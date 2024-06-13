import { greet } from "./greeting.js";
import { Parser } from "krikata";

// ANCHOR: parse-exec
try {
  const parseResult = greet.parse(Parser.fromArgv());

  console.log(parseResult.execute());
} catch (error) {
  if (error instanceof Error) console.log(`${error.name}: ${error.message}`);
}
// ANCHOR_END: parse-exec
