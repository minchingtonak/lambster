export interface Visitor<T> {
    visitAbstraction(abstraction: Abstraction): T;
    visitApplication(application: Application): T;
    visitVariable(variable: Variable): T;
}

export abstract class Term {
    abstract accept<T>(visitor: Visitor<T>): T;
    abstract rename(new_name: string, root: Abstraction): void;
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

    rename(new_name: string, root: Abstraction) {
        this.body.rename(new_name, root);
        if (this === root) this.name = new_name;
    }

    getBoundVariables(): Variable[] {
        return this.getVariables();
    }

    getAllBoundVariables(): Variable[] {
        return this.getVariables(true);
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

    getBoundVariableNames(): Set<string> {
        return this.getNames();
    }

    getAllBoundVariableNames(): Set<string> {
        return this.getNames(true);
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
        find_all = false
    ) {
        if (current instanceof Abstraction) {
            this.findBoundVariables(current.body, accumulator, find_all);
        } else if (current instanceof Application) {
            this.findBoundVariables(current.func, accumulator, find_all);
            this.findBoundVariables(current.argument, accumulator, find_all);
        } else if (current instanceof Variable) {
            if (current.getParentAbstraction() === this || find_all) accumulator(current);
        }
    }

    accept<T>(visitor: Visitor<T>): T {
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

    accept<T>(visitor: Visitor<T>): T {
        return visitor.visitApplication(this);
    }
}

export class Variable extends Term {
    name: string;

    constructor(name: string) {
        super();
        this.name = name;
    }

    getParentAbstraction(): Abstraction {
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

    accept<T>(visitor: Visitor<T>): T {
        return visitor.visitVariable(this);
    }
}
