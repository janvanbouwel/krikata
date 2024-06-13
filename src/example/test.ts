import { Func, Language, primitives } from "../index.js";
import { Parser } from "../parser.js";

primitives.int.setFunctions([
  Func("add")
    .arg(primitives.int)
    .arg(primitives.int)
    .setExec((left, right) => left + right),

  Func("sub")
    .arg(primitives.int)
    .arg(primitives.int)
    .setExec((left, right) => left - right),
]);

try {
  console.log(
    new Language("language", primitives.int).parse(Parser.fromArgv()).execute(),
  );
} catch (error) {
  if (error instanceof Error) console.log(error.message);
}
