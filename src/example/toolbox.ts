import { readFile, writeFile } from "fs/promises";
import { Func, Language, Repeat, Type, cli, primitives } from "../index.js";

const stringArr = new Repeat(primitives.string, "-");

const source = new Type<string>("source");

source.setFunctions([
  Func("readFile")
    .arg(primitives.string)
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

const command = new Type<void>("command");
command.setFunctions([
  Func("writeFile")
    .arg(primitives.string)
    .arg(source)
    .setExec(async (filename, content) => {
      await writeFile(filename, content);
    }),
]);

const lang = new Language("toolbox", command);

await cli(lang);
