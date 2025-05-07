export type Consumable = {
  name: string;
  id: number;
  price: number;
  turns: number;
  stomach: number;
  liver: number;
  spleen: number;
  notes: string;
  effect: string;
  effectDuration: string;
};

export type Effect = {
  name: string;
  id: number;
  modifiers: {
    [key: string]: string;
  };
};

export function applyCleanser(consumable: Consumable) {
  if (consumable.notes === "") return consumable;
  const match = consumable.notes
    .toLowerCase()
    .match(/-(\d+) (fullness|drunkenness|spleen)/);
  if (!match) return consumable;
  const organ = match[2];
  const space = Number(match[1]);
  return {
    ...consumable,
    stomach: consumable.stomach - (organ === "fullness" ? space : 0),
    liver: consumable.liver - (organ === "drunkenness" ? space : 0),
    spleen: consumable.spleen - (organ === "spleen" ? space : 0),
  };
}

export function isVampyre(consumable: Consumable) {
  return consumable.notes.includes("Vampyre");
}

export function isSalad(consumable: Consumable) {
  return consumable.notes.includes("SALAD");
}

export function isBeer(consumable: Consumable) {
  return consumable.notes.includes("BEER");
}

export function isSaucy(consumable: Consumable) {
  return consumable.notes.includes("SAUCY");
}

export function isWine(consumable: Consumable) {
  return consumable.notes.includes("WINE");
}

export function isPizza(consumable: Consumable) {
  return consumable.notes.includes("PIZZA");
}

export function isMartini(consumable: Consumable) {
  return consumable.notes.includes("MARTINI");
}
