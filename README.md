# Krikata

Krikata is an experimental framework to quickly build a parser and interpreter for Domain Specific Languages. It evaluates left to right, is right associative, and strongly typed, with an expression's type being fully dependent on the context in which it is evaluated.

## Description

A Krikata language is based on a top-level expression. Every expression is a Krikata type, and has a resulting TypeScript type. A Krikata language thus also has a specific resulting TypeScript type.

Here is a toy calculator example:

```typescript
import { Type, Func, Language, primitives, cli, Constant } from "krikata";

const value = new Type<number>("value");
value.setFunctions([
  Func("add")
    .arg(value)
    .arg(value)
    .setExec((left, right) => left + right),
  Func("mul")
    .arg(value)
    .arg(value)
    .setExec((left, right) => left * right),
  Constant("pi", () => 3.14),
]);
value.setDefault(primitives.number);

const calc = new Language("calc", value);

await cli(calc);
```

We can run this using the

```text
> add 5 mul 6 7
47
> 5
5
```

For more information, read the [book](https://janvanbouwel.github.io/krikata/)!
