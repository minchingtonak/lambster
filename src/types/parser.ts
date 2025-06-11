/**
 * Parser-related types for handling raw nearley output
 */

import type { Statement } from "./ast.js";

/**
 * Raw parser output types (what nearley currently produces)
 */
export interface RawBinding {
  identifier: string;
  term: unknown;
}

export interface RawCommand {
  command: string;
  identifier?: string;
}

export interface RawAbstraction {
  lambda_symbol: string;
  identifier: string;
  term: unknown;
}

export interface RawApplication {
  function: unknown;
  argument: unknown;
}

/**
 * Union type for all possible raw parser outputs
 */
export type RawParserOutput =
  | RawBinding
  | RawCommand
  | RawAbstraction
  | RawApplication
  | string
  | unknown[];

/**
 * Parser configuration options
 */
export interface ParserOptions {
  /** Whether to validate AST after transformation */
  validate?: boolean;
  /** Whether to optimize the AST during transformation */
  optimize?: boolean;
  /** Custom transformation hooks */
  hooks?: {
    beforeTransform?: (_raw: unknown) => unknown;
    afterTransform?: (_ast: Statement) => Statement;
  };
}

/**
 * Parser error types
 */
export class ParseError extends Error {
  constructor(
    message: string,
    public readonly _input: string,
    public readonly _position?: number,
  ) {
    super(message);
    this.name = "ParseError";
  }
}

export class TransformError extends Error {
  constructor(
    message: string,
    public readonly _rawOutput: unknown,
  ) {
    super(message);
    this.name = "TransformError";
  }
}
