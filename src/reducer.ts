import { TermVisitor, Term, Abstraction, Application, Variable } from "./ast";
import { cloneTerm } from "./termcloner";
import { printTerm } from "./termprinter";
import Logger from "./logger";

export class Reducer implements TermVisitor<Term> {
    private logger: Logger;

    private rename_free_vars: boolean;
    private redex: Term;

    constructor(rename_free_vars: boolean, logger: Logger) {
        this.rename_free_vars = rename_free_vars;
        this.logger = logger;
    }

    reduceTerm(term: Term): Term {
        this.redex = cloneTerm(term);
        return this.reduce(this.redex);
    }

    private reduce(term: Term): Term {
        return term.accept(this);
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
        );
        if (conflicting_abs.size) this.logger.vvlog();
        conflicting_abs.forEach(abs => {
            const new_name: string = this.genNewName();
            this.logger.vvlog(`Alpha reducing '${printTerm(abs)}' with name '${new_name}'`);
            abs.alphaReduce(new_name);
        });
        if (conflicting_abs.size !== 0) this.logger.vlog(`α > ${printTerm(this.redex)}`);

        // Beta reduce x_normal into f_normal then reduce the result of that beta reduction to normal form
        this.logger.vvlog(`\nBeta reducing '${printTerm(x_normal)}' into '${printTerm(f_normal)}'`);
        const beta_reduct: Term = f_normal.betaReduce(x_normal, application.parent);
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
        this.logger.vlog(`β > ${printTerm(this.redex)}`);
        return this.reduce(beta_reduct);
    }
    visitVariable(variable: Variable): Term {
        // Rename free variable to unambiguous name if initialized with rename_free_vars = true
        if (this.rename_free_vars && !variable.free_renamed && variable.isFreeVar()) {
            const new_name: string = this.genNewFreeName();
            this.logger.vvlog(`\nRenaming free variable '${variable.name}' to '${new_name}'`);
            this.logger.vlog(`ε > '${variable.name}' → '${new_name}'`);
            variable.renameFreeVar(new_name);
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
