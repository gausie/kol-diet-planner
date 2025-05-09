import { lessEq, solve } from "yalps";
import { type Attributes, parseNotes, tuple } from "./utils";

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
  mafiaPinkyRing?: boolean;
};

type ServingOptions = {
  utensil?: number;
  mayo?: string;
};

export abstract class Planner {
  options: PlannerOptions;

  constructor(options: PlannerOptions) {
    this.options = options;
  }

  abstract getConsumables(): number[];
  abstract getEffectModifiers(name: string): Record<string, string> | undefined;
  abstract getPrice(id: number): number;
  abstract getStomach(id: number): number;
  abstract getLiver(id: number): number;
  abstract getSpleen(id: number): number;
  abstract getTurns(id: number): number;
  abstract getNotes(id: number): string;
  abstract getItemEffect(id: number): string;
  abstract getItemEffectDuration(id: number): number;

  getAttributes(id: number): Attributes {
    const notes = this.getNotes(id);
    return parseNotes(notes);
  }

  valueMeatDrop(value: number | string) {
    return (this.options.baseMeat ?? 0) * (Number(value) / 100);
  }

  calculateEffectProfit(id: number, duration = this.getItemEffectDuration(id)) {
    const effect = this.getItemEffect(id);
    if (!effect) return 0;

    const modifiers = this.getEffectModifiers(effect);
    if (!modifiers) return 0;

    let profit = 0;
    for (const [modifier, value] of Object.entries(modifiers)) {
      switch (modifier) {
        case "Meat Drop":
          profit += this.valueMeatDrop(value) * duration;
          break;
      }
    }

    return profit;
  }

  evaluateConsumable(id: number, options: ServingOptions) {
    const attributes = this.getAttributes(id);

    // Vampyre food cannot be eaten in a normal ascension
    if (attributes.vampyre) return null;

    let price = this.getPrice(id);

    // Untradeable or otherwise unavailable
    if (price === 0) return null;

    // Lets work out what resources this consumable will provide and consume
    let turns = this.getTurns(id);
    let liver = this.getLiver(id) - (attributes.cleansesLiver ?? 0);
    let stomach = this.getStomach(id) - (attributes.cleansesStomach ?? 0);
    let spleen = this.getSpleen(id) - (attributes.cleansesSpleen ?? 0);

    const chasers: string[] = [];
    const voa = this.options.valueOfAdventure;

    // Munchies pill
    if (stomach > 0) {
      const munchiesTurns = (() => {
        if (turns < 1) return 0;
        if (turns < 4) return 3;
        if (turns < 7) return 2;
        return 1;
      })();
      if (this.getPrice(1619) < voa * munchiesTurns) {
        chasers.push("munchies");
        price += this.getPrice(1619);
        turns += munchiesTurns;
      }
    }

    // Utensils
    switch (options.utensil) {
      case 3323: // salad fork
        turns += Math.ceil(turns * (attributes.salad ? 0.5 : 0.3));
        price += this.getPrice(3323);
        break;
      case 3324: // frosty mug
        turns += Math.floor(turns * (attributes.beer ? 0.5 : 0.3));
        price += this.getPrice(3324);
        break;
    }

    // Wine buffs
    if (attributes.wine) {
      // Refined Palate
      turns += Math.floor(turns * 0.25);

      // Mafia Pinky Ring
      if (this.options.mafiaPinkyRing) {
        turns += Math.round(turns * 0.125);
      }
    }

    // Ode to Booze
    if (this.options.odeToBooze && liver > 0) {
      turns += liver;
    }

    // Tuxedo shirt
    if (this.options.tuxedoShirt && attributes.martini) {
      turns += 2;
    }

    // Pizza Lover
    if (this.options.pizzaLover && attributes.pizza) {
      turns += stomach;
    }

    // Saucemaven
    if (this.options.saucemaven && attributes.saucy) {
      turns += 3;
      if (
        this.options.class === "Sauceror" ||
        this.options.class === "Pastamancer"
      ) {
        turns += 2;
      }
    }

    // Mayo Clinic
    let effectDuration = this.getItemEffectDuration(id);
    if (this.options.mayoClinic && stomach > 0) {
      switch (options.mayo) {
        case "mayoflex":
          turns += 1;
          break;
        case "mayodiol":
          stomach -= 1;
          liver += 1;
          break;
        case "mayozapine":
          effectDuration *= 2;
          break;
      }
    }

    // Whetstone
    if (this.getPrice(11107) < voa) {
      chasers.push("whetstone");
      price += this.getPrice(11107);
      turns += 1;
    }

    // Mini kiwi aioli
    if (this.getPrice(11598) < voa * stomach) {
      chasers.push("aioli");
      price += this.getPrice(11598);
      turns += stomach;
    }

    // Now lets calculate profit based on the turns we know this will generate
    let profit = turns * voa - price;

    // And if the item grants an effect, take into account its expected value
    profit += this.calculateEffectProfit(id, effectDuration);

    // Filtering out negative profit entries here is an effective optimisation before the solver is run.
    if (profit < 0) return null;

    return {
      // Meta-resources to allow us to constrain consumables where appropriate
      [`id:${id}`]: 1,
      ...(options.utensil ? { [`utensil:${options.utensil}`]: 1 } : {}),
      chasers,
      // Resources consumed
      stomach,
      liver,
      spleen,
      // Resources generated
      turns,
      profit,
    };
  }

  evaluateConsumableOptions(id: number) {
    const makeEntry = (options: ServingOptions = {}) => {
      const evaluated = this.evaluateConsumable(id, options);
      if (!evaluated) return null;
      const { chasers, ...values } = evaluated;
      const servings = Object.entries(options)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${k}=${v}`)
        .concat(chasers)
        .join(",");
      return tuple(`${id}${servings ? `(${servings})` : ""}`, values);
    };

    const entries = [makeEntry()];

    if (this.getStomach(id) > 0) {
      entries.push(makeEntry({ utensil: 3323 }));
      if (this.options.mayoClinic) {
        for (const mayo of ["mayoflex", "mayodiol", "mayozapine"]) {
          entries.push(makeEntry({ mayo }));
          entries.push(makeEntry({ utensil: 3323, mayo }));
        }
      }
    }
    if (this.getLiver(id) > 0) {
      entries.push(makeEntry({ utensil: 3324 }));
    }

    return entries.filter((e) => e !== null);
  }

  plan() {
    const { stomach = 15, liver = 14, spleen = 15, limits = {} } = this.options;

    const variables = Object.fromEntries(
      this.getConsumables().flatMap((id) => this.evaluateConsumableOptions(id)),
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
