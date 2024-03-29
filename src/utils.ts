import { Abstraction, Application, Term, Variable } from "./ast";

declare global {
    interface Set<T> {
        join<T>(sepatator: string): string;
    }
}

Set.prototype.join = function <T>(separator: string): string {
    const set = this as Set<T>;
    let joined: string = "",
        first: boolean = true;
    set.forEach(val => {
        if (first) {
            joined += `${val}`;
            first = false;
            return;
        }
        joined += `${separator}${val}`;
    });
    return joined;
};

export function transformTerm<T>(
    root: Term,
    funcs: {
        absf: (abs: Abstraction, body: T) => T;
        appf: (app: Application, func: T, arg: T) => T;
        vf: (v: Variable) => T;
    }
): T {
    if (root instanceof Abstraction) {
        const body = transformTerm(root.body, funcs);
        return funcs.absf(root, body);
    } else if (root instanceof Application) {
        const func = transformTerm(root.func, funcs),
            arg = transformTerm(root.argument, funcs);
        return funcs.appf(root, func, arg);
    } else if (root instanceof Variable) {
        return funcs.vf(root);
    } else throw Error("Term traversal failed");
}

export function traverseTerm(
    root: Term,
    funcs: {
        absf?: (abs: Abstraction) => void;
        appf?: (app: Application) => void;
        vf?: (v: Variable) => void;
    }
) {
    transformTerm<void>(root, {
        absf: abs => (funcs.absf !== undefined ? funcs.absf(abs) : void {}),
        appf: app => (funcs.appf !== undefined ? funcs.appf(app) : void {}),
        vf: v => (funcs.vf !== undefined ? funcs.vf(v) : void {}),
    });
}

export function stringify(term: Term): string {
    return transformTerm<string>(term, {
        absf: (abs, body) => `(λ${abs.name}. ${body})`,
        appf: (_, func, arg) => `(${func} ${arg})`,
        vf: v => v.name,
    });
}

export function clone(term: Term, new_parent: Term | null = null) {
    const cloned: Term = transformTerm<Term>(term, {
        absf: (abs, body) => new Abstraction(abs.name, abs.id, body),
        appf: (_, func, arg) => new Application(func, arg),
        vf: v => Variable.fromOther(v),
    });
    cloned.parent = new_parent;
    return cloned;
}
