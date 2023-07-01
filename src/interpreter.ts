import { Stmt, Term, StmtVisitor, TermStmt, BindingStmt, CommandStmt, CommandType } from "./ast";
import { Reducer, RecursionDepthError } from "./reducer";
import { BindingResolver } from "./bindingresolver";
import { stringify } from "./utils";
import { structureHash } from "./hash";
import { InterpreterOptions } from "./types";
import { Lexer } from "./lexer";
import { Parser } from "./parser";
import Logger, { Verbosity } from "./logger";

export class Interpreter implements StmtVisitor<void> {
    private structure_hashes: { [key: number]: Set<string> } = {};

    private addHash(term: Term, name: string) {
        const s_hash: number = structureHash(term);
        if (!(s_hash in this.structure_hashes)) this.structure_hashes[s_hash] = new Set<string>();
        this.structure_hashes[s_hash].add(name);
    }
    private deleteHash(term: Term, name: string) {
        const s_hash: number = structureHash(term),
            s_set: Set<string> = this.structure_hashes[s_hash];

        s_set.delete(name);
    }

    private start_index: number;
    private bindings: { [key: string]: Term } =
        // Process multikeys
        (dict => {
            const parser: Parser = new Parser(),
                parsed_terms: { [key: string]: Term } = {};
            Object.keys(dict).forEach(key => {
                parser.setTokens(new Lexer(dict[key]).lexTokens());
                const term = parser.parseTerm(),
                    subkeys: string[] = key.split("|");
                subkeys.forEach(subkey => {
                    this.addHash(term!, subkey);
                    parsed_terms[subkey] = term!;
                });
            });
            this.start_index = parser.currentIndex();
            return parsed_terms;
        })({
            // Logic
            true: "(λt. (λf. t))",
            false: "(λt. (λf. f))",
            and: "(λa. (λb. ((a b) a)))",
            or: "(λa. (λb. ((a a) b)))",
            not: "(λb. ((b false) true))",
            if: "(λp. (λa. (λb. ((p a) b))))",

            // Lists
            "pair|cons": "(λx. (λy. (λf. ((f x) y))))",
            "first|car": "(λp. (p true))",
            "second|cdr": "(λp. (p false))",
            "nil|empty": "(λx. true)",
            "null|isempty": "(λp. (p (λx. (λy. false))))",

            // Trees
            tree: "(λd. (λl. (λr. ((pair d) ((pair l) r)))))",
            datum: "(λt. (first t))",
            left: "(λt. (first (second t)))",
            right: "(λt. (second (second t)))",

            // Arithmetic
            incr: "(λn. (λf. (λy. (f ((n f) y)))))",
            plus: "(λm. (λn. ((m incr) n)))",
            times: "(λm. (λn. ((m (plus n)) zero)))",
            iszero: "(λn. ((n (λy. false)) true))",
            zero: "(λf. (λx. x))",
            one: "(λf. (λx. (f x)))",
            two: "(λf. (λx. (f (f x))))",
            three: "(λf. (λx. (f (f (f x)))))",
            four: "(λf. (λx. (f (f (f (f x))))))",
            five: "(λf. (λx. (f (f (f (f (f x)))))))",
            six: "(λf. (λx. (f (f (f (f (f (f x))))))))",
            seven: "(λf. (λx. (f (f (f (f (f (f (f x)))))))))",
            eight: "(λf. (λx. (f (f (f (f (f (f (f (f x))))))))))",
            nine: "(λf. (λx. (f (f (f (f (f (f (f (f (f x)))))))))))",
        });

    private rename_free_vars: boolean;
    private logger: Logger;
    private resolver: BindingResolver;
    private show_equivalence: boolean;

    constructor(options?: InterpreterOptions) {
        this.setOptions(options);
    }

    setOptions(options?: InterpreterOptions) {
        this.rename_free_vars = options?.rename_free_vars ?? this.rename_free_vars ?? false;

        this.show_equivalence = options?.show_equivalent ?? this.show_equivalence ?? true;

        if (!this.logger) {
            this.logger = new Logger();
            this.resolver = new BindingResolver(this.bindings, this.logger);
        }

        this.logger.setOptions({
            verbosity: options?.verbosity,
            transports: options?.transports,
        });
    }

    evaluate(source: string) {
        this.logger.hasError = false;
        this.logger.setOptions({ source: source });
        const stmts: Stmt[] = new Parser(
            new Lexer(source, this.logger).lexTokens(),
            this.logger,
            this.start_index
        ).parse();

        if (this.logger.hasError) return;

        stmts.forEach(stmt => {
            stmt.accept(this);
        });
    }

    visitTermStmt(term_stmt: TermStmt): void {
        this.eval(term_stmt.term);
    }
    visitBindingStmt(binding: BindingStmt): void {
        const reduct = this.eval(binding.term, binding.name);
        if (reduct) {
            this.bindings[binding.name] = reduct;
            this.addHash(reduct, binding.name);
        }
    }
    visitCommandStmt(command: CommandStmt): void {
        switch (command.type) {
            case CommandType.ENV:
                this.printBindings();
                break;
            case CommandType.UNBIND:
                this.deleteBinding(command.argument!);
                break;
            case CommandType.HELP:
                this.printHelp();
                break;
        }
    }

    hadError(): boolean {
        return this.logger.hasError;
    }

    private eval(term: Term, binding_name?: string): Term | undefined {
        this.logger.vlog(`λ > ${stringify(term)}`);
        try {
            const reduct: Term = new Reducer(this.rename_free_vars, this.logger).reduceTerm(
                this.resolver.resolveTerm(term)
            );
            this.logger.vvlog();
            if (binding_name) this.logger.log(`>>> ${binding_name} = ${stringify(reduct)}`);
            else this.logger.log(`>>> ${stringify(reduct)}`);
            const s_hash: number = structureHash(reduct);
            if (this.show_equivalence && s_hash in this.structure_hashes)
                this.logger.log(`    ↳ equivalent to: ${this.structure_hashes[s_hash].join(", ")}`);
            this.logger.vlog();
            return reduct;
        } catch (e) {
            this.logger.log(`Error: ${(e as RecursionDepthError).message}`);
        }
    }

    private printBindings() {
        Object.entries(this.bindings).forEach(binding => {
            this.logger.log(`${binding[0]}:\t${stringify(binding[1])}`);
        });
    }

    private deleteBinding(binding: string) {
        this.deleteHash(this.bindings[binding], binding);
        delete this.bindings[binding];
    }

    private printHelp() {
        [
            "~= Commands =~",
            "help:\t\t print this help message",
            "env:\t\t prints all variables currently bound in the environment (try this to see the built-in bindings)",
            "unbind <name>:\t removes the binding with <name> from the environment",
            "\n",
            "~= Output =~",
            "λ>\t prompt",
            "λ >\t unambiguous, parsed representation of the given term",
            "α >\t indicates that an alpha reduction (renaming) was performed",
            "β >\t indicates that a beta reduction (substitution) was performed",
            "ε >\t indicates that a free variable has been renamed to an unambiguous name",
            "δ >\t indicates that a variable has been expanded to its binding in the environment",
            "Δ >\t shows a term after all its bound variables have been resolved to their bindings",
            "",
            "Example:",
            "λ> b = Lc.c",
            "λ > (λc. c)",
            ">>> b = (λc. c)",
            "",
            "λ> z = b",
            "λ > b",
            "    δ > expanded 'b' into '(λc. c)'",
            "Δ > (λc. c)",
            ">>> z = (λc. c)",
            "",
            "    ↳ equivalent to: b",
            "λ> (Lx y. x y z)(Ly. (Lx.x y) a y) b",
            "λ > (((λx. (λy. ((x y) z))) (λy. (((λx. (x y)) a) y))) b)",
            "    δ > expanded 'z' into '(λc. c)'",
            "    δ > expanded 'b' into '(λc. c)'",
            "Δ > (((λx. (λy. ((x y) (λc. c)))) (λy. (((λx. (x y)) a) y))) (λc. c))",
            "β > (((λx. (λy. ((x y) (λc. c)))) (λy. ((a y) y))) (λc. c))",
            "α > (((λx. (λy. ((x y) (λc. c)))) (λX0. ((a X0) X0))) (λc. c))",
            "β > ((λy. (((λX0. ((a X0) X0)) y) (λc. c))) (λc. c))",
            "β > ((λy. (((a y) y) (λc. c))) (λc. c))",
            "α > ((λy. (((a y) y) (λc. c))) (λX1. X1))",
            "β > (((a (λX1. X1)) (λX1. X1)) (λc. c))",
            ">>> (((a (λX1. X1)) (λX1. X1)) (λc. c))",
            "\n",
            "~= Syntax =~",
            "Lambda calculus terms follow this grammar:",
            "\tterm\t\t → abstraction | application | variable",
            "\tabstraction\t → (lambda | L | \\ | λ) IDENTIFIER+ . term",
            "\tapplication\t → term term",
            "\tvariable\t → IDENTIFIER",
            "\tIDENTIFIER\t → [a-z0-9]+",
            "",
            "Lambster also supports simple bindings with this syntax:",
            "\tbinding\t\t → IDENTIFIER = term",
            "",
            "Application is left-associative.",
            "Abstraction extends as far to the right as possible.",
            "",
            "Examples:",
            "\t(Lx. x x) y",
            "\t(Lx y. y x) lambda f. f z",
            "\tduplicate = \\a.a a",
            "\thello world",
        ].forEach(line => {
            this.logger.log(line);
        });
    }
}
