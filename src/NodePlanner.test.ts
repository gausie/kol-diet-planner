import { describe, expect, it } from "vitest";
import { NodePlanner } from "./NodePlanner";

describe("Planner", async () => {
  const planner = new NodePlanner({
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
    mayoClinic: true,
    mafiaPinkyRing: true,
  });

  it("plans", async () => {
    const plan = planner.plan();
    console.log(plan);
    expect(plan).toMatchObject({});
  });
});
