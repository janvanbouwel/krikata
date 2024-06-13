# Inspecting the language

In the previous step we defined our `greeting` expression, a type consisting of two functions. We can now create a new language from this expression, appropriately called `greet`.

```typescript
{{#include src/greeting.ts:language}}
```

Krikata can automatically generate a grammar for `greet` in an approximate [BNF](https://en.wikipedia.org/wiki/Backus–Naur_form) notation.

```typescript
{{#include src/grammar.ts:grammar}}
```

```text
<!-- cmdrun node src/grammar.js -->
```

We see our two expressions. First the language greet, which expects a greeting type followed by the special End-Of-Input, and second the greeting type itself, which matches either the string `hi` or the string `hello` followed by a primitive string.
