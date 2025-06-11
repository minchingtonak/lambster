/**
 * Main LAMBSTER parser class with tagged union support
 */

import * as nearley from "nearley";
import grammar from "../nearley/lambster_parser.js";
import { ASTTransformer } from "./transform/transformer.js";
import type { Statement, Term, Command, ParserOptions } from "./types/index.js";
import { ParseError } from "./types/parser.js";

/**
 * LAMBSTER parser with both raw and tagged union output support
 */
export class LambsterParser {
  private nearleyParser: nearley.Parser;
  private transformer: ASTTransformer;
  private options: ParserOptions;

  constructor(options: ParserOptions = {}) {
    this.nearleyParser = new nearley.Parser(
      nearley.Grammar.fromCompiled(grammar),
    );
    this.transformer = new ASTTransformer();
    this.options = { validate: false, optimize: false, ...options };
  }

  /**
   * Parse input and return raw nearley output (for backward compatibility)
   */
  parseRaw(input: string): unknown {
    try {
      // Reset parser state
      this.nearleyParser = new nearley.Parser(
        nearley.Grammar.fromCompiled(grammar),
      );

      this.nearleyParser.feed(input);

      if (this.nearleyParser.results.length === 0) {
        throw new ParseError("No parse results", input);
      }

      if (this.nearleyParser.results.length > 1) {
        console.warn(
          `Ambiguous parse: ${this.nearleyParser.results.length} results`,
        );
      }

      return this.nearleyParser.results[0];
    } catch (error) {
      if (error instanceof ParseError) {
        throw error;
      }
      throw new ParseError(
        `Parse error: ${error instanceof Error ? error.message : String(error)}`,
        input,
      );
    }
  }

  /**
   * Parse input and return tagged union AST
   */
  parse(input: string): Statement {
    const raw = this.parseRaw(input);

    // Apply pre-transform hook if provided
    const processedRaw = this.options.hooks?.beforeTransform?.(raw) ?? raw;

    // Transform to tagged union
    let statement = this.transformer.transformStatement(processedRaw);

    // Apply post-transform hook if provided
    statement = this.options.hooks?.afterTransform?.(statement) ?? statement;

    // Validate if requested
    if (this.options.validate) {
      this.validateStatement(statement);
    }

    return statement;
  }

  /**
   * Parse input expecting a term and return the term directly
   */
  parseTerm(input: string): Term {
    const statement = this.parse(input);

    if (statement.tag === "Term") {
      return statement.term;
    }

    if (statement.tag === "Binding") {
      return statement.term;
    }

    throw new ParseError("Input is not a term", input);
  }

  /**
   * Parse input expecting a command and return the command directly
   */
  parseCommand(input: string): Command {
    const statement = this.parse(input);

    if (statement.tag === "Command") {
      return statement.command;
    }

    throw new ParseError("Input is not a command", input);
  }

  /**
   * Parse multiple statements from input (separated by newlines or semicolons)
   */
  parseMultiple(input: string, separator = "\n"): Statement[] {
    const lines = input
      .split(separator)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    return lines.map((line) => this.parse(line));
  }

  /**
   * Check if input can be parsed without throwing
   */
  canParse(input: string): boolean {
    try {
      this.parse(input);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get parser statistics for the last parse
   */
  getParseStats(): { ambiguous: boolean; resultCount: number } {
    return {
      ambiguous: this.nearleyParser.results.length > 1,
      resultCount: this.nearleyParser.results.length,
    };
  }

  /**
   * Reset parser state
   */
  reset(): void {
    this.nearleyParser = new nearley.Parser(
      nearley.Grammar.fromCompiled(grammar),
    );
  }

  /**
   * Basic validation of parsed statements
   */
  private validateStatement(statement: Statement): void {
    // Basic structural validation
    if (!statement || typeof statement !== "object" || !("tag" in statement)) {
      throw new ParseError(
        "Invalid statement structure",
        JSON.stringify(statement),
      );
    }

    switch (statement.tag) {
      case "Binding":
        if (!statement.identifier || typeof statement.identifier !== "string") {
          throw new ParseError(
            "Invalid binding identifier",
            JSON.stringify(statement),
          );
        }
        this.validateTerm(statement.term);
        break;

      case "Command":
        this.validateCommand(statement.command);
        break;

      case "Term":
        this.validateTerm(statement.term);
        break;

      default:
        throw new ParseError(
          `Unknown statement type: ${(statement as { tag: string }).tag}`,
          JSON.stringify(statement),
        );
    }
  }

  /**
   * Basic validation of terms
   */
  private validateTerm(term: Term): void {
    if (!term || typeof term !== "object" || !("tag" in term)) {
      throw new ParseError("Invalid term structure", JSON.stringify(term));
    }

    switch (term.tag) {
      case "Variable":
        if (!term.name || typeof term.name !== "string") {
          throw new ParseError("Invalid variable name", JSON.stringify(term));
        }
        break;

      case "Abstraction":
        if (!term.parameter || typeof term.parameter !== "string") {
          throw new ParseError(
            "Invalid abstraction parameter",
            JSON.stringify(term),
          );
        }
        if (!term.symbol || typeof term.symbol !== "string") {
          throw new ParseError("Invalid lambda symbol", JSON.stringify(term));
        }
        this.validateTerm(term.body);
        break;

      case "Application":
        this.validateTerm(term.function);
        this.validateTerm(term.argument);
        break;

      default:
        throw new ParseError(
          `Unknown term type: ${(term as { tag: string }).tag}`,
          JSON.stringify(term),
        );
    }
  }

  /**
   * Basic validation of commands
   */
  private validateCommand(command: Command): void {
    if (!command || typeof command !== "object" || !("tag" in command)) {
      throw new ParseError(
        "Invalid command structure",
        JSON.stringify(command),
      );
    }

    switch (command.tag) {
      case "Help":
      case "Environment":
        // No additional validation needed
        break;

      case "Unbind":
        if (!command.identifier || typeof command.identifier !== "string") {
          throw new ParseError(
            "Invalid unbind identifier",
            JSON.stringify(command),
          );
        }
        break;

      default:
        throw new ParseError(
          `Unknown command type: ${(command as { tag: string }).tag}`,
          JSON.stringify(command),
        );
    }
  }
}

/**
 * Convenience function to create a parser and parse input in one call
 */
export function parse(input: string, options?: ParserOptions): Statement {
  const parser = new LambsterParser(options);
  return parser.parse(input);
}

/**
 * Convenience function to parse a term
 */
export function parseTerm(input: string, options?: ParserOptions): Term {
  const parser = new LambsterParser(options);
  return parser.parseTerm(input);
}

/**
 * Convenience function to parse a command
 */
export function parseCommand(input: string, options?: ParserOptions): Command {
  const parser = new LambsterParser(options);
  return parser.parseCommand(input);
}
