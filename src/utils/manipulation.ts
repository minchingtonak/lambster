/**
 * AST manipulation utilities for lambda calculus operations
 */

import { match } from "ts-pattern";
import type { Term } from "../types/ast";

/**
 * Generate a fresh variable name that doesn't conflict with existing names
 */
export function generateFreshVariable(
  existingNames: string[],
  base = "x",
): string {
  let counter = 0;
  let candidate = base;

  while (existingNames.includes(candidate)) {
    candidate = `${base}${counter}`;
    counter++;
  }

  return candidate;
}

/**
 * Substitute all free occurrences of a variable in a term
 * substitute(term, from, to) replaces all free occurrences of 'from' with 'to'
 */
export function substitute(term: Term, from: string, to: Term): Term {
  return match(term)
    .with({ tag: "var" }, ({ name }) => (name === from ? to : term))
    .with({ tag: "abs" }, ({ symbol, parameter, body }) => {
      if (parameter === from) {
        // Variable is bound, don't substitute
        return term;
      }

      // Check if substitution would cause variable capture
      const freeInTo = findFreeVariables(to);
      if (freeInTo.includes(parameter)) {
        // Alpha-convert to avoid capture
        const allVars = [
          ...findAllVariables(body),
          ...findAllVariables(to),
          from,
        ];
        const freshParam = generateFreshVariable(allVars, parameter);
        const renamedBody = substitute(body, parameter, {
          tag: "var",
          name: freshParam,
        });

        return {
          tag: "abs" as const,
          symbol,
          parameter: freshParam,
          body: substitute(renamedBody, from, to),
        };
      }

      return {
        tag: "abs" as const,
        symbol,
        parameter,
        body: substitute(body, from, to),
      };
    })
    .with({ tag: "app" }, ({ function: fn, argument }) => ({
      tag: "app" as const,
      function: substitute(fn, from, to),
      argument: substitute(argument, from, to),
    }))
    .exhaustive();
}

/**
 * Perform alpha-conversion (rename bound variable)
 */
export function alphaConvert(
  term: Term,
  oldName: string,
  newName: string,
): Term {
  return match(term)
    .with({ tag: "var" }, () => term)
    .with({ tag: "abs" }, ({ symbol, parameter, body }) => {
      if (parameter === oldName) {
        return {
          tag: "abs" as const,
          symbol,
          parameter: newName,
          body: substitute(body, oldName, {
            tag: "var" as const,
            name: newName,
          }),
        };
      }
      return {
        tag: "abs" as const,
        symbol,
        parameter,
        body: alphaConvert(body, oldName, newName),
      };
    })
    .with({ tag: "app" }, ({ function: fn, argument }) => ({
      tag: "app" as const,
      function: alphaConvert(fn, oldName, newName),
      argument: alphaConvert(argument, oldName, newName),
    }))
    .exhaustive();
}

/**
 * Perform one step of beta-reduction if possible
 * Returns the reduced term or null if no reduction is possible
 */
export function betaReduce(term: Term): Term | null {
  return match(term)
    .with({ tag: "var" }, (): Term | null => null)
    .with({ tag: "abs" }, ({ symbol, parameter, body }): Term | null => {
      const reducedBody = betaReduce(body);
      return reducedBody ?
          { tag: "abs" as const, symbol, parameter, body: reducedBody }
        : null;
    })
    .with(
      { tag: "app", function: { tag: "abs" } },
      ({ function: { parameter, body }, argument }): Term => {
        // Beta-redex: (λx.M) N → M[x := N]
        return substitute(body, parameter, argument);
      },
    )
    .with({ tag: "app" }, ({ function: fn, argument }): Term | null => {
      // Try to reduce function first (call-by-name)
      const reducedFn = betaReduce(fn);
      if (reducedFn) {
        return { tag: "app" as const, function: reducedFn, argument };
      }

      // If function can't be reduced, try argument
      const reducedArg = betaReduce(argument);
      if (reducedArg) {
        return { tag: "app" as const, function: fn, argument: reducedArg };
      }

      return null;
    })
    .exhaustive();
}

/**
 * Perform beta-reduction to normal form (if it exists)
 * Returns the normal form or throws if reduction doesn't terminate
 */
export function normalize(term: Term, maxSteps = 1000): Term {
  let current = term;
  let steps = 0;

  while (steps < maxSteps) {
    const reduced = betaReduce(current);
    if (!reduced) {
      // No more reductions possible - normal form reached
      return current;
    }
    current = reduced;
    steps++;
  }

  throw new Error(`Normalization did not terminate within ${maxSteps} steps`);
}

/**
 * Perform eta-conversion: λx.M x → M (if x is not free in M)
 */
export function etaReduce(term: Term): Term {
  return match(term)
    .with({ tag: "var" }, (): Term => term)
    .with({ tag: "abs" }, ({ symbol, parameter, body }): Term => {
      const reducedBody = etaReduce(body);

      // Check for eta-redex: λx.M x where x is not free in M
      return match(reducedBody)
        .with(
          { tag: "app", argument: { tag: "var" } },
          ({ function: fn, argument }): Term => {
            if (
              argument.name === parameter &&
              !findFreeVariables(fn).includes(parameter)
            ) {
              return fn; // Eta-reduce
            }
            return {
              tag: "abs" as const,
              symbol,
              parameter,
              body: reducedBody,
            };
          },
        )
        .otherwise(
          (): Term => ({
            tag: "abs" as const,
            symbol,
            parameter,
            body: reducedBody,
          }),
        );
    })
    .with(
      { tag: "app" },
      ({ function: fn, argument }): Term => ({
        tag: "app" as const,
        function: etaReduce(fn),
        argument: etaReduce(argument),
      }),
    )
    .exhaustive();
}

/**
 * Helper function to find free variables (imported from pattern.ts logic)
 */
function findFreeVariables(
  term: Term,
  bound: Set<string> = new Set(),
): string[] {
  return match(term)
    .with({ tag: "var" }, ({ name }) => (bound.has(name) ? [] : [name]))
    .with({ tag: "abs" }, ({ parameter, body }) =>
      findFreeVariables(body, new Set([...bound, parameter])),
    )
    .with({ tag: "app" }, ({ function: fn, argument }) => [
      ...findFreeVariables(fn, bound),
      ...findFreeVariables(argument, bound),
    ])
    .exhaustive();
}

/**
 * Helper function to find all variables
 */
function findAllVariables(term: Term): string[] {
  return match(term)
    .with({ tag: "var" }, ({ name }) => [name])
    .with({ tag: "abs" }, ({ parameter, body }) => [
      parameter,
      ...findAllVariables(body),
    ])
    .with({ tag: "app" }, ({ function: fn, argument }) => [
      ...findAllVariables(fn),
      ...findAllVariables(argument),
    ])
    .exhaustive();
}
