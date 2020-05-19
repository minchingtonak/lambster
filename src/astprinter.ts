import { Abstraction, Application, Variable, TermVisitor, Term } from "./ast";

class AstPrinter implements TermVisitor<string> {
    printAst(term: Term): string {
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
const printer: AstPrinter = new AstPrinter();
export default (term: Term) => printer.printAst(term);