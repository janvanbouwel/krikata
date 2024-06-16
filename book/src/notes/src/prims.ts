import { Type, Func, Language, primitives, cli, Constant } from "krikata";

// ANCHOR: language
const show = new Type<string>("value");

// ANCHOR: mybool
const mybool = new Type<boolean>("mybool", [
  Constant("T", () => true),
  Constant("T", () => false),
]);
// ANCHOR_END: mybool

show.setFunctions([
  Func("number")
    .arg(primitives.number)
    .setExec((val) => val.toString()),
  Func("int")
    .arg(primitives.int)
    .setExec((val) => val.toString()),
  Func("string")
    .arg(primitives.string)
    .setExec((val) => val.toString()),
  Func("bool")
    .arg(primitives.bool)
    .setExec((val) => val.toString()),
  Func("mybool")
    .arg(mybool)
    .setExec((val) => val.toString()),
]);

const calc = new Language("calc", show);
// ANCHOR_END: language

await cli(calc);
