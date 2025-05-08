import { createClient } from "data-of-loathing";
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
        },
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
      },
    },
  },
});

const consumables =
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
        effectDuration: Number(modifiers["Effect Duration"]) || 0,
      };
    }) ?? [];

const effects = result.allEffects?.nodes
  ?.filter((e) => e !== null)
  .map((e) => ({
    id: e.id,
    name: e.name,
    modifiers: e.effectModifierByEffect?.modifiers || {},
  }));

await fs.writeFile(
  `./data-${dateString}.json`,
  JSON.stringify({
    consumables,
    effects,
  }),
);
