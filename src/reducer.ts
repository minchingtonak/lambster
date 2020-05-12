import { Visitor, Term, Abstraction, Application, Variable } from "./ast";
import { AstPrinter } from "./astprinter";

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

        if (f_normal instanceof Variable && x_normal instanceof Variable) return application;

        // If f_normal and application.argument have bound variables of the same name, alpha reduce application.argument
        const x_names: Set<string> = x_normal.getAllBoundVariableNames(),
            conflicts: Set<string> = new Set<string>(
                [...f_normal.getAllBoundVariableNames()].filter(n => x_names.has(n))
            );

        // get as set of all the parent abstractions of all bound vars of conflicting names
        // rename those abstractions
        new Set<Abstraction>(
            x_normal
                .getAllBoundVariables()
                .filter(v => conflicts.has(v.name))
                .map(v => v.getParentAbstraction())
        ).forEach(abs => {
            abs.alphaReduce(this.genNewName());
        });

        // beta reduce x_normal into f_normal if f_normal is an abstraction
        if (f_normal instanceof Abstraction) {
            const reduct: Term = f_normal.betaReduce(x_normal);
            // reduce that beta-reduct into normal form
            return this.reduce(reduct);
        }

        return application;
    }
    visitVariable(variable: Variable): Term {
        // checking for apostrophe in name seems hacky, change later, maybe in favor of dedicated bool member or at least a function
        // if (variable.isFreeVariable() && variable.name.indexOf("'") === -1)
        //     variable.renameFreeVariable(this.genNewFreeName());
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
