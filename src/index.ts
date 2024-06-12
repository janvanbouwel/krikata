class Token {
  constructor(public value: string) {}

  toString(): string {
    return this.value;
  }
}

export class Parser {
  index = 0;

  private constructor(private args: Token[]) {}

  static fromArray(tokens: string[]) {
    return new Parser(
      tokens.map((value) => {
        return new Token(value);
      }),
    );
  }

  static fromArgv(): Parser {
    return Parser.fromArray(process.argv.slice(2));
  }

  finished() {
    return this.index === this.args.length;
  }

  peek() {
    return this.args[this.index] !== undefined;
  }

  undo() {
    this.index--;
    return this;
  }

  next() {
    const value = this.args[this.index++];

    if (!value) {
      throw Error(`Missing argument at index ${this.index.toString()}`);
    } else return value;
  }

  lastIndex() {
    return this.index - 1;
  }
}

type Executor<T> = () => T;

type Deb = Debug | DebugToken;

class DebugToken {
  constructor(
    public type: string,
    public token: Token,
  ) {}

  showTokens(): string {
    return this.token.value;
  }

  typedTokens(): string {
    return `${this.type}:${this.showTokens()}`;
  }

  prepend(type: string, debug: Deb): Debug {
    return new Debug(type, [debug, this]);
  }
}

class Debug {
  constructor(
    public type: string,
    public tokens: (DebugToken | Debug)[],
  ) {}

  showTokens(): string {
    return `[${this.tokens.map((val) => val.showTokens()).join(" ")}]`;
  }

  typedTokens(): string {
    return `${this.type}:[${this.tokens.map((val) => val.typedTokens()).join(" ")}]`;
  }

  prepend(type: string, debug: Deb): Debug {
    return new Debug(type, [debug, ...this.tokens]);
  }
}

class ParseResult<T> {
  constructor(
    public debug: Debug | DebugToken,
    public execute: Executor<T>,
  ) {}
}

type ExpressionParser<R> = (parser: Parser) => ParseResult<R>;

class Expression<R> {
  constructor(
    public name: string,
    public parse: ExpressionParser<R>,
  ) {}
}

export function language<R>(
  name: string,
  expression: Expression<R>,
): Expression<R> {
  return new Expression(name, (parser) => {
    const result = expression.parse(parser);
    if (!parser.finished())
      throw Error("Parsing finished with input remaining.");
    return new ParseResult(new Debug(name, [result.debug]), () =>
      result.execute(),
    );
  });
}

class FuncBuilder<
  Args extends unknown[] = [],
  ResArgs extends Expression<unknown>[] = [],
> {
  constructor(
    protected arity: number,
    protected argExtractors: ResArgs,
  ) {}

  arg<R>(
    extractor: Expression<R>,
  ): FuncBuilder<[...Args, R], [...ResArgs, Expression<R>]> {
    return new FuncBuilder<[...Args, R], [...ResArgs, Expression<R>]>(
      this.arity + 1,
      [...this.argExtractors, extractor],
    );
  }

  setExec<R>(exec: (...args: Args) => R): ExpressionParser<R> {
    return (parser) => {
      const parsedArgs = this.argExtractors.map((extractor) =>
        extractor.parse(parser),
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
    };
  }
}

export const func = new FuncBuilder(0, []);

export class Any<R> implements Expression<R> {
  private default?: Expression<R>;

  private expressions = new Map<string, ExpressionParser<R>>();

  constructor(
    public name: string,
    expressions: [string, ExpressionParser<R>][] = [],
  ) {
    this.setExpressions(expressions);
  }

  static fromDefault<R>(name: string, def: Expression<R>): Any<R> {
    return new Any<R>(name).setDefault(def);
  }

  setExpressions(expressions: [string, ExpressionParser<R>][]) {
    for (const item of expressions) {
      this.expressions.set(item[0], item[1]);
    }

    return this;
  }

  setDefault(expression?: Expression<R>) {
    this.default = expression;
    return this;
  }

  parse(parser: Parser): ParseResult<R> {
    const nameToken = parser.next();
    const exprParser = this.expressions.get(nameToken.value);
    if (exprParser) {
      const pr = exprParser(parser);
      return new ParseResult(
        pr.debug.prepend(this.name, new DebugToken("fn", nameToken)),
        () => pr.execute(),
      );
    }

    parser.undo();
    if (this.default) return this.default.parse(parser);

    throw Error("Was not able to parse any expression");
  }
}

abstract class BaseRepeat<C, R> implements Expression<R> {
  public name;
  constructor(
    protected expression: Expression<C>,
    protected exit?: string,
  ) {
    this.name = `${this.namePrefix()}.${expression.name}`;
  }

  abstract namePrefix(): string;

  parse(parser: Parser) {
    const parseResult = [];
    const debug = [];
    while (parser.peek()) {
      if (this.exit) {
        const exitToken = parser.next();
        if (exitToken.value === this.exit) {
          debug.push(new DebugToken(`${this.name}.exit`, exitToken));
          break;
        }
        parser.undo();
      }

      const pr = this.expression.parse(parser);
      parseResult.push(pr);
      debug.push(pr.debug);
    }

    return new ParseResult(
      new Debug(this.name, debug),
      this.createExecutor(parseResult),
    );
  }

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
  name: string,
  parseFn: (val: string) => T,
): Expression<T> => {
  return new Expression(name, (parser: Parser): ParseResult<T> => {
    const token = parser.next();
    const result = parseFn(token.value);
    return new ParseResult(new DebugToken(name, token), () => result);
  });
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
  int: Any.fromDefault("int", strictPrimitives.int),
  number: Any.fromDefault("number", strictPrimitives.number),
  string: Any.fromDefault("string", strictPrimitives.string),
  bool: Any.fromDefault("bool", strictPrimitives.bool),
};
