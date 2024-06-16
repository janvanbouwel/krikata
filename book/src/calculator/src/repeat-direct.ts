import {
  Type,
  Func,
  Language,
  primitives,
  cli,
  Repeat,
  Constant,
} from "krikata";

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
  // ANCHOR: sum
  Func("sum")
    .arg(new Repeat(value))
    .setExec((args: number[]) => args.reduce((sum, next) => sum + next, 0)),
  // ANCHOR_END: sum
  Constant("pi", () => 3.14),
]);
value.setDefault(primitives.number);

const calc = new Language("calc", value);

await cli(calc);
