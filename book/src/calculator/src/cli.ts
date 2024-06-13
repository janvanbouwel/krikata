import { Language, Parser } from "krikata";

export function cli<R>(lang: Language<R>) {
  if (process.argv[2] === "--grammar") {
    console.log(lang.grammar().format());
    return;
  }

  console.log(`> ${process.argv.slice(2).join(" ")}`);

  try {
    const parseResult = lang.parse(Parser.fromArgv());

    console.log(parseResult.execute());
  } catch (error) {
    if (error instanceof Error) console.log(`${error.name}: ${error.message}`);
  }
}
