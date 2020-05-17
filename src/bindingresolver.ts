import { TermVisitor, Term, Abstraction, Application, Variable } from "./ast";
import { AstCloner } from "./astcloner";
import { AstPrinter } from "./astprinter";

export class BindingResolver implements TermVisitor<Term> {
    private cloner: AstCloner = new AstCloner();
    private printer: AstPrinter = new AstPrinter();
    private bindings;
    private expanded: boolean = false;

    constructor(bindings) {
        this.bindings = bindings;
    }

    resolveTerm(term: Term): Term {
        const resolved: Term = this.resolve(term);
        if (this.expanded) {
            this.expanded = false;
            console.log(`ω > ${this.printer.print(resolved)}`);
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
            console.log(`  Expanded '${variable.name}' into '${this.printer.print(binding)}'`);
            this.expanded = true;
            return this.resolve(this.cloner.clone(binding, variable.parent));
        }
        return variable;
    }
}
