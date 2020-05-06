import { Token } from "./token";
import { TokenType } from "./tokentype";

export module LambdaError {
    export class LexError {}
    export class ParseError {}

    export let hasError: boolean = false;

    export function error(token: Token, message: string) {
        console.log(
            `Error at ${token.type === TokenType.EOF ? "end" : "line " + token.line}: ${message}`
        );
    }
}
