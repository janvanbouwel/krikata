import { Type, Func, Language, primitives, cli, Constant } from "krikata";

const value = new Type<number>("value");

value.setFunctions([
  // ANCHOR: value
  Func("add")
    .arg(value)
    .arg(value)
    .setExec((left, right) => left + right),
  // ANCHOR_END: value
  Func("mul")
    .arg(value)
    .arg(value)
    .setExec((left, right) => left * right),
  // ANCHOR: im
  Func("im")
    .arg(primitives.number)
    .setExec((val) => val),
  // ANCHOR_END: im
  Constant("pi", () => 3.14),
]);

const calc = new Language("calc", value);

await cli(calc);
