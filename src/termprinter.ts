import { Abstraction, Application, Variable, TermVisitor, Term } from "./ast";

class TermPrinter implements TermVisitor<string> {
    printTerm(term: Term): string {
        return term.accept(this);
    }

    visitAbstraction(abstraction: Abstraction): string {
        return `(λ${abstraction.name}. ${abstraction.body.accept(this)})`;
    }
    visitApplication(application: Application): string {
        return `(${application.func.accept(this)} ${application.argument.accept(this)})`;
    }
    visitVariable(variable: Variable): string {
        return variable.name;
    }
}
const printer: TermPrinter = new TermPrinter();
export function printTerm(term: Term): string {
    return printer.printTerm(term);
}
