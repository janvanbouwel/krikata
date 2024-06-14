import { format } from "./grammar.js";

export class Token {
  constructor(
    public value: string,
    public at: string,
  ) {}

  toString(): string {
    return this.value;
  }

  toStringAt(): string {
    return `${format.exact(this.value)} at ${this.at}`;
  }
}

export class ParserEmptyError extends Error {}

export class Parser {
  index = 0;

  private constructor(private args: Token[]) {}

  static fromArray(tokens: string[]) {
    return new Parser(
      tokens.map((value, index) => {
        return new Token(value, `index ${index.toString()}`);
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

  next(type: { type: string }) {
    const value = this.args[this.index++];

    if (!value) {
      throw new ParserEmptyError(
        `Parser finished but expected type ${format.type(type)}.`,
      );
    } else return value;
  }

  lastIndex() {
    return this.index - 1;
  }
}
