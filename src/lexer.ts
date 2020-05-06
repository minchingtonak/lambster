import { Token } from "./token";
import { TokenType } from "./tokentype";
import './error';
import { LambdaError } from "./error";

export class Lexer {
    private source: string;
    private tokens: Token[] = [];

    private start: number = 0;
    private current: number = 0;
    private line: number = 1;
    //TODO generalize this lexer to take in arbitrary token rules
    constructor(source: string) {
        this.source = source;
    }

    scanTokens(): Token[] {
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.scanToken();
        }

        this.tokens.push(new Token(TokenType.EOF, "", this.line));
        return this.tokens;
    }

    private scanToken() {
        let c: string = this.advance();
        switch (c) {
            case "(":
                this.addToken(TokenType.LPAREN);
                break;
            case ")":
                this.addToken(TokenType.RPAREN);
                break;
            case "L":
            case "λ":
                this.addToken(TokenType.LAMBDA);
                break;
            case ".":
                this.addToken(TokenType.DOT);
                break;
            case " ":
            case "\t":
            case "\r":
                break;
            case "\n":
                ++this.line;
                break;
            default:
                if (this.isLowerAlpha(c)) {
                    this.identifier();
                } else {
                    this.error(c, "Unexpected character.")
                }
        }
    }

    private identifier() {
        while (this.isLowerAlpha(this.peek())) this.advance();

        //TODO add library lambdas, match them against scanned identifier
        this.addToken(TokenType.IDENTIFIER);
    }

    private match(expected: string): boolean {
        if (this.isAtEnd()) return false;
        if (this.source.charAt(this.current) !== expected) return false;
        ++this.current;
        return true;
    }

    private peek(): string {
        return this.isAtEnd() ? "\0" : this.source.charAt(this.current);
    }

    private peekNext(): string {
        return this.current + 1 >= this.source.length ? "\0" : this.source.charAt(this.current + 1);
    }

    private isLowerAlpha(s: string): boolean {
        return /^[a-z]$/.test(s);
    }

    private isAtEnd(): boolean {
        return this.current >= this.source.length;
    }

    private advance(): string {
        return this.source.charAt(this.current++);
    }

    private addToken(type: TokenType) {
        this.tokens.push(new Token(type, this.source.substring(this.start, this.current), this.line));
    }

    private error(character: string, message: string): LambdaError.LexError {
        LambdaError.error(new Token(TokenType.ERROR, character, this.line), message);
        return new LambdaError.LexError();
    }
}
