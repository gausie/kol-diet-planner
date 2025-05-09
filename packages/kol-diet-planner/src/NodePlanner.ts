import { createClient } from "data-of-loathing";
import { memoize } from "utils-decorators";

import { Planner, type PlannerOptions } from "./Planner";

type ConsumableData = Record<
  number,
  {
    name: string;
    id: number;
    turns: number;
    range: [low: number, high: number];
    stomach: number;
    liver: number;
    spleen: number;
    notes: string;
    effect: string;
    effectDuration: number;
  }
>;

type EffectData = {
  id: number;
  name: string;
  modifiers: Record<string, string>;
};

type PriceData = Record<number, number>;
export class NodePlanner extends Planner {
  consumables: ConsumableData = {};
  prices: PriceData = {};
  effects: EffectData[] = [];

  constructor(options: PlannerOptions) {
    super(options);
  }

  updateOptions(options: PlannerOptions) {
    this.options = options;
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

    this.consumables = Object.fromEntries(
      result.allConsumables?.nodes
        ?.filter((r) => r !== null)
        .map((r) => {
          const modifiers = r.itemById?.itemModifierByItem?.modifiers ?? {};
          return [
            r.id,
            {
              id: r.id,
              liver: r.liver,
              name: r.itemById?.name || `[${r.id}]`,
              spleen: r.spleen,
              stomach: r.stomach,
              turns: r.adventures,
              range: (
                r.adventureRange.match(/(-?\d+)(?:-(-?\d+))?/)?.slice(1) ?? []
              )
                .map((x, i, arr) => (x === undefined ? arr[i - 1] : x))
                .map(Number) as [number, number],
              notes: r.notes || "",
              effect: modifiers["Effect"] || "",
              effectDuration: Number(modifiers["Effect Duration"]) || 0,
            },
          ];
        }) ?? [],
    );

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

  getConsumables() {
    return Object.keys(this.consumables).map(Number);
  }

  getName(id: number) {
    return this.consumables[id]?.name ?? `[${id}]`;
  }

  getStomach(id: number) {
    return this.consumables[id]?.stomach ?? 0;
  }

  getLiver(id: number) {
    return this.consumables[id]?.liver ?? 0;
  }

  getSpleen(id: number) {
    return this.consumables[id]?.spleen ?? 0;
  }

  getTurns(id: number) {
    return this.consumables[id]?.turns ?? 0;
  }

  getTurnRange(id: number) {
    return this.consumables[id]?.range ?? [0, 0];
  }

  getNotes(id: number): string {
    return this.consumables[id]?.notes ?? "";
  }

  getItemEffect(id: number) {
    return this.consumables[id]?.effect ?? "";
  }

  getItemEffectDuration(id: number) {
    return this.consumables[id]?.effectDuration ?? 0;
  }

  @memoize()
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
    switch (id) {
      case 7589:
      case 7590:
      case 7591:
        return 250;
      case 7592:
      case 7593:
      case 7594:
      case 7595:
        return 500;
      case 7596:
        return 5000;
      case 7597:
        return 10000;
      case 7598:
        return 20000;
      case 7599:
        return 100000;
      default:
        return this.prices[id] ?? 0;
    }
  }
}
