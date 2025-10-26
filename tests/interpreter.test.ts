import * as chai from "chai";
import { Interpreter } from "../src/interpreter";
import { Verbosity } from "../src/logger";

const expect = chai.expect;

describe("Interpreter tests", () => {
    it("Interpreter setOptions tests", () => {
        const int: Interpreter = new Interpreter();
        int.evaluate("");
        int.setOptions({ rename_free_vars: true });
        int.evaluate("x");
        int.setOptions({ rename_free_vars: false });
        int.evaluate("x");
        int.setOptions({ verbosity: Verbosity.LOW, rename_free_vars: true });
        int.evaluate("x");
        int.evaluate("true"); // expects equivalent to true
        int.setOptions({ verbosity: Verbosity.NONE, show_equivalent: false });
        int.evaluate("true"); // expects no equivalent line
    });

    it("Evaluate test", () => {
        let result = "";
        const int: Interpreter = new Interpreter({
            transports: [log => (result = log)],
            verbosity: Verbosity.NONE,
            show_equivalent: false,
        });

        int.evaluate("or true false");

        expect(result).to.equal(">>> (λX0. (λf. X0))");

        int.evaluate("times two three");

        expect(result).to.equal(">>> (λf. (λy. (f (f (f (f (f (f y))))))))");
    });
});
