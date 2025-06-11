/**
 * AST traversal utilities for lambda calculus terms
 */

import { match } from "ts-pattern";
import type { Term, Statement } from "../types/ast.js";

/**
 * Map over all terms in an AST, applying a transformation function
 */
export function mapTerm<T>(term: Term, fn: (_t: Term) => T): T[] {
  const results: T[] = [fn(term)];

  return match(term)
    .with({ tag: "Variable" }, () => results)
    .with({ tag: "Abstraction" }, ({ body }) => [
      ...results,
      ...mapTerm(body, fn),
    ])
    .with({ tag: "Application" }, ({ function: fnTerm, argument }) => [
      ...results,
      ...mapTerm(fnTerm, fn),
      ...mapTerm(argument, fn),
    ])
    .exhaustive();
}

/**
 * Fold over all terms in an AST, accumulating a result
 */
export function foldTerm<T>(
  term: Term,
  fn: (_acc: T, _current: Term) => T,
  initial: T,
): T {
  let result = fn(initial, term);

  return match(term)
    .with({ tag: "Variable" }, () => result)
    .with({ tag: "Abstraction" }, ({ body }) => foldTerm(body, fn, result))
    .with({ tag: "Application" }, ({ function: fnTerm, argument }) => {
      result = foldTerm(fnTerm, fn, result);
      return foldTerm(argument, fn, result);
    })
    .exhaustive();
}

/**
 * Visit all terms in an AST, calling a function for each
 */
export function visitTerm(term: Term, visitor: (_t: Term) => void): void {
  visitor(term);

  match(term)
    .with({ tag: "Variable" }, () => {})
    .with({ tag: "Abstraction" }, ({ body }) => visitTerm(body, visitor))
    .with({ tag: "Application" }, ({ function: fnTerm, argument }) => {
      visitTerm(fnTerm, visitor);
      visitTerm(argument, visitor);
    })
    .exhaustive();
}

/**
 * Find the first term that matches a predicate
 */
export function findTerm(
  term: Term,
  predicate: (_t: Term) => boolean,
): Term | null {
  if (predicate(term)) {
    return term;
  }

  return match(term)
    .with({ tag: "Variable" }, () => null)
    .with({ tag: "Abstraction" }, ({ body }) => findTerm(body, predicate))
    .with({ tag: "Application" }, ({ function: fnTerm, argument }) => {
      const foundInFn = findTerm(fnTerm, predicate);
      return foundInFn || findTerm(argument, predicate);
    })
    .exhaustive();
}

/**
 * Find all terms that match a predicate
 */
export function findAllTerms(
  term: Term,
  predicate: (_t: Term) => boolean,
): Term[] {
  const results: Term[] = [];

  if (predicate(term)) {
    results.push(term);
  }

  match(term)
    .with({ tag: "Variable" }, () => {})
    .with({ tag: "Abstraction" }, ({ body }) => {
      results.push(...findAllTerms(body, predicate));
    })
    .with({ tag: "Application" }, ({ function: fnTerm, argument }) => {
      results.push(...findAllTerms(fnTerm, predicate));
      results.push(...findAllTerms(argument, predicate));
    })
    .exhaustive();

  return results;
}

/**
 * Count the number of nodes in a term
 */
export function countNodes(term: Term): number {
  return match(term)
    .with({ tag: "Variable" }, () => 1)
    .with({ tag: "Abstraction" }, ({ body }) => 1 + countNodes(body))
    .with(
      { tag: "Application" },
      ({ function: fnTerm, argument }) =>
        1 + countNodes(fnTerm) + countNodes(argument),
    )
    .exhaustive();
}

/**
 * Calculate the depth of a term (maximum nesting level)
 */
export function calculateDepth(term: Term): number {
  return match(term)
    .with({ tag: "Variable" }, () => 1)
    .with({ tag: "Abstraction" }, ({ body }) => 1 + calculateDepth(body))
    .with(
      { tag: "Application" },
      ({ function: fnTerm, argument }) =>
        1 + Math.max(calculateDepth(fnTerm), calculateDepth(argument)),
    )
    .exhaustive();
}

/**
 * Transform a term by applying a function to each node
 */
export function transformTerm(
  term: Term,
  transformer: (_t: Term) => Term,
): Term {
  const transformed = transformer(term);

  return match(transformed)
    .with({ tag: "Variable" }, () => transformed)
    .with({ tag: "Abstraction" }, ({ symbol, parameter, body }) => ({
      tag: "Abstraction" as const,
      symbol,
      parameter,
      body: transformTerm(body, transformer),
    }))
    .with({ tag: "Application" }, ({ function: fnTerm, argument }) => ({
      tag: "Application" as const,
      function: transformTerm(fnTerm, transformer),
      argument: transformTerm(argument, transformer),
    }))
    .exhaustive();
}

/**
 * Check if any term in the AST matches a predicate
 */
export function anyTerm(term: Term, predicate: (_t: Term) => boolean): boolean {
  if (predicate(term)) {
    return true;
  }

  return match(term)
    .with({ tag: "Variable" }, () => false)
    .with({ tag: "Abstraction" }, ({ body }) => anyTerm(body, predicate))
    .with(
      { tag: "Application" },
      ({ function: fnTerm, argument }) =>
        anyTerm(fnTerm, predicate) || anyTerm(argument, predicate),
    )
    .exhaustive();
}

/**
 * Check if all terms in the AST match a predicate
 */
export function allTerms(
  term: Term,
  predicate: (_t: Term) => boolean,
): boolean {
  if (!predicate(term)) {
    return false;
  }

  return match(term)
    .with({ tag: "Variable" }, () => true)
    .with({ tag: "Abstraction" }, ({ body }) => allTerms(body, predicate))
    .with(
      { tag: "Application" },
      ({ function: fnTerm, argument }) =>
        allTerms(fnTerm, predicate) && allTerms(argument, predicate),
    )
    .exhaustive();
}

/**
 * Get all immediate children of a term
 */
export function getChildren(term: Term): Term[] {
  return match(term)
    .with({ tag: "Variable" }, () => [])
    .with({ tag: "Abstraction" }, ({ body }) => [body])
    .with({ tag: "Application" }, ({ function: fnTerm, argument }) => [
      fnTerm,
      argument,
    ])
    .exhaustive();
}

/**
 * Get the parent-child relationships in a term as a flat list
 */
export function getParentChildPairs(
  term: Term,
): Array<{ parent: Term; child: Term }> {
  const pairs: Array<{ parent: Term; child: Term }> = [];

  match(term)
    .with({ tag: "Variable" }, () => {})
    .with({ tag: "Abstraction" }, ({ body }) => {
      pairs.push({ parent: term, child: body });
      pairs.push(...getParentChildPairs(body));
    })
    .with({ tag: "Application" }, ({ function: fnTerm, argument }) => {
      pairs.push({ parent: term, child: fnTerm });
      pairs.push({ parent: term, child: argument });
      pairs.push(...getParentChildPairs(fnTerm));
      pairs.push(...getParentChildPairs(argument));
    })
    .exhaustive();

  return pairs;
}

/**
 * Traverse a statement and apply operations to its terms
 */
export function traverseStatement(
  statement: Statement,
  termVisitor: (_t: Term) => void,
): void {
  match(statement)
    .with({ tag: "Binding" }, ({ term }) => visitTerm(term, termVisitor))
    .with({ tag: "Command" }, () => {}) // Commands don't contain terms
    .with({ tag: "Term" }, ({ term }) => visitTerm(term, termVisitor))
    .exhaustive();
}

/**
 * Transform all terms in a statement
 */
export function transformStatement(
  statement: Statement,
  termTransformer: (_t: Term) => Term,
): Statement {
  return match(statement)
    .with({ tag: "Binding" }, ({ identifier, term }) => ({
      tag: "Binding" as const,
      identifier,
      term: transformTerm(term, termTransformer),
    }))
    .with({ tag: "Command" }, () => statement) // Commands don't contain terms
    .with({ tag: "Term" }, ({ term }) => ({
      tag: "Term" as const,
      term: transformTerm(term, termTransformer),
    }))
    .exhaustive();
}
