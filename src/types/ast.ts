/**
 * Core AST types for lambster using tagged unions
 */

/**
 * Lambda symbol variants supported by the parser
 */
export type LambdaSymbol = "λ" | "\\" | "L" | "lambda" | "LAMBDA" | "Lambda";

/**
 * Term represents lambda calculus expressions
 */
export type Term =
  | { tag: "var"; name: string }
  | { tag: "abs"; symbol: LambdaSymbol; parameter: string; body: Term }
  | { tag: "app"; function: Term; argument: Term };

/**
 * Command represents REPL commands
 */
export type Command =
  | { tag: "help" }
  | { tag: "env" }
  | { tag: "unbind"; identifier: string };

/**
 * Statement represents top-level parser constructs
 */
export type Statement =
  | { tag: "bind"; identifier: string; term: Term }
  | { tag: "cmd"; command: Command }
  | { tag: "term"; term: Term };

/**
 * Type guards for Terms
 */
export const isVariable = (term: Term): term is { tag: "var"; name: string } =>
  term.tag === "var";

export const isAbstraction = (
  term: Term,
): term is {
  tag: "abs";
  symbol: LambdaSymbol;
  parameter: string;
  body: Term;
} => term.tag === "abs";

export const isApplication = (
  term: Term,
): term is { tag: "app"; function: Term; argument: Term } => term.tag === "app";

/**
 * Type guards for Commands
 */
export const isHelp = (command: Command): command is { tag: "help" } =>
  command.tag === "help";

export const isEnvironment = (command: Command): command is { tag: "env" } =>
  command.tag === "env";

export const isUnbind = (
  command: Command,
): command is { tag: "unbind"; identifier: string } => command.tag === "unbind";

/**
 * Type guards for Statements
 */
export const isBinding = (
  statement: Statement,
): statement is { tag: "bind"; identifier: string; term: Term } =>
  statement.tag === "bind";

export const isCommandStatement = (
  statement: Statement,
): statement is { tag: "cmd"; command: Command } => statement.tag === "cmd";

export const isTermStatement = (
  statement: Statement,
): statement is { tag: "term"; term: Term } => statement.tag === "term";
