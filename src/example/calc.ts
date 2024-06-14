import { createInterface } from "readline";

import { Func, Language, Parser, Repeat, Type, primitives } from "../index.js";

const num = new Type<number>("number").setDefault(primitives.number);
const bool = new Type<boolean>("bool").setDefault(primitives.bool);

const print = new Type<string>("print", [
  Func("num")
    .arg(num)
    .setExec((val) => val.toString()),

  Func("bool")
    .arg(bool)
    .setExec((val) => val.toString()),
]);

const numArr = new Repeat(num, "-");

const op = <R>(name: string, exec: (l: number, r: number) => R) =>
  Func(name).arg(num).arg(num).setExec(exec);

num.setFunctions([
  op("add", (l, r) => l + r),
  op("sub", (l, r) => l - r),
  op("mul", (l, r) => l * r),
  op("div", (l, r) => l / r),
  Func("test")
    .arg(bool)
    .arg(num)
    .arg(num)
    .setExec((test, t, f) => {
      return test ? t : f;
    }),
  Func("sum")
    .arg(numArr)
    .setExec((vals) => vals.reduce((prev, nex) => prev + nex, 0)),
]);

bool.setFunctions([op("eq", (l, r) => l === r)]);

const lang = new Language("language", print);

const grammar = lang.grammar();
console.log(grammar.format());
// console.log(lang.parser.grammar(new Map()));

if (process.argv.length > 2) {
  const rl = createInterface({
    prompt: "> ",
    input: process.stdin,
    output: process.stdout,
    crlfDelay: Infinity,
  });

  const onClose = () => {
    console.log();
  };
  rl.on("close", onClose);
  rl.prompt();
  for await (const line of rl) {
    if (line === ":q") {
      rl.removeListener("close", onClose);
      rl.close();
      break;
    }

    try {
      const pr = lang.parse(
        Parser.fromArray(
          line
            .trim()
            .split(" ")
            .filter((str) => str.length > 0),
        ),
      );
      console.log(pr.debug.showTokens());
      console.log(pr.debug.typedTokens());
      console.log(pr.execute());
    } catch (error: unknown) {
      if (error instanceof Error) console.log(error.message);
    }
    rl.prompt();
  }
  //   console.log(num.parse(Parser.fromArgv()).execute());
}
