import { Debug, DebugToken } from "../debug.js";
import { Grammar, format } from "../grammar.js";
import { Parser } from "../parser.js";

export type Promisable<T> = T | PromiseLike<T>;

export type Runnable<T> = () => T;

export interface ParseResult<T> {
  debug: Debug | DebugToken;
  execute: Runnable<T>;
}

export interface Expression<R> {
  type: string;

  grammar: (grammar: Grammar) => Grammar;

  parse: (parser: Parser) => ParseResult<R>;
}

export class Language<R> {
  private name;
  constructor(
    name: string,
    private expression: Expression<R>,
  ) {
    this.name = `l.${name}`;
  }

  grammar(): Grammar {
    const gram = new Grammar();

    gram.store.set(this.name, [[format.type(this.expression), format.EOI]]);
    return this.expression.grammar(gram);
  }

  parse(parser: Parser): ParseResult<R> {
    const result = this.expression.parse(parser);
    if (!parser.finished())
      throw Error("Parsing finished with input remaining.");
    return {
      debug: new Debug(this.name, [result.debug]),
      execute: () => result.execute(),
    };
  }
}
