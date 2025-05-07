import { describe, expect, it } from "vitest";
import * as fs from "node:fs/promises";
import { Planner } from "./planner";

describe("Planner", async () => {
  const data = JSON.parse(await fs.readFile("./data.json", "utf-8"));
  const planner = new Planner(data.consumables, data.effects, data.prices);

  it("plans", async () => {
    const plan = planner.plan({
      stomach: 15,
      liver: 14,
      spleen: 15,
      valueOfAdventure: 7000,
      baseMeat: 275,
      odeToBooze: true,
      pizzaLover: true,
      tuxedoShirt: true,
      saucemaven: true,
      class: "Pastamancer",
      sweetSynthesis: true,
    });
    console.log(plan);
    expect(plan).toMatchObject({});
  });
});
