import { Executor, Expression, ParseResult, Promisable } from "./base.js";
import { Deb, Debug, DebugToken } from "../debug.js";
import { Grammar, format } from "../grammar.js";
import { Parser } from "../parser.js";

class Funct<R> {
  constructor(
    public name: string,
    public args: Expression<unknown>[],
    public parse: (parser: Parser) => { debug: Deb[]; execute: Executor<R> },
  ) {}

  rule(): { rule: string[]; todo: Set<Expression<unknown>> } {
    const res = {
      rule: [format.exact(this.name)],
      todo: new Set<Expression<unknown>>(),
    };

    for (const expr of this.args) {
      res.rule.push(format.type(expr));
      res.todo.add(expr);
    }

    return res;
  }
}

class FuncBuilder<Args extends unknown[] = []> {
  constructor(
    protected name: string,
    protected args: Expression<unknown>[],
  ) {}

  arg<R>(expression: Expression<R>): FuncBuilder<[...Args, Awaited<R>]> {
    return new FuncBuilder(this.name, [...this.args, expression]);
  }

  setExec<R>(exec: (...args: Args) => Promisable<R>): Funct<R> {
    return new Funct(
      this.name,
      this.args,
      (parser): { debug: Deb[]; execute: Executor<R> } => {
        const nameToken = parser.next({ type: this.name });
        if (nameToken.value !== this.name)
          throw Error(`Expected ${this.name} but got ${nameToken.value}`);

        const parsedArgs = this.args.map((expression) =>
          expression.parse(parser),
        );

        const debug = [
          new DebugToken("fn", nameToken),
          ...parsedArgs.map((pr) => pr.debug),
        ];

        return {
          debug,
          execute: async (): Promise<Awaited<R>> => {
            // await Array.fromAsync(parsedArgs, (pr) => pr.execute());
            const args = [];
            for (const pr of parsedArgs) {
              args.push(await pr.execute());
            }

            return await exec(...(args as Args));
          },
        };
      },
    );
  }
}

export const Func = (name: string) => new FuncBuilder(name, []);
export const Constant = <R>(name: string, exec: () => Promisable<R>) => {
  return Func(name).setExec(exec);
};

export class Type<R> implements Expression<R> {
  private default?: Expression<R>;

  functions = new Map<string, Funct<R>>();

  public type;
  constructor(type: string, functions: Funct<R>[] = []) {
    this.type = `t.${type}`;
    this.setFunctions(functions);
  }

  static fromFunc<R>(func: Funct<R>): Type<R> {
    return new Type(func.name, [func]);
  }

  setFunctions(functions: Funct<R>[]) {
    for (const func of functions) this.functions.set(func.name, func);
    return this;
  }

  setDefault(expression?: Expression<R>) {
    this.default = expression;
    return this;
  }

  grammar(grammar: Grammar): Grammar {
    if (grammar.store.has(this.type)) return grammar;

    const rules = [];
    const todo = new Set<Expression<unknown>>();
    for (const func of this.functions.values()) {
      const { rule, todo: fnTodo } = func.rule();
      rules.push(rule);
      for (const expr of fnTodo) todo.add(expr);
    }

    if (this.default) {
      rules.push([format.type(this.default)]);
      todo.add(this.default);
    }
    grammar.store.set(this.type, rules);

    for (const expr of todo.values()) {
      grammar = expr.grammar(grammar);
    }
    return grammar;
  }

  parse(parser: Parser): ParseResult<R> {
    const nameToken = parser.next(this);

    const exprParser = this.functions.get(nameToken.value);
    parser.undo();
    if (exprParser) {
      const { debug, execute } = exprParser.parse(parser);

      return { debug: new Debug(this.type, debug), execute };
    }

    if (this.default) return this.default.parse(parser);

    throw Error(
      `Unexpected token ${nameToken.toStringAt()} for type ${format.type(this)}`,
    );
  }
}
