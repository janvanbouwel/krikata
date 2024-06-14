import { Expression, ParseResult } from "./base.js";
import { DebugToken } from "../debug.js";
import { Grammar, format } from "../grammar.js";
import { Parser, Token } from "../parser.js";

class Primitive<T> implements Expression<T> {
  type: string;
  constructor(
    type: string,
    private parseFn: (val: Token) => T,
  ) {
    this.type = `p.${type}`;
  }

  grammar(grammar: Grammar): Grammar {
    return grammar;
  }

  parse(parser: Parser): ParseResult<T> {
    const token = parser.next(this);

    try {
      const result = this.parseFn(token);
      return {
        debug: new DebugToken(this.type, token),
        execute: () => Promise.resolve(result),
      };
    } catch (error) {
      throw Error(
        `Unexpected token ${token.toStringAt()} for type ${format.type(this)}`,
      );
    }
  }
}

export const primitives = {
  int: new Primitive("int", (token) => {
    const n = parseFloat(token.value);
    if (!Number.isInteger(n)) throw Error();
    return n;
  }),
  number: new Primitive("number", (token) => {
    const n = parseFloat(token.value);
    if (!Number.isFinite(n)) throw Error();
    return n;
  }),
  string: new Primitive("string", (token) => token.value),
  bool: new Primitive("bool", (token) => {
    if (token.value === "true") return true;
    if (token.value === "false") return false;
    throw Error();
  }),
};
