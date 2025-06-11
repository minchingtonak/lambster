/**
 * Type exports for LAMBSTER
 */

export type { LambdaSymbol, Term, Command, Statement } from "./ast.js";

export {
  isVariable,
  isAbstraction,
  isApplication,
  isHelp,
  isEnvironment,
  isUnbind,
  isBinding,
  isCommandStatement,
  isTermStatement,
} from "./ast.js";

export type {
  RawBinding,
  RawCommand,
  RawAbstraction,
  RawApplication,
  RawParserOutput,
  ParserOptions,
} from "./parser.js";

export { ParseError, TransformError } from "./parser.js";
