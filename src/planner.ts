import { lessEq, solve } from "yalps";
import {
  type Consumable,
  Effect,
  isBeer,
  isMartini,
  isPizza,
  isSalad,
  isSaucy,
  isWine,
} from "./utils";

export type PlannerOptions = {
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
  sweetSynthesis?: boolean;
  mayoClinic?: boolean;
};

export abstract class Planner {
  options: PlannerOptions;

  constructor(options: PlannerOptions) {
    this.options = options;
  }

  abstract getConsumables(): Consumable[];
  abstract getEffect(name: string): Effect | undefined;
  abstract getPrice(id: number): number;

  valueMeatDrop(value: number | string) {
    return (this.options.baseMeat ?? 0) * (Number(value) / 100);
  }

  calculateEffectProfit(
    consumable: Consumable,
    duration = consumable.effectDuration,
  ) {
    const effect = this.getEffect(consumable.effect);
    if (!effect) return 0;

    let profit = 0;
    for (const [modifier, value] of Object.entries(effect.modifiers)) {
      switch (modifier) {
        case "Meat Drop":
          profit += this.valueMeatDrop(value) * duration;
          break;
      }
    }

    return profit;
  }

  calculateProfit(consumable: Consumable, utensil?: number, mayo?: string) {
    let turns = consumable.turns;

    // Utensils
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
    if (this.options.odeToBooze && consumable.liver > 0) {
      turns += consumable.liver;
    }

    // Tuxedo shirt
    if (this.options.tuxedoShirt && isMartini(consumable)) {
      turns += 2;
    }

    // Pizza Lover
    if (this.options.pizzaLover && isPizza(consumable)) {
      turns += consumable.stomach;
    }

    // Saucemaven
    if (this.options.saucemaven && isSaucy(consumable)) {
      turns += 3;
      if (
        this.options.class === "Sauceror" ||
        this.options.class === "Pastamancer"
      ) {
        turns += 2;
      }
    }

    // Mayo Clinic
    let effectDuration = consumable.effectDuration;
    let extra: Partial<typeof consumable> = {};
    if (this.options.mayoClinic && consumable.stomach > 0) {
      switch (mayo) {
        case "mayoflex":
          turns += 1;
          break;
        case "mayodiol":
          extra.stomach = consumable.stomach - 1;
          extra.liver = consumable.liver + 1;
          break;
        case "mayozapine":
          effectDuration *= 2;
          break;
      }
    }

    let profit = turns * this.options.valueOfAdventure;

    if (utensil) {
      profit -= this.getPrice(utensil);
    }

    if (consumable.effect) {
      profit += this.calculateEffectProfit(consumable, effectDuration);
    }

    return {
      ...consumable,
      ...extra,
      turns,
      profit,
      ...(utensil ? { [`utensil:${utensil}`]: 1 } : {}),
    };
  }

  servingOptions(consumable: Consumable) {
    const makeEntry = (serving: { utensil?: number; mayo?: string } = {}) => {
      const servings = Object.entries(serving)
        .filter(([k, v]) => v !== undefined)
        .map(([k, v]) => `${k}=${v}`)
        .join(",");
      return [
        `${consumable.id}${servings ? `(${servings})` : ""}`,
        {
          ...this.calculateProfit(consumable, serving.utensil, serving.mayo),
          name: undefined,
          notes: undefined,
          [`id:${consumable.id}`]: 1,
        },
      ];
    };

    const entries = [makeEntry()];

    if (consumable.stomach > 0) {
      entries.push(makeEntry({ utensil: 3323 }));
      if (this.options.mayoClinic) {
        for (const mayo of ["mayoflex", "mayodiol", "mayozapine"]) {
          entries.push(makeEntry({ mayo }));
          entries.push(makeEntry({ utensil: 3323, mayo }));
        }
      }
    }
    if (consumable.liver > 0) {
      entries.push(makeEntry({ utensil: 3324 }));
    }

    return entries;
  }

  plan() {
    const { stomach = 15, liver = 14, spleen = 15, limits = {} } = this.options;

    const variables = Object.fromEntries(
      this.getConsumables().flatMap((c) => this.servingOptions(c)),
    );

    if (this.options.sweetSynthesis) {
      variables["sweetsynthesis"] = {
        profit: this.valueMeatDrop(300) * 30,
        turns: 0,
        stomach: 0,
        liver: 0,
        spleen: 1,
      };
    }

    const limitConstraints = Object.fromEntries(
      Object.entries({
        3325: 1, // jar of fermented pickle juice
        3326: 1, // voodoo snuff
        3327: 1, // extra-greasy slider
        3338: 1, // frozen banquet
        8819: 1, // The Plumber's Mushroom Stew
        8821: 1, // The Mad Liquor
        8822: 1, // Doc Clock's thyme cocktail
        8823: 1, // Mr. Burnsger
        8824: 1, // The Inquisitor's unidentifiable object
        10060: 23, // magical sausage
        10991: 1, // Pizza of Legend
        10992: 1, // Calzone of Legend
        11000: 1, // Deep Dish of Legend
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
