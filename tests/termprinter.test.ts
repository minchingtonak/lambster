import * as chai from "chai";
import { stringify } from "../src/termstringifier";
import { Parser } from "../src/parser";
import { Lexer } from "../src/lexer";

const expect = chai.expect;

describe("Term printer tests", () => {
    it("Basic print test", () => {
        expect(
            stringify(new Parser(new Lexer("(Lx.x x)(Ly.y y)").lexTokens()).parseTerm())
        ).to.equal("((λx. (x x)) (λy. (y y)))");
    });
});
