import { lessEq, solve } from "yalps";
import {
  applyCleanser,
  type Consumable,
  isBeer,
  isMartini,
  isPizza,
  isSalad,
  isSaucy,
  isVampyre,
  isWine,
} from "./utils";

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
  pizzaLover?: boolean;
  tuxedoShirt?: boolean;
  odeToBooze?: boolean;
  saucemaven?: boolean;
  class?:
    | "Seal Clubber"
    | "Turtle Tamer"
    | "Pastamancer"
    | "Sauceror"
    | "Disco Bandit"
    | "Accordion Thief";
};

export class Planner {
  consumables: Consumable[];
  itemToPrice: Record<number, number>;

  constructor(
    consumables: Consumable[],
    otherPrices: Record<number, number> = {},
  ) {
    this.consumables = consumables
      .filter((c) => !isVampyre(c))
      .filter((c) => c.price > 0)
      .map(applyCleanser);

    this.itemToPrice = {
      ...Object.fromEntries(this.consumables.map((c) => [c.id, c.price])),
      ...otherPrices,
    };
  }

  calculateProfit(
    consumable: Consumable,
    options: PlanOptions,
    utensil?: number,
  ) {
    let turns = consumable.turns;

    switch (utensil) {
      case 3323: // salad fork
        turns += Math.ceil(turns * (isSalad(consumable) ? 0.5 : 0.3));
        break;
      case 3324: // frosty mug
        turns += Math.floor(turns * (isBeer(consumable) ? 0.5 : 0.3));
        break;
    }

    // Refined Palate
    if (isWine(consumable)) {
      turns += Math.floor(turns * 0.25);
    }

    // Ode to Booze
    if (options.odeToBooze && consumable.liver > 0) {
      turns += consumable.liver;
    }

    // Tuxedo shirt
    if (options.tuxedoShirt && isMartini(consumable)) {
      turns += 2;
    }

    // Pizza Lover
    if (options.pizzaLover && isPizza(consumable)) {
      turns += consumable.stomach;
    }

    // Saucemaven
    if (options.saucemaven && isSaucy(consumable)) {
      turns += 3;
      if (options.class === "Sauceror" || options.class === "Pastamancer") {
        turns += 2;
      }
    }

    let profit = turns * options.valueOfAdventure;

    if (utensil) {
      profit -= this.itemToPrice[utensil] ?? 0;
    }

    return {
      turns,
      profit,
      ...(utensil ? { [`utensil:${utensil}`]: 1 } : {}),
    };
  }

  considerUtensil(consumable: Consumable, options: PlanOptions) {
    const makeEntry = (utensil?: number) => [
      `${consumable.id}${utensil ? `+${utensil}` : ""}`,
      {
        ...consumable,
        name: undefined,
        notes: undefined,
        ...this.calculateProfit(consumable, options, utensil),
        [`id:${consumable.id}`]: 1,
      },
    ];

    const base = makeEntry();

    if (consumable.stomach > 0) return [base, makeEntry(3323)];
    if (consumable.liver > 0) return [base, makeEntry(3324)];
    return [base];
  }

  plan(options: PlanOptions) {
    const { stomach = 15, liver = 14, spleen = 15, limits = {} } = options;

    const variables = Object.fromEntries(
      this.consumables.flatMap((c) => this.considerUtensil(c, options)),
    );

    console.log();

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
        "utensil:3323": lessEq(1), // salad fork
        "utensil:3324": lessEq(1), // frosty mug
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
        (acc, [id, q]) => acc + (variables[id]?.turns ?? 0) * q,
        0,
      ),
      diet: solution.variables,
    };
  }
}
