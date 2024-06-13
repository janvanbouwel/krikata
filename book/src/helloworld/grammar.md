# Inspecting the language

We ended our previous step with `greet`, a language consisting of two functions. Krikata can automatically generate a grammar for `greet` in approximate [BNF](https://en.wikipedia.org/wiki/Backus–Naur_form) notation.

```typescript
{{#include greeting.ts:language}}

{{#include grammar.ts:grammar}}
```

```text
<!-- cmdrun npx tsx grammar.ts -->
```

We see our two expressions. First the language greet, which expects a greeting type followed by the special End-Of-Input, and second the greeting type itself, which matches either the string `hi` or the string `hello` followed by a primitive string.
