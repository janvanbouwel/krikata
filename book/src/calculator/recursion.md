# Recursion

Our current language can either add or multiply two numbers. However, the result of an addition can not be used in a multiplication and vice-versa, since the arguments of both functions are primitive numbers. We also can't add or multiply using Pi.

```text
<!-- cmdrun node src/step0.js add pi 1 -->
```

We can change this by changing the arguments of `add` and `mul` to `value`, making them recursive.

```typescript
{{ #include src/rec-nodef.ts:value }}
```

However, we now have a new problem, as we can _only_ use recursion.

```text
<!-- cmdrun node src/rec-nodef.js add 1 2 -->
<!-- cmdrun node src/rec-nodef.js add pi pi -->
```

We could solve this problem using a separate function, for example `im` for immediate, but this is annoying to use.

```typescript
{{ #include src/rec-nodef.ts:im }}
```

```text
<!-- cmdrun node src/rec-nodef.js add im 5 im 10 -->
```

Instead, `value` has an optional default expression, which will be parsed if none of its functions matched the input.

```typescript
{{ #include src/rec-default.ts:default }}
```

This gives the desired functionality:

```text
<!-- cmdrun node src/rec-default.js add 5 mul 6 7 -->
<!-- cmdrun node src/rec-default.js 5 -->
```

Notice that a single number is now also a valid program. We can see this in the updated grammar.

```text
<!-- cmdrun node src/rec-default.js --grammar -->
```
