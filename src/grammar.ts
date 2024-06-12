export type Grammar = Map<string, string[][]>;

export const repeat = (val: string) => `${val}*`;
export const quote = (val: string) => `"${val}"`;

export function formatGrammar(grammar: Grammar): string {
  const lines = [];

  for (const [key, arr] of grammar.entries()) {
    lines.push(`${key}:`);
    const sizes: number[] = [];
    for (const rule of arr) {
      rule.map((val, i) => {
        const size = val.length;
        if (size > (sizes[i] ?? 0)) sizes[i] = size;
      });
    }

    for (let rule of arr) {
      rule = rule.map((val, i) => val.padEnd(sizes[i] ?? 0, " "));
      lines.push(` | ${rule.join(" ")}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
