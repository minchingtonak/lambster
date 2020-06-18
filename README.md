# lambster

### A lambda calculus interpreter written in TypeScript, packaged for npm.

## Features

-   Clean, minimal command-line interface with REPL and ability to run files
-   No external dependencies
-   Selectable verbosity for lambda calculus term reduction output:

    -   Result (none): only the result of the reduction
        ```
        λ> (Lx y. x y)(Lw. (Lx.x w) a w) b
        >>> ((a b) b)
        ```
    -   Reductions (low): intermediate reductions
        ```
        λ> (Lx y. x y)(Lw. (Lx.x w) a w) b
        λ > (((λx. (λy. (x y))) (λw. (((λx. (x w)) a) w))) b)
        β > (((λx. (λy. (x y))) (λw. ((a w) w))) b)
        β > ((λy. ((λw. ((a w) w)) y)) b)
        β > ((λy. ((a y) y)) b)
        β > ((a b) b)
        >>> ((a b) b)
        ```
    -   Step-by-step (high): intermediate reductions with plain English explanation for each reduction

        ```
        λ> (Lx y. x y)(Lw. (Lx.x w) a w) b
        λ > (((λx. (λy. (x y))) (λw. (((λx. (x w)) a) w))) b)

        Beta reducing 'a' into '(λx. (x w))'
        β > (((λx. (λy. (x y))) (λw. ((a w) w))) b)

        Beta reducing '(λw. ((a w) w))' into '(λx. (λy. (x y)))'
        β > ((λy. ((λw. ((a w) w)) y)) b)

        Beta reducing 'y' into '(λw. ((a w) w))'
        β > ((λy. ((a y) y)) b)

        Beta reducing 'b' into '(λy. ((a y) y))'
        β > ((a b) b)

        >>> ((a b) b)
        ```

-   Simple variable system with useful predefined lambda calculus terms
    ```
    λ> duplicate = Lx.x x
    >>> (λx. (x x))
    λ> duplicate z
    >>> (z z)
    ```
    ```
    λ> env
    true:	(λt. (λf. t))
    false:	(λt. (λf. f))
    and:	(λa. (λb. ((a b) a)))
    or:	(λa. (λb. ((a a) b)))
    not:	(λb. ((b false) true))
    if:	(λp. (λa. (λb. ((p a) b))))
    ... (all bindings in the environment are printed)
    λ> or true false
    >>> (λX0. (λf. X0))
        ↳ equivalent to: true
    ```
-   Optional free variable renaming

    ```
    λ> (Ly.y) y
    λ > ((λy. y) y)
    ε > 'y' → 'X`0'
    β > X`0
    >>> X`0
    ```

-   Shorthand for introducing nested lambda functions
    ```
    λ> (Lx y. y x)
    >>> (λx. (λy. (y x))
    ```
-   Shorthand for introducing lambda functions
    ```
    λ> (lambda x. x) y
    >>> y
    λ> (λx. x) y
    >>> y
    λ> (Lx. x) y
    >>> y
    ```
-   Clear and robust error printing

    ```
    λ> (xx
    Error at line 1 [4, 5]: Expected ')' to close expression.
        (xx
           ^
    ```

-   Results are checked for structural equivalence to terms bound in the environment

    ```
    λ> env
    plus:	(λm. (λn. ((m incr) n)))
    one:	(λf. (λx. (f x)))
    two:	(λf. (λx. (f (f x))))
    three:	(λf. (λx. (f (f (f x)))))
    λ> plus one two
    >>> (λf. (λy. (f (f (f y)))))
        ↳ equivalent to: three
    ```

-   Simple comment support
    ```
    λ> (Lx.x) y # This is a comment
    >>> y
    ```

## Installation

`lambda` is available on npm! Simply install the package:

```
npm i lambda
```

## Usage

After `lambda` is installed, import and use the interpreter:

```js
import { Interpreter, Verbosity, InterpreterOptions } from "lambda";

const interpreter: Interpreter = new Interpreter();

interpreter.interpret("(Ly. y) z");
// <console output>
// >>> z
```

The interpreter can also be passed an [`InterpreterOptions`](#interface-InterpreterOptions) to control output parameters.

NodeJS's `Writable` stream interface is used to write output, allowing for custom output handling.

```js
import { Interpreter, Verbosity, InterpreterOptions } from "lambda";
import { Writable } from "stream";

let output: string = "";

const interpreter: Interpreter = new Interpreter({
    verbosity: Verbosity.LOW,
    output_stream: new Writable({
        // Called each time the interpreter logs a line of output
        write(chunk, encoding, done) {
            // Do whatever you want with the output
            output += chunk.toString();
            done();
        },
    }),
});

interpreter.interpret("(Lx.x x) y");

console.log(output);
// <console output>
// λ > ((λx. (x x)) y)
// β > (y y)
// >>> (y y)
```

## API Reference

### class Interpreter:

-   `constructor(options?: InterpreterOptions)`

    -   Create an instance of an `Interpreter`, optionally with the given options.
    -   If options are not provided, interpreter parameters are given these default values:
        -   verbosity: `Verbosity.NONE` (result only)
        -   rename_free_vars: `false`
        -   output_stream: `process.stdout`

-   `interpret(source: string)`
    -   Interpret the given string and write the output to the provided `Writable`

### interface InterpreterOptions

-   `verbosity?: Verbosity`
    -   Optional Verbosity level for the interpreter
-   `output_stream?: Writable`
    -   Optional `Writable` that the interpreter will write its output to
-   `rename_free_vars?: boolean`
    -   Optional boolean that controls whether the interpreter will rename free variables to unambiguous names

### enum Verbosity

-   `NONE`
    -   Indicates the least amount of verbosity to the interpreter. Only the result of the reduction will be logged.
-   `LOW`
    -   Indicates that the interpreter will log the result and type of each intermediate reduction while reducing a given term.
-   `HIGH`
    -   Indicates that the interpreter will log a plain English explanation along with each intermediate reduction while reducing a given term.

## Grammar

For all you PL nerds out there, the interpreter recognizes this grammar:

```
program     → ( stmt )* EOF ;

stmt        → bindingStmt
            | commandStmt
            | termStmt
            | "\n" ;
bindingStmt → IDENTIFIER "=" expression "\n" ;
commandStmt → "env" "\n"
            | "unbind" IDENTIFIER "\n" ;
termStmt    → term "\n" ;
term        → IDENTIFIER
            | abstraction
            | application
            | grouping ;
abstraction      → LAMBDA IDENTIFIER+ "." expression ;
application → expression expression ;
grouping    → "(" expression ")" ;
LAMBDA      → "L" | "λ" | "lambda" ;
IDENTIFIER  → [a-z0-9]+ ; // Note, only lowercase letters allowed
```

## Planned features

-   Infinite/exponentially increasing reduction detection
-   Support for [De Bruijn indices](https://en.wikipedia.org/wiki/De_Bruijn_index)
-   Even prettier printing in step-by-step verbosity
-   Library functions that do useful/interesting things (TBD)
