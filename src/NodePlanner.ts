import { createClient } from "data-of-loathing";
import { Planner, PlannerOptions } from "./Planner";
import * as fs from "node:fs";

type ConsumableData = {
  name: string;
  id: number;
  turns: number;
  range: string[];
  stomach: number;
  liver: number;
  spleen: number;
  notes: string;
  effect: string;
  effectDuration: number;
};

type EffectData = {
  id: number;
  name: string;
  modifiers: Record<string, string>;
};

type PriceData = Record<number, number>;
export class NodePlanner extends Planner {
  consumables: ConsumableData[] = [];
  prices: PriceData = {};
  effects: EffectData[] = [];

  constructor(options: PlannerOptions) {
    super(options);
  }

  async #loadData() {
    const client = createClient();
    const result = await client.query({
      allConsumables: {
        nodes: {
          id: true,
          itemById: {
            name: true,
            itemModifierByItem: {
              modifiers: true,
            },
          },
          adventureRange: true,
          adventures: true,
          liver: true,
          spleen: true,
          stomach: true,
          notes: true,
        },
      },
      allEffects: {
        nodes: {
          id: true,
          name: true,
          effectModifierByEffect: {
            modifiers: true,
          },
        },
      },
    });

    this.consumables =
      result.allConsumables?.nodes
        ?.filter((r) => r !== null)
        .map((r) => {
          const modifiers = r.itemById?.itemModifierByItem?.modifiers ?? {};
          return {
            id: r.id,
            liver: r.liver,
            name: r.itemById?.name || `[${r.id}]`,
            spleen: r.spleen,
            stomach: r.stomach,
            turns: r.adventures,
            range:
              r.adventureRange.match(/(-?\d+)(?:-(-?\d+))?/)?.slice(1) ?? [],
            notes: r.notes || "",
            effect: modifiers["Effect"] || "",
            effectDuration: Number(modifiers["Effect Duration"]) || 0,
          };
        }) ?? [];

    this.effects =
      result.allEffects?.nodes
        ?.filter((e) => e !== null)
        .map((e) => ({
          id: e.id,
          name: e.name,
          modifiers: e.effectModifierByEffect?.modifiers || {},
        })) ?? [];
  }

  async #loadPrices() {
    const response = await fetch("https://pricegun.loathers.net/api/all");
    const json = (await response.json()) as { value: number; itemId: number }[];
    this.prices = Object.fromEntries(
      json.map((item) => [item.itemId, item.value]),
    );
  }

  async load() {
    await this.#loadPrices();
    await this.#loadData();
  }

  getConsumables(): number[] {
    return this.consumables.map((c) => c.id);
  }

  getStomach(id: number) {
    return this.consumables.find((c) => c.id === id)?.stomach ?? 0;
  }

  getLiver(id: number) {
    return this.consumables.find((c) => c.id === id)?.liver ?? 0;
  }

  getSpleen(id: number) {
    return this.consumables.find((c) => c.id === id)?.spleen ?? 0;
  }

  getTurns(id: number) {
    return this.consumables.find((c) => c.id === id)?.turns ?? 0;
  }

  getNotes(id: number): string {
    return this.consumables.find((c) => c.id === id)?.notes ?? "";
  }

  getItemEffect(id: number) {
    return this.consumables.find((c) => c.id === id)?.effect ?? "";
  }

  getItemEffectDuration(id: number) {
    return this.consumables.find((c) => c.id === id)?.effectDuration ?? 0;
  }

  getEffectModifiers(effect: string) {
    const effectName = effect.slice(1, -1);
    const match = effectName.match(/\[(\d+)\].*/);
    if (match) {
      const id = Number(match[1]);
      return this.effects.find((e) => e.id === id)?.modifiers;
    }
    return this.effects.find((e) => e.name === effectName)?.modifiers;
  }

  getPrice(id: number) {
    return this.prices[id] ?? 0;
  }
}
