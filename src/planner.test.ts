import { describe, expect, it } from "vitest";
import * as fs from "node:fs/promises";
import { Planner } from "./planner";

describe("Planner", async () => {
  const planner = new Planner(
    JSON.parse(await fs.readFile("./consumables.json", "utf-8")),
  );

  it("plans", async () => {
    const plan = planner.plan({
      stomach: 15,
      liver: 14,
      spleen: 15,
      valueOfAdventure: 7000,
      baseMeat: 250,
    });
    console.log(plan);
    expect(plan).toMatchObject({});
  });
});
