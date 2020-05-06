import * as mocha from "mocha";
import * as chai from "chai";
import { AstPrinter } from "./astprinter";
import { Term, Application, Abstraction, Variable } from "./ast";

const expect = chai.expect;

describe("AST printer tests", () => {
    it("Basic print test", () => {
        expect(
            new AstPrinter().print(
                new Application(
                    new Abstraction("x", new Application(new Variable("x"), new Variable("x"))),
                    new Abstraction("y", new Application(new Variable("y"), new Variable("y")))
                )
            )
        ).to.equal("((λx. (x x)) (λy. (y y)))");
    });
});
