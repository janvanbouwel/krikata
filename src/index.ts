import { Debug, DebugToken } from "./debug.js";
import { Grammar, quote, repeat } from "./grammar.js";
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

export function language<R>(
  type: string,
  expression: Expression<R>,
): Expression<R> {
  return new Expression(
    type,
    new ExpressionParser<R>(
      (gram: Grammar) => {
        if (gram.has(type)) return gram;
        gram.set(type, [[expression.type, "EOI"]]);
        return expression.parser.grammar(gram);
      },
      (parser) => {
        const result = expression.parser.parse(parser);
        if (!parser.finished())
          throw Error("Parsing finished with input remaining.");
        return new ParseResult(new Debug(type, [result.debug]), () =>
          result.execute(),
        );
      },
    ),
  );
}

class Func<R> {
  constructor(
    public args: Expression<unknown>[],
    public parse: (parser: Parser) => ParseResult<R>,
  ) {}
}

class FuncBuilder<
  Args extends unknown[] = [],
  ResArgs extends Expression<unknown>[] = [],
> {
  constructor(protected args: ResArgs) {}

  arg<R>(
    expression: Expression<R>,
  ): FuncBuilder<[...Args, R], [...ResArgs, Expression<R>]> {
    return new FuncBuilder<[...Args, R], [...ResArgs, Expression<R>]>([
      ...this.args,
      expression,
    ]);
  }

  setExec<R>(exec: (...args: Args) => R): Func<R> {
    return new Func(this.args, (parser) => {
      const parsedArgs = this.args.map((extractor) =>
        extractor.parser.parse(parser),
      );

      return new ParseResult(
        new Debug(
          "body",
          parsedArgs.map((pr) => pr.debug),
        ),
        () => {
          const args = parsedArgs.map((value) => value.execute()) as Args;
          return exec(...args);
        },
      );
    });
  }
}

export const func = new FuncBuilder([]);

export class Any<R> implements Expression<R> {
  private default?: Expression<R>;

  private expressions = new Map<string, Func<R>>();

  constructor(
    public type: string,
    expressions: [string, Func<R>][] = [],
  ) {
    this.setExpressions(expressions);
  }

  static fromDefault<R>(name: string, def: Expression<R>): Any<R> {
    return new Any<R>(name).setDefault(def);
  }

  setExpressions(expressions: [string, Func<R>][]) {
    for (const item of expressions) {
      this.expressions.set(item[0], item[1]);
    }

    return this;
  }

  setDefault(expression?: Expression<R>) {
    this.default = expression;
    return this;
  }

  parser = new ExpressionParser<R>(
    (gram) => {
      if (gram.has(this.type)) return gram;
      const lines = [];
      const todo = new Set<Expression<unknown>>();
      for (const [key, func] of this.expressions.entries()) {
        const line = [quote(key)];
        for (const arg of func.args) {
          line.push(arg.type);
          todo.add(arg);
        }
        lines.push(line);
      }
      if (this.default) {
        lines.push([this.default.type]);
        todo.add(this.default);
      }
      gram.set(this.type, lines);

      for (const expr of todo.values()) {
        gram = expr.parser.grammar(gram);
      }
      return gram;
    },
    (parser: Parser): ParseResult<R> => {
      const nameToken = parser.next();
      const exprParser = this.expressions.get(nameToken.value);
      if (exprParser) {
        const pr = exprParser.parse(parser);
        return new ParseResult(
          pr.debug.prepend(this.type, new DebugToken("fn", nameToken)),
          () => pr.execute(),
        );
      }

      parser.undo();
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
      if (gram.has(this.type)) return gram;
      gram.set(
        this.type,
        [[repeat(this.expression.type), "EOI"]].concat(
          this.exit ? [[repeat(this.expression.type), quote(this.exit)]] : [],
        ),
      );
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
    return "array";
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
    return "seq-array";
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
    type,
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
  int: parsePrimitive("p.int", (value) => {
    const n = parseFloat(value);
    if (!Number.isInteger(n)) throw Error("Expected integer");
    return n;
  }),
  number: parsePrimitive("p.number", (value) => {
    const n = parseFloat(value);
    if (!Number.isFinite(n)) throw Error("Invalid number");
    return n;
  }),
  string: parsePrimitive("p.string", (value) => value),
  bool: parsePrimitive("p.bool", (value) => {
    if (value === "true") return true;
    if (value === "false") return false;
    throw Error("Invalid boolean");
  }),
};

export const primitives = {
  int: Any.fromDefault("int", strictPrimitives.int),
  number: Any.fromDefault("number", strictPrimitives.number),
  string: Any.fromDefault("string", strictPrimitives.string),
  bool: Any.fromDefault("bool", strictPrimitives.bool),
};
