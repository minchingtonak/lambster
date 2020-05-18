import { TermVisitor, Term, Abstraction, Application, Variable } from "./ast";
import { AstCloner } from "./astcloner";
import { AstPrinter } from "./astprinter";
import logger from "./logger";

export class BindingResolver implements TermVisitor<Term> {
    private cloner: AstCloner = new AstCloner();
    private printer: AstPrinter = new AstPrinter();
    private bindings: { [key: string]: Term };
    private expanded: boolean = false;

    constructor(bindings: { [key: string]: Term }) {
        this.bindings = bindings;
    }

    resolveTerm(term: Term): Term {
        const resolved: Term = this.resolve(term);
        if (this.expanded) {
            this.expanded = false;
            logger.vlog(`Δ > ${this.printer.print(resolved)}`);
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
            logger.vlog(`    δ > ${variable.name} → ${this.printer.print(binding)}`);
            this.expanded = true;
            return this.resolve(this.cloner.clone(binding, variable.parent));
        }
        return variable;
    }
}
