import {Term, Abstraction, Application } from '../src/ast';

export function traverseAst(root: Term, test: (val: any) => void) {
    test(root);
    if (root instanceof Application) {
        traverseAst(root.func, test);
        traverseAst(root.argument, test);
    } else if (root instanceof Abstraction) {
        traverseAst(root.body, test);
    }
}