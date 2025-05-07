import { createClient } from "data-of-loathing";
import { Consumable } from "../src/utils";
import * as fs from "node:fs/promises";

const date = new Date();
const dateString = `${date.getDate().toString().padStart(2, "0")}${(date.getMonth() + 1).toString().padStart(2, "0")}${date.getFullYear()}`;

const client = createClient();
const result = await client.query({
  allConsumables: {
    nodes: {
      id: true,
      itemById: {
        name: true,
        itemModifierByItem: {
          modifiers: true,
        }
      },
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
      }
    }
  }
});

const unpricedConsumables =
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
        notes: r.notes || "",
        effect: modifiers["Effect"] || "",
        effectDuration: modifiers["Effect Duration"] || 0,
      };
    }) ?? [];

const consumables: Consumable[] = [];

// const prices = JSON.parse(await fs.readFile("./consumables.json", "utf-8"));

for (const c of unpricedConsumables) {
  const response = await fetch(`https://pricegun.loathers.net/api/${c.id}`);
  const json = (await response.json()) as { value: number };
  // const json = prices.filter(p => p.id === c.id).map(p => ({ value: p.price }))[0];
  consumables.push({ ...c, price: Math.round(json.value) });
}

await fs.writeFile(
  `./consumables-${dateString}.json`,
  JSON.stringify(consumables),
);

const effects = result.allEffects?.nodes?.filter(e => e !== null).map(e => ({
  id: e.id,
  name: e.name,
  modifiers: e.effectModifierByEffect?.modifiers || {},
}));

await fs.writeFile(
  `./effects-${dateString}.json`,
  JSON.stringify(effects),
)
