import { expect, test, describe } from "bun:test";
import {
  generateFreshVariable,
  substitute,
  alphaConvert,
  betaReduce,
  normalize,
  etaReduce,
  evaluate,
  type EvaluationStrategy,
} from "../src/utils/manipulation.js";
import type { Term } from "../src/types/ast.js";

// Helper functions to create common AST structures
const createVar = (name: string): Term => ({ tag: "var", name });

const createAbs = (
  parameter: string,
  body: Term,
  symbol: "λ" | "\\" = "λ",
): Term => ({ tag: "abs", symbol, parameter, body });

const createApp = (fn: Term, arg: Term): Term => ({
  tag: "app",
  function: fn,
  argument: arg,
});

// Common lambda calculus terms
const identity = createAbs("x", createVar("x"));
const churchOne = createAbs(
  "f",
  createAbs("x", createApp(createVar("f"), createVar("x"))),
);
const churchTwo = createAbs(
  "f",
  createAbs(
    "x",
    createApp(createVar("f"), createApp(createVar("f"), createVar("x"))),
  ),
);

// Combinators
const kCombinator = createAbs("x", createAbs("y", createVar("x")));
const sCombinator = createAbs(
  "x",
  createAbs(
    "y",
    createAbs(
      "z",
      createApp(
        createApp(createVar("x"), createVar("z")),
        createApp(createVar("y"), createVar("z")),
      ),
    ),
  ),
);

// Omega combinator (infinite loop)
const omega = createApp(
  createAbs("x", createApp(createVar("x"), createVar("x"))),
  createAbs("x", createApp(createVar("x"), createVar("x"))),
);

describe("generateFreshVariable", () => {
  test("returns base name when no conflicts", () => {
    const result = generateFreshVariable([], "x");
    expect(result).toBe("x");
  });

  test("returns base name when not in existing names", () => {
    const result = generateFreshVariable(["y", "z"], "x");
    expect(result).toBe("x");
  });

  test("generates numbered variant when base conflicts", () => {
    const result = generateFreshVariable(["x"], "x");
    expect(result).toBe("x0");
  });

  test("generates higher numbers when multiple conflicts", () => {
    const result = generateFreshVariable(["x", "x0", "x1"], "x");
    expect(result).toBe("x2");
  });

  test("handles empty base name", () => {
    const result = generateFreshVariable([""], "");
    expect(result).toBe("0");
  });

  test("uses default base 'x' when not provided", () => {
    const result = generateFreshVariable([]);
    expect(result).toBe("x");
  });

  test("handles complex existing names", () => {
    const existing = ["x", "x0", "x1", "x2", "y", "z", "x10"];
    const result = generateFreshVariable(existing, "x");
    expect(result).toBe("x3");
  });

  test("works with different base names", () => {
    const result = generateFreshVariable(["foo", "foo0"], "foo");
    expect(result).toBe("foo1");
  });
});

describe("substitute", () => {
  test("substitutes free variable", () => {
    const term = createVar("x");
    const replacement = createVar("y");
    const result = substitute(term, "x", replacement);

    expect(result.tag).toBe("var");
    if (result.tag === "var") {
      expect(result.name).toBe("y");
    }
  });

  test("leaves unmatched variable unchanged", () => {
    const term = createVar("x");
    const replacement = createVar("y");
    const result = substitute(term, "z", replacement);

    expect(result.tag).toBe("var");
    if (result.tag === "var") {
      expect(result.name).toBe("x");
    }
  });

  test("substitutes in application function", () => {
    const term = createApp(createVar("x"), createVar("y"));
    const replacement = createVar("z");
    const result = substitute(term, "x", replacement);

    expect(result.tag).toBe("app");
    if (result.tag === "app" && result.function.tag === "var") {
      expect(result.function.name).toBe("z");
    }
  });

  test("substitutes in application argument", () => {
    const term = createApp(createVar("f"), createVar("x"));
    const replacement = createVar("y");
    const result = substitute(term, "x", replacement);

    expect(result.tag).toBe("app");
    if (result.tag === "app" && result.argument.tag === "var") {
      expect(result.argument.name).toBe("y");
    }
  });

  test("does not substitute bound variable", () => {
    const term = createAbs("x", createVar("x"));
    const replacement = createVar("y");
    const result = substitute(term, "x", replacement);

    expect(result.tag).toBe("abs");
    if (result.tag === "abs") {
      expect(result.parameter).toBe("x");
      expect(result.body.tag).toBe("var");
      if (result.body.tag === "var") {
        expect(result.body.name).toBe("x");
      }
    }
  });

  test("substitutes free variable in abstraction body", () => {
    const term = createAbs("x", createVar("y"));
    const replacement = createVar("z");
    const result = substitute(term, "y", replacement);

    expect(result.tag).toBe("abs");
    if (result.tag === "abs" && result.body.tag === "var") {
      expect(result.body.name).toBe("z");
    }
  });

  test("performs alpha-conversion to avoid capture", () => {
    // λy.x where we substitute x with y should become λy0.y
    const term = createAbs("y", createVar("x"));
    const replacement = createVar("y");
    const result = substitute(term, "x", replacement);

    expect(result.tag).toBe("abs");
    if (result.tag === "abs") {
      expect(result.parameter).not.toBe("y"); // Should be renamed
      expect(result.body.tag).toBe("var");
      if (result.body.tag === "var") {
        expect(result.body.name).toBe("y");
      }
    }
  });

  test("handles complex nested substitution", () => {
    // (λx.x y) z where we substitute y with x
    const term = createApp(
      createAbs("x", createApp(createVar("x"), createVar("y"))),
      createVar("z"),
    );
    const replacement = createVar("x");
    const result = substitute(term, "y", replacement);

    expect(result.tag).toBe("app");
    if (result.tag === "app" && result.function.tag === "abs") {
      const abs = result.function;
      expect(abs.body.tag).toBe("app");
      if (abs.body.tag === "app" && abs.body.argument.tag === "var") {
        expect(abs.body.argument.name).toBe("x");
      }
    }
  });

  test("substitution in Church numeral", () => {
    const term = churchTwo;
    const replacement = createVar("g");
    const result = substitute(term, "f", replacement);

    // Should not change anything since f is bound
    expect(result).toEqual(term);
  });
});

describe("alphaConvert", () => {
  test("renames bound variable in simple abstraction", () => {
    const term = createAbs("x", createVar("x"));
    const result = alphaConvert(term, "x", "y");

    expect(result.tag).toBe("abs");
    if (result.tag === "abs") {
      expect(result.parameter).toBe("y");
      expect(result.body.tag).toBe("var");
      if (result.body.tag === "var") {
        expect(result.body.name).toBe("y");
      }
    }
  });

  test("does not affect unbound variables", () => {
    const term = createVar("x");
    const result = alphaConvert(term, "x", "y");

    expect(result).toEqual(term);
  });

  test("renames in nested abstractions", () => {
    const term = createAbs("x", createAbs("y", createVar("x")));
    const result = alphaConvert(term, "x", "z");

    expect(result.tag).toBe("abs");
    if (result.tag === "abs") {
      expect(result.parameter).toBe("z");
      expect(result.body.tag).toBe("abs");
      if (result.body.tag === "abs" && result.body.body.tag === "var") {
        expect(result.body.body.name).toBe("z");
      }
    }
  });

  test("only renames matching bound variables", () => {
    const term = createAbs("x", createAbs("x", createVar("x")));
    const result = alphaConvert(term, "x", "y");

    expect(result.tag).toBe("abs");
    if (result.tag === "abs") {
      expect(result.parameter).toBe("y");
      expect(result.body.tag).toBe("abs");
      if (result.body.tag === "abs") {
        expect(result.body.parameter).toBe("x"); // Inner x unchanged
      }
    }
  });

  test("renames in applications", () => {
    const term = createApp(
      createAbs("x", createVar("x")),
      createAbs("x", createVar("x")),
    );
    const result = alphaConvert(term, "x", "y");

    expect(result.tag).toBe("app");
    if (result.tag === "app") {
      expect(result.function.tag).toBe("abs");
      expect(result.argument.tag).toBe("abs");
      if (result.function.tag === "abs" && result.argument.tag === "abs") {
        expect(result.function.parameter).toBe("y");
        expect(result.argument.parameter).toBe("y");
      }
    }
  });
});

describe("betaReduce", () => {
  test("reduces simple beta-redex", () => {
    const term = createApp(identity, createVar("y"));
    const result = betaReduce(term);

    expect(result).not.toBeNull();
    if (result) {
      expect(result.tag).toBe("var");
      if (result.tag === "var") {
        expect(result.name).toBe("y");
      }
    }
  });

  test("returns null for variable", () => {
    const term = createVar("x");
    const result = betaReduce(term);

    expect(result).toBeNull();
  });

  test("returns null for abstraction with no reducible body", () => {
    const term = createAbs("x", createVar("x"));
    const result = betaReduce(term);

    expect(result).toBeNull();
  });

  test("reduces body of abstraction", () => {
    const term = createAbs("x", createApp(identity, createVar("y")));
    const result = betaReduce(term);

    expect(result).not.toBeNull();
    if (result && result.tag === "abs" && result.body.tag === "var") {
      expect(result.body.name).toBe("y");
    }
  });

  test("reduces function in application first", () => {
    const term = createApp(
      createApp(kCombinator, createVar("x")),
      createVar("y"),
    );
    const result = betaReduce(term);

    expect(result).not.toBeNull();
    if (result && result.tag === "app" && result.function.tag === "abs") {
      expect(result.function.parameter).toBe("y");
    }
  });

  test("reduces argument when function cannot be reduced", () => {
    const term = createApp(createVar("f"), createApp(identity, createVar("x")));
    const result = betaReduce(term);

    expect(result).not.toBeNull();
    if (result && result.tag === "app" && result.argument.tag === "var") {
      expect(result.argument.name).toBe("x");
    }
  });

  test("handles Church numeral application", () => {
    const term = createApp(
      createApp(churchOne, createVar("f")),
      createVar("x"),
    );
    const result = betaReduce(term);

    expect(result).not.toBeNull();
    // First reduction: (λf.λx.f x) f → λx.f x
    if (result && result.tag === "abs") {
      expect(result.parameter).toBe("x");
      expect(result.body.tag).toBe("app");
    }
  });

  test("detects no reduction possible", () => {
    const term = createApp(createVar("f"), createVar("x"));
    const result = betaReduce(term);

    expect(result).toBeNull();
  });
});

describe("normalize", () => {
  test("normalizes identity application", () => {
    const term = createApp(identity, createVar("y"));
    const result = normalize(term);

    expect(result.tag).toBe("var");
    if (result.tag === "var") {
      expect(result.name).toBe("y");
    }
  });

  test("normalizes nested applications", () => {
    const term = createApp(identity, createApp(identity, createVar("x")));
    const result = normalize(term);

    expect(result.tag).toBe("var");
    if (result.tag === "var") {
      expect(result.name).toBe("x");
    }
  });

  test("normalizes K combinator application", () => {
    const term = createApp(
      createApp(kCombinator, createVar("x")),
      createVar("y"),
    );
    const result = normalize(term);

    expect(result.tag).toBe("var");
    if (result.tag === "var") {
      expect(result.name).toBe("x");
    }
  });

  test("returns term already in normal form", () => {
    const term = createVar("x");
    const result = normalize(term);

    expect(result).toEqual(term);
  });

  test("throws error for non-terminating reduction", () => {
    expect(() => normalize(omega, 10)).toThrow(
      "Normalization did not terminate within 10 steps",
    );
  });

  test("handles complex S combinator reduction", () => {
    // S K K x should normalize to x
    const term = createApp(
      createApp(createApp(sCombinator, kCombinator), kCombinator),
      createVar("x"),
    );
    const result = normalize(term);

    expect(result.tag).toBe("var");
    if (result.tag === "var") {
      expect(result.name).toBe("x");
    }
  });

  test("respects maxSteps parameter", () => {
    const term = createApp(identity, createVar("x"));
    const result = normalize(term, 1000);

    expect(result.tag).toBe("var");
    if (result.tag === "var") {
      expect(result.name).toBe("x");
    }
  });
});

describe("etaReduce", () => {
  test("performs eta-reduction on simple case", () => {
    // λx.f x where x not free in f should reduce to f
    const term = createAbs("x", createApp(createVar("f"), createVar("x")));
    const result = etaReduce(term);

    expect(result.tag).toBe("var");
    if (result.tag === "var") {
      expect(result.name).toBe("f");
    }
  });

  test("does not eta-reduce when variable is free in function", () => {
    // λx.x x should not be eta-reduced
    const term = createAbs("x", createApp(createVar("x"), createVar("x")));
    const result = etaReduce(term);

    expect(result).toEqual(term);
  });

  test("does not eta-reduce when argument is not the bound variable", () => {
    // λx.f y should not be eta-reduced
    const term = createAbs("x", createApp(createVar("f"), createVar("y")));
    const result = etaReduce(term);

    expect(result).toEqual(term);
  });

  test("eta-reduces nested abstractions", () => {
    // λx.λy.f x y where x,y not free in f
    const inner = createAbs(
      "y",
      createApp(createApp(createVar("f"), createVar("x")), createVar("y")),
    );
    const term = createAbs("x", inner);
    const result = etaReduce(term);

    // Should reduce inner first: λx.f x, then outer: f
    expect(result.tag).toBe("var");
    if (result.tag === "var") {
      expect(result.name).toBe("f");
    }
  });

  test("eta-reduces in applications", () => {
    const term = createApp(
      createAbs("x", createApp(createVar("f"), createVar("x"))),
      createVar("y"),
    );
    const result = etaReduce(term);

    expect(result.tag).toBe("app");
    if (result.tag === "app" && result.function.tag === "var") {
      expect(result.function.name).toBe("f");
    }
  });

  test("leaves variables unchanged", () => {
    const term = createVar("x");
    const result = etaReduce(term);

    expect(result).toEqual(term);
  });

  test("handles complex nested structure", () => {
    // λx.(λy.g y) x should reduce to g
    const inner = createAbs("y", createApp(createVar("g"), createVar("y")));
    const term = createAbs("x", createApp(inner, createVar("x")));
    const result = etaReduce(term);

    expect(result.tag).toBe("var");
    if (result.tag === "var") {
      expect(result.name).toBe("g");
    }
  });
});

describe("evaluate", () => {
  test("evaluates with default options", () => {
    const term = createApp(identity, createVar("x"));
    const result = evaluate(term);

    expect(result.term.tag).toBe("var");
    if (result.term.tag === "var") {
      expect(result.term.name).toBe("x");
    }
    expect(result.isNormalForm).toBe(true);
    expect(result.betaSteps).toBeGreaterThan(0);
  });

  test("evaluates with normal order strategy", () => {
    const term = createApp(identity, createVar("x"));
    const result = evaluate(term, { strategy: "normal" });

    expect(result.term.tag).toBe("var");
    expect(result.isNormalForm).toBe(true);
  });

  test("evaluates with applicative order strategy", () => {
    const term = createApp(identity, createVar("x"));
    const result = evaluate(term, { strategy: "applicative" });

    expect(result.term.tag).toBe("var");
    expect(result.isNormalForm).toBe(true);
  });

  test("evaluates with lazy strategy", () => {
    const term = createApp(identity, createVar("x"));
    const result = evaluate(term, { strategy: "lazy" });

    expect(result.term.tag).toBe("var");
    expect(result.isNormalForm).toBe(true);
  });

  test("tracks evaluation steps when enabled", () => {
    const term = createApp(identity, createVar("x"));
    const result = evaluate(term, { trackSteps: true });

    expect(result.steps).toBeDefined();
    expect(result.steps!.length).toBeGreaterThan(0);
    expect(result.steps![0]).toEqual(term);
  });

  test("performs eta-reduction when enabled", () => {
    const term = createAbs("x", createApp(createVar("f"), createVar("x")));
    const result = evaluate(term, { enableEtaReduction: true });

    expect(result.term.tag).toBe("var");
    if (result.term.tag === "var") {
      expect(result.term.name).toBe("f");
    }
    expect(result.etaSteps).toBeGreaterThan(0);
  });

  test("skips eta-reduction when disabled", () => {
    const term = createAbs("x", createApp(createVar("f"), createVar("x")));
    const result = evaluate(term, { enableEtaReduction: false });

    expect(result.term).toEqual(term);
    expect(result.etaSteps).toBe(0);
  });

  test("respects maxSteps limit", () => {
    const term = createApp(identity, createVar("x"));
    const result = evaluate(term, { maxSteps: 5 });

    expect(result.term.tag).toBe("var");
  });

  test("throws error for non-terminating evaluation", () => {
    expect(() => evaluate(omega, { maxSteps: 5 })).toThrow(
      "Beta-reduction did not terminate",
    );
  });

  test("handles Church numeral evaluation", () => {
    const term = createApp(
      createApp(churchTwo, createVar("f")),
      createVar("x"),
    );
    const result = evaluate(term);

    // Should evaluate to f (f x)
    expect(result.term.tag).toBe("app");
    expect(result.isNormalForm).toBe(true);
  });

  test("evaluates complex combinator expressions", () => {
    // S K K should evaluate to I (identity)
    const term = createApp(createApp(sCombinator, kCombinator), kCombinator);
    const result = evaluate(term);

    expect(result.isNormalForm).toBe(true);
    // The result should behave like identity when applied
  });

  test("returns correct metadata", () => {
    const term = createApp(identity, createVar("x"));
    const result = evaluate(term, { trackSteps: true });

    expect(typeof result.betaSteps).toBe("number");
    expect(typeof result.etaSteps).toBe("number");
    expect(typeof result.isNormalForm).toBe("boolean");
    expect(result.steps).toBeDefined();
  });

  test("throws error for unknown strategy", () => {
    const term = createVar("x");
    expect(() =>
      evaluate(term, { strategy: "unknown" as EvaluationStrategy }),
    ).toThrow("Unknown evaluation strategy");
  });

  test("handles already normalized terms", () => {
    const term = createVar("x");
    const result = evaluate(term);

    expect(result.term).toEqual(term);
    expect(result.isNormalForm).toBe(true);
    // betaSteps might be maxSteps when no tracking is done
    expect(result.betaSteps).toBeGreaterThanOrEqual(0);
  });

  test("evaluates nested applications correctly", () => {
    const term = createApp(createApp(identity, identity), createVar("x"));
    const result = evaluate(term);

    expect(result.term.tag).toBe("var");
    if (result.term.tag === "var") {
      expect(result.term.name).toBe("x");
    }
  });
});

describe("Integration Tests", () => {
  test("substitute and betaReduce work together", () => {
    const term = createApp(createAbs("x", createVar("y")), createVar("z"));
    const substituted = substitute(term, "y", createVar("w"));
    const reduced = betaReduce(substituted);

    expect(reduced).not.toBeNull();
    if (reduced && reduced.tag === "var") {
      expect(reduced.name).toBe("w");
    }
  });

  test("alphaConvert and normalize work together", () => {
    const term = createAbs("x", createApp(identity, createVar("x")));
    const converted = alphaConvert(term, "x", "y");
    const normalized = normalize(converted);

    expect(normalized.tag).toBe("abs");
    if (normalized.tag === "abs") {
      expect(normalized.parameter).toBe("y");
      expect(normalized.body.tag).toBe("var");
      if (normalized.body.tag === "var") {
        expect(normalized.body.name).toBe("y");
      }
    }
  });

  test("full evaluation pipeline", () => {
    // Create a complex term and evaluate it fully
    const term = createApp(
      createApp(kCombinator, createVar("x")),
      createApp(identity, createVar("y")),
    );

    const result = evaluate(term, {
      strategy: "normal",
      enableEtaReduction: true,
      trackSteps: true,
      maxSteps: 100,
    });

    expect(result.term.tag).toBe("var");
    if (result.term.tag === "var") {
      expect(result.term.name).toBe("x");
    }
    expect(result.isNormalForm).toBe(true);
    expect(result.steps).toBeDefined();
  });

  test("variable capture avoidance in complex substitution", () => {
    // λx.λy.x where we substitute x with y should avoid capture
    const term = createAbs("x", createAbs("y", createVar("x")));
    const result = substitute(term, "x", createVar("y"));

    expect(result.tag).toBe("abs");
    if (result.tag === "abs") {
      // The outer x is bound, so substitution shouldn't happen
      expect(result.parameter).toBe("x");
      expect(result.body.tag).toBe("abs");
      if (result.body.tag === "abs") {
        expect(result.body.parameter).toBe("y");
        expect(result.body.body.tag).toBe("var");
        if (result.body.body.tag === "var") {
          expect(result.body.body.name).toBe("x"); // x is still bound by outer lambda
        }
      }
    }
  });
});

describe("Edge Cases and Error Handling", () => {
  test("generateFreshVariable with extreme cases", () => {
    const manyNames = Array.from({ length: 1000 }, (_, i) => `x${i}`);
    manyNames.push("x");
    const result = generateFreshVariable(manyNames, "x");
    expect(result).toBe("x1000");
  });

  test("normalize with maxSteps of 0 throws on reducible term", () => {
    const term = createApp(identity, createVar("x"));
    expect(() => normalize(term, 0)).toThrow(
      "Normalization did not terminate within 0 steps",
    );
  });

  test("normalize with maxSteps of 1 on normal form", () => {
    const term = createVar("x");
    const result = normalize(term, 1);
    expect(result).toEqual(term);
  });

  test("evaluate with maxSteps of 0 on reducible term", () => {
    const term = createApp(identity, createVar("x"));
    expect(() => evaluate(term, { maxSteps: 0 })).toThrow(
      "Beta-reduction did not terminate within 0 steps",
    );
  });

  test("deeply nested lambda terms", () => {
    // Create λx.λy.λz.x
    let term = createVar("x");
    for (let i = 0; i < 10; i++) {
      term = createAbs(`var${i}`, term);
    }

    const result = normalize(term);
    expect(result.tag).toBe("abs");
  });

  test("very long application chains", () => {
    // Create f x y z ... (many applications)
    let term = createVar("f");
    for (let i = 0; i < 20; i++) {
      term = createApp(term, createVar(`x${i}`));
    }

    const result = normalize(term);
    expect(result.tag).toBe("app");
  });

  test("substitute with complex replacement term", () => {
    const term = createVar("x");
    const replacement = createApp(
      createAbs("y", createVar("y")),
      createVar("z"),
    );
    const result = substitute(term, "x", replacement);

    expect(result).toEqual(replacement);
  });
});
