import { greet } from "./greeting.js";

// ANCHOR: grammar
const grammar = greet.grammar();
console.log(grammar.format());
// ANCHOR_END: grammar
