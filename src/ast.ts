import { cloneTerm } from "./termcloner";

export interface TermVisitor<T> {
    visitAbstraction(abstraction: Abstraction): T;
    visitApplication(application: Application): T;
    visitVariable(variable: Variable): T;
}

export interface StmtVisitor<T> {
    visitTermStmt(term_stmt: TermStmt): T;
    visitBindingStmt(binding: BindingStmt): T;
    visitCommandStmt(command: CommandStmt): T;
}

export type Stmt = TermStmt | BindingStmt | CommandStmt;

export class TermStmt {
    term: Term;

    constructor(term: Term) {
        this.term = term;
    }

    accept<T>(visitor: StmtVisitor<T>) {
        return visitor.visitTermStmt(this);
    }
}

export class BindingStmt {
    readonly name: string;
    readonly term: Term;

    constructor(name: string, term: Term) {
        this.name = name;
        this.term = term;
    }

    accept<T>(visitor: StmtVisitor<T>) {
        return visitor.visitBindingStmt(this);
    }
}

export enum CommandType {
    ENV,
    UNBIND,
    HELP,
}

export class CommandStmt {
    readonly type: CommandType;
    readonly argument?: string;

    constructor(type: CommandType, argument?: string) {
        this.type = type;
        this.argument = argument;
    }

    accept<T>(visitor: StmtVisitor<T>) {
        return visitor.visitCommandStmt(this);
    }
}

export abstract class Term {
    abstract accept<T>(visitor: TermVisitor<T>): T;
    abstract rename(new_name: string, root_id: number): void;
    abstract getAllBoundVarNames(): Set<string>;
    abstract getAllBoundVars(): Variable[];
    parent: Term;
}

export class Abstraction extends Term {
    name: string;
    id: number;
    body: Term;

    constructor(name: string, body: Term, id: number = -1) {
        super();
        this.name = name;
        this.body = body;
        this.id = id;
        body.parent = this;
    }

    alphaReduce(new_name: string) {
        this.rename(new_name, this.id);
    }

    betaReduce(argument: Term, application_parent: Term): Term {
        const replacements: Variable[] = this.getBoundVars();
        if (replacements.length !== 0) {
            replacements.forEach(rep => {
                if (rep.parent instanceof Abstraction) {
                    rep.parent.body = cloneTerm(argument, rep.parent);
                } else if (rep.parent instanceof Application) {
                    if (rep.parent.func === rep) {
                        rep.parent.func = cloneTerm(argument, rep.parent);
                    } else {
                        rep.parent.argument = cloneTerm(argument, rep.parent);
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

    rename(new_name: string, root_id: number) {
        this.body.rename(new_name, root_id);
        if (this.id === root_id) this.name = new_name;
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

    private getVariables(find_all: boolean = false): Variable[] {
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

    private getNames(find_all: boolean = false): Set<string> {
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
            if (current.id === this.id || (find_all && !current.isFreeVar())) accumulator(current);
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

    rename(new_name: string, root_id: number) {
        this.func.rename(new_name, root_id);
        this.argument.rename(new_name, root_id);
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
    id: number;
    private free_renamed: boolean = false;

    constructor(name: string, id: number = -1) {
        super();
        this.name = name;
        this.id = id;
    }

    getParentAbstraction(): Abstraction {
        let current: Term = this.parent;
        while (current) {
            if (current instanceof Abstraction && this.id == current.id) return current;
            current = current.parent;
        }
        return null;
    }

    rename(new_name: string, root_id: number) {
        if (this.id === root_id) this.name = new_name;
    }

    renameFree(new_name: string) {
        this.free_renamed = true;
        this.name = new_name;
    }

    isFreeVar(): boolean {
        return !this.id;
    }

    wasFreeRenamed(): boolean {
        return this.free_renamed;
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
