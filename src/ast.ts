import { clone, traverseTerm } from "./utils";
import "./hash";

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
    NONE,
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
    abstract _rename(new_name: string, new_id: number, root_id: number): void;
    abstract getAllBoundVarNames(): Set<string>;
    abstract getAllBoundVars(): Variable[];
    parent: Term | null;
}

export class Abstraction extends Term {
    constructor(public name: string, public id: number, public body: Term) {
        super();
        body.parent = this;
    }

    alphaReduce(new_name: string) {
        this._rename(new_name, new_name.hash(), this.id);
    }

    betaReduce(argument: Term, application_parent: Term): Term {
        const replacements: Variable[] = this.getBoundVars();
        if (replacements.length !== 0) {
            replacements.forEach(rep => {
                if (rep.parent instanceof Abstraction) {
                    rep.parent.body = clone(argument, rep.parent);
                } else if (rep.parent instanceof Application) {
                    if (rep.parent.func === rep) {
                        rep.parent.func = clone(argument, rep.parent);
                    } else {
                        rep.parent.argument = clone(argument, rep.parent);
                    }
                }
            });
        }
        // The new parent of the reduct should be the parent of the surrounding application
        this.body.parent = application_parent;
        return this.body;
    }

    _rename(new_name: string, new_id: number, root_id: number) {
        this.body._rename(new_name, new_id, root_id);
        if (this.id === root_id) (this.name = new_name), (this.id = new_id);
    }

    getBoundVars(): Variable[] {
        return this.findVariables(false, false);
    }

    getAllBoundVars(): Variable[] {
        return this.findVariables(false, true);
    }

    getBoundVarNames(): Set<string> {
        return this.findVariables(true, false);
    }

    getAllBoundVarNames(): Set<string> {
        return this.findVariables(true, true);
    }

    // TODO: figure out how to make return type based on value of names
    private findVariables<T extends Set<string> | Variable[]>(
        names: boolean,
        find_all: boolean
    ): T {
        const container = names ? new Set<string>() : new Array<Variable>(),
            cond: (v: Variable) => boolean = v => v.id === this.id || (find_all && !v.isFreeVar()),
            accumulator =
                // TODO: an optimization that would avoid having to do this check and having the change to traverseTerm would be changing an abstraction's id when it's alpha reduced
                container instanceof Set
                    ? (v: Variable) => {
                          if (cond(v)) container.add(v.name);
                      }
                    : (v: Variable) => {
                          if (cond(v)) container.push(v);
                      };

        traverseTerm(this, { vf: accumulator });
        return container as T;
    }

    accept<T>(visitor: TermVisitor<T>): T {
        return visitor.visitAbstraction(this);
    }
}

export class Application extends Term {
    constructor(public func: Term, public argument: Term) {
        super();
        this.func = func;
        this.argument = argument;
        func.parent = argument.parent = this;
    }

    _rename(new_name: string, new_id: number, root_id: number) {
        this.func._rename(new_name, new_id, root_id);
        this.argument._rename(new_name, new_id, root_id);
    }

    getAllBoundVars(): Variable[] {
        return [...this.func.getAllBoundVars(), ...this.argument.getAllBoundVars()];
    }

    getAllBoundVarNames(): Set<string> {
        return new Set<string>([
            ...this.func.getAllBoundVarNames(),
            ...this.argument.getAllBoundVarNames(),
        ]);
    }

    accept<T>(visitor: TermVisitor<T>): T {
        return visitor.visitApplication(this);
    }
}

export class Variable extends Term {
    private free_renamed: boolean = false;

    constructor(public name: string, public id: number) {
        super();
    }

    static fromOther(v: Variable): Variable {
        const { id, name, free_renamed } = v,
            copy = new this(name, id);
        copy.free_renamed = free_renamed;
        return copy;
    }

    getParentAbstraction(): Abstraction | null {
        let current = this.parent;
        while (current) {
            if (current instanceof Abstraction && this.id == current.id) return current;
            current = current.parent;
        }
        return null;
    }

    _rename(new_name: string, new_id: number, root_id: number) {
        if (this.id === root_id) (this.name = new_name), (this.id = new_id);
    }

    isFreeVar(): boolean {
        return !this.id;
    }

    renameFree(new_name: string) {
        this.free_renamed = true;
        this.name = new_name;
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
