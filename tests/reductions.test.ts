import * as chai from "chai";
import { printTerm } from "../src/termprinter";
import { Reducer } from "../src/reducer";
import { Parser } from "../src/parser";
import { Lexer } from "../src/lexer";
import { Term, Abstraction, Application } from "../src/ast";
import { logger } from "./util";

const expect = chai.expect;

describe("Reduction tests", () => {

    function expectTreeToBe(tree: Term, expected: string) {
        expect(printTerm(tree)).to.equal(expected);
    }

    function expectTreeToReduceTo(tree: Term, expected: string, rename_free: boolean = false) {
        expectTreeToBe(new Reducer(rename_free, logger).reduceTerm(tree), expected);
    }

    it("Basic alpha reduction test", () => {
        const tree: Term = new Parser(
            new Lexer("(Lx.x)(Ly.y)", logger).lexTokens(),
            logger
        ).parseTerm();

        tree.rename("z", ((tree as Application).func as Abstraction).id);
        expectTreeToBe(tree, "((λz. z) (λy. y))");

        ((tree as Application).argument as Abstraction).alphaReduce("w");
        expectTreeToBe(tree, "((λz. z) (λw. w))");
    });

    it("Nested abstraction alpha reduction test", () => {
        const tree: Term = new Parser(
            new Lexer("(Lx. Ly. x y y)", logger).lexTokens(),
            logger
        ).parseTerm();

        (tree as Abstraction).alphaReduce("z");
        expectTreeToBe(tree, "(λz. (λy. ((z y) y)))");

        ((tree as Abstraction).body as Abstraction).alphaReduce("w");
        expectTreeToBe(tree, "(λz. (λw. ((z w) w)))");
    });

    it("Duplicate name alpha reduction test", () => {
        const tree: Term = new Parser(
            new Lexer("(Lx. Lx. x y y)", logger).lexTokens(),
            logger
        ).parseTerm();

        (tree as Abstraction).alphaReduce("z");
        expectTreeToBe(tree, "(λz. (λx. ((x y) y)))");
    });

    it("Reduction free renaming test", () => {
        const tree: Term = new Parser(
            new Lexer("((Ly. (Lx. x x y)) x) w", logger).lexTokens(),
            logger
        ).parseTerm();
        expectTreeToReduceTo(tree, "((w w) x)");
        expectTreeToReduceTo(tree, "((X`1 X`1) X`0)", true);
    });

    it("Reduction test 1", () => {
        const tree: Term = new Parser(
            new Lexer("(Lx. Lx. x y y) (Lx. Ly. y x)", logger).lexTokens(),
            logger
        ).parseTerm();
        expectTreeToReduceTo(tree, "(λx. ((x y) y))");
    });

    it("Reduction test 2", () => {
        const tree: Term = new Parser(
            new Lexer("(Lx. x x) (Ly. y) z", logger).lexTokens(),
            logger
        ).parseTerm();
        expectTreeToReduceTo(tree, "z");
    });

    it("Reduction test 2.5", () => {
        const tree: Term = new Parser(
            new Lexer("(Lx. x x) (Ly. y)", logger).lexTokens(),
            logger
        ).parseTerm();
        expectTreeToReduceTo(tree, "(λX0. X0)");
    });

    const t: string = "(Lt. Lf. t)";
    const f: string = "(Lt. Lf. f)";
    const and: string = "(La. Lb. a b a)";
    const or: string = "(La. Lb. a a b)";
    const not: string = `(Lb. b ${f} ${t})`;
    const if_: string = `(Lp. Lz. Lw. p z w)`;

    it("Reduction test 3", () => {
        const tree: Term = new Parser(
            new Lexer(`${and} ${t} bool`, logger).lexTokens(),
            logger
        ).parseTerm();

        expectTreeToReduceTo(tree, "X`0", true);
        expectTreeToReduceTo(tree, "bool");
    });

    it("Reduction test 4", () => {
        const tree: Term = new Parser(
            new Lexer(`(${and} ${f}) bool`, logger).lexTokens(),
            logger
        ).parseTerm();

        expectTreeToReduceTo(tree, "(λt. (λX0. X0))", true);
        expectTreeToReduceTo(tree, "(λt. (λX0. X0))");
    });

    it("Reduction test 5", () => {
        const tree: Term = new Parser(
            new Lexer("((La. Lb. a a b) (Lt. Lf. t)) bool", logger).lexTokens(),
            logger
        ).parseTerm();

        expectTreeToReduceTo(tree, "(λX0. (λf. X0))", true);
        expectTreeToReduceTo(tree, "(λX0. (λf. X0))");
    });

    it("Reduction test 6", () => {
        const tree: Term = new Parser(
            new Lexer("((La. Lb. a a b) (Lt. Lf. f)) bool", logger).lexTokens(),
            logger
        ).parseTerm();

        expectTreeToReduceTo(tree, "X`0", true);
        expectTreeToReduceTo(tree, "bool");
    });

    it("Reduction test 7", () => {
        const tree: Term = new Parser(
            new Lexer(`${not} (Lt. Lf. t)`, logger).lexTokens(),
            logger
        ).parseTerm();

        expectTreeToReduceTo(tree, "(λt. (λf. f))", true);
        expectTreeToReduceTo(tree, "(λt. (λf. f))");
    });

    it("Reduction test 8", () => {
        const tree: Term = new Parser(
            new Lexer(`(Le.t)(Le.t)(Le.t)`, logger).lexTokens(),
            logger
        ).parseTerm();

        expectTreeToReduceTo(tree, "(X`0 (λe. X`2))", true);
        expectTreeToReduceTo(tree, "(t (λe. t))");
    });

    it("Reduction test 9", () => {
        const tree: Term = new Parser(
            new Lexer(`(Lx.(Ly.Lx.y) x) z`, logger).lexTokens(),
            logger
        ).parseTerm();

        expectTreeToReduceTo(tree, "(λx. z)");
    });
});
