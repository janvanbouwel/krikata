export type Grammar = Map<string, string[][]>;

const type = (val: string) => `<${val}>`;
const repeat = (val: string) => `${val} *`;
const exact = (val: string) => `"${val}"`;
const EOI = "EOI";

export const format = { type, repeat, exact, EOI };

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
