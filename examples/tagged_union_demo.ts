/**
 * LAMBSTER Tagged Union Demo
 *
 * This example demonstrates the new tagged union AST representation
 * and pattern matching capabilities using ts-pattern.
 */

import {
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
import type { Term } from "../src/index.js";

console.log("🚀 LAMBSTER Tagged Union Demo\n");

// 1. Basic parsing examples
console.log("1. Basic Parsing Examples");
console.log("========================");

const variable = parseTerm("x");
console.log("Variable:", variable);

const abstraction = parseTerm("λx.x");
console.log("Abstraction:", abstraction);

const application = parseTerm("f x");
console.log("Application:", application);

const binding = parse("identity = λx.x");
console.log("Binding:", binding);

const command = parseCommand("help");
console.log("Command:", command);

console.log("\n");

// 2. Pattern matching with ts-pattern
console.log("2. Pattern Matching Examples");
console.log("============================");

const complexTerm = parseTerm("λf.λx.f (f x)");

const description = match(complexTerm)
  .with({ tag: "Variable" }, ({ name }) => `Variable: ${name}`)
  .with({ tag: "Abstraction" }, ({ parameter, body }) => {
    const bodyDesc = match(body)
      .with({ tag: "Variable" }, ({ name }) => `variable ${name}`)
      .with(
        { tag: "Abstraction" },
        ({ parameter }) => `abstraction over ${parameter}`,
      )
      .with({ tag: "Application" }, () => "application")
      .exhaustive();
    return `Abstraction over ${parameter} with body: ${bodyDesc}`;
  })
  .with({ tag: "Application" }, () => `Application of function to argument`)
  .exhaustive();

console.log("Complex term:", prettyPrintTerm(complexTerm));
console.log("Description:", description);

console.log("\n");

// 3. Lambda calculus operations
console.log("3. Lambda Calculus Operations");
console.log("=============================");

const term1 = parseTerm("λx.x y z");
console.log("Term:", prettyPrintTerm(term1));
console.log("Free variables:", findFreeVariables(term1));

const term2 = parseTerm("(λx.x) y");
console.log("\nBefore beta reduction:", prettyPrintTerm(term2));
const reduced = betaReduce(term2);
if (reduced) {
  console.log("After beta reduction:", prettyPrintTerm(reduced));
}

const term3 = parseTerm("(λx.x) ((λy.y) z)");
console.log("\nBefore normalization:", prettyPrintTerm(term3));
const normalized = normalize(term3);
console.log("After normalization:", prettyPrintTerm(normalized));

console.log("\n");

// 4. Church encodings
console.log("4. Church Encodings");
console.log("==================");

const churchZero = parseTerm("λf.λx.x");
const churchOne = parseTerm("λf.λx.f x");
const churchTwo = parseTerm("λf.λx.f (f x)");

console.log("Church Zero:", prettyPrintTerm(churchZero));
console.log("Church One:", prettyPrintTerm(churchOne));
console.log("Church Two:", prettyPrintTerm(churchTwo));

const churchTrue = parseTerm("λx.λy.x");
const churchFalse = parseTerm("λx.λy.y");

console.log("Church True:", prettyPrintTerm(churchTrue));
console.log("Church False:", prettyPrintTerm(churchFalse));

console.log("\n");

// 5. Variable substitution
console.log("5. Variable Substitution");
console.log("========================");

const originalTerm = parseTerm("λx.x y");
const replacement = parseTerm("z");
const substituted = substitute(originalTerm, "y", replacement);

console.log("Original:", prettyPrintTerm(originalTerm));
console.log("Substitute y with z:", prettyPrintTerm(substituted));

console.log("\n");

// 6. Type-safe pattern matching for evaluation
console.log("6. Custom Evaluation with Pattern Matching");
console.log("==========================================");

function customEvaluate(term: Term): string {
  return match(term)
    .with({ tag: "Variable" }, ({ name }) => `VAR(${name})`)
    .with(
      { tag: "Abstraction" },
      ({ symbol, parameter, body }) =>
        `ABS(${symbol}${parameter}.${customEvaluate(body)})`,
    )
    .with(
      { tag: "Application" },
      ({ function: fn, argument }) =>
        `APP(${customEvaluate(fn)}, ${customEvaluate(argument)})`,
    )
    .exhaustive();
}

const exampleTerm = parseTerm("(λx.x) y");
console.log("Standard evaluation:", evaluateTerm(exampleTerm));
console.log("Custom evaluation:", customEvaluate(exampleTerm));

console.log("\n✅ Demo completed successfully!");
