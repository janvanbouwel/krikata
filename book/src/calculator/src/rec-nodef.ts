import { Type, Func, Language, primitives } from "krikata";
import { cli } from "./cli.js";

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
  Func("pi").setExec(() => 3.14),
]);

const calc = new Language("calc", value);

cli(calc);
