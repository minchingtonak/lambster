#!/usr/bin/env node
import { Lexer } from "./lexer";
import { Token } from "./token";
import { Parser } from "./parser";
import { Stmt } from "./ast";
import { LambdaError } from "./error";
import { Interpreter } from "./interpreter";
import logger from "./logger";
import * as readline from "readline";
import * as fs from "fs";

export module LambdaCalculus {
    const reader = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const interpreter: Interpreter = new Interpreter(false);

    export function main() {
        try {
            const args: { [key: string]: string } = parseArgs();
            if ("filename" in args) {
                runFile(args["filename"]);
                process.exit(0);
            }
            runPrompt();
        } catch (e) {
            logger.log(e.message);
            usage();
            process.exit(64);
        }
    }

    function parseArgs(): { [key: string]: string } {
        const obj: { [key: string]: string } = {};
        process.argv.slice(2).forEach(arg => {
            if (arg.startsWith("-")) {
                switch (arg.substr(1)) {
                    case "v":
                        logger.incrVerbosity(1);
                        break;
                    case "vv":
                        logger.incrVerbosity(2);
                        break;
                    default:
                        throw new Error(`Failed to parse arguments: unexpected option '${arg}'`);
                }
            } else {
                if ("filename" in obj)
                    throw new Error(`Failed to parse arguments: unexpected '${arg}'`);
                obj["filename"] = arg;
            }
        });
        return obj;
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

    function usage() {
        logger.log(`Usage: ${process.argv[2]} (-v|-vv)? [FILE]`);
    }
}

LambdaCalculus.main();
