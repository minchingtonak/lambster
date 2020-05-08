import * as mocha from "mocha";
import * as chai from "chai";
import { AstPrinter } from "../src/astprinter";
import { Parser } from "../src/parser";
import { Lexer } from "../src/lexer";
import { Term, Abstraction, Application } from "../src/ast";

const expect = chai.expect;

describe("Reduction tests", () => {
    it("Basic alpha reduction test", () => {
        const tree: Term = new Parser(new Lexer("(Lx.x)(Ly.y)").scanTokens()).parseTerm();

        tree.rename("z", <Abstraction>(<Application>tree).func);
        expect(new AstPrinter().print(tree)).to.equal("((λz. z) (λy. y))");

        (<Abstraction>(<Application>tree).argument).alphaReduce("w");
        expect(new AstPrinter().print(tree)).to.equal("((λz. z) (λw. w))");
    });

    it("Nested abstraction alpha reduction test", () => {
        const tree: Term = new Parser(new Lexer("(Lx. Ly. x y y)").scanTokens()).parseTerm();

        (<Abstraction>tree).alphaReduce("z");
        expect(new AstPrinter().print(tree)).to.equal("(λz. (λy. ((z y) y)))");

        (<Abstraction>(<Abstraction>tree).body).alphaReduce("w");
        expect(new AstPrinter().print(tree)).to.equal("(λz. (λw. ((z w) w)))");
    });

    it("Duplicate name alpha reduction test", () => {
        const tree: Term = new Parser(new Lexer("(Lx. Lx. x y y)").scanTokens()).parseTerm();

        (<Abstraction>tree).alphaReduce("z");
        expect(new AstPrinter().print(tree)).to.equal("(λz. (λx. ((x y) y)))");
    });
});
