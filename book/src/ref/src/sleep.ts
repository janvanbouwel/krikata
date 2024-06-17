import {
  Type,
  Func,
  Language,
  Repeat,
  Parallel,
  Parser,
  Constant,
} from "krikata";
import { setTimeout } from "timers/promises";

// ANCHOR: lang
const sleep = Constant("sleep", () => setTimeout(10)).toType();

const run = new Type<void>("run", [
  Func("repeat")
    .arg(new Repeat(sleep))
    .setExec(() => undefined),
  Func("parallel")
    .arg(new Parallel(sleep))
    .setExec(() => undefined),
]);

const lang = new Language("sleep", run);
// ANCHOR_END: lang

const repeatCmd = ["repeat", "sleep", "sleep", "sleep", "sleep", "sleep"];

const parsedRep = lang.parse(Parser.fromArray(repeatCmd));
console.log(`> ${repeatCmd.join(" ")}`);
console.time("took");
await parsedRep.execute();
console.timeEnd("took");

const parallelCmd = ["parallel", "sleep", "sleep", "sleep", "sleep", "sleep"];

console.log(`> ${parallelCmd.join(" ")}`);
const parsedPar = lang.parse(Parser.fromArray(parallelCmd));
console.time("took");
await parsedPar.execute();
console.timeEnd("took");
