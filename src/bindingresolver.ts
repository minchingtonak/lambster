import { TermVisitor, Term, Abstraction, Application, Variable } from "./ast";
import { AstCloner } from "./astcloner";
import { AstPrinter } from "./astprinter";

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
        if (variable.name in this.bindings) {
            const parent_abs: Abstraction = variable.getParentAbstraction();
            if (!parent_abs) {
                const replacement: Term = this.cloner.clone(
                    this.bindings[variable.name],
                    variable.parent
                );
                console.log(
                    `\tExpanded '${variable.name}' into '${this.printer.print(
                        this.bindings[variable.name]
                    )}'`
                );
                this.expanded = true;
                return replacement;
            }
        }
        return variable;
    }
}
