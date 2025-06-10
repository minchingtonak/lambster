import { expect, test, describe } from "bun:test";
import grammar from "../nearley/lambster_parser.js";
import nearley from "nearley";

// Helper function to create a parser and parse input
function parseInput(input: string) {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  try {
    parser.feed(input);
    return parser.results.length > 0 ? parser.results[0] : null;
  } catch (_error) {
    return null;
  }
}

describe("Command Statement Tests", () => {
  test("help command statement parse test", () => {
    const result = parseInput("help");
    expect(result[0].command).toBe("help");
  });

  test("env command statement parse test", () => {
    const result = parseInput("env");
    expect(result[0].command).toBe("env");
  });

  test("unbind command statement parse test", () => {
    const result = parseInput("unbind epla");
    expect(result[0].command).toBe("unbind");
    expect(result[0].identifier).toBe("epla");
  });
});

describe("Binding Statement Tests", () => {
  test("binding statement parse test", () => {
    const result = parseInput("p = 12");
    expect(result[0].identifier).toBe("p");
    expect(result[0].term).toEqual(["12"]);
  });
});

describe("Basic Term Statement Tests", () => {
  test("lambda with L symbol", () => {
    const result = parseInput("Lxa.xa");
    expect(result[0][0].identifier).toBe("xa");
    expect(result[0][0].term).toEqual(["xa"]);
    expect(result[0][0].lambda_symbol).toBe("L");
  });

  test("lambda with backslash symbol", () => {
    const result = parseInput("\\bax.12");
    expect(result[0][0].identifier).toBe("bax");
    expect(result[0][0].term).toEqual(["12"]);
    expect(result[0][0].lambda_symbol).toBe("\\");
  });

  test("lambda with unicode symbol", () => {
    const result = parseInput("λfun.tlas");
    expect(result[0][0].identifier).toBe("fun");
    expect(result[0][0].term).toEqual(["tlas"]);
    expect(result[0][0].lambda_symbol).toBe("λ");
  });
});

describe("Lambda Calculus Parser Tests", () => {
  test("Simple lambda expression", () => {
    const result = parseInput("Lx.x");
    expect(result).not.toBeNull();
    expect(result[0][0].lambda_symbol).toBe("L");
    expect(result[0][0].identifier).toBe("x");
    expect(result[0][0].term).toEqual(["x"]);
  });

  test("Lambda with backslash", () => {
    const result = parseInput("\\x.x");
    expect(result).not.toBeNull();
    expect(result[0][0].lambda_symbol).toBe("\\");
    expect(result[0][0].identifier).toBe("x");
    expect(result[0][0].term).toEqual(["x"]);
  });

  test("Lambda with unicode symbol", () => {
    const result = parseInput("λx.x");
    expect(result).not.toBeNull();
    expect(result[0][0].lambda_symbol).toBe("λ");
    expect(result[0][0].identifier).toBe("x");
    expect(result[0][0].term).toEqual(["x"]);
  });

  test("Simple identifier", () => {
    const result = parseInput("x");
    expect(result[0][0]).toBe("x");
  });

  test("Grouped lambda expression", () => {
    const result = parseInput("(Lx.x)");
    expect(result).not.toBeNull();
    expect(result[0][0][0].lambda_symbol).toBe("L");
    expect(result[0][0][0].identifier).toBe("x");
    expect(result[0][0][0].term).toEqual(["x"]);
  });

  test("Lambda with application body", () => {
    const result = parseInput("Lx.x y");
    expect(result).not.toBeNull();
    expect(result[0][0].function).toBeDefined();
    expect(result[0][0].argument).toBeDefined();
    expect(result[0][0].function[0].lambda_symbol).toBe("L");
    expect(result[0][0].function[0].identifier).toBe("x");
    expect(result[0][0].argument).toEqual(["y"]);
  });

  test("Basic application parsing", () => {
    const result = parseInput("(Lx.x) (Ly.y)");
    expect(result).not.toBeNull();
    expect(result).toBeDefined();
  });
});

describe("Parser Error Tests", () => {
  test("Invalid dot placement", () => {
    const result = parseInput("Lx.x x .x x");
    expect(result).toBeNull();
  });

  test("Incomplete lambda expression", () => {
    const result = parseInput("Lx.x x L x x");
    expect(result).toBeNull();
  });

  test("Double dot in lambda", () => {
    const result = parseInput("Lx.. z x x");
    expect(result).toBeNull();
  });

  test("Empty lambda body in parentheses", () => {
    const result = parseInput("(Lx. ) z x x");
    expect(result).toBeNull();
  });

  test("Unmatched opening parenthesis", () => {
    const result = parseInput("(Lx.  z x x");
    expect(result).toBeNull();
  });

  test("Unmatched closing parenthesis", () => {
    const result = parseInput("Lx. z x ) x");
    expect(result).toBeNull();
  });

  test("Invalid identifier with space", () => {
    const result = parseInput("Lx world. z x ) x");
    expect(result).toBeNull();
  });
});

describe("Complex Lambda Calculus Test Cases", () => {
  // Church Numerals
  test("Church numeral zero", () => {
    const result = parseInput("λf.λx.x");
    expect(result).not.toBeNull();
    expect(result[0][0].lambda_symbol).toBe("λ");
    expect(result[0][0].identifier).toBe("f");
    expect(result[0][0].term[0].lambda_symbol).toBe("λ");
    expect(result[0][0].term[0].identifier).toBe("x");
    expect(result[0][0].term[0].term).toEqual(["x"]);
  });

  test("Church numeral one", () => {
    const result = parseInput("λf.λx.f x");
    expect(result).not.toBeNull();
    // This is an application, so it has a different structure
    expect(Array.isArray(result)).toBe(true);
    expect(result[0][0].function[0].lambda_symbol).toBe("λ");
    expect(result[0][0].function[0].identifier).toBe("f");
    expect(result[0][0].function[0].term[0].lambda_symbol).toBe("λ");
    expect(result[0][0].function[0].term[0].identifier).toBe("x");
  });

  test("Church numeral two", () => {
    const result = parseInput("λf.λx.f (f x)");
    expect(result).not.toBeNull();
    expect(result[0][0].function[0].lambda_symbol).toBe("λ");
    expect(result[0][0].function[0].identifier).toBe("f");
    expect(result[0][0].function[0].term[0].lambda_symbol).toBe("λ");
    expect(result[0][0].function[0].term[0].identifier).toBe("x");
    expect(Array.isArray(result[0][0].argument)).toBe(true);
  });

  // Boolean Logic
  test("Church boolean TRUE", () => {
    const result = parseInput("λx.λy.x");
    expect(result).not.toBeNull();
    expect(result[0][0].lambda_symbol).toBe("λ");
    expect(result[0][0].identifier).toBe("x");
    expect(result[0][0].term[0].lambda_symbol).toBe("λ");
    expect(result[0][0].term[0].identifier).toBe("y");
    expect(result[0][0].term[0].term).toEqual(["x"]);
  });

  test("Church boolean FALSE", () => {
    const result = parseInput("λx.λy.y");
    expect(result).not.toBeNull();
    expect(result[0][0].lambda_symbol).toBe("λ");
    expect(result[0][0].identifier).toBe("x");
    expect(result[0][0].term[0].lambda_symbol).toBe("λ");
    expect(result[0][0].term[0].identifier).toBe("y");
    expect(result[0][0].term[0].term).toEqual(["y"]);
  });

  test("Church boolean AND operation", () => {
    const result = parseInput("λp.λq.p q p");
    expect(result).not.toBeNull();
    // This is an application, so it has a different structure
    expect(Array.isArray(result)).toBe(true);
    expect(result[0][0].function[0].function[0].lambda_symbol).toBe("λ");
    expect(result[0][0].function[0].function[0].identifier).toBe("p");
    expect(result[0][0].function[0].function[0].term[0].lambda_symbol).toBe(
      "λ",
    );
    expect(result[0][0].function[0].function[0].term[0].identifier).toBe("q");
  });

  // Combinators
  test("Identity combinator (I)", () => {
    const result = parseInput("λx.x");
    expect(result).not.toBeNull();
    expect(result[0][0].lambda_symbol).toBe("λ");
    expect(result[0][0].identifier).toBe("x");
    expect(result[0][0].term).toEqual(["x"]);
  });

  test("K combinator (constant function)", () => {
    const result = parseInput("λx.λy.x");
    expect(result).not.toBeNull();
    expect(result[0][0].lambda_symbol).toBe("λ");
    expect(result[0][0].identifier).toBe("x");
    expect(result[0][0].term[0].lambda_symbol).toBe("λ");
    expect(result[0][0].term[0].identifier).toBe("y");
    expect(result[0][0].term[0].term).toEqual(["x"]);
  });

  test("S combinator (substitution)", () => {
    const result = parseInput("λx.λy.λz.x z (y z)");
    expect(result).not.toBeNull();
    // This is an application, so it has a different structure
    expect(Array.isArray(result)).toBe(true);
    expect(result[0][0].function[0].function[0].lambda_symbol).toBe("λ");
    expect(result[0][0].function[0].function[0].identifier).toBe("x");
    expect(result[0][0].function[0].function[0].term[0].lambda_symbol).toBe(
      "λ",
    );
    expect(result[0][0].function[0].function[0].term[0].identifier).toBe("y");
    expect(
      result[0][0].function[0].function[0].term[0].term[0].lambda_symbol,
    ).toBe("λ");
    expect(
      result[0][0].function[0].function[0].term[0].term[0].identifier,
    ).toBe("z");
  });

  test("Y combinator (fixed point)", () => {
    const result = parseInput("λf.(λx.f (x x)) (λx.f (x x))");
    expect(result).not.toBeNull();
    // This is an application, so it has a different structure
    expect(Array.isArray(result)).toBe(true);
    expect(result[0][0].function[0].lambda_symbol).toBe("λ");
    expect(result[0][0].function[0].identifier).toBe("f");
    expect(Array.isArray(result[0][0].function[0].term)).toBe(true);
  });

  // Complex Applications
  test("Multiple nested applications", () => {
    const result = parseInput("((λx.x) (λy.y)) (λz.z)");
    expect(result).not.toBeNull();
    expect(Array.isArray(result)).toBe(true);
  });

  test("Application with multiple arguments", () => {
    const result = parseInput("f x y z");
    expect(result).not.toBeNull();
    expect(Array.isArray(result)).toBe(true);
  });

  test("Mixed lambda symbols in complex expression", () => {
    const result = parseInput("(Lx.x) (\\y.y) (λz.z)");
    expect(result).not.toBeNull();
    expect(Array.isArray(result)).toBe(true);
  });

  // Higher-order functions
  test("Function composition", () => {
    const result = parseInput("λf.λg.λx.f (g x)");
    expect(result).not.toBeNull();
    expect(result[0][0].function[0].lambda_symbol).toBe("λ");
    expect(result[0][0].function[0].identifier).toBe("f");
    expect(result[0][0].function[0].term[0].lambda_symbol).toBe("λ");
    expect(result[0][0].function[0].term[0].identifier).toBe("g");
    expect(result[0][0].function[0].term[0].term[0].lambda_symbol).toBe("λ");
    expect(result[0][0].function[0].term[0].term[0].identifier).toBe("x");
    expect(Array.isArray(result[0][0].argument)).toBe(true);
  });

  test("Curried function with three parameters", () => {
    const result = parseInput("λa.λb.λc.a b c");
    expect(result).not.toBeNull();
    // This is an application, so it has a different structure
    expect(Array.isArray(result)).toBe(true);
    expect(result[0][0].function[0].function[0].lambda_symbol).toBe("λ");
    expect(result[0][0].function[0].function[0].identifier).toBe("a");
    expect(result[0][0].function[0].function[0].term[0].lambda_symbol).toBe(
      "λ",
    );
    expect(result[0][0].function[0].function[0].term[0].identifier).toBe("b");
    expect(
      result[0][0].function[0].function[0].term[0].term[0].lambda_symbol,
    ).toBe("λ");
    expect(
      result[0][0].function[0].function[0].term[0].term[0].identifier,
    ).toBe("c");
  });

  // Complex groupings
  test("Deeply nested parentheses", () => {
    const result = parseInput("(((λx.x)))");
    expect(result).not.toBeNull();
    expect(result[0][0][0][0][0].lambda_symbol).toBe("λ");
    expect(result[0][0][0][0][0].identifier).toBe("x");
    expect(result[0][0][0][0][0].term).toEqual(["x"]);
  });

  test("Mixed groupings and applications", () => {
    const result = parseInput("(λx.x y) (λz.z)");
    expect(result).not.toBeNull();
    expect(Array.isArray(result)).toBe(true);
  });

  // Church Pairs (Tuples)
  test("Church pair constructor", () => {
    const result = parseInput("λx.λy.λf.f x y");
    expect(result).not.toBeNull();
    // This is an application, so it has a different structure
    expect(Array.isArray(result)).toBe(true);
    expect(result[0][0].function[0].function[0].lambda_symbol).toBe("λ");
    expect(result[0][0].function[0].function[0].identifier).toBe("x");
    expect(result[0][0].function[0].function[0].term[0].lambda_symbol).toBe(
      "λ",
    );
    expect(result[0][0].function[0].function[0].term[0].identifier).toBe("y");
    expect(
      result[0][0].function[0].function[0].term[0].term[0].lambda_symbol,
    ).toBe("λ");
    expect(
      result[0][0].function[0].function[0].term[0].term[0].identifier,
    ).toBe("f");
  });

  test("Church pair first selector", () => {
    const result = parseInput("λp.p (λx.λy.x)");
    expect(result).not.toBeNull();
    expect(result[0][0].function[0].lambda_symbol).toBe("λ");
    expect(result[0][0].function[0].identifier).toBe("p");
    expect(Array.isArray(result[0][0].argument)).toBe(true);
    expect(result[0][0].argument[0][0].lambda_symbol).toBe("λ");
    expect(result[0][0].argument[0][0].identifier).toBe("x");
  });

  // Recursive-like structures
  test("Self-application", () => {
    const result = parseInput("(λx.x x) (λx.x x)");
    expect(result).not.toBeNull();
    expect(Array.isArray(result)).toBe(true);
  });

  test("Omega combinator", () => {
    const result = parseInput("λx.x x");
    expect(result).not.toBeNull();
    // This is an application, so it has a different structure
    expect(Array.isArray(result)).toBe(true);
    expect(result[0][0].function[0].lambda_symbol).toBe("λ");
    expect(result[0][0].function[0].identifier).toBe("x");
    expect(Array.isArray(result[0][0].argument)).toBe(true);
  });

  // Complex identifier patterns
  test("Multi-character identifiers", () => {
    const result = parseInput("λfunc.λarg.func arg");
    expect(result).not.toBeNull();
    // This is an application, so it has a different structure
    expect(Array.isArray(result)).toBe(true);
    expect(result[0][0].function[0].lambda_symbol).toBe("λ");
    expect(result[0][0].function[0].identifier).toBe("func");
    expect(result[0][0].function[0].term[0].lambda_symbol).toBe("λ");
    expect(result[0][0].function[0].term[0].identifier).toBe("arg");
  });

  test("Numeric identifiers", () => {
    const result = parseInput("λx1.λx2.x1 x2");
    expect(result).not.toBeNull();
    // This is an application, so it has a different structure
    expect(Array.isArray(result)).toBe(true);
    expect(result[0][0].function[0].lambda_symbol).toBe("λ");
    expect(result[0][0].function[0].identifier).toBe("x1");
    expect(result[0][0].function[0].term[0].lambda_symbol).toBe("λ");
    expect(result[0][0].function[0].term[0].identifier).toBe("x2");
  });

  test("Mixed alphanumeric identifiers", () => {
    const result = parseInput("λvar123.λfn2.var123 fn2");
    expect(result).not.toBeNull();
    // This is an application, so it has a different structure
    expect(Array.isArray(result)).toBe(true);
    expect(result[0][0].function[0].lambda_symbol).toBe("λ");
    expect(result[0][0].function[0].identifier).toBe("var123");
    expect(result[0][0].function[0].term[0].lambda_symbol).toBe("λ");
    expect(result[0][0].function[0].term[0].identifier).toBe("fn2");
  });

  // Case-insensitive lambda keyword
  test("Case-insensitive lambda keyword", () => {
    const result = parseInput("LAMBDA x.x");
    expect(result).not.toBeNull();
    expect(result[0][0].lambda_symbol).toBe("LAMBDA");
    expect(result[0][0].identifier).toBe("x");
    expect(result[0][0].term).toEqual(["x"]);
  });

  test("Mixed case lambda keyword", () => {
    const result = parseInput("Lambda x.x");
    expect(result).not.toBeNull();
    expect(result[0][0].lambda_symbol).toBe("Lambda");
    expect(result[0][0].identifier).toBe("x");
    expect(result[0][0].term).toEqual(["x"]);
  });
});

describe("Advanced Binding and Command Tests", () => {
  test("Binding complex lambda expression", () => {
    const result = parseInput("identity = λx.x");
    expect(result).not.toBeNull();
    expect(result[0].identifier).toBe("identity");
    expect(result[0].term[0].lambda_symbol).toBe("λ");
    expect(result[0].term[0].identifier).toBe("x");
    expect(result[0].term[0].term).toEqual(["x"]);
  });

  test("Binding Church numeral", () => {
    const result = parseInput("zero = λf.λx.x");
    expect(result).not.toBeNull();
    expect(result[0].identifier).toBe("zero");
    expect(result[0].term[0].lambda_symbol).toBe("λ");
    expect(result[0].term[0].identifier).toBe("f");
    expect(result[0].term[0].term[0].lambda_symbol).toBe("λ");
    expect(result[0].term[0].term[0].identifier).toBe("x");
    expect(result[0].term[0].term[0].term).toEqual(["x"]);
  });

  test("Binding complex application", () => {
    const result = parseInput("app = f x y");
    expect(result).not.toBeNull();
    expect(result[0].identifier).toBe("app");
    expect(Array.isArray(result[0].term)).toBe(true);
  });

  test("Binding with numeric identifier", () => {
    const result = parseInput("fn123 = λx.x");
    expect(result).not.toBeNull();
    expect(result[0].identifier).toBe("fn123");
    expect(result[0].term[0].lambda_symbol).toBe("λ");
    expect(result[0].term[0].identifier).toBe("x");
    expect(result[0].term[0].term).toEqual(["x"]);
  });

  test("Unbind with numeric identifier", () => {
    const result = parseInput("unbind var123");
    expect(result).not.toBeNull();
    expect(result[0].command).toBe("unbind");
    expect(result[0].identifier).toBe("var123");
  });
});

describe("Edge Cases and Stress Tests", () => {
  test("Very long identifier", () => {
    const result = parseInput(
      "λverylongidentifiername123456789.verylongidentifiername123456789",
    );
    expect(result).not.toBeNull();
    expect(result[0][0].lambda_symbol).toBe("λ");
    expect(result[0][0].identifier).toBe("verylongidentifiername123456789");
    expect(result[0][0].term).toEqual(["verylongidentifiername123456789"]);
  });

  test("Chain of applications", () => {
    const result = parseInput("a b c d e f g h i j");
    expect(result).not.toBeNull();
    expect(Array.isArray(result)).toBe(true);
  });

  test("Alternating lambda symbols", () => {
    const result = parseInput("λx.\\y.Lz.lambda w.x y z w");
    expect(result).not.toBeNull();
    // This is an application, so it has a different structure
    expect(Array.isArray(result)).toBe(true);
    expect(result[0][0].function[0].function[0].function[0].lambda_symbol).toBe(
      "λ",
    );
    expect(result[0][0].function[0].function[0].function[0].identifier).toBe(
      "x",
    );
    expect(
      result[0][0].function[0].function[0].function[0].term[0].lambda_symbol,
    ).toBe("\\");
    expect(
      result[0][0].function[0].function[0].function[0].term[0].identifier,
    ).toBe("y");
    expect(
      result[0][0].function[0].function[0].function[0].term[0].term[0]
        .lambda_symbol,
    ).toBe("L");
    expect(
      result[0][0].function[0].function[0].function[0].term[0].term[0]
        .identifier,
    ).toBe("z");
    expect(
      result[0][0].function[0].function[0].function[0].term[0].term[0].term[0]
        .lambda_symbol,
    ).toBe("lambda");
    expect(
      result[0][0].function[0].function[0].function[0].term[0].term[0].term[0]
        .identifier,
    ).toBe("w");
  });

  test("Maximum nesting with different grouping styles", () => {
    const result = parseInput("((((λx.x))))");
    expect(result).not.toBeNull();
    expect(result[0][0][0][0][0][0].lambda_symbol).toBe("λ");
    expect(result[0][0][0][0][0][0].identifier).toBe("x");
    expect(result[0][0][0][0][0][0].term).toEqual(["x"]);
  });

  test("Complex Church arithmetic expression", () => {
    const result = parseInput("λm.λn.λf.λx.m f (n f x)");
    expect(result).not.toBeNull();
    // This is an application, so it has a different structure
    expect(Array.isArray(result)).toBe(true);
    expect(result[0][0].function[0].function[0].lambda_symbol).toBe("λ");
    expect(result[0][0].function[0].function[0].identifier).toBe("m");
    expect(result[0][0].function[0].function[0].term[0].lambda_symbol).toBe(
      "λ",
    );
    expect(result[0][0].function[0].function[0].term[0].identifier).toBe("n");
    expect(
      result[0][0].function[0].function[0].term[0].term[0].lambda_symbol,
    ).toBe("λ");
    expect(
      result[0][0].function[0].function[0].term[0].term[0].identifier,
    ).toBe("f");
    expect(
      result[0][0].function[0].function[0].term[0].term[0].term[0]
        .lambda_symbol,
    ).toBe("λ");
    expect(
      result[0][0].function[0].function[0].term[0].term[0].term[0].identifier,
    ).toBe("x");
  });
});

test("complex test", () => {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  parser.feed("(Lx y. L z. z y x) w");
  console.dir(parser.results, { depth: Infinity });
});
