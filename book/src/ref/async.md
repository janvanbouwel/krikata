# Async Execution

As Krikata is mainly intended for running commands, both the `Language` and all intermediate executions are inherently asynchronous, with all Promises being awaited before being passed to other functions.

If the program contains a repetition, there are two main ways of awaiting it. Either we regard it as a sequential process with every sub-expression being executed and awaited in order, or as a parallel process where all promises are started at the same time. The default behaviour using `Repeat` is sequential, parallel execution is possible using `Parallel`, which otherwise functions identically.

The difference can be seen in the following example.

```typescript
{{ #include src/sleep.ts:lang }}
```

```text
<!-- cmdrun node src/sleep.js -->
```
