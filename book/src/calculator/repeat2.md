# Advanced Repetition

If we want nested repetition that doesn't consume the whole input, we need a way to end the scope of a `Repeat`. This is accomplished using a special value given to the constructor. We also wrap the repeat into a separate type so we can easily add other array-manipulating functions.

```typescript
{{ #include src/repeat-exit.ts:repeat }}
```

We use a `-` here as common scope characters like `)`,`]` and `;` are used by shells like bash and would need to be escaped in a cli.

```text
<!-- cmdrun node src/repeat-exit.js mul sum 1 1 1 2 -->
<!-- cmdrun node src/repeat-exit.js mul sum 1 1 1 - 2 -->
```

For fun we add some more array functions.

```typescript
{{ #include src/repeat-exit.ts:arr }}
```

```text
<!-- cmdrun node src/repeat-exit.js mul 2 sum range 5 -->
<!-- cmdrun node src/repeat-exit.js sum double range 5 -->
```

```text
<!-- cmdrun node src/repeat-exit.js --grammar -->
```
