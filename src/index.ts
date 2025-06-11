/**
 * LAMBSTER - Lambda Calculus Parser with Tagged Union AST
 *
 * Main entry point for the library
 */

// Core parser
export { LambsterParser, parse, parseTerm, parseCommand } from "./parser.js";

// AST transformer
export { ASTTransformer } from "./transform/transformer.js";

// Types
export type {
  LambdaSymbol,
  Term,
  Command,
  Statement,
  RawBinding,
  RawCommand,
  RawAbstraction,
  RawApplication,
  RawParserOutput,
  ParserOptions,
} from "./types/index.js";

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
  ParseError,
  TransformError,
} from "./types/index.js";

// Pattern matching utilities
export {
  evaluateTerm,
  prettyPrintTerm,
  analyzeComplexity,
  findFreeVariables,
  findBoundVariables,
  findAllVariables,
  isClosedTerm,
  isNormalForm,
  executeCommand,
  describeStatement,
  structurallyEqual,
} from "./utils/pattern.js";

// AST manipulation utilities
export {
  generateFreshVariable,
  substitute,
  alphaConvert,
  betaReduce,
  normalize,
  etaReduce,
} from "./utils/manipulation.js";

// AST traversal utilities
export {
  mapTerm,
  foldTerm,
  visitTerm,
  findTerm,
  findAllTerms,
  countNodes,
  calculateDepth,
  transformTerm,
  anyTerm,
  allTerms,
  getChildren,
  getParentChildPairs,
  traverseStatement,
  transformStatement,
} from "./utils/traversal.js";

// Re-export ts-pattern for convenience
export { match } from "ts-pattern";
