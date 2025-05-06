import { createClient } from "data-of-loathing";
import { Consumable } from "../src/utils";
import * as fs from "node:fs/promises";

const client = createClient();
const result = await client.query({
  allConsumables: {
    nodes: {
      id: true,
      itemById: {
        name: true,
      },
      adventures: true,
      liver: true,
      spleen: true,
      stomach: true,
      notes: true,
    },
  },
});

const unpricedConsumables =
  result.allConsumables?.nodes
    ?.filter((r) => r !== null)
    .map((r) => ({
      id: r.id,
      liver: r.liver,
      name: r.itemById?.name || `[${r.id}]`,
      spleen: r.spleen,
      stomach: r.stomach,
      turns: r.adventures,
      notes: r.notes || "",
    })) ?? [];

const consumables: Consumable[] = [];

// const prices = JSON.parse(await fs.readFile("./consumables.json", "utf-8"));

for (const c of unpricedConsumables) {
  const response = await fetch(`https://pricegun.loathers.net/api/${c.id}`);
  const json = (await response.json()) as { value: number };
  // const json = prices.find(p => p.id === c.id)
  consumables.push({ ...c, price: Math.round(json.value) });
}

const date = new Date();
await fs.writeFile(
  `./consumables-${date.getDate().toString().padStart(2, "0")}${(date.getMonth() + 1).toString().padStart(2, "0")}${date.getFullYear()}.json`,
  JSON.stringify(consumables),
);
