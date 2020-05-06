import { TokenType } from "./tokentype";

export class Token {
    type: TokenType;
    lexeme: string;
    line: number;
    start: number;
    length: number;

    constructor(type: TokenType, lexeme: string, line: number, startcol: number, length: number) {
        this.type = type;
        this.lexeme = lexeme;
        this.line = line;
        this.start = startcol;
        this.length = length;
    }
}
