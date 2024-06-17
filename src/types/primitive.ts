import { Expression, ParseResult, Parser, Token } from "../base.js";
import { DebugToken } from "../debug.js";
import { Grammar, format } from "../grammar.js";

class Primitive<R> implements Expression<R> {
  type: string;
  constructor(
    type: string,
    private parseFn: (val: Token) => R,
  ) {
    this.type = `p.${type}`;
  }

  grammar(grammar: Grammar): Grammar {
    return grammar;
  }

  parse(parser: Parser): ParseResult<R> {
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
    const n = parseFloat(token.toString());
    if (!Number.isInteger(n)) throw Error();
    return n;
  }),
  number: new Primitive("number", (token) => {
    const n = parseFloat(token.toString());
    if (!Number.isFinite(n)) throw Error();
    return n;
  }),
  string: new Primitive("string", (token) => token.toString()),
  bool: new Primitive("bool", (token) => {
    if (token.toString() === "true") return true;
    if (token.toString() === "false") return false;
    throw Error();
  }),
};
