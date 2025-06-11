import { expect, test, describe } from "bun:test";
import {
  LambsterParser,
  parse,
  parseTerm,
  parseCommand,
  evaluateTerm,
  prettyPrintTerm,
  findFreeVariables,
  substitute,
  betaReduce,
  normalize,
  match,
} from "../src/index.js";

describe("Tagged Union Parser Tests", () => {
  test("parse simple variable", () => {
    const result = parseTerm("x");
    expect(result.tag).toBe("Variable");
    if (result.tag === "Variable") {
      expect(result.name).toBe("x");
    }
  });

  test("parse lambda abstraction", () => {
    const result = parseTerm("λx.x");
    expect(result.tag).toBe("Abstraction");
    if (result.tag === "Abstraction") {
      expect(result.symbol).toBe("λ");
      expect(result.parameter).toBe("x");
      expect(result.body.tag).toBe("Variable");
      if (result.body.tag === "Variable") {
        expect(result.body.name).toBe("x");
      }
    }
  });

  test("parse application", () => {
    const result = parseTerm("f x");
    expect(result.tag).toBe("Application");
    if (result.tag === "Application") {
      expect(result.function.tag).toBe("Variable");
      expect(result.argument.tag).toBe("Variable");
      if (
        result.function.tag === "Variable" &&
        result.argument.tag === "Variable"
      ) {
        expect(result.function.name).toBe("f");
        expect(result.argument.name).toBe("x");
      }
    }
  });

  test("parse binding statement", () => {
    const result = parse("identity = λx.x");
    expect(result.tag).toBe("Binding");
    if (result.tag === "Binding") {
      expect(result.identifier).toBe("identity");
      expect(result.term.tag).toBe("Abstraction");
    }
  });

  test("parse command statement", () => {
    const result = parse("help");
    expect(result.tag).toBe("Command");
    if (result.tag === "Command") {
      expect(result.command.tag).toBe("Help");
    }
  });

  test("parse unbind command", () => {
    const result = parseCommand("unbind foo");
    expect(result.tag).toBe("Unbind");
    if (result.tag === "Unbind") {
      expect(result.identifier).toBe("foo");
    }
  });
});

describe("Pattern Matching Tests", () => {
  test("evaluateTerm with ts-pattern", () => {
    const term = parseTerm("λx.x");
    const result = evaluateTerm(term);
    expect(result).toBe("λx.x");
  });

  test("prettyPrintTerm", () => {
    const term = parseTerm("(λx.x) y");
    const result = prettyPrintTerm(term);
    expect(result).toBe("(λx.x) y");
  });

  test("custom pattern matching", () => {
    const term = parseTerm("λx.x");

    const result = match(term)
      .with({ tag: "Variable" }, ({ name }) => `var:${name}`)
      .with({ tag: "Abstraction" }, ({ parameter }) => `abs:${parameter}`)
      .with({ tag: "Application" }, () => "app")
      .exhaustive();

    expect(result).toBe("abs:x");
  });
});

describe("Lambda Calculus Operations", () => {
  test("find free variables", () => {
    const term = parseTerm("λx.x y z");
    const freeVars = findFreeVariables(term);
    expect(freeVars).toEqual(["y", "z"]);
  });

  test("variable substitution", () => {
    const term = parseTerm("λx.x y");
    const replacement = parseTerm("z");
    const result = substitute(term, "y", replacement);

    // λx.x y is parsed as an application: (λx.x) y
    // After substitution of y with z, it should be: (λx.x) z
    expect(result.tag).toBe("Application");
    if (result.tag === "Application") {
      expect(result.function.tag).toBe("Abstraction");
      expect(result.argument.tag).toBe("Variable");
      if (result.argument.tag === "Variable") {
        expect(result.argument.name).toBe("z");
      }
    }
  });

  test("beta reduction", () => {
    const term = parseTerm("(λx.x) y");
    const reduced = betaReduce(term);

    expect(reduced).not.toBeNull();
    if (reduced) {
      expect(reduced.tag).toBe("Variable");
      if (reduced.tag === "Variable") {
        expect(reduced.name).toBe("y");
      }
    }
  });

  test("normalization", () => {
    const term = parseTerm("(λx.x) ((λy.y) z)");
    const normal = normalize(term);

    expect(normal.tag).toBe("Variable");
    if (normal.tag === "Variable") {
      expect(normal.name).toBe("z");
    }
  });
});

describe("Complex Lambda Expressions", () => {
  test("Church numeral zero", () => {
    const term = parseTerm("λf.λx.x");
    expect(term.tag).toBe("Abstraction");

    if (term.tag === "Abstraction") {
      expect(term.parameter).toBe("f");
      expect(term.body.tag).toBe("Abstraction");

      if (term.body.tag === "Abstraction") {
        expect(term.body.parameter).toBe("x");
        expect(term.body.body.tag).toBe("Variable");

        if (term.body.body.tag === "Variable") {
          expect(term.body.body.name).toBe("x");
        }
      }
    }
  });

  test("Church boolean TRUE", () => {
    const term = parseTerm("λx.λy.x");
    const freeVars = findFreeVariables(term);
    expect(freeVars).toEqual([]);
  });

  test("Complex application chain", () => {
    const term = parseTerm("f g h i j");
    expect(term.tag).toBe("Application");

    // Should be left-associative: ((((f g) h) i) j)
    let current = term;
    let depth = 0;
    while (current.tag === "Application") {
      depth++;
      current = current.function;
    }
    expect(depth).toBe(4); // 4 applications total
  });
});

describe("Error Handling", () => {
  test("invalid syntax throws ParseError", () => {
    expect(() => parse("λx..x")).toThrow();
  });

  test("parsing term as command throws", () => {
    expect(() => parseCommand("λx.x")).toThrow();
  });

  test("parsing command as term throws", () => {
    expect(() => parseTerm("help")).toThrow();
  });
});

describe("Parser Options", () => {
  test("validation option", () => {
    const parser = new LambsterParser({ validate: true });
    const result = parser.parse("λx.x");
    expect(result.tag).toBe("Term");
  });

  test("multiple parse results", () => {
    const parser = new LambsterParser();
    const statements = parser.parseMultiple("λx.x\nhelp\ny = z");

    expect(statements).toHaveLength(3);
    expect(statements[0]?.tag).toBe("Term");
    expect(statements[1]?.tag).toBe("Command");
    expect(statements[2]?.tag).toBe("Binding");
  });
});
