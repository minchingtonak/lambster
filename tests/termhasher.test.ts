import * as chai from "chai";
import { Parser } from "../src/parser";
import { Lexer } from "../src/lexer";
import { Term } from "../src/ast";
import { hash as hashTerm, structureHash as hashTermStructure } from "../src/hash";
import { logger } from "./util";

const expect = chai.expect;

describe("Term hasher tests", () => {
    function genTerm(source: string): Term {
        return new Parser(new Lexer(source, logger).lexTokens(), logger).parseTerm() as Term;
    }
    function hash(source: string): number {
        const h = hashTerm(genTerm(source));
        console.log(`${source} -> ${h}`);
        return h;
    }
    function shash(source: string): number {
        const h = hashTermStructure(genTerm(source));
        console.log(`${source} -> ${h}`);
        return h;
    }

    it("Basic equivalence test", () => {
        expect(hash("(Lx.x)")).to.equal(hash("(Lx.x)"));
        expect(hash("Lx.x")).to.equal(hash("Lx.x"));
        expect(hash("Lx.x")).to.not.equal(hash("Ly.y"));
        expect(hash("Lx y. x y")).to.not.equal(hash("Ly x. y x"));
    });

    it("Basic structural equivalence test", () => {
        expect(shash("(Lx.x)")).to.equal(shash("(Lx.x)"));
        expect(shash("Lx.x")).to.equal(shash("Lx.x"));
        expect(shash("Lx.x")).to.equal(shash("Ly.y"));
        expect(shash("Lx y. x y")).to.equal(shash("Ly x. y x"));
    });
});
