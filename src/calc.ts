import { createInterface } from "readline";

import { Any, Parser, Repeat, primitives, language, func } from "./index.js";

const num = primitives.number;
const bool = primitives.bool;

const print = new Any<string>("print", [
  ["num", func.arg(num).setExec((val) => val.toString())],
  ["bool", func.arg(bool).setExec((val) => val.toString())],
]);

const numArr = new Repeat(num, "-");

const op = <R>(exec: (l: number, r: number) => R) =>
  func.arg(num).arg(num).setExec(exec);

num.setExpressions([
  ["add", op((l, r) => l + r)],
  ["sub", op((l, r) => l - r)],
  ["mul", op((l, r) => l * r)],
  ["div", op((l, r) => l / r)],
  [
    "test",
    func
      .arg(bool)
      .arg(num)
      .arg(num)
      .setExec((test, t, f) => {
        return test ? t : f;
      }),
  ],
  [
    "sum",
    func
      .arg(numArr)
      .setExec((vals) => vals.reduce((prev, nex) => prev + nex, 0)),
  ],
]);

bool.setExpressions([["eq", op((l, r) => l === r)]]);

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
    const pr = language("language", print).parse(
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
