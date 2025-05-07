import { Planner, PlannerOptions } from "./planner";
import { applyCleanser, Consumable, Effect, isVampyre } from "./utils";
import * as fs from "node:fs";

type EnvironmentOptions = {
  getConsumables: () => Consumable[];
};

export class NodePlanner extends Planner {
  consumables: Consumable[];
  prices: Record<number, number>;
  effects: Effect[];

  constructor(options: PlannerOptions) {
    super(options);

    const data = JSON.parse(fs.readFileSync("./data.json", "utf-8"));
    this.prices = data.prices;

    this.consumables = data.consumables
      .filter((c) => !isVampyre(c))
      .filter((c) => this.prices[c.id] > 0)
      .map(applyCleanser);

    this.effects = data.effects;
  }

  getConsumables(): Consumable[] {
    return this.consumables;
  }

  getEffect(effect: string) {
    const effectName = effect.slice(1, -1);
    const match = effectName.match(/\[(\d+)\].*/);
    if (match) {
      const id = Number(match[1]);
      return this.effects.find((e) => e.id === id);
    }
    return this.effects.find((e) => e.name === effectName);
  }

  getPrice(id: number) {
    return this.prices[id] ?? 0;
  }
}
