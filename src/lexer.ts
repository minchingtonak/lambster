import { Token } from "./token";
import { TokenType } from "./tokentype";
import { LambdaError } from "./error";
import { SourceData } from "./sourcedata";

export class Lexer {
    private source: string;
    private tokens: Token[] = [];

    private start: number = 0;
    private current: number = 0;
    private line: number = 1;
    //TODO generalize this lexer to take in arbitrary token rules
    constructor(source: string) {
        this.source = source;
        SourceData.current_source = source;
    }

    constuctor() {
        this.source = SourceData.current_source;
    }

    scanTokens(): Token[] {
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.scanToken();
        }

        this.tokens.push(this.genToken(TokenType.EOF, "", true));
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
                if (this.isLowerAlphaNumeric(c)) {
                    this.identifier();
                } else {
                    this.error(c, `Unexpected character '${c}'`);
                }
        }
    }

    private identifier() {
        while (this.isLowerAlphaNumeric(this.peek())) this.advance();

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

    private isLowerAlphaNumeric(s: string): boolean {
        return /^[a-z0-9]$/.test(s);
    }

    private isAtEnd(): boolean {
        return this.current >= this.source.length;
    }

    private advance(): string {
        return this.source.charAt(this.current++);
    }

    private addToken(type: TokenType) {
        this.tokens.push(this.genToken(type, this.source.substring(this.start, this.current)));
    }

    private error(character: string, message: string): LambdaError.LexError {
        LambdaError.error(this.genToken(TokenType.ERROR, character), message);
        return new LambdaError.LexError();
    }

    private genToken(type: TokenType, lexeme: string, eof = false): Token {
        return new Token(
            type,
            lexeme,
            this.line,
            this.start + 1,
            eof ? 0 : this.current - this.start
        );
    }
}
