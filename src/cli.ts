#!/usr/bin/env node
import { Lexer } from "./lexer";
import { Token } from "./token";
import { Parser } from "./parser";
import { Stmt } from "./ast";
import { LambdaError } from "./error";
import { Interpreter } from "./interpreter";
import * as readline from "readline";
import * as fs from "fs";

export module LambdaCalculus {
    const reader = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const interpreter: Interpreter = new Interpreter(false);

    export function main() {
        const args = process.argv.slice(1);
        switch (args.length) {
            case 2:
                runFile(args[1]);
                process.exit(0);
            case 1:
                runPrompt();
                break;
            default:
                usage(args);
                break;
        }
    }

    function runFile(filename: string) {
        try {
            const source = fs.readFileSync(filename, "utf-8");
            run(source);
            // https://www.freebsd.org/cgi/man.cgi?query=sysexits&apropos=0&sektion=0&manpath=FreeBSD%204.3-RELEASE&format=html
            if (LambdaError.hasError) process.exit(65);
        } catch (e) {
            console.log(`Error: file '${filename}' not found.`);
            process.exit(66);
        }
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
