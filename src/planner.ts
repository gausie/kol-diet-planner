import { Coefficients, lessEq, solve } from "yalps";

export type Consumable = {
  name: string;
  id: number;
  price: number;
  turns: number;
  stomach: number;
  liver: number;
  spleen: number;
  notes: string;
};

type PlanOptions = {
  /** How much stomach space the plan should fill */
  stomach?: number;
  /** How much liver space the plan should fill */
  liver?: number;
  /** How much spleen space the plan should fill */
  spleen?: number;
  /** Meat value of your marginal adventure */
  valueOfAdventure: number;
  /** Base meat drop for monsters, used to value +meat effects */
  baseMeat?: number;
  /** Map of items id to top consumption limit thereof. Applied over a sane set of defaults */
  limits?: { [itemId: number]: number };
};

function isVampyre(consumable: Consumable) {
  return consumable.notes.includes("Vampyre");
}

function applyCleanser(consumable: Consumable) {
  if (consumable.notes === "") return consumable;
  const match = consumable.notes
    .toLowerCase()
    .match(/-(\d+) (fullness|drunkenness|spleen)/);
  if (!match) return consumable;
  const organ = match[2];
  const space = Number(match[1]);
  return {
    ...consumable,
    stomach: consumable.stomach - (organ === "fullness" ? space : 0),
    liver: consumable.liver - (organ === "drunkenness" ? space : 0),
    spleen: consumable.spleen - (organ === "spleen" ? space : 0),
  };
}

function calculateProfit(consumable: Consumable, options: PlanOptions) {
  return consumable.turns * options.valueOfAdventure;
}

export class Planner {
  consumables: Consumable[];

  constructor(consumables: Consumable[]) {
    this.consumables = consumables
      .filter((c) => !isVampyre(c))
      .filter((c) => c.price > 0)
      .map(applyCleanser);
  }

  plan(options: PlanOptions) {
    const { stomach = 15, liver = 14, spleen = 15, limits = {} } = options;

    const variables = Object.fromEntries(
      this.consumables.map((c) => [
        c.id,
        {
          ...c,
          name: undefined,
          notes: undefined,
          profit: calculateProfit(c, options),
          [`id:${c.id}`]: 1,
        },
      ]),
    );

    const limitConstraints = Object.fromEntries(
      Object.entries({
        3325: 1, // jar of fermented pickle juice
        3326: 1, // voodoo snuff
        3327: 1, // extra-greasy slider
        8819: 1, // The Plumber's Mushroom Stew
        8821: 1, // The Mad Liquor
        8822: 1, // Doc Clock's thyme cocktail
        8823: 1, // Mr. Burnsger
        10060: 23, // magical sausage
        ...limits,
      }).map(([id, limit]) => [`id:${id}`, lessEq(limit)]),
    );

    const model = {
      direction: "maximize" as const,
      objective: "profit",
      constraints: {
        stomach: lessEq(stomach),
        liver: lessEq(liver),
        spleen: lessEq(spleen),
        ...limitConstraints,
      },
      variables,
      // All variables must be consumed as integers, we cannot consume half a consumable
      integers: true,
    };

    const solution = solve(model);

    return {
      profit: solution.result,
      turns: solution.variables.reduce(
        (acc, [id, q]) => acc + variables[id].turns * q,
        0,
      ),
      diet: solution.variables,
    };
  }
}
