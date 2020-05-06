export interface Visitor<T> {
    visitAbstraction(abstraction: Abstraction): T;
    visitApplication(application: Application): T;
    visitVariable(variable: Variable): T;
}

export abstract class Term {
    abstract accept<T>(visitor: Visitor<T>): T;
}

export class Abstraction extends Term {
    name: string;
    body: Term;

    constructor(name: string, body: Term) {
        super();
        this.name = name;
        this.body = body;
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

    accept<T>(visitor: Visitor<T>): T {
        return visitor.visitVariable(this);
    }
}
