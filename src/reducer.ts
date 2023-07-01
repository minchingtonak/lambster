import { TermVisitor, Term, Abstraction, Application, Variable } from "./ast";
import { clone, stringify } from "./utils";
import Logger from "./logger";

export class RecursionDepthError extends Error {
    constructor() {
        super("Maximum recursion depth exceeded while reducing term.");
    }
}

export class Reducer implements TermVisitor<Term> {
    private redex: Term;
    private depth: number;

    private static MAX_RECURSION_DEPTH: number = 1000;

    constructor(private rename_free_vars: boolean, private logger: Logger) {}

    reduceTerm(term: Term): Term {
        this.depth = 0;
        this.redex = clone(term);
        return this.reduce(this.redex);
    }

    private reduce(term: Term): Term {
        if (this.depth++ > Reducer.MAX_RECURSION_DEPTH) throw new RecursionDepthError();
        const result: Term = term.accept(this);
        this.depth--;
        return result;
    }

    visitAbstraction(abstraction: Abstraction): Term {
        abstraction.body = this.reduce(abstraction.body);
        return abstraction;
    }
    visitApplication(application: Application): Term {
        const f_normal: Term = (application.func = this.reduce(application.func)),
            x_normal: Term = (application.argument = this.reduce(application.argument));

        if (!(f_normal instanceof Abstraction)) return application;

        // If f_normal and x_normal have bound variables of the same name, alpha reduce application.argument
        const x_names: Set<string> = x_normal.getAllBoundVarNames(),
            conflicts: Set<string> = new Set<string>(
                [...f_normal.getAllBoundVarNames()].filter(n => x_names.has(n))
            );

        // For each abstraction containing conflicting bound variables, alpha reduce that abstraction
        const conflicting_abs: Set<Abstraction> = new Set<Abstraction>(
            x_normal
                .getAllBoundVars()
                .filter(v => conflicts.has(v.name))
                .map(v => v.getParentAbstraction())
                .filter((v): v is Abstraction => v !== null)
        );
        if (conflicting_abs.size) this.logger.vvlog();
        conflicting_abs.forEach(abs => {
            const new_name: string = this.genNewName();
            this.logger.vvlog(`Alpha reducing '${stringify(abs)}' with name '${new_name}'`);
            abs.alphaReduce(new_name);
        });
        if (conflicting_abs.size !== 0) this.logger.vlog(`α > ${stringify(this.redex)}`);

        // Beta reduce x_normal into f_normal then reduce the result of that beta reduction to normal form
        this.logger.vvlog(`\nBeta reducing '${stringify(x_normal)}' into '${stringify(f_normal)}'`);
        const beta_reduct = f_normal.betaReduce(x_normal, application.parent!);
        if (application.parent) {
            if (application.parent instanceof Abstraction) {
                application.parent.body = beta_reduct;
            } else if (application.parent instanceof Application) {
                if (application.parent.func === application) {
                    application.parent.func = beta_reduct;
                } else if (application.parent.argument === application) {
                    application.parent.argument = beta_reduct;
                }
            }
        } else {
            this.redex = beta_reduct;
        }
        this.logger.vlog(`β > ${stringify(this.redex)}`);
        return this.reduce(beta_reduct);
    }
    visitVariable(variable: Variable): Term {
        // Rename free variable to unambiguous name if initialized with rename_free_vars = true
        if (this.rename_free_vars && !variable.wasFreeRenamed() && variable.isFreeVar()) {
            const new_name: string = this.genNewFreeName();
            this.logger.vvlog(`\nRenaming free variable '${variable.name}' to '${new_name}'`);
            this.logger.vlog(`ε > '${variable.name}' → '${new_name}'`);
            variable.renameFree(new_name);
        }
        return variable;
    }

    private current_name_prefix: number = 0;
    private genNewName(): string {
        return `X${this.current_name_prefix++}`;
    }

    private current_free_name_prefix: number = 0;
    private genNewFreeName(): string {
        return `X\`${this.current_free_name_prefix++}`;
    }
}
