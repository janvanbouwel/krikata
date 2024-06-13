import { Type, Func, Language, primitives } from "krikata";
import { cli } from "./cli.js";

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
  Func("pi").setExec(() => 3.14),
]);
// ANCHOR: default
value.setDefault(primitives.number);
// ANCHOR_END: default

const calc = new Language("calc", value);

cli(calc);
