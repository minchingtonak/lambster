#!/usr/bin/env node
import { Lexer } from "./lexer";
import { Token } from "./token";
import { Parser } from "./parser";
import { Term, Stmt } from "./ast";
import { AstPrinter } from "./astprinter";
import { LambdaError } from "./error";
import { Reducer } from "./reducer";
import * as readline from "readline";
import { Interpreter } from "./interpreter";

export module LambdaCalculus {
    const reader = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const interpreter: Interpreter = new Interpreter(true);

    export function main() {
        const args = process.argv.slice(1);
        switch (args.length) {
            case 2:
                runFile(args[1]);
                break;
            case 1:
                runPrompt();
                break;
            default:
                usage(args);
                break;
        }
    }

    function runFile(filename: string) {
        // open file, send contents to run
        // if haserror, exit 65
        console.log("Hello, it seems like this isn't implemented yet.");
    }

    async function runPrompt() {
        function waitForLine(prompt: string): Promise<string> {
            return new Promise((resolve, reject) => {
                reader.question(prompt, answer => {
                    resolve(answer);
                });
            });
        }
        process.on("SIGINT", _ => {
            reader.close();
            console.log("\nGoodbye.");
            process.exit(0);
        });
        for (;;) {
            run(await waitForLine("λ> "));
            LambdaError.hasError = false;
        }
    }

    function run(source: string) {
        const lexer: Lexer = new Lexer(source),
            tokens: Token[] = lexer.scanTokens(),
            parser: Parser = new Parser(tokens),
            stmts: Stmt[] = parser.parse();

        if (LambdaError.hasError) return;

        interpreter.interpret(stmts);
    }

    function usage(args: string[]) {
        console.log(`Usage: ${args[0]} [FILE]`);
    }
}

LambdaCalculus.main();
