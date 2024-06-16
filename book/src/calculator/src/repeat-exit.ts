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

// ANCHOR: repeat
const repeatNumber = new Repeat(value, "-");

const arr = new Type<number[]>("arr");
arr.setDefault(repeatNumber);
// ANCHOR_END: repeat

// ANCHOR: arr
arr.setFunctions([
  Func("repeat")
    .arg(value)
    .arg(value)
    .setExec((amnt, val): number[] => Array<number>(amnt).fill(val)),
  Func("range")
    .arg(value)
    .setExec((max): number[] =>
      Array.from({ length: max }, (_, index) => index),
    ),
  Func("double")
    .arg(arr)
    .setExec((vals) => vals.map((val) => val * 2)),
]);
// ANCHOR_END: arr

value.setFunctions([
  Func("add")
    .arg(value)
    .arg(value)
    .setExec((left, right) => left + right),
  Func("mul")
    .arg(value)
    .arg(value)
    .setExec((left, right) => left * right),
  Func("sum")
    .arg(arr)
    .setExec((args: number[]) => args.reduce((sum, next) => sum + next, 0)),
  Constant("pi", () => 3.14),
]);
value.setDefault(primitives.number);

const calc = new Language("calc", value);

await cli(calc);
