import { TermVisitor, Term, Abstraction, Application, Variable } from "./ast";
import { clone, stringify } from "./utils";
import Logger from "./logger";

export class BindingResolver implements TermVisitor<Term> {
    private expanded: boolean = false;

    constructor(private bindings: { [key: string]: Term }, private logger: Logger) {}

    resolveTerm(term: Term): Term {
        const resolved: Term = this.resolve(term);
        if (this.expanded) {
            this.expanded = false;
            this.logger.vlog(`Δ > ${stringify(resolved)}`);
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
            this.logger.vlog(`    δ > expanded '${variable.name}' into '${stringify(binding)}'`);
            this.expanded = true;
            return this.resolve(clone(binding, variable.parent));
        }
        return variable;
    }
}
