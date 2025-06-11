declare module "nearley" {
  export class Parser {
    constructor(_grammar: Grammar);
    feed(_input: string): void;
    results: unknown[];
  }

  export class Grammar {
    static fromCompiled(_compiled: unknown): Grammar;
  }
}
