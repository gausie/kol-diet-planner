import { beforeAll, describe, expect, it } from "vitest";
import { NodePlanner } from "./NodePlanner";
import fetchMock, { manageFetchMockGlobally } from "@fetch-mock/vitest";
import * as fs from "fs/promises";

manageFetchMockGlobally();

describe("Planner", async () => {
  beforeAll(async () => {
    fetchMock
      .get(
        "https://pricegun.loathers.net/api/all",
        200,
        await fs.readFile(
          import.meta.dirname + "/__fixtures__/prices.json",
          "utf-8",
        ),
      )
      .post(
        "https://data.loathers.net/graphql",
        200,
        await fs.readFile(
          import.meta.dirname + "/__fixtures__/data.json",
          "utf-8",
        ),
      );
  });

  it("plans", async () => {
    const planner = new NodePlanner({
      stomach: 15,
      liver: 14,
      spleen: 15,
      valueOfAdventure: 10000,
      baseMeat: 275,
      odeToBooze: true,
      pizzaLover: true,
      tuxedoShirt: true,
      saucemaven: true,
      class: "Pastamancer",
      sweetSynthesis: true,
      mayoClinic: true,
      mafiaPinkyRing: true,
    });

    await planner.load();

    const plan = planner.plan();
    console.log(plan);
    expect(plan).toMatchObject({});
  });
});
