import * as mocha from "mocha";
import * as chai from "chai";
import { AstPrinter } from "../src/astprinter";
import { Parser } from "../src/parser";
import { Lexer } from "../src/lexer";
import { Application, Abstraction, Variable, Term } from "../src/ast";

const expect = chai.expect;

describe("AST operation tests", () => {
    it("Test getBoundVars 1", () => {
        const tree: Term = new Parser(new Lexer("(Lx.x)(Ly.y)").scanTokens()).parseTerm();

        const bound: Variable[] = ((tree as Application).func as Abstraction).getBoundVariables();

        expect(bound).to.deep.equal([((tree as Application).func as Abstraction).body]);
    });

    it("Test getBoundVars 2", () => {
        const tree: Term = new Parser(new Lexer("(Lx. Lx. x y y)").scanTokens()).parseTerm();

        const bound: Variable[] = (tree as Abstraction).getBoundVariables();

        expect(bound).to.deep.equal([]);

        const all: Variable[] = (tree as Abstraction).getAllBoundVariables();

        expect(all.length).to.equal(3);
    });

    it("Test getBoundNames 1", () => {
        const tree: Term = new Parser(new Lexer("(Lx. Lx. x y y)").scanTokens()).parseTerm();

        const bound: Set<string> = (tree as Abstraction).getBoundVariableNames();

        expect(bound.size).to.equal(0);

        const all: Set<string> = (tree as Abstraction).getAllBoundVariableNames();

        expect(all.size).to.equal(2);
        expect(all.has("x")).to.equal(true);
        expect(all.has("y")).to.equal(true);
    });
});
