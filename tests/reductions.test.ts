import * as chai from "chai";
import { AstPrinter } from "../src/astprinter";
import { Reducer } from "../src/reducer";
import { Parser } from "../src/parser";
import { Lexer } from "../src/lexer";
import { Term, Abstraction, Application } from "../src/ast";

const expect = chai.expect;

describe("Reduction tests", () => {
    it("Basic alpha reduction test", () => {
        const tree: Term = new Parser(new Lexer("(Lx.x)(Ly.y)").scanTokens()).parseTerm();

        tree.rename("z", (tree as Application).func as Abstraction);
        expect(new AstPrinter().print(tree)).to.equal("((λz. z) (λy. y))");

        (<Abstraction>(<Application>tree).argument).alphaReduce("w");
        expect(new AstPrinter().print(tree)).to.equal("((λz. z) (λw. w))");
    });

    it("Nested abstraction alpha reduction test", () => {
        const tree: Term = new Parser(new Lexer("(Lx. Ly. x y y)").scanTokens()).parseTerm();

        (tree as Abstraction).alphaReduce("z");
        expect(new AstPrinter().print(tree)).to.equal("(λz. (λy. ((z y) y)))");

        ((tree as Abstraction).body as Abstraction).alphaReduce("w");
        expect(new AstPrinter().print(tree)).to.equal("(λz. (λw. ((z w) w)))");
    });

    it("Duplicate name alpha reduction test", () => {
        const tree: Term = new Parser(new Lexer("(Lx. Lx. x y y)").scanTokens()).parseTerm();

        (tree as Abstraction).alphaReduce("z");
        expect(new AstPrinter().print(tree)).to.equal("(λz. (λx. ((x y) y)))");
    });

    it("Reduction test 1", () => {
        const tree: Term = new Parser(
            new Lexer("(Lx. Lx. x y y) (Lx. Ly. y x)").scanTokens()
        ).parseTerm();

        expect(new AstPrinter().print(new Reducer().reduce(tree))).to.equal("(λx. ((x y) y))");
    });

    it("Reduction test 2", () => {
        const tree: Term = new Parser(
            new Lexer("(Lx. x x) (Ly. y) z").scanTokens()
        ).parseTerm();

        expect(new AstPrinter().print(new Reducer().reduce(tree))).to.equal("z");
    });
});

