import { Abstraction, Application, Variable, Term } from '../ast';

export function transform<T = void>(
	root: Term,
	funcs: {
		abs: (abs: Abstraction, body: T) => T;
		app: (app: Application, func: T, arg: T) => T;
		var: (v: Variable) => T;
	}
): T {
	switch (root.type) {
		case 'abs': {
			const body = transform(root.body, funcs);
			return funcs.abs(root, body);
		}
		case 'app': {
			const func = transform(root.func, funcs),
				arg = transform(root.argument, funcs);
			return funcs.app(root, func, arg);
		}
		case 'var':
			return funcs.var(root);
	}
}

export function traverse(
	root: Term,
	funcs: {
		abs: (abs: Abstraction) => void;
		app: (app: Application) => void;
		var: (v: Variable) => void;
	}
) {
	transform(root, funcs);
}

export function stringify(term: Term): string {
	return transform(term, {
		abs: (abs, body) => `(λ${abs.name}. ${body})`,
		app: (_, func, arg) => `(${func} ${arg})`,
		var: v => v.name,
	});
}

export function clone(term: Term, new_parent: Term | null = null) {
	const cloned = transform(term, {
		// abs: (abs, body) => new Abstraction(abs.name, abs.id, body) ,
		abs: (abs, body) => ({name: abs.name, } as Abstraction),
		app: (_, func, arg) => new Application(func, arg),
		var: v => Variable.fromOther(v),
	});
	cloned.parent = new_parent;
	return cloned;
}
