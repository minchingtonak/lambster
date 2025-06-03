import { expect, test } from "bun:test";
import grammar from "../nearley/lambster_parser.js";
import nearley from "nearley";

// Tests help command statement to be the first element of the parse tree
test("help command statement parse test", () => {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  parser.feed("help");
  expect(parser.results[0][0]["command"]).toBe("help");
});

// Tests env command statement to be the first element of the parse tree
test("env command statement parse test", () => {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  parser.feed("env");
  expect(parser.results[0][0]["command"]).toBe("env");
});

// Tests unbind command statement to be the first element of the parse tree with argument as the third
test("unbind command statement parse test", () => {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  parser.feed("unbind epla");
  expect(parser.results[0][0]["command"]).toBe("unbind");
  expect(parser.results[0][0]["identifier"]).toBe("epla");
});

// Tests binding variable statement to be the first element of the parse tree with argument as the third
test("binding statement parse test", () => {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  parser.feed("p = 12");
  expect(parser.results[0][0]["identifier"]).toBe("p");
  expect(parser.results[0][0]["term"]).toBe("12");
});

// Tests lambda statement without operator or spaces
test("term statement parse test", () => {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  parser.feed("Lxa.xa");
  expect(parser.results[0][0][0]["identifier"]).toBe("xa");
  expect(parser.results[0][0][0]["term"]).toBe("xa");
  expect(parser.results[0][0][0]["lambda_symbol"]).toBe("L");
});

// Tests lambda statement without operator or spaces
test("term statement parse test 2", () => {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  parser.feed("\\bax.12");
  expect(parser.results[0][0][0]["identifier"]).toBe("bax");
  expect(parser.results[0][0][0]["term"]).toBe("12");
  expect(parser.results[0][0][0]["lambda_symbol"]).toBe("\\");
});

// Tests lambda statement without operator or spaces
test("term statement parse test 3", () => {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  parser.feed("λfun.tlas");
  expect(parser.results[0][0][0]["identifier"]).toBe("fun");
  expect(parser.results[0][0][0]["term"]).toBe("tlas");
  expect(parser.results[0][0][0]["lambda_symbol"]).toBe("λ");
});

test("complex test", () => {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  parser.feed("(Lx y. L z. z y x) w");
  console.dir(parser.results, { depth: Infinity });
});
