import { readFile, writeFile } from "fs/promises";
import {
  AsyncFunc,
  AsyncType,
  Func,
  Language,
  Repeat,
  primitives,
} from "../index.js";
import { cli } from "../cli.js";

const stringArr = new Repeat(primitives.string, "-");

const source = new AsyncType<string>("source");

source.setFunctions([
  AsyncFunc("readFile")
    .await(primitives.string)
    .setExec((filename) => {
      return readFile(filename, { encoding: "utf-8" });
    }),
  Func("token")
    .arg(primitives.string)
    .setExec((val) => val),
  Func("join")
    .arg(primitives.string)
    .arg(stringArr)
    .setExec((by, vals) => vals.join(by)),
]);

const command = new AsyncType<void>("command");
command.setFunctions([
  AsyncFunc("writeFile")
    .await(primitives.string)
    .await(source)
    .setExec(async (filename, content) => {
      await writeFile(filename, content);
    }),
]);

const lang = new Language("toolbox", command);

await cli(lang);
