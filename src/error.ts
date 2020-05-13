import { Token } from "./token";
import { TokenType } from "./tokentype";
import { SourceData } from "./sourcedata";

export module LambdaError {
    export class LexError {}
    export class ParseError {}

    export let hasError: boolean = false;

    export function error(token: Token, message: string, verbose = true) {
        hasError = true;
        console.log(
            `Error at ${
                token.type === TokenType.EOF
                    ? "end of file"
                    : "line " + token.line + " [" + token.start + ", " + (token.start + token.length) + "]"
            }: ${message}`
        );
        if (verbose) verboseError(token);
    }

    function verboseError(token: Token) {
        let pointer: string = "";
        for (let i = 1; i < token.start + token.length; ++i)
            pointer += i >= token.start ? "^" : " ";
        if (token.type === TokenType.EOF) pointer += '^';
        console.log(`\t${SourceData.current_source}\n\t${pointer}\n`);
    }
}
