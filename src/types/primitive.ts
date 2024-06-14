import { Expression, ParseResult } from "./base.js";
import { DebugToken } from "../debug.js";
import { Grammar } from "../grammar.js";
import { Parser } from "../parser.js";

class Primitive<T> implements Expression<T> {
  constructor(
    public type: string,
    private parseFn: (val: string) => T,
  ) {}

  grammar(grammar: Grammar): Grammar {
    return grammar;
  }

  parse(parser: Parser): ParseResult<T> {
    const token = parser.next();
    const result = this.parseFn(token.value);
    return {
      debug: new DebugToken(this.type, token),
      execute: () => Promise.resolve(result),
    };
  }
}

export const primitives = {
  int: new Primitive("int", (value) => {
    const n = parseFloat(value);
    if (!Number.isInteger(n)) throw Error("Expected integer");
    return n;
  }),
  number: new Primitive("number", (value) => {
    const n = parseFloat(value);
    if (!Number.isFinite(n)) throw Error("Invalid number");
    return n;
  }),
  string: new Primitive("string", (value) => value),
  bool: new Primitive("bool", (value) => {
    if (value === "true") return true;
    if (value === "false") return false;
    throw Error("Invalid boolean");
  }),
};
