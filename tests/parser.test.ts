import * as chai from "chai";
import { traverseAst } from './util'
import { AstPrinter } from "../src/astprinter";
import { Parser } from "../src/parser";
import { Lexer } from "../src/lexer";
import { Application, Abstraction, Variable, Term } from "../src/ast";

const expect = chai.expect;

describe("Parser tests", () => {
    it("Basic parse test", () => {
        expect(
            new AstPrinter().print(new Parser(new Lexer("(Lx.x)(Ly.y)").scanTokens()).parseTerm())
        ).to.equal("((λx. x) (λy. y))");
    });

    it("Parse test 2", () => {
        expect(
            new AstPrinter().print(
                new Parser(new Lexer("((λx. (x x)) (λy. (y y)))").scanTokens()).parseTerm()
            )
        ).to.equal("((λx. (x x)) (λy. (y y)))");
    });

    it("Parse test 3", () => {
        expect(
            new AstPrinter().print(
                new Parser(new Lexer("(Lx.x Ly.y y)").scanTokens()).parseTerm()
            )
        ).to.equal("(λx. (x (λy. (y y))))");
    });

    it("Associativity test 1", () => {
        expect(
            new AstPrinter().print(new Parser(new Lexer("Lx.x x x x").scanTokens()).parseTerm())
        ).to.equal("(λx. (((x x) x) x))");
    });

    it("Parent assignment test", () => {
        const tree: Term = new Parser(
            new Lexer("((λx. (x x)) (λy. (y y)))").scanTokens()
        ).parseTerm();
        traverseAst(tree, (val: Term) => {
            if (val instanceof Application) {
                expect(val.func.parent).to.equal(val);
                expect(val.argument.parent).to.equal(val);
            } else if (val instanceof Abstraction) {
                expect(val.body.parent).to.equal(val);
            }
        });
    });

    it("Error test 1", () => {
        expect(new Parser(new Lexer("Lx.x x .x x").scanTokens()).parseTerm()).to.be.a("null");
    });

    it("Error test 2", () => {
        expect(new Parser(new Lexer("Lx.x x L x x").scanTokens()).parseTerm()).to.be.a("null");
    });

    it("Error test 3", () => {
        expect(new Parser(new Lexer("Lx.. z x x").scanTokens()).parseTerm()).to.be.a("null");
    });

    it("Error test 4", () => {
        expect(new Parser(new Lexer("Lx z. z x x").scanTokens()).parseTerm()).to.be.a("null");
    });

    it("Error test 5", () => {
        expect(new Parser(new Lexer("(Lx. ) z x x").scanTokens()).parseTerm()).to.be.a("null");
    });

    it("Error test 6", () => {
        expect(new Parser(new Lexer("(Lx.  z x x").scanTokens()).parseTerm()).to.be.a("null");
    });

    it("Error test 7", () => {
        expect(new Parser(new Lexer("Lx. z x ) x").scanTokens()).parseTerm()).to.be.a("null");
    });

    it("Error test 8", () => {
        expect(new Parser(new Lexer("Lx world. z x ) x").scanTokens()).parseTerm()).to.be.a("null");
    });
});
