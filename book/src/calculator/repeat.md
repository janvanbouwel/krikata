# Repetition

Since we can use the result of an addition in another addition, we can theoretically add any amount of numbers together. This is not a very nice way of dealing with the problem.

```text
<!-- cmdrun node src/rec-default.js add 1 add 2 add 3 add 4 5 -->
```

Instead we can use `Repeat` which evaluates to an array of of its inner type.

```typescript
{{ #include src/repeat-direct.ts:sum }}
```

```text
<!-- cmdrun node src/repeat-direct.js sum 1 2 3 4 5 -->
<!-- cmdrun node src/repeat-direct.js sum -->
<!-- cmdrun node src/repeat-direct.js sum 1 2 3 mul 4 5 -->
<!-- cmdrun node src/repeat-direct.js mul 2 sum 3 4 5 -->
<!-- cmdrun node src/repeat-direct.js mul sum 3 4 5 2 -->
```

Notice how the last example didn't work. This is because `Repeat` parses until the end of input is reached, meaning the `2` is consumed by `sum` and not given as an argument to `mul`. This can also be seen in the grammar. We fix this in the next chapter.

```text
<!-- cmdrun node src/repeat-direct.js --grammar -->
```
