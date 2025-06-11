/**
 * Core AST types for LAMBSTER using tagged unions
 */

/**
 * Lambda symbol variants supported by the parser
 */
export type LambdaSymbol = "λ" | "\\" | "L" | "lambda" | "LAMBDA" | "Lambda";

/**
 * Term represents lambda calculus expressions
 */
export type Term =
  | { tag: "Variable"; name: string }
  | { tag: "Abstraction"; symbol: LambdaSymbol; parameter: string; body: Term }
  | { tag: "Application"; function: Term; argument: Term };

/**
 * Command represents REPL commands
 */
export type Command =
  | { tag: "Help" }
  | { tag: "Environment" }
  | { tag: "Unbind"; identifier: string };

/**
 * Statement represents top-level parser constructs
 */
export type Statement =
  | { tag: "Binding"; identifier: string; term: Term }
  | { tag: "Command"; command: Command }
  | { tag: "Term"; term: Term };

/**
 * Type guards for Terms
 */
export const isVariable = (
  term: Term,
): term is { tag: "Variable"; name: string } => term.tag === "Variable";

export const isAbstraction = (
  term: Term,
): term is {
  tag: "Abstraction";
  symbol: LambdaSymbol;
  parameter: string;
  body: Term;
} => term.tag === "Abstraction";

export const isApplication = (
  term: Term,
): term is { tag: "Application"; function: Term; argument: Term } =>
  term.tag === "Application";

/**
 * Type guards for Commands
 */
export const isHelp = (command: Command): command is { tag: "Help" } =>
  command.tag === "Help";

export const isEnvironment = (
  command: Command,
): command is { tag: "Environment" } => command.tag === "Environment";

export const isUnbind = (
  command: Command,
): command is { tag: "Unbind"; identifier: string } => command.tag === "Unbind";

/**
 * Type guards for Statements
 */
export const isBinding = (
  statement: Statement,
): statement is { tag: "Binding"; identifier: string; term: Term } =>
  statement.tag === "Binding";

export const isCommandStatement = (
  statement: Statement,
): statement is { tag: "Command"; command: Command } =>
  statement.tag === "Command";

export const isTermStatement = (
  statement: Statement,
): statement is { tag: "Term"; term: Term } => statement.tag === "Term";
