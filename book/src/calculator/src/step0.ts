import { Type, Func, Language, primitives, cli, Constant } from "krikata";

// ANCHOR: language
const value = new Type<number>("value");

value.setFunctions([
  Func("add")
    .arg(primitives.number)
    .arg(primitives.number)
    .setExec((left, right) => left + right),
  Func("mul")
    .arg(primitives.number)
    .arg(primitives.number)
    .setExec((left, right) => left * right),
  Constant("pi", () => 3.14),
]);

const calc = new Language("calc", value);
// ANCHOR_END: language

await cli(calc);
