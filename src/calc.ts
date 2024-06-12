import { createInterface } from "readline";

import { Any, Parser, Repeat, primitives, language, func } from "./index.js";

const num = primitives.number;
const bool = primitives.bool;

const print = new Any<string>([
  func("num")
    .arg(num)
    .setExec((val) => val.toString()),
  func("bool")
    .arg(bool)
    .setExec((val) => val.toString()),
]);

const op = <R>(name: string, exec: (l: number, r: number) => R) =>
  func(name).arg(num).arg(num).setExec(exec);

num.setExpressions([
  op("add", (l, r) => l + r),
  op("sub", (l, r) => l - r),
  op("mul", (l, r) => l * r),
  op("div", (l, r) => l / r),
  func("test")
    .arg(bool)
    .arg(num)
    .arg(num)
    .setExec((test, t, f) => {
      return test ? t : f;
    }),
  func("sum")
    .arg(new Repeat(num, "-"))
    .setExec((vals) => vals.reduce((prev, nex) => prev + nex, 0)),
]);

bool.setExpressions([op("eq", (l, r) => l === r)]);

const rl = createInterface({
  prompt: "> ",
  input: process.stdin,
  output: process.stdout,
  crlfDelay: Infinity,
  //   history: [],
  //   historySize: 30,
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
    console.log(
      language(print)
        .parse(
          new Parser(
            line
              .trim()
              .split(" ")
              .filter((str) => str.length > 0),
          ),
        )
        .execute(),
    );
  } catch (error: unknown) {
    if (error instanceof Error) console.log(error.message);
  }
  rl.prompt();
}
//   console.log(num.parse(Parser.fromArgv()).execute());
