import { Debug, DebugToken } from "./debug.js";
import { Grammar, format } from "./grammar.js";

export interface Token {
  toString(): string;
  toStringAt(): string;
}

export interface Parser {
  finished(): boolean;
  peek(): boolean;
  undo(): this;
  next(type: { type: string }): Token;
  lastIndex(): number;
}

export type Promisable<T> = T | PromiseLike<T>;

type Runnable<T> = () => T;
export type Executor<R> = Runnable<PromiseLike<Awaited<R>>>;

export interface ParseResult<T> {
  debug: Debug | DebugToken;
  execute: Executor<T>;
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
      throw Error(
        `Unexpected token ${parser.next({ type: this.name }).toStringAt()}.`,
      );
    return {
      debug: new Debug(this.name, [result.debug]),
      execute: () => result.execute(),
    };
  }
}
