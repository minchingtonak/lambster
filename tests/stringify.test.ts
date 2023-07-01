import * as chai from "chai";
import { Parser } from "../src/parser";
import { Lexer } from "../src/lexer";
import { stringify } from "../src/utils";
import { Term } from "../src/ast";

const expect = chai.expect;

describe("Term printer tests", () => {
    it("Basic print test", () => {
        expect(
            stringify(new Parser(new Lexer("(Lx.x x)(Ly.y y)").lexTokens()).parseTerm() as Term)
        ).to.equal("((λx. (x x)) (λy. (y y)))");
    });
});
