import { Token } from "./base.js";

export type Deb = Debug | DebugToken;
export class DebugToken {
  constructor(
    public type: string,
    public token: Token,
  ) {}

  showTokens(): string {
    return this.token.toString();
  }

  typedTokens(): string {
    return `${this.type}:${this.showTokens()}`;
  }

  prepend(type: string, debug: Deb): Debug {
    return new Debug(type, [debug, this]);
  }
}
export class Debug {
  constructor(
    public type: string,
    public tokens: Deb[],
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
