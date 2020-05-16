import { AstCloner } from "./astcloner";

export interface TermVisitor<T> {
    visitAbstraction(abstraction: Abstraction): T;
    visitApplication(application: Application): T;
    visitVariable(variable: Variable): T;
}

export type Stmt = Binding | Term;

export class Binding {
    name: string;
    term: Term;

    constructor(name: string, term: Term) {
        this.name = name;
        this.term = term;
    }
}

export abstract class Term {
    abstract accept<T>(visitor: TermVisitor<T>): T;
    abstract rename(new_name: string, root: Abstraction): void;
    abstract getAllBoundVarNames(): Set<string>;
    abstract getAllBoundVars(): Variable[];
    parent: Term;
}

export class Abstraction extends Term {
    name: string;
    body: Term;

    constructor(name: string, body: Term) {
        super();
        this.name = name;
        this.body = body;
        body.parent = this;
    }

    alphaReduce(new_name: string) {
        this.rename(new_name, this);
    }

    betaReduce(argument: Term, application_parent: Term): Term {
        const replacements: Variable[] = this.getBoundVars();
        if (replacements.length !== 0) {
            const cloner: AstCloner = new AstCloner();
            replacements.forEach(rep => {
                if (rep.parent instanceof Abstraction) {
                    rep.parent.body = cloner.clone(argument, rep.parent);
                } else if (rep.parent instanceof Application) {
                    if (rep.parent.func === rep) {
                        rep.parent.func = cloner.clone(argument, rep.parent);
                    } else {
                        rep.parent.argument = cloner.clone(argument, rep.parent);
                    }
                } else {
                    throw new Error("something is very wrong");
                }
            });
        }
        // The new parent of the reduct should be the parent of the surrounding application
        this.body.parent = application_parent;
        return this.body;
    }

    rename(new_name: string, root: Abstraction) {
        this.body.rename(new_name, root);
        if (this === root) this.name = new_name;
    }

    getBoundVars(): Variable[] {
        return this.getVariables();
    }

    getAllBoundVars(): Variable[] {
        return this.getVariables(true);
    }

    getBoundVarNames(): Set<string> {
        return this.getNames();
    }

    getAllBoundVarNames(): Set<string> {
        return this.getNames(true);
    }

    private getVariables(find_all = false): Variable[] {
        const vars: Variable[] = [];
        this.findBoundVariables(
            this,
            (v: Variable) => {
                vars.push(v);
            },
            find_all
        );
        return vars;
    }

    private getNames(find_all = false): Set<string> {
        const names: Set<string> = new Set<string>();
        this.findBoundVariables(
            this,
            (v: Variable) => {
                names.add(v.name);
            },
            find_all
        );
        return names;
    }

    private findBoundVariables(
        current: Term,
        accumulator: (val: Variable) => void,
        find_all: boolean
    ) {
        if (current instanceof Abstraction) {
            this.findBoundVariables(current.body, accumulator, find_all);
        } else if (current instanceof Application) {
            this.findBoundVariables(current.func, accumulator, find_all);
            this.findBoundVariables(current.argument, accumulator, find_all);
        } else if (current instanceof Variable) {
            if (current.getParentAbstraction() === this || (find_all && !current.isFreeVar()))
                accumulator(current);
        }
    }

    accept<T>(visitor: TermVisitor<T>): T {
        return visitor.visitAbstraction(this);
    }
}

export class Application extends Term {
    func: Term;
    argument: Term;

    constructor(func: Term, argument: Term) {
        super();
        this.func = func;
        this.argument = argument;
        func.parent = argument.parent = this;
    }

    rename(new_name: string, root: Abstraction) {
        this.func.rename(new_name, root);
        this.argument.rename(new_name, root);
    }

    getAllBoundVars(): Variable[] {
        const vars: Variable[] = this.func.getAllBoundVars();
        this.argument.getAllBoundVars().forEach(v => {
            vars.push(v);
        });
        return vars;
    }

    getAllBoundVarNames(): Set<string> {
        const funcnames: Set<string> = this.func.getAllBoundVarNames();
        this.argument.getAllBoundVarNames().forEach(name => {
            funcnames.add(name);
        });
        return funcnames;
    }

    accept<T>(visitor: TermVisitor<T>): T {
        return visitor.visitApplication(this);
    }
}

export class Variable extends Term {
    name: string;
    is_free_var: boolean = undefined;
    free_renamed: boolean = false;

    constructor(name: string) {
        super();
        this.name = name;
    }

    getParentAbstraction(): Abstraction {
        if (this.is_free_var) return null;
        let current: Term = this.parent;
        while (current) {
            if (current instanceof Abstraction && this.name === current.name) return current;
            current = current.parent;
        }
        return null;
    }

    rename(new_name: string, root: Abstraction) {
        if (this.getParentAbstraction() === root) this.name = new_name;
    }

    renameFreeVar(new_name: string) {
        this.free_renamed = true;
        this.name = new_name;
    }

    isFreeVar(): boolean {
        return this.is_free_var === undefined
            ? (this.is_free_var = this.getParentAbstraction() === null)
            : this.is_free_var;
    }

    getAllBoundVars(): Variable[] {
        return this.isFreeVar() ? [] : [this];
    }

    getAllBoundVarNames(): Set<string> {
        return new Set<string>([this.name]);
    }

    accept<T>(visitor: TermVisitor<T>): T {
        return visitor.visitVariable(this);
    }
}
