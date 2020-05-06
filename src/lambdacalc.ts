import { Lexer } from "./lexer";
import { Token } from "./token";

export function run(source: string) {
    const lexer: Lexer = new Lexer(source);
    const tokens: Token[] = lexer.scanTokens();

    for (let token of tokens) {
        console.log(token);
    }
}
