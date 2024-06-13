# Calculator

In this chapter we will incrementally build up a basic calculator. As a starting point we trivially adapt the language `greet` from the previous chapter, into the language `calc`.

```typescript
{{#include src/step0.ts:language}}
```

This language has the following grammar:

```text
<!-- cmdrun node src/step0.js --grammar -->
```

Running the language like before gives:

```
<!-- cmdrun node src/step0.js add 1 5 -->
<!-- cmdrun node src/step0.js mul 9 5 -->
<!-- cmdrun node src/step0.js pi -->
```
