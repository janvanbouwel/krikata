import { Type, Func, Language, primitives, Constant } from "krikata";

// ANCHOR: greeting
const greeting = new Type<string>("greeting");

greeting.setFunctions([
  Constant("hi", () => `Hi mysterious person!`),
  Func("hello")
    .arg(primitives.string)
    .setExec((value: string) => `Hello ${value}! It is a great day today!`),
]);
// ANCHOR_END: greeting

// ANCHOR: language
const greet = new Language("greet", greeting);
// ANCHOR_END: language

export { greet };
