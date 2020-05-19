import * as chai from "chai";
import { Term, Application, Abstraction, Variable } from "../src/ast";
import { Parser } from "../src/parser";
import { Lexer } from "../src/lexer";
import cloneAst from "../src/astcloner";
import { traverseAst } from "./util";

const expect = chai.expect;

describe("AST cloner tests", () => {
    it("Basic clone test", () => {
        const tree: Term = new Parser(new Lexer("(Lx.x Ly.y y)").scanTokens()).parseTerm();

        const copy: Term = cloneAst(tree, null);

        const orig_terms: Term[] = [];
        traverseAst(tree, val => {
            orig_terms.push(val);
        });
        const copy_terms: Term[] = [];
        traverseAst(copy, val => {
            copy_terms.push(val);
        });

        expect(orig_terms.length).to.equal(copy_terms.length);

        for (let i in orig_terms) {
            expect(orig_terms[i]).to.not.equal(copy_terms[i]);
            if (orig_terms[i] instanceof Abstraction) {
                expect(copy_terms[i] instanceof Abstraction).to.equal(true);
                expect((orig_terms[i] as Abstraction).name).to.equal(
                    (copy_terms[i] as Abstraction).name
                );
            } else if (orig_terms[i] instanceof Application) {
                expect(copy_terms[i] instanceof Application).to.equal(true);
            } else if (orig_terms[i] instanceof Variable) {
                expect(copy_terms[i] instanceof Variable).to.equal(true);
                expect((orig_terms[i] as Variable).name).to.equal((copy_terms[i] as Variable).name);
                expect((orig_terms[i] as Variable).isFreeVar()).to.equal(
                    (copy_terms[i] as Variable).isFreeVar()
                );
            }
        }
    });
});
