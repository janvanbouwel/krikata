export class Parser {
  index = 0;

  constructor(private args: string[]) {}

  static fromArgv(): Parser {
    return new Parser(process.argv.slice(2));
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

class ParseResult<T> {
  constructor(public execute: () => T) {}
}

type ExpressionParser<R> = (parser: Parser) => ParseResult<R>;

export class Expression<R> {
  constructor(public parse: ExpressionParser<R>) {}
}

export function language<R>(expression: Expression<R>): Expression<R> {
  return new Expression((parser) => {
    const result = expression.parse(parser);
    if (!parser.finished())
      throw Error("Parsing finished with input remaining.");
    return result;
  });
}

class ExpressionBuilder<
  Args extends unknown[] = [],
  ParseResArgs extends ParseResult<unknown>[] = [],
> {
  constructor(
    protected name: string,
    protected argExtractor: (parser: Parser) => ParseResArgs,
  ) {}

  arg<R>(
    extractor: Expression<R>,
  ): ExpressionBuilder<[...Args, R], [...ParseResArgs, ParseResult<R>]> {
    return new ExpressionBuilder<
      [...Args, R],
      [...ParseResArgs, ParseResult<R>]
    >(this.name, (parser) => [
      ...this.argExtractor(parser),
      extractor.parse(parser),
    ]);
  }

  setExec<R>(exec: (...args: Args) => R): Expression<R> {
    return new Expression<R>((parser) => {
      if (parser.next() !== this.name)
        throw Error("Parsed does not match wanted");

      const parsedArgs = this.argExtractor(parser);

      return new ParseResult(() => {
        const args = parsedArgs.map((value) => value.execute()) as Args;
        return exec(...args);
      });
    });
  }
}

export function func(name: string): ExpressionBuilder {
  return new ExpressionBuilder(name, () => []);
}

export class Any<R> implements Expression<R> {
  private default?: Expression<R>;

  constructor(private expressions: Expression<R>[] = []) {}

  static fromDefault<R>(def: Expression<R>): Any<R> {
    return new Any<R>().setDefault(def);
  }

  setExpressions(expressions: Expression<R>[]) {
    this.expressions = expressions;
    return this;
  }

  setDefault(expression?: Expression<R>) {
    this.default = expression;
    return this;
  }

  parse(parser: Parser): ParseResult<R> {
    for (const expression of this.expressions) {
      const index = parser.index;
      try {
        return expression.parse(parser);
      } catch (error) {
        parser.index = index;
      }
    }
    if (this.default) return this.default.parse(parser);

    throw Error("Was not able to parse any expression");
  }
}

abstract class BaseRepeat<C, R> implements Expression<R> {
  constructor(
    protected expression: Expression<C>,
    protected exit?: string,
  ) {}

  abstract parse(parser: Parser): ParseResult<R>;

  _parse(parser: Parser) {
    const parseResult = [];
    while (parser.peek()) {
      if (this.exit) {
        if (parser.next() === this.exit) break;
        parser.undo();
      }

      parseResult.push(this.expression.parse(parser));
    }

    return parseResult;
  }
}

export class Repeat<R> extends BaseRepeat<R, R[]> {
  parse(parser: Parser): ParseResult<R[]> {
    const parseResult = this._parse(parser);

    return {
      execute: () => {
        const result = [];
        for (const res of parseResult) {
          result.push(res.execute());
        }
        return result;
      },
    };
  }
}

export class AsyncRepeat<R> extends BaseRepeat<R | Promise<R>, Promise<R[]>> {
  parse(parser: Parser) {
    const parseResult: ParseResult<R | Promise<R>>[] = this._parse(parser);

    return {
      execute: async () => {
        const result = [];
        for (const res of parseResult) {
          result.push(await res.execute());
        }
        return result;
      },
    };
  }
}

const parsePrimitive = <T>(parseFn: (parser: Parser) => T): Expression<T> => {
  return new Expression((parser: Parser) => {
    const result = parseFn(parser);
    return new ParseResult(() => result);
  });
};

export const strictPrimitives = {
  int: parsePrimitive((parser) => {
    const n = parseFloat(parser.next());
    if (!Number.isInteger(n)) throw Error("Expected integer");
    return n;
  }),
  number: parsePrimitive((parser) => {
    const n = parseFloat(parser.next());
    if (!Number.isFinite(n)) throw Error("Invalid number");
    return n;
  }),
  string: parsePrimitive((parser) => {
    return parser.next();
  }),
  bool: parsePrimitive((parser) => {
    const val = parser.next();
    if (val === "true") return true;
    if (val === "false") return false;
    throw Error("Invalid boolean");
  }),
};

export const primitives = {
  int: Any.fromDefault(strictPrimitives.int),
  number: Any.fromDefault(strictPrimitives.number),
  string: Any.fromDefault(strictPrimitives.string),
  bool: Any.fromDefault(strictPrimitives.bool),
};
