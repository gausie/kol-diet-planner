import type { NodePlanner } from "kol-diet-planner";

interface MenuProps {
  plan: ReturnType<NodePlanner["plan"]> | null;
}

export function Menu({ plan }: MenuProps) {
  if (!plan) return null;

  return (
    <div>
      <h2>Plan</h2>
      <div>Profit: {Math.round(plan.profit)}</div>
      <div>Turns: {plan.turns}</div>
      <div>
        {plan.diet.map(({ name, id, serving, quantity }) => (
          <div key={id}>
            {name}
            {serving ? ` (with ${serving.split(",").join(", ")})` : ""} x
            {quantity}
          </div>
        ))}
      </div>
    </div>
  );
}
