#!/usr/bin/env node
import { Interpreter } from "./interpreter";
import { Verbosity } from "./logger";
import * as readline from "readline";
import * as fs from "fs";

module LambdaCalculus {
    const reader = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    let interpreter: Interpreter;

    export function main() {
        try {
            const args = parseArgs();
            if ("help" in args) {
                usage();
                process.exit(0);
            }
            interpreter = new Interpreter({
                verbosity: args.verbosity as Verbosity,
                output_stream: process.stdout,
                rename_free_vars: args["rename_free_vars"],
            });
            if ("filename" in args) {
                runFile(args["filename"] as string);
                process.exit(0);
            }
            runPrompt();
        } catch (e) {
            console.log(e.message);
            usage();
            process.exit(64);
        }
    }

    function parseArgs() {
        const options = { verbosity: Verbosity.NONE, rename_free_vars: false };
        process.argv.slice(2).forEach(arg => {
            if (arg.startsWith("-")) {
                switch (arg.substr(1)) {
                    case "v":
                        if (options["verbosity"] < Verbosity.LOW)
                            options["verbosity"] = Verbosity.LOW;
                        break;
                    case "vv":
                        options["verbosity"] = Verbosity.HIGH;
                        break;
                    case "r":
                        options["rename_free_vars"] = true;
                        break;
                    case "-help":
                    case "h":
                        options["help"] = true;
                        break;
                    default:
                        throw new Error(`Failed to parse arguments: unexpected option '${arg}'`);
                }
            } else {
                if ("filename" in options)
                    throw new Error(`Failed to parse arguments: unexpected '${arg}'`);
                options["filename"] = arg;
            }
        });
        return options;
    }

    function runFile(filename: string) {
        try {
            const source: string = fs.readFileSync(filename, "utf-8");
            run(source);
            // https://www.freebsd.org/cgi/man.cgi?query=sysexits&apropos=0&sektion=0&manpath=FreeBSD%204.3-RELEASE&format=html
            if (interpreter.hadError()) process.exit(65);
        } catch (e) {
            if (e.code === "ENOENT") {
                console.log(`Error: file '${filename}' not found.`);
                process.exit(66);
            } else {
                console.log("Uh oh. Something went wrong. Here's the error:");
                console.log(e);
            }
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
        console.log(
            "lambster: A lambda calculus interpreter\n -- type 'help' for more information"
        );
        for (;;) run(await waitForLine("λ> "));
    }

    function run(source: string) {
        interpreter.evaluate(source);
    }

    function usage() {
        console.log(`Usage: ${process.argv[1]} (-v|-vv)? (-r)? (-h|--help)? [FILE]`);
    }
}

LambdaCalculus.main();
