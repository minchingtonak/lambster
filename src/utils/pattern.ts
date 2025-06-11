/**
 * Pattern matching utilities using ts-pattern
 */

import { match } from "ts-pattern";
import type { Term, Command, Statement } from "../types/ast.js";

/**
 * Evaluate a term to its string representation
 */
export function evaluateTerm(term: Term): string {
  return match(term)
    .with({ tag: "Variable" }, ({ name }) => name)
    .with(
      { tag: "Abstraction" },
      ({ symbol, parameter, body }) =>
        `${symbol}${parameter}.${evaluateTerm(body)}`,
    )
    .with(
      { tag: "Application" },
      ({ function: fn, argument }) =>
        `(${evaluateTerm(fn)} ${evaluateTerm(argument)})`,
    )
    .exhaustive();
}

/**
 * Pretty print a term with proper parenthesization
 */
export function prettyPrintTerm(term: Term, parenthesize = false): string {
  return match(term)
    .with({ tag: "Variable" }, ({ name }) => name)
    .with({ tag: "Abstraction" }, ({ symbol, parameter, body }) => {
      const result = `${symbol}${parameter}.${prettyPrintTerm(body)}`;
      return parenthesize ? `(${result})` : result;
    })
    .with({ tag: "Application" }, ({ function: fn, argument }) => {
      const fnStr = match(fn)
        .with({ tag: "Abstraction" }, (abs) => prettyPrintTerm(abs, true))
        .otherwise((t) => prettyPrintTerm(t));

      const argStr = match(argument)
        .with({ tag: "Application" }, (app) => prettyPrintTerm(app, true))
        .with({ tag: "Abstraction" }, (abs) => prettyPrintTerm(abs, true))
        .otherwise((t) => prettyPrintTerm(t));

      const result = `${fnStr} ${argStr}`;
      return parenthesize ? `(${result})` : result;
    })
    .exhaustive();
}

/**
 * Analyze the complexity of a term (number of nodes)
 */
export function analyzeComplexity(term: Term): number {
  return match(term)
    .with({ tag: "Variable" }, () => 1)
    .with({ tag: "Abstraction" }, ({ body }) => 1 + analyzeComplexity(body))
    .with(
      { tag: "Application" },
      ({ function: fn, argument }) =>
        1 + analyzeComplexity(fn) + analyzeComplexity(argument),
    )
    .exhaustive();
}

/**
 * Find all free variables in a term
 */
export function findFreeVariables(
  term: Term,
  bound: Set<string> = new Set(),
): string[] {
  return match(term)
    .with({ tag: "Variable" }, ({ name }) => (bound.has(name) ? [] : [name]))
    .with({ tag: "Abstraction" }, ({ parameter, body }) =>
      findFreeVariables(body, new Set([...bound, parameter])),
    )
    .with({ tag: "Application" }, ({ function: fn, argument }) => [
      ...findFreeVariables(fn, bound),
      ...findFreeVariables(argument, bound),
    ])
    .exhaustive();
}

/**
 * Find all bound variables in a term
 */
export function findBoundVariables(term: Term): string[] {
  return match(term)
    .with({ tag: "Variable" }, () => [])
    .with({ tag: "Abstraction" }, ({ parameter, body }) => [
      parameter,
      ...findBoundVariables(body),
    ])
    .with({ tag: "Application" }, ({ function: fn, argument }) => [
      ...findBoundVariables(fn),
      ...findBoundVariables(argument),
    ])
    .exhaustive();
}

/**
 * Find all variables (free and bound) in a term
 */
export function findAllVariables(term: Term): string[] {
  return match(term)
    .with({ tag: "Variable" }, ({ name }) => [name])
    .with({ tag: "Abstraction" }, ({ parameter, body }) => [
      parameter,
      ...findAllVariables(body),
    ])
    .with({ tag: "Application" }, ({ function: fn, argument }) => [
      ...findAllVariables(fn),
      ...findAllVariables(argument),
    ])
    .exhaustive();
}

/**
 * Check if a term is a closed term (no free variables)
 */
export function isClosedTerm(term: Term): boolean {
  return findFreeVariables(term).length === 0;
}

/**
 * Check if a term is in normal form (cannot be beta-reduced)
 */
export function isNormalForm(term: Term): boolean {
  return match(term)
    .with({ tag: "Variable" }, () => true)
    .with({ tag: "Abstraction" }, ({ body }) => isNormalForm(body))
    .with({ tag: "Application", function: { tag: "Abstraction" } }, () => false) // Beta-redex found
    .with(
      { tag: "Application" },
      ({ function: fn, argument }) =>
        isNormalForm(fn) && isNormalForm(argument),
    )
    .exhaustive();
}

/**
 * Execute a command and return a description
 */
export function executeCommand(command: Command): string {
  return match(command)
    .with(
      { tag: "Help" },
      () => "Available commands: help, env, unbind <identifier>",
    )
    .with({ tag: "Environment" }, () => "Environment command executed")
    .with(
      { tag: "Unbind" },
      ({ identifier }) => `Unbound identifier: ${identifier}`,
    )
    .exhaustive();
}

/**
 * Get a description of a statement
 */
export function describeStatement(statement: Statement): string {
  return match(statement)
    .with(
      { tag: "Binding" },
      ({ identifier, term }) =>
        `Binding ${identifier} = ${prettyPrintTerm(term)}`,
    )
    .with(
      { tag: "Command" },
      ({ command }) => `Command: ${executeCommand(command)}`,
    )
    .with({ tag: "Term" }, ({ term }) => `Term: ${prettyPrintTerm(term)}`)
    .exhaustive();
}

/**
 * Check if two terms are structurally equal (alpha-equivalence not considered)
 */
export function structurallyEqual(term1: Term, term2: Term): boolean {
  return match([term1, term2])
    .with(
      [{ tag: "Variable" }, { tag: "Variable" }],
      ([t1, t2]) => t1.name === t2.name,
    )
    .with(
      [{ tag: "Abstraction" }, { tag: "Abstraction" }],
      ([t1, t2]) =>
        t1.parameter === t2.parameter && structurallyEqual(t1.body, t2.body),
    )
    .with(
      [{ tag: "Application" }, { tag: "Application" }],
      ([t1, t2]) =>
        structurallyEqual(t1.function, t2.function) &&
        structurallyEqual(t1.argument, t2.argument),
    )
    .otherwise(() => false);
}
