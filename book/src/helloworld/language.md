# Defining the language

A Krikata language consists of a top level expression, which in turn consists of nested other expressions. Expressions have a certain Typescript type, which is what will be returned upon running the language.

## Greeting

```typescript
{{#include greeting.ts:greeting}}
```

Let's deconstruct this:

1. We construct a new Krikata `Type` named `greeting`.
1. The Typescript type parameter of `greeting` is `string`. This means when running the program, this expression will evaluate to a `string`.
1. We give `greeting` an array of functions:
   1. The first function, `hi`, takes no arguments. When it is executed, it will return a constant string.
   1. The second function, `hello`, takes one argument, a string. This is accomplished using the `primitives.string` expression, which evaluates to a TypeScript string. This value will be passed to the function's executor, and it is used to customise the string that is returned.

## Language

In the previous step we defined our `greeting` expression, a type consisting of two functions. We can now create a new language from this expression, appropriately called `greet`.

```typescript
{{#include greeting.ts:language}}
```
