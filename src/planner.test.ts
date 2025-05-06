import { describe, expect, it } from "vitest";
import * as fs from "node:fs/promises";
import { Planner } from "./planner";

describe("Planner", async () => {
  const planner = new Planner(
    JSON.parse(await fs.readFile("./consumables.json", "utf-8")),
    {
      3323: 383_621,
      3324: 315_363,
    },
  );

  it("plans", async () => {
    const plan = planner.plan({
      stomach: 15,
      liver: 14,
      spleen: 15,
      valueOfAdventure: 7000,
      baseMeat: 250,
      odeToBooze: true,
      pizzaLover: true,
      tuxedoShirt: true,
      saucemaven: true,
      class: "Pastamancer",
    });
    console.log(plan);
    expect(plan).toMatchObject({});
  });
});
