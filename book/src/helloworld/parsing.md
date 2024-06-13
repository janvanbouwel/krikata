# Parsing and executing

With our language `greet` defined and inspected, we can now parse and execute a program. Parsing requires a `Parser`, which can easily be constructed from a process`s command line arguments.

```typescript
{{#include src/cli.ts:parse-exec}}
```

We can now run the program from a terminal (after compiling it with typescript).

```bash
$ node cli.js hi
<!-- cmdrun node src/cli.js hi -->
$ node cli.js hello world
<!-- cmdrun node src/cli.js hello world -->

$ node cli.js
<!-- cmdrun node src/cli.js -->
$ node cli.js hello
<!-- cmdrun node src/cli.js hello -->
$ node cli.js hi world
<!-- cmdrun node src/cli.js hi world -->
```
