import { Abstraction, Application, Variable, Binding, TermVisitor, Term } from "./ast";

export class AstPrinter implements TermVisitor<string> {
    print(term: Term): string {
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
