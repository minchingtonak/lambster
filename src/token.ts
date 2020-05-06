import { TokenType } from './tokentype';

export class Token {
    type: TokenType;
    lexeme: string;
    line: number

    constructor(type: TokenType, lexeme: string, line: number) {
        this.type = type;
        this.lexeme = lexeme;
        this.line = line;
    }
}