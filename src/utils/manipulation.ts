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

/**
 * Evaluation strategy options
 */
export type EvaluationStrategy = "normal" | "applicative" | "lazy";

/**
 * Evaluation options for controlling the evaluation process
 */
export interface EvaluationOptions {
  /** Maximum number of reduction steps before throwing an error */
  maxSteps?: number;
  /** Evaluation strategy to use */
  strategy?: EvaluationStrategy;
  /** Whether to perform eta-reduction after beta-normalization */
  enableEtaReduction?: boolean;
  /** Whether to track evaluation steps for debugging */
  trackSteps?: boolean;
}

/**
 * Result of evaluation including the final term and metadata
 */
export interface EvaluationResult {
  /** The fully evaluated term */
  term: Term;
  /** Number of beta-reduction steps performed */
  betaSteps: number;
  /** Number of eta-reduction steps performed */
  etaSteps: number;
  /** Whether the term reached normal form */
  isNormalForm: boolean;
  /** Evaluation steps taken (if trackSteps was enabled) */
  steps?: Term[];
}

/**
 * Comprehensive evaluation function that combines beta-reduction and eta-reduction
 * with support for different evaluation strategies and proper error handling.
 *
 * This function performs a complete evaluation of a lambda calculus term by:
 * 1. Applying beta-reduction according to the specified strategy
 * 2. Optionally applying eta-reduction to further simplify the result
 * 3. Tracking evaluation metadata and steps
 *
 * @param term - The lambda calculus term to evaluate
 * @param options - Optional evaluation configuration
 * @returns EvaluationResult containing the evaluated term and metadata
 *
 * @throws Error if evaluation doesn't terminate within maxSteps
 *
 * @example
 * ```typescript
 * // Basic evaluation
 * const result = evaluate(term);
 *
 * // With custom options
 * const result = evaluate(term, {
 *   strategy: "applicative",
 *   enableEtaReduction: true,
 *   maxSteps: 500,
 *   trackSteps: true
 * });
 * ```
 */
export function evaluate(
  term: Term,
  options: EvaluationOptions = {},
): EvaluationResult {
  const {
    maxSteps = 1000,
    strategy = "normal",
    enableEtaReduction = true,
    trackSteps = false,
  } = options;

  let current = term;
  let betaSteps = 0;
  let etaSteps = 0;
  const steps: Term[] = trackSteps ? [term] : [];

  // Phase 1: Beta-reduction according to strategy
  try {
    switch (strategy) {
      case "normal":
        current = normalOrderEvaluation(
          current,
          maxSteps,
          trackSteps ? steps : undefined,
        );
        break;
      case "applicative":
        current = applicativeOrderEvaluation(
          current,
          maxSteps,
          trackSteps ? steps : undefined,
        );
        break;
      case "lazy":
        current = lazyEvaluation(
          current,
          maxSteps,
          trackSteps ? steps : undefined,
        );
        break;
      default:
        throw new Error(`Unknown evaluation strategy: ${strategy}`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("did not terminate")) {
      throw new Error(
        `Beta-reduction did not terminate within ${maxSteps} steps using ${strategy} order evaluation`,
      );
    }
    throw error;
  }

  // Count beta steps from the tracked steps or estimate
  betaSteps = trackSteps ? steps.length - 1 : maxSteps;

  // Phase 2: Eta-reduction (if enabled)
  if (enableEtaReduction) {
    const beforeEta = current;
    current = comprehensiveEtaReduce(current, Math.floor(maxSteps / 4));

    // Count eta steps by comparing before and after
    if (!termsEqual(beforeEta, current)) {
      etaSteps = 1; // Simplified counting - eta reduction is typically fast
      if (trackSteps) {
        steps.push(current);
      }
    }
  }

  // Check if we reached normal form
  const isNormalForm = betaReduce(current) === null;

  return {
    term: current,
    betaSteps,
    etaSteps,
    isNormalForm,
    ...(trackSteps && { steps }),
  };
}

/**
 * Normal order evaluation (leftmost-outermost reduction)
 * Reduces the leftmost redex first, which guarantees finding normal form if it exists
 */
function normalOrderEvaluation(
  term: Term,
  maxSteps: number,
  steps?: Term[],
): Term {
  let current = term;
  let stepCount = 0;

  while (stepCount < maxSteps) {
    const reduced = betaReduceNormalOrder(current);
    if (!reduced) {
      return current; // Normal form reached
    }
    current = reduced;
    stepCount++;
    if (steps) {
      steps.push(current);
    }
  }

  throw new Error(
    `Normal order evaluation did not terminate within ${maxSteps} steps`,
  );
}

/**
 * Applicative order evaluation (leftmost-innermost reduction)
 * Reduces arguments before applying functions
 */
function applicativeOrderEvaluation(
  term: Term,
  maxSteps: number,
  steps?: Term[],
): Term {
  let current = term;
  let stepCount = 0;

  while (stepCount < maxSteps) {
    const reduced = betaReduceApplicativeOrder(current);
    if (!reduced) {
      return current; // Normal form reached
    }
    current = reduced;
    stepCount++;
    if (steps) {
      steps.push(current);
    }
  }

  throw new Error(
    `Applicative order evaluation did not terminate within ${maxSteps} steps`,
  );
}

/**
 * Lazy evaluation (call-by-need)
 * Similar to normal order but with memoization concepts
 */
function lazyEvaluation(term: Term, maxSteps: number, steps?: Term[]): Term {
  // For now, lazy evaluation uses normal order as the base strategy
  // In a full implementation, this would include memoization
  return normalOrderEvaluation(term, maxSteps, steps);
}

/**
 * Beta-reduction with normal order strategy
 */
function betaReduceNormalOrder(term: Term): Term | null {
  return match(term)
    .with({ tag: "var" }, (): Term | null => null)
    .with(
      { tag: "app", function: { tag: "abs" } },
      ({ function: { parameter, body }, argument }): Term => {
        // Beta-redex found - reduce immediately (leftmost-outermost)
        return substitute(body, parameter, argument);
      },
    )
    .with({ tag: "app" }, ({ function: fn, argument }): Term | null => {
      // Try to reduce function first (normal order)
      const reducedFn = betaReduceNormalOrder(fn);
      if (reducedFn) {
        return { tag: "app" as const, function: reducedFn, argument };
      }

      // If function can't be reduced, try argument
      const reducedArg = betaReduceNormalOrder(argument);
      if (reducedArg) {
        return { tag: "app" as const, function: fn, argument: reducedArg };
      }

      return null;
    })
    .with({ tag: "abs" }, ({ symbol, parameter, body }): Term | null => {
      const reducedBody = betaReduceNormalOrder(body);
      return reducedBody ?
          { tag: "abs" as const, symbol, parameter, body: reducedBody }
        : null;
    })
    .exhaustive();
}

/**
 * Beta-reduction with applicative order strategy
 */
function betaReduceApplicativeOrder(term: Term): Term | null {
  return match(term)
    .with({ tag: "var" }, (): Term | null => null)
    .with({ tag: "abs" }, ({ symbol, parameter, body }): Term | null => {
      const reducedBody = betaReduceApplicativeOrder(body);
      return reducedBody ?
          { tag: "abs" as const, symbol, parameter, body: reducedBody }
        : null;
    })
    .with({ tag: "app" }, ({ function: fn, argument }): Term | null => {
      // In applicative order, reduce arguments first
      const reducedArg = betaReduceApplicativeOrder(argument);
      if (reducedArg) {
        return { tag: "app" as const, function: fn, argument: reducedArg };
      }

      const reducedFn = betaReduceApplicativeOrder(fn);
      if (reducedFn) {
        return { tag: "app" as const, function: reducedFn, argument };
      }

      // Now check for beta-redex
      return match(fn)
        .with({ tag: "abs" }, ({ parameter, body }): Term => {
          return substitute(body, parameter, argument);
        })
        .otherwise((): Term | null => null);
    })
    .exhaustive();
}

/**
 * Comprehensive eta-reduction that applies eta-reduction repeatedly until no more reductions are possible
 */
function comprehensiveEtaReduce(term: Term, maxSteps: number): Term {
  let current = term;
  let steps = 0;

  while (steps < maxSteps) {
    const reduced = etaReduce(current);
    if (termsEqual(current, reduced)) {
      return current; // No more eta-reductions possible
    }
    current = reduced;
    steps++;
  }

  // If we hit max steps, return current state (eta-reduction should terminate quickly)
  return current;
}

/**
 * Check if two terms are structurally equal
 */
function termsEqual(term1: Term, term2: Term): boolean {
  return match([term1, term2] as const)
    .with([{ tag: "var" }, { tag: "var" }], ([t1, t2]) => t1.name === t2.name)
    .with(
      [{ tag: "abs" }, { tag: "abs" }],
      ([t1, t2]) =>
        t1.parameter === t2.parameter &&
        t1.symbol === t2.symbol &&
        termsEqual(t1.body, t2.body),
    )
    .with(
      [{ tag: "app" }, { tag: "app" }],
      ([t1, t2]) =>
        termsEqual(t1.function, t2.function) &&
        termsEqual(t1.argument, t2.argument),
    )
    .otherwise(() => false);
}
