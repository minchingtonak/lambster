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
    });
});
