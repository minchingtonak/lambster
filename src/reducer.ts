import { Visitor, Term, Abstraction, Application, Variable } from "./ast";

export class Reducer implements Visitor<Term> {
    reduce(term: Term): Term {
        return term.accept(this);
    }

    visitAbstraction(abstraction: Abstraction): Term {
        abstraction.body = this.reduce(abstraction.body); // Should modify in place so don't need to explicitly assign
        return abstraction;
    }
    visitApplication(application: Application): Term {
        const f_normal: Term = this.reduce(application.func);
        const x_normal: Term = this.reduce(application.argument);

        // If f_normal and application.argument have bound variables of the same name, alpha reduce application.argument

        const conflicts: Set<string> = new Set<string>();
        const f_names: Set<string> = f_normal.getAllBoundVariableNames();
        const x_names: Set<string> = x_normal.getAllBoundVariableNames();
        f_names.forEach(name => {
            if (x_names.has(name)) conflicts.add(name);
        });

        // console.log()

        // console.log("F_NAMES");
        // console.log(f_names);

        // console.log("X_NAMES");
        // console.log(x_names);

        // console.log("CONFLICTS");
        // console.log(conflicts);

        // get as set of all the parent abstractions of all bound vars of conflicting names
        // rename those abstractions
        const abstractions: Set<Abstraction> = new Set<Abstraction>();
        x_normal.getAllBoundVariables().forEach(v => {
            if (conflicts.has(v.name)) abstractions.add(v.getParentAbstraction());
        });

        // console.log("ABSTRACTIONS");
        // console.log(abstractions);

        // console.log()

        abstractions.forEach(abs => {
            abs.alphaReduce(this.genNewName());
        });

        // beta reduce x_normal into f_normal if f_normal is an abstraction

        // reduce that beta-reduct into normal form

        return application;
    }
    visitVariable(variable: Variable): Term {
        if (variable.isFreeVariable()) variable.renameFreeVariable(this.genNewFreeName());
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
