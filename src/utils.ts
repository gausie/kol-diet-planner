export type Attributes = {
  cleansesStomach?: number;
  cleansesLiver?: number;
  cleansesSpleen?: number;
  salad?: boolean;
  saucy?: boolean;
  beer?: boolean;
  wine?: boolean;
  pizza?: boolean;
  martini?: boolean;
  vampyre?: boolean;
};

export function tokenizeNotes(notes: string): string[] {
  const tokens: string[] = [];
  let currentToken = "";
  let inQuotes = false;
  let inBrackets = false;

  for (let i = 0; i < notes.length; i++) {
    const char = notes[i];

    if (char === '"' && !inBrackets) {
      inQuotes = !inQuotes;
    } else if (char === "(" && !inQuotes) {
      inBrackets = true;
    } else if (char === ")" && inBrackets) {
      inBrackets = false;
    } else if (char === "," && !inQuotes && !inBrackets) {
      if (currentToken.trim()) {
        tokens.push(currentToken.trim());
        currentToken = "";
        continue;
      }
    }

    currentToken += char;
  }

  if (currentToken.trim()) {
    tokens.push(currentToken.trim());
  }

  return tokens;
}

export function parseTokenizedNotes(tokens: string[]) {
  return tokens.reduce<Attributes>((acc, token) => {
    switch (token) {
      case "SALAD":
        acc.salad = true;
        break;
      case "SAUCY":
        acc.saucy = true;
        break;
      case "BEER":
        acc.beer = true;
        break;
      case "WINE":
        acc.wine = true;
        break;
      case "PIZZA":
        acc.pizza = true;
        break;
      case "MARTINI":
        acc.martini = true;
        break;
      case "Vampyre":
        acc.vampyre = true;
        break;
      default: {
        const match = token
          .toLowerCase()
          .match(/-(\d+) (fullness|drunkenness|spleen)/);
        if (match) {
          const value = Number(match[1]);
          switch (match[2]) {
            case "fullness":
              acc.cleansesStomach = value;
              break;
            case "drunkenness":
              acc.cleansesLiver = value;
              break;
            case "spleen":
              acc.cleansesSpleen = value;
              break;
          }
        }
      }
    }
    return acc;
  }, {});
}

export function parseNotes(notes: string) {
  return parseTokenizedNotes(tokenizeNotes(notes));
}

export const tuple = <T extends any[]>(...args: T): T => args;
