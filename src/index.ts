import { Deb, Debug, DebugToken } from "./debug.js";
import { Grammar, format } from "./grammar.js";
import { Parser } from "./parser.js";
export { cli } from "./cli.js";

export { Parser };

export type Promisable<T> = T | PromiseLike<T>;

type Executor<T> = () => T;

class ParseResult<T> {
  constructor(
    public debug: Debug | DebugToken,
    public execute: Executor<T>,
  ) {}
}

class ExpressionParser<R> {
  constructor(
    public grammar: (grammar: Grammar) => Grammar,
    public parse: (parser: Parser) => ParseResult<R>,
  ) {}
}

class Expression<R> {
  constructor(
    public type: string,
    public parser: ExpressionParser<R>,
  ) {}
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
    return this.expression.parser.grammar(gram);
  }

  parse(parser: Parser): ParseResult<R> {
    const result = this.expression.parser.parse(parser);
    if (!parser.finished())
      throw Error("Parsing finished with input remaining.");
    return new ParseResult(new Debug(this.name, [result.debug]), () =>
      result.execute(),
    );
  }
}

class Funct<R> {
  constructor(
    public name: string,
    public args: Expression<unknown>[],
    public parse: (parser: Parser) => { debug: Deb[]; exec: Executor<R> },
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

abstract class BaseFuncBuilder {
  constructor(
    protected name: string,
    protected args: Expression<unknown>[],
  ) {}

  exec<R>(
    executor: (parsedArgs: ParseResult<unknown>[]) => Executor<R>,
  ): Funct<R> {
    return new Funct(this.name, this.args, (parser) => {
      const nameToken = parser.next();
      if (nameToken.value !== this.name)
        throw Error(`Expected ${this.name} but got ${nameToken.value}`);

      const parsedArgs = this.args.map((extractor) =>
        extractor.parser.parse(parser),
      );

      const debug = [
        new DebugToken("fn", nameToken),
        ...parsedArgs.map((pr) => pr.debug),
      ];

      return {
        debug,
        exec: executor(parsedArgs),
      };
    });
  }
}

class FuncBuilder<Args extends unknown[] = []> extends BaseFuncBuilder {
  arg<R>(expression: Expression<R>): FuncBuilder<[...Args, R]> {
    return new FuncBuilder(this.name, [...this.args, expression]);
  }

  setExec<R>(exec: (...args: Args) => R): Funct<R> {
    return this.exec((parsedArgs) => {
      return () => {
        const args = parsedArgs.map((value) => value.execute()) as Args;
        return exec(...args);
      };
    });
  }
}

class AsyncFB<Args extends unknown[] = []> extends BaseFuncBuilder {
  await<R>(expression: Expression<R>): AsyncFB<[...Args, Awaited<R>]> {
    return new AsyncFB(this.name, [...this.args, expression]);
  }

  setExec<R>(exec: (...args: Args) => Promisable<R>): Funct<Promise<R>> {
    return this.exec((parsedArgs) => {
      return async () => {
        const args = (await Promise.all(
          parsedArgs.map((value) => value.execute()),
        )) as Args;
        return exec(...args);
      };
    });
  }
}

export const Func = (name: string) => new FuncBuilder(name, []);
export const AsyncFunc = (name: string) => new AsyncFB(name, []);

export abstract class BaseType<R> implements Expression<R> {
  private default?: Expression<R>;

  functions = new Map<string, Funct<R>>();

  public type;
  constructor(type: string, functions: Funct<R>[] = []) {
    this.type = `t.${type}`;
    this.setFunctions(functions);
  }

  setFunctions(functions: Funct<R>[]) {
    for (const func of functions) this.functions.set(func.name, func);
    return this;
  }

  setDefault(expression?: Expression<R>) {
    this.default = expression;
    return this;
  }

  parser = new ExpressionParser<R>(
    (gram) => {
      if (gram.store.has(this.type)) return gram;

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
      gram.store.set(this.type, rules);

      for (const expr of todo.values()) {
        gram = expr.parser.grammar(gram);
      }
      return gram;
    },
    (parser: Parser): ParseResult<R> => {
      const nameToken = parser.next();
      const exprParser = this.functions.get(nameToken.value);
      parser.undo();
      if (exprParser) {
        const { debug, exec } = exprParser.parse(parser);

        return new ParseResult(new Debug(this.type, debug), exec);
      }

      if (this.default) return this.default.parser.parse(parser);

      throw Error("Was not able to parse any expression");
    },
  );
}

export class Type<R> extends BaseType<R extends Promise<unknown> ? never : R> {}

export class AsyncType<R> extends BaseType<Promisable<R>> {}

abstract class BaseRepeat<C, R> implements Expression<R> {
  public type;
  constructor(
    protected expression: Expression<C>,
    protected exit?: string,
  ) {
    this.type = `r.${expression.type}`;
  }

  parser: ExpressionParser<R> = new ExpressionParser<R>(
    (gram: Grammar): Grammar => {
      if (gram.store.has(this.type)) return gram;

      const exptType = format.repeat(format.type(this.expression));
      const rules = [[exptType, format.EOI]];
      if (this.exit) rules.push([exptType, format.exact(this.exit)]);
      gram.store.set(this.type, rules);

      return this.expression.parser.grammar(gram);
    },
    (parser: Parser) => {
      const parseResult: ParseResult<C>[] = [];
      const debug = [];
      while (parser.peek()) {
        if (this.exit) {
          const exitToken = parser.next();
          if (exitToken.value === this.exit) {
            debug.push(new DebugToken(`${this.type}.exit`, exitToken));
            break;
          }
          parser.undo();
        }

        const pr = this.expression.parser.parse(parser);
        parseResult.push(pr);
        debug.push(pr.debug);
      }

      return new ParseResult(new Debug(this.type, debug), () =>
        this.exec(parseResult),
      );
    },
  );

  protected abstract exec(parseResult: ParseResult<C>[]): R;
}

export class Repeat<R> extends BaseRepeat<R, R[]> {
  override exec(parseResult: ParseResult<R>[]) {
    return parseResult.map((pr) => pr.execute());
  }
}

export class AsyncSequence<R> extends BaseRepeat<Promisable<R>, Promise<R[]>> {
  override async exec(parseResult: ParseResult<Promisable<R>>[]) {
    // return Array.fromAsync(parseResult, (pr) => pr.execute());
    const result = [];
    for (const pr of parseResult) {
      result.push(await pr.execute());
    }
    return result;
  }
}

export class AsyncAll<R> extends BaseRepeat<Promisable<R>, Promise<R[]>> {
  override exec(parseResult: ParseResult<Promisable<R>>[]) {
    return Promise.all(parseResult.map((pr) => pr.execute()));
  }
}

const parsePrimitive = <T>(
  type: string,
  parseFn: (val: string) => T,
): Expression<T> => {
  return new Expression(
    `p.${type}`,
    new ExpressionParser(
      (gram) => gram,
      (parser: Parser): ParseResult<T> => {
        const token = parser.next();
        const result = parseFn(token.value);
        return new ParseResult(new DebugToken(type, token), () => result);
      },
    ),
  );
};

export const primitives = {
  int: parsePrimitive("int", (value) => {
    const n = parseFloat(value);
    if (!Number.isInteger(n)) throw Error("Expected integer");
    return n;
  }),
  number: parsePrimitive("number", (value) => {
    const n = parseFloat(value);
    if (!Number.isFinite(n)) throw Error("Invalid number");
    return n;
  }),
  string: parsePrimitive("string", (value) => value),
  bool: parsePrimitive("bool", (value) => {
    if (value === "true") return true;
    if (value === "false") return false;
    throw Error("Invalid boolean");
  }),
};
