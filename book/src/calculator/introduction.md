# Example: calculator

In this chapter we will incrementally build up a basic calculator.

// TODO

```text
lang:
  | "num   <number>
  | "bool" <bool>

number:
  | p.number
  | "neg"  <number>
  | "add"  <number> <number>
  | "sub"  <number> <number>
  | "test" <bool>   <number> <number>

bool:
  | p.bool
  | "eq" <number> <number>
  | "gz" <number>
```
