import { Token } from "./token";
import { TokenType } from "./tokentype";
import sourcedata from "./sourcedata";
import logger from "./logger";

class ErrorReporter {
    hasError: boolean = false;

    reportError(token: Token, message: string, verbose = true) {
        this.hasError = true;
        logger.log(
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

    private verboseError(token: Token) {
        let indicator: string = "";
        for (let i = 1; i < token.start + token.length; ++i)
            indicator += i >= token.start ? "^" : " ";
        if (token.type === TokenType.EOF) indicator += "^";
        logger.log(`\t${sourcedata.getSourceLine(token.line)}\n\t${indicator}\n`);
    }
}

export class LexError {
    static type: string = "lexerror";
}
export class ParseError {
    static type: string = "parseerror";
}
export const reporter = new ErrorReporter();
