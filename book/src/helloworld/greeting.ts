import { Type, Func, Language, strictPrimitives } from "krikata";

// ANCHOR: greeting
const greeting = new Type<string>("greeting");

greeting.setFunctions([
  Func("hi").setExec(() => `Hi mysterious person!`),
  Func("hello")
    .arg(strictPrimitives.string)
    .setExec((value: string) => `Hello ${value}! It is a great day today!`),
]);
// ANCHOR_END: greeting

// ANCHOR: language
const greet = new Language("greet", greeting);
// ANCHOR_END: language
void greet;

export const lang = greet;
