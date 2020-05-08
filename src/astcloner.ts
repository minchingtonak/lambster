import { Visitor, Term, Abstraction, Application, Variable } from "./ast";

export class AstCloner implements Visitor<Term> {
    clone(term: Term): Term {
        return term.accept(this);
    }

    visitAbstraction(abstraction: Abstraction): Term {
        return new Abstraction(abstraction.name, abstraction.body.accept(this));
    }
    visitApplication(application: Application): Term {
        return new Application(application.func.accept(this), application.argument.accept(this));
    }
    visitVariable(variable: Variable): Term {
        return new Variable(variable.name);
    }
}
