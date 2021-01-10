import { Abstraction, Application, Term, Variable } from "./ast";

export function joinSet<T>(set: Set<T>, separator: string) {
    let joined: string = "";
    set.forEach(val => {
        joined += `${val}${separator}`;
    });
    return joined.substr(0, joined.length - separator.length);
}

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
    transformTerm(root, {
        absf: abs => {
            if (funcs.absf !== undefined) funcs.absf(abs);
        },
        appf: app => {
            if (funcs.appf !== undefined) funcs.appf(app);
        },
        vf: v => {
            if (funcs.vf !== undefined) funcs.vf(v);
        },
    });
}

export function stringify(term: Term): string {
    return transformTerm<string>(term, {
        absf: (abs, body) => `(λ${abs.name}. ${body})`,
        appf: (_, func, arg) => `(${func} ${arg})`,
        vf: v => v.name,
    });
}

export function clone(term: Term, new_parent: Term = null) {
    function copyAtomicMembers(src: Term, dest: Term): Term {
        Object.keys(src).forEach(key => {
            if (typeof src[key] !== "object") dest[key] = src[key];
        });
        return dest;
    }

    const cloned: Term = transformTerm<Term>(term, {
        absf: (abs, body) => copyAtomicMembers(abs, new Abstraction(abs.name, body, abs.id)),
        appf: (app, func, arg) => copyAtomicMembers(app, new Application(func, arg)),
        vf: v => copyAtomicMembers(v, new Variable(v.name, v.id)),
    });
    cloned.parent = new_parent;
    return cloned;
}
