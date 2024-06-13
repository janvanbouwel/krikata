export class Token {
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
      throw Error(`Missing argument at index ${(this.index - 1).toString()}`);
    } else return value;
  }

  lastIndex() {
    return this.index - 1;
  }
}
