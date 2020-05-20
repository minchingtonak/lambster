import { TermVisitor, Term, Abstraction, Application, Variable } from "./ast";

class TermCloner implements TermVisitor<Term> {
    clone(term: Term, new_parent: Term): Term {
        const cloned: Term = term.accept(this);
        cloned.parent = new_parent;
        return cloned;
    }

    visitAbstraction(abstraction: Abstraction): Term {
        return this.copyAtomicMembers(
            new Abstraction(abstraction.name, abstraction.body.accept(this)),
            abstraction
        );
    }
    visitApplication(application: Application): Term {
        return this.copyAtomicMembers(
            new Application(application.func.accept(this), application.argument.accept(this)),
            application
        );
    }
    visitVariable(variable: Variable): Term {
        return this.copyAtomicMembers(new Variable(variable.name), variable);
    }

    private copyAtomicMembers(dest: Term, source: Term): Term {
        Object.keys(source).forEach(key => {
            if (typeof source[key] !== "object") dest[key] = source[key];
        });
        return dest;
    }
}

const cloner: TermCloner = new TermCloner();
function cloneTerm(term: Term, new_parent = null): Term {
    return cloner.clone(term, new_parent);
}
export { cloneTerm };
