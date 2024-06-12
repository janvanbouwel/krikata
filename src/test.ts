import { func, language, primitives } from "./index.js";
import { Parser } from "./parser.js";

primitives.int.setFunctions([
  [
    "add",
    func
      .arg(primitives.int)
      .arg(primitives.int)
      .setExec((left, right) => left + right),
  ],
  [
    "sub",
    func
      .arg(primitives.int)
      .arg(primitives.int)
      .setExec((left, right) => left - right),
  ],
]);

try {
  console.log(
    language("language", primitives.int)
      .parser.parse(Parser.fromArgv())
      .execute(),
  );
} catch (error) {
  if (error instanceof Error) console.log(error.message);
}
