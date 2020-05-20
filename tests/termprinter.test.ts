import * as chai from "chai";
import { printTerm } from "../src/termprinter";
import { Application, Abstraction, Variable } from "../src/ast";

const expect = chai.expect;

describe("Term printer tests", () => {
    it("Basic print test", () => {
        expect(
            printTerm(
                new Application(
                    new Abstraction("x", new Application(new Variable("x"), new Variable("x"))),
                    new Abstraction("y", new Application(new Variable("y"), new Variable("y")))
                )
            )
        ).to.equal("((λx. (x x)) (λy. (y y)))");
    });
});
