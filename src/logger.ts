import { LoggerOptions } from "./types";
import { Token } from "./token";
import { TokenType } from "./tokentype";
import { Writable } from "stream";

export enum Verbosity {
    NONE = 0,
    LOW,
    HIGH,
}

class Logger {
    hasError: boolean = false;
    private verbosity: Verbosity;
    private source: string[];
    private os: Writable;

    constructor(options: LoggerOptions) {
        this.verbosity = options.verbosity;
        if (options.source) this.source = options.source.split("\n");
        this.os = options.output_stream;
    }

    setSource(source: string) {
        this.source = source.split("\n");
    }

    log(message: string) {
        this.print(message, Verbosity.NONE);
    }

    vlog(message: string) {
        this.print(message, Verbosity.LOW);
    }

    vvlog(message: string) {
        this.print(message, Verbosity.HIGH);
    }

    reportError(token: Token, message: string, verbose = true) {
        this.hasError = true;
        this.log(
            `Error at ${
                token.type === TokenType.EOF
                    ? "end of file"
                    : "line " +
                      token.line +
                      " [" +
                      token.start +
                      ", " +
                      (token.start + token.length) +
                      "]"
            }: ${message}`
        );
        if (verbose) this.verboseError(token);
    }

    private print(message: string, target: Verbosity) {
        if (this.verbosity < target) return;
        this.os.write(`${message}\n`);
    }

    private verboseError(token: Token) {
        let indicator: string = "";
        for (let i = 1; i < token.start + token.length; ++i)
            indicator += i >= token.start ? "^" : " ";
        if (token.type === TokenType.EOF) indicator += "^";
        this.log(`\t${this.source[token.line - 1]}\n\t${indicator}\n`);
    }
}

export class LexError {
    static type: string = "lexerror";
}
export class ParseError {
    static type: string = "parseerror";
}

export default Logger;
