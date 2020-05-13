#!/usr/bin/env node
import { Lexer } from "./lexer";
import { Token } from "./token";
import { Parser } from "./parser";
import { Term } from "./ast";
import { AstPrinter } from "./astprinter";
import { LambdaError } from "./error";
import { Reducer } from "./reducer";
import * as readline from "readline";

export module LambdaCalculus {
    const reader = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const reducer: Reducer = new Reducer();

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
        const lexer: Lexer = new Lexer(source);
        const tokens: Token[] = lexer.scanTokens();
        const parser: Parser = new Parser(tokens);
        const term: Term = parser.parseTerm();

        if (LambdaError.hasError) return;

        console.log(new AstPrinter().print(reducer.reduceTerm(term)));
    }

    function usage(args: string[]) {
        console.log(`Usage: ${args[0]} [FILE]`);
    }
}

LambdaCalculus.main();
