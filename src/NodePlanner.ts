import { Planner, PlannerOptions } from "./Planner";
import * as fs from "node:fs";

type Data = {
  consumables: {
    name: string;
    id: number;
    price: number;
    turns: number;
    stomach: number;
    liver: number;
    spleen: number;
    notes: string;
    effect: string;
    effectDuration: number;
  }[];
  effects: {
    id: number;
    name: string;
    modifiers: Record<string, string>;
  }[];
};

export class NodePlanner extends Planner {
  data: Data;
  prices: Record<number, number> = {};

  constructor(options: PlannerOptions) {
    super(options);

    this.data = JSON.parse(fs.readFileSync("./data.json", "utf-8"));
  }

  async load() {
    const response = await fetch("https://pricegun.loathers.net/api/all");
    const json = (await response.json()) as { value: number; itemId: number }[];
    this.prices = Object.fromEntries(
      json.map((item) => [item.itemId, item.value]),
    );
  }

  getConsumables(): number[] {
    return this.data.consumables.map((c) => c.id);
  }

  getStomach(id: number) {
    return this.data.consumables.find((c) => c.id === id)?.stomach ?? 0;
  }

  getLiver(id: number) {
    return this.data.consumables.find((c) => c.id === id)?.liver ?? 0;
  }

  getSpleen(id: number) {
    return this.data.consumables.find((c) => c.id === id)?.spleen ?? 0;
  }

  getTurns(id: number) {
    return this.data.consumables.find((c) => c.id === id)?.turns ?? 0;
  }

  getNotes(id: number): string {
    return this.data.consumables.find((c) => c.id === id)?.notes ?? "";
  }

  getItemEffect(id: number) {
    return this.data.consumables.find((c) => c.id === id)?.effect ?? "";
  }

  getItemEffectDuration(id: number) {
    return this.data.consumables.find((c) => c.id === id)?.effectDuration ?? 0;
  }

  getEffectModifiers(effect: string) {
    const effectName = effect.slice(1, -1);
    const match = effectName.match(/\[(\d+)\].*/);
    if (match) {
      const id = Number(match[1]);
      return this.data.effects.find((e) => e.id === id)?.modifiers;
    }
    return this.data.effects.find((e) => e.name === effectName)?.modifiers;
  }

  getPrice(id: number) {
    return this.prices[id] ?? 0;
  }
}
