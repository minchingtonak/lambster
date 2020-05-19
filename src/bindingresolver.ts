import { TermVisitor, Term, Abstraction, Application, Variable } from "./ast";
import cloneAst from "./astcloner";
import printAst from "./astprinter";
import logger from "./logger";

export class BindingResolver implements TermVisitor<Term> {
    private bindings: { [key: string]: Term };
    private expanded: boolean = false;

    constructor(bindings: { [key: string]: Term }) {
        this.bindings = bindings;
    }

    resolveTerm(term: Term): Term {
        const resolved: Term = this.resolve(term);
        if (this.expanded) {
            this.expanded = false;
            logger.vlog(`Δ > ${printAst(resolved)}`);
        }
        return resolved;
    }

    private resolve(term: Term): Term {
        return term.accept(this);
    }

    visitAbstraction(abstraction: Abstraction): Term {
        abstraction.body = abstraction.body.accept(this);
        return abstraction;
    }
    visitApplication(application: Application): Term {
        application.func = application.func.accept(this);
        application.argument = application.argument.accept(this);
        return application;
    }
    visitVariable(variable: Variable): Term {
        let binding: Term;
        if (variable.isFreeVar() && (binding = this.bindings[variable.name])) {
            logger.vlog(`    δ > '${variable.name}' → '${printAst(binding)}'`);
            this.expanded = true;
            return this.resolve(cloneAst(binding, variable.parent));
        }
        return variable;
    }
}
