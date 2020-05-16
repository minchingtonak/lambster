import * as chai from "chai";
import { Parser } from "../src/parser";
import { Lexer } from "../src/lexer";
import { Application, Abstraction, Variable, Term } from "../src/ast";

const expect = chai.expect;

describe("AST operation tests", () => {
    it("Test getBoundVars 1", () => {
        const tree: Term = new Parser(new Lexer("(Lx.x)(Ly.y)").scanTokens()).parseTerm();

        const bound: Variable[] = ((tree as Application).func as Abstraction).getBoundVars();

        expect(bound).to.deep.equal([((tree as Application).func as Abstraction).body]);
    });

    it("Test getBoundVars 2", () => {
        const tree: Term = new Parser(new Lexer("(Lx. Lx. x y y)").scanTokens()).parseTerm();

        const bound: Variable[] = (tree as Abstraction).getBoundVars();

        expect(bound).to.deep.equal([]);

        const all: Variable[] = (tree as Abstraction).getAllBoundVars();

        expect(all.length).to.equal(1);
    });

    it("Test getBoundNames 1", () => {
        const tree: Term = new Parser(new Lexer("(Lx. Lx. x y y)").scanTokens()).parseTerm();

        const bound: Set<string> = (tree as Abstraction).getBoundVarNames();

        expect(bound.size).to.equal(0);

        const all: Set<string> = (tree as Abstraction).getAllBoundVarNames();

        expect(all.size).to.equal(1);
        expect(all.has("x")).to.equal(true);
    });
});
