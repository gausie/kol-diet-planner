import { useEffect, useMemo, useState } from "react";
import { NodePlanner, type PlannerOptions } from "kol-diet-planner";
import { ConfigForm } from "./ConfigForm";
import { Menu } from "./Menu";

const defaultConfig: PlannerOptions = {
  stomach: 15,
  liver: 14,
  spleen: 15,
  valueOfAdventure: 5000,
};

export function App() {
  const [config, setConfig] = useState<PlannerOptions>(defaultConfig);

  const [loading, setLoading] = useState(false);

  const planner = useMemo(() => new NodePlanner(defaultConfig), []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      await planner.load();
      setLoading(false);
    }

    load();
  }, [planner]);

  const plan = useMemo(() => {
    if (loading) return null;
    planner.updateOptions(config);
    return planner.plan();
  }, [loading, planner, config]);

  return (
    <>
      <h1>Diet Planner</h1>
      <ConfigForm value={config} onChange={setConfig} />
      <Menu plan={plan} />
    </>
  );
}
