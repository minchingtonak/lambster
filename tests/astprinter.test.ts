import * as chai from "chai";
import { AstPrinter } from "../src/astprinter";
import { Application, Abstraction, Variable } from "../src/ast";

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
