import { Token } from "./token";
import { TokenType } from "./tokentype";
import { LambdaError } from "./error";
import { Term, Abstraction, Variable, Application } from "./ast";

export class Parser {
    private tokens: Token[];
    private current: number = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    parseTerm(): Term {
        try {
            const parsed: Term = this.term();
            if (!this.isAtEnd())
                throw this.error(this.peek(), `Unexpected token '${this.peek().lexeme}'`);
            return parsed;
        } catch (p) {
            return null;
        }
    }

    private term(): Term {
        if (this.match(TokenType.LAMBDA)) {
            return this.abstraction();
        }
        return this.application();
    }

    private abstraction(): Term {
        const ident: string = this.consume(
            TokenType.IDENTIFIER,
            "No identifier in abstraction definition."
        ).lexeme;
        this.consume(TokenType.DOT, "No dot in abstraction definition.");
        return new Abstraction(ident, this.term());
    }

    private application(): Term {
        let term: Term = this.atom();

        while (this.check(TokenType.LPAREN) || this.check(TokenType.IDENTIFIER)) {
            term = new Application(term, this.atom());
        }

        return term;
    }

    private atom(): Term {
        if (this.match(TokenType.LPAREN)) {
            const term: Term = this.term();
            this.consume(TokenType.RPAREN, "Expected ')' to close grouping.");
            //TODO consider adding explicit grouping ast node
            return term;
        }

        if (this.match(TokenType.IDENTIFIER)) return new Variable(this.previous().lexeme);

        throw this.error(this.peek(), "Unexpected token.");
    }

    private match(...types: TokenType[]): boolean {
        for (let type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }

        return false;
    }

    private consume(type: TokenType, message: string): Token {
        if (this.check(type)) return this.advance();

        throw this.error(this.peek(), message);
    }

    private check(type: TokenType): boolean {
        if (this.isAtEnd()) return false;
        return this.peek().type === type;
    }

    private advance(): Token {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    private isAtEnd(): boolean {
        return this.peek().type === TokenType.EOF;
    }

    private peek(): Token {
        return this.tokens[this.current];
    }

    private previous(): Token {
        return this.tokens[this.current - 1];
    }

    private error(token: Token, message: string): LambdaError.ParseError {
        LambdaError.hasError = true;
        LambdaError.error(token, message);
        return new LambdaError.ParseError();
    }
}
