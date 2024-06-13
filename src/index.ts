import { Deb, Debug, DebugToken } from "./debug.js";
import { Grammar, format } from "./grammar.js";
import { Parser } from "./parser.js";

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

    gram.store.set(this.name, [
      [format.type(this.expression.type), format.EOI],
    ]);
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
    public parse: (parser: Parser) => [Deb[], Executor<R>],
  ) {}

  rule(): { rule: string[]; todo: Set<Expression<unknown>> } {
    const res = {
      rule: [format.exact(this.name)],
      todo: new Set<Expression<unknown>>(),
    };

    for (const expr of this.args) {
      res.rule.push(format.type(expr.type));
      res.todo.add(expr);
    }

    return res;
  }
}

class FuncBuilder<
  Args extends unknown[] = [],
  ResArgs extends Expression<unknown>[] = [],
> {
  constructor(
    private name: string,
    protected args: ResArgs,
  ) {}

  arg<R>(
    expression: Expression<R>,
  ): FuncBuilder<[...Args, R], [...ResArgs, Expression<R>]> {
    return new FuncBuilder<[...Args, R], [...ResArgs, Expression<R>]>(
      this.name,
      [...this.args, expression],
    );
  }

  setExec<R>(exec: (...args: Args) => R): Funct<R> {
    return new Funct(this.name, this.args, (parser): [Deb[], Executor<R>] => {
      const nameToken = parser.next();
      if (nameToken.value !== this.name)
        throw Error(`Expected ${this.name} but got ${nameToken.value}`);

      const parsedArgs = this.args.map((extractor) =>
        extractor.parser.parse(parser),
      );

      return [
        [new DebugToken("fn", nameToken), ...parsedArgs.map((pr) => pr.debug)],
        () => {
          const args = parsedArgs.map((value) => value.execute()) as Args;
          return exec(...args);
        },
      ];
    });
  }
}

export const Func = (name: string) => new FuncBuilder(name, []);

export class Type<R> implements Expression<R> {
  private default?: Expression<R>;

  functions = new Map<string, Funct<R>>();

  public type;
  constructor(type: string, functions: Funct<R>[] = []) {
    this.type = `t.${type}`;
    this.setFunctions(functions);
  }

  static fromDefault<R>(name: string, def: Expression<R>): Type<R> {
    return new Type<R>(name).setDefault(def);
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
        rules.push([format.type(this.default.type)]);
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
        const [debug, exec] = exprParser.parse(parser);

        return new ParseResult(new Debug(this.type, debug), exec);
      }

      if (this.default) return this.default.parser.parse(parser);

      throw Error("Was not able to parse any expression");
    },
  );
}

abstract class BaseRepeat<C, R> implements Expression<R> {
  public type;
  constructor(
    protected expression: Expression<C>,
    protected exit?: string,
  ) {
    this.type = `${this.namePrefix()}.${expression.type}`;
  }

  parser: ExpressionParser<R> = new ExpressionParser<R>(
    (gram: Grammar): Grammar => {
      if (gram.store.has(this.type)) return gram;

      const exptType = format.repeat(format.type(this.expression.type));
      const rules = [[exptType, format.EOI]];
      if (this.exit) rules.push([exptType, format.exact(this.exit)]);
      gram.store.set(this.type, rules);

      return this.expression.parser.grammar(gram);
    },
    (parser: Parser) => {
      const parseResult = [];
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

      return new ParseResult(
        new Debug(this.type, debug),
        this.createExecutor(parseResult),
      );
    },
  );

  abstract namePrefix(): string;

  protected abstract createExecutor(parseResult: ParseResult<C>[]): Executor<R>;
}

export class Repeat<R> extends BaseRepeat<R, R[]> {
  override namePrefix(): string {
    return "r";
  }
  override createExecutor(parseResult: ParseResult<R>[]) {
    return () => {
      const result = [];
      for (const res of parseResult) {
        result.push(res.execute());
      }
      return result;
    };
  }
}

export class SequentialRepeat<R> extends BaseRepeat<
  R | Promise<R>,
  Promise<R[]>
> {
  override namePrefix(): string {
    return "sr";
  }

  override createExecutor(parseResult: ParseResult<R | Promise<R>>[]) {
    return async () => {
      const result = [];
      for (const res of parseResult) {
        result.push(await res.execute());
      }
      return result;
    };
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

export const strictPrimitives = {
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

export const primitives = {
  int: Type.fromDefault("int", strictPrimitives.int),
  number: Type.fromDefault("number", strictPrimitives.number),
  string: Type.fromDefault("string", strictPrimitives.string),
  bool: Type.fromDefault("bool", strictPrimitives.bool),
};
