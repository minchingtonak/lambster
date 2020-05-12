import { Visitor, Term, Abstraction, Application, Variable } from "./ast";

export class Reducer implements Visitor<Term> {
    private rename_free_vars: boolean;

    constructor(rename_free_vars = false) {
        this.rename_free_vars = rename_free_vars;
    }

    reduce(term: Term): Term {
        return term.accept(this);
    }

    visitAbstraction(abstraction: Abstraction): Term {
        abstraction.body = this.reduce(abstraction.body);
        return abstraction;
    }
    visitApplication(application: Application): Term {
        const f_normal: Term = this.reduce(application.func),
            x_normal: Term = this.reduce(application.argument);

        if (f_normal instanceof Variable && x_normal instanceof Variable) return application;

        // If f_normal and x_normal have bound variables of the same name, alpha reduce application.argument
        const x_names: Set<string> = x_normal.getAllBoundVarNames(),
            conflicts: Set<string> = new Set<string>(
                [...f_normal.getAllBoundVarNames()].filter(n => x_names.has(n))
            );

        // For each abstraction containing conflicting bound variables, alpha reduce that abstraction
        new Set<Abstraction>(
            x_normal
                .getAllBoundVars()
                .filter(v => conflicts.has(v.name))
                .map(v => v.getParentAbstraction())
        ).forEach(abs => {
            abs.alphaReduce(this.genNewName());
        });

        // Beta reduce x_normal into f_normal if f_normal is an abstraction
        // Then, reduce the result of that beta reduction to normal form
        // Else, just return the alpha-reduced application
        return f_normal instanceof Abstraction
            ? this.reduce(f_normal.betaReduce(x_normal))
            : application;
    }
    visitVariable(variable: Variable): Term {
        // Rename free variable to unambiguous name if initialized with rename_free_vars = true
        if (this.rename_free_vars && !variable.free_renamed && variable.isFreeVar())
            variable.renameFreeVar(this.genNewFreeName());
        return variable;
    }

    private current_name_prefix: number = 0;
    private genNewName(): string {
        return `x${this.current_name_prefix++}`;
    }

    private current_free_name_prefix: number = 0;
    private genNewFreeName(): string {
        return `x'${this.current_free_name_prefix++}`;
    }
}
