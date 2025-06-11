/**
 * Main AST transformer for converting raw parser output to tagged unions
 */

import type { Statement, Term, Command, LambdaSymbol } from "../types/ast";
import { TransformError } from "../types/parser";

export class ASTTransformer {
  /**
   * Transform raw parser output to a Statement
   * Raw parser output structure: [statement] where statement can be:
   * - { identifier: string, term: [...] } for bindings
   * - { command: string, identifier?: string } for commands
   * - [...] for terms (nested arrays)
   */
  transformStatement(raw: unknown): Statement {
    if (!Array.isArray(raw) || raw.length === 0) {
      throw new TransformError("Expected array from parser", raw);
    }

    const statement = raw[0];

    if (!statement || typeof statement !== "object") {
      throw new TransformError("Invalid statement structure", raw);
    }

    const obj = statement as Record<string, unknown>;

    // Handle binding statements (identifier = term)
    if (
      "identifier" in obj &&
      "term" in obj &&
      typeof obj.identifier === "string"
    ) {
      return {
        tag: "bind",
        identifier: obj.identifier,
        term: this.transformTerm(obj.term),
      };
    }

    // Handle command statements
    if ("command" in obj && typeof obj.command === "string") {
      return { tag: "cmd", command: this.transformCommand(obj) };
    }

    // Handle term statements (nested arrays)
    return { tag: "term", term: this.transformTerm(statement) };
  }

  /**
   * Transform raw parser output to a Term
   * Term structure can be:
   * - string for variables
   * - [string] for variables in arrays
   * - { lambda_symbol, identifier, term } for abstractions
   * - { function, argument } for applications
   * - nested arrays for complex expressions
   */
  transformTerm(raw: unknown): Term {
    // Handle arrays (current parser output format)
    if (Array.isArray(raw)) {
      if (raw.length === 0) {
        throw new TransformError("Empty array in term", raw);
      }
      return this.transformTerm(raw[0]);
    }

    // Handle string identifiers (variables)
    if (typeof raw === "string") {
      return { tag: "var", name: raw };
    }

    if (!raw || typeof raw !== "object") {
      throw new TransformError("Invalid term input", raw);
    }

    const obj = raw as Record<string, unknown>;

    // Handle lambda abstractions
    if ("lambda_symbol" in obj && "identifier" in obj && "term" in obj) {
      if (
        typeof obj.lambda_symbol !== "string" ||
        typeof obj.identifier !== "string"
      ) {
        throw new TransformError("Invalid abstraction format", raw);
      }

      if (!this.isValidLambdaSymbol(obj.lambda_symbol)) {
        throw new TransformError(
          `Invalid lambda symbol: ${obj.lambda_symbol}`,
          raw,
        );
      }

      return {
        tag: "abs",
        symbol: obj.lambda_symbol as LambdaSymbol,
        parameter: obj.identifier,
        body: this.transformTerm(obj.term),
      };
    }

    // Handle applications
    if ("function" in obj && "argument" in obj) {
      return {
        tag: "app",
        function: this.transformTerm(obj.function),
        argument: this.transformTerm(obj.argument),
      };
    }

    throw new TransformError(
      `Unknown term format: ${JSON.stringify(raw)}`,
      raw,
    );
  }

  /**
   * Transform raw parser output to a Command
   */
  transformCommand(raw: unknown): Command {
    if (!raw || typeof raw !== "object") {
      throw new TransformError("Invalid command input", raw);
    }

    const obj = raw as Record<string, unknown>;

    if (!("command" in obj) || typeof obj.command !== "string") {
      throw new TransformError("Missing or invalid command field", raw);
    }

    switch (obj.command) {
      case "help":
        return { tag: "help" };

      case "env":
        return { tag: "env" };

      case "unbind":
        if (!("identifier" in obj) || typeof obj.identifier !== "string") {
          throw new TransformError("Unbind command missing identifier", raw);
        }
        return { tag: "unbind", identifier: obj.identifier };

      default:
        throw new TransformError(`Unknown command: ${obj.command}`, raw);
    }
  }

  /**
   * Validate that a lambda symbol is supported
   */
  private isValidLambdaSymbol(symbol: string): symbol is LambdaSymbol {
    return ["λ", "\\", "L", "lambda", "LAMBDA", "Lambda"].includes(symbol);
  }
}
