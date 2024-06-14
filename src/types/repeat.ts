import { Expression, ParseResult } from "./base.js";
import { Debug, DebugToken } from "../debug.js";
import { Grammar, format } from "../grammar.js";
import { Parser } from "../parser.js";

abstract class BaseRepeat<R> implements Expression<R[]> {
  public type;
  constructor(
    protected expression: Expression<R>,
    protected exit?: string,
  ) {
    this.type = `r.${expression.type}`;
  }

  grammar(grammar: Grammar): Grammar {
    if (grammar.store.has(this.type)) return grammar;

    const exptType = format.repeat(format.type(this.expression));
    const rules = [[exptType, format.EOI]];
    if (this.exit) rules.push([exptType, format.exact(this.exit)]);
    grammar.store.set(this.type, rules);

    return this.expression.grammar(grammar);
  }

  parse(parser: Parser): ParseResult<R[]> {
    const parseResult: ParseResult<R>[] = [];
    const debug = [];
    while (parser.peek()) {
      if (this.exit) {
        const exitToken = parser.next({ type: "" });
        if (exitToken.value === this.exit) {
          debug.push(new DebugToken(`${this.type}.exit`, exitToken));
          break;
        }
        parser.undo();
      }

      const pr = this.expression.parse(parser);
      parseResult.push(pr);
      debug.push(pr.debug);
    }

    return {
      debug: new Debug(this.type, debug),
      execute: () => this.exec(parseResult),
    };
  }

  protected abstract exec(parseResult: ParseResult<R>[]): Promise<R[]>;
}

export class Sequence<R> extends BaseRepeat<R> {
  override async exec(parseResult: ParseResult<R>[]) {
    // return Array.fromAsync(parseResult, (pr) => pr.execute());
    const result = [];
    for (const pr of parseResult) {
      result.push(await pr.execute());
    }
    return result;
  }
}

export class Repeat<R> extends BaseRepeat<R> {
  override exec(parseResult: ParseResult<R>[]) {
    return Promise.all(parseResult.map((pr) => pr.execute()));
  }
}
