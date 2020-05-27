import { TermVisitor, Term, Abstraction, Application, Variable } from "./ast";
import { cloneTerm } from "./termcloner";
import { printTerm } from "./termprinter";
import Logger from "./logger";

export class BindingResolver implements TermVisitor<Term> {
    private logger: Logger;

    private bindings: { [key: string]: Term };
    private expanded: boolean = false;

    constructor(bindings: { [key: string]: Term }, logger: Logger) {
        this.bindings = bindings;
        this.logger = logger;
    }

    resolveTerm(term: Term): Term {
        const resolved: Term = this.resolve(term);
        if (this.expanded) {
            this.expanded = false;
            this.logger.vlog(`Δ > ${printTerm(resolved)}`);
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
            this.logger.vlog(`    δ > expanded '${variable.name}' into '${printTerm(binding)}'`);
            this.expanded = true;
            return this.resolve(cloneTerm(binding, variable.parent));
        }
        return variable;
    }
}
