import { useForm } from "@tanstack/react-form";
import type { PlannerOptions } from "kol-diet-planner";

interface ConfigFormProps {
  value: PlannerOptions;
  onChange: (value: PlannerOptions) => void;
}

const classes = [
  "Seal Clubber",
  "Turtle Tamer",
  "Pastamancer",
  "Sauceror",
  "Disco Bandit",
  "Accordion Thief",
] as const;

type ClassType = (typeof classes)[number];

export function ConfigForm({ value, onChange }: ConfigFormProps) {
  const form = useForm({
    defaultValues: value,
    onSubmit: ({ value }) => {
      onChange(value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <div>
        <form.Field
          name="stomach"
          children={(field) => (
            <div>
              <label htmlFor={field.name}>Stomach Space</label>
              <input
                id={field.name}
                type="number"
                value={field.state.value ?? ""}
                onChange={(e) => field.handleChange(Number(e.target.value))}
              />
            </div>
          )}
        />

        <form.Field
          name="liver"
          children={(field) => (
            <div>
              <label htmlFor={field.name}>Liver Space</label>
              <input
                id={field.name}
                type="number"
                value={field.state.value ?? ""}
                onChange={(e) => field.handleChange(Number(e.target.value))}
              />
            </div>
          )}
        />

        <form.Field
          name="spleen"
          children={(field) => (
            <div>
              <label htmlFor={field.name}>Spleen Space</label>
              <input
                id={field.name}
                type="number"
                value={field.state.value ?? ""}
                onChange={(e) => field.handleChange(Number(e.target.value))}
              />
            </div>
          )}
        />

        <form.Field
          name="valueOfAdventure"
          children={(field) => (
            <div>
              <label htmlFor={field.name}>Value of Adventure</label>
              <input
                id={field.name}
                type="number"
                value={field.state.value}
                onChange={(e) => field.handleChange(Number(e.target.value))}
              />
            </div>
          )}
        />

        <form.Field
          name="baseMeat"
          children={(field) => (
            <div>
              <label htmlFor={field.name}>Base Meat Drop</label>
              <input
                id={field.name}
                type="number"
                value={field.state.value ?? ""}
                onChange={(e) => field.handleChange(Number(e.target.value))}
              />
            </div>
          )}
        />

        <form.Field
          name="class"
          children={(field) => (
            <div>
              <label htmlFor={field.name}>Class</label>
              <select
                id={field.name}
                value={field.state.value ?? ""}
                onChange={(e) =>
                  field.handleChange(e.target.value as ClassType)
                }
              >
                <option value="">Select a class</option>
                {classes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}
        />
      </div>

      <div>
        <form.Field
          name="pizzaLover"
          children={(field) => (
            <div>
              <input
                id={field.name}
                type="checkbox"
                checked={field.state.value ?? false}
                onChange={(e) => field.handleChange(e.target.checked)}
              />
              <label htmlFor={field.name}>Pizza Lover</label>
            </div>
          )}
        />

        <form.Field
          name="tuxedoShirt"
          children={(field) => (
            <div>
              <input
                id={field.name}
                type="checkbox"
                checked={field.state.value ?? false}
                onChange={(e) => field.handleChange(e.target.checked)}
              />
              <label htmlFor={field.name}>Tuxedo Shirt</label>
            </div>
          )}
        />

        <form.Field
          name="odeToBooze"
          children={(field) => (
            <div>
              <input
                id={field.name}
                type="checkbox"
                checked={field.state.value ?? false}
                onChange={(e) => field.handleChange(e.target.checked)}
              />
              <label htmlFor={field.name}>Ode to Booze</label>
            </div>
          )}
        />

        <form.Field
          name="saucemaven"
          children={(field) => (
            <div>
              <input
                id={field.name}
                type="checkbox"
                checked={field.state.value ?? false}
                onChange={(e) => field.handleChange(e.target.checked)}
              />
              <label htmlFor={field.name}>Saucemaven</label>
            </div>
          )}
        />

        <form.Field
          name="sweetSynthesis"
          children={(field) => (
            <div>
              <input
                id={field.name}
                type="checkbox"
                checked={field.state.value ?? false}
                onChange={(e) => field.handleChange(e.target.checked)}
              />
              <label htmlFor={field.name}>Sweet Synthesis</label>
            </div>
          )}
        />

        <form.Field
          name="mayoClinic"
          children={(field) => (
            <div>
              <input
                id={field.name}
                type="checkbox"
                checked={field.state.value ?? false}
                onChange={(e) => field.handleChange(e.target.checked)}
              />
              <label htmlFor={field.name}>Mayo Clinic</label>
            </div>
          )}
        />

        <form.Field
          name="mafiaPinkyRing"
          children={(field) => (
            <div>
              <input
                id={field.name}
                type="checkbox"
                checked={field.state.value ?? false}
                onChange={(e) => field.handleChange(e.target.checked)}
              />
              <label htmlFor={field.name}>Mafia Pinky Ring</label>
            </div>
          )}
        />
      </div>

      <button type="submit">Plan</button>
    </form>
  );
}
