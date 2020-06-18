import * as chai from "chai";
import { Interpreter } from "../src/interpreter";
import { Verbosity } from "../src/logger";

const expect = chai.expect;

describe("Interpreter tests", () => {
    it("Interpreter setOptions tests", () => {
        const int: Interpreter = new Interpreter();
        int.interpret("");
        int.setOptions({ rename_free_vars: true });
        int.interpret("x");
        int.setOptions({ rename_free_vars: false });
        int.interpret("x");
        int.setOptions({ verbosity: Verbosity.LOW, rename_free_vars: true });
        int.interpret("x");
    });
});
