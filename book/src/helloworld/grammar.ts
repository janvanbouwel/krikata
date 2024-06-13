import { lang } from "./greeting.js";

const greet = lang;

// ANCHOR: grammar
const grammar = greet.grammar();
console.log(grammar.format());
// ANCHOR_END: grammar
