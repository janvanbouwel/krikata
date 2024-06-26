import { primitives } from "../types/primitive.js";
import { Func, Type } from "../types/type.js";
import { Language } from "../types/base.js";
import { Parser } from "../parser.js";

const int = new Type<number>("int").setDefault(primitives.int);

int.setFunctions([
  Func("add")
    .arg(int)
    .arg(int)
    .setExec((left, right) => left + right),

  Func("sub")
    .arg(int)
    .arg(int)
    .setExec((left, right) => left - right),
]);

try {
  console.log(new Language("language", int).parse(Parser.fromArgv()).execute());
} catch (error) {
  if (error instanceof Error) console.log(error.message);
}
