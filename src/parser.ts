import { Token } from "./token";
import { TokenType } from "./tokentype";
import { LambdaError } from "./error";
import { Term, Abstraction, Variable, Application, Binding, Stmt } from "./ast";

export class Parser {
    private tokens: Token[];
    private current: number = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    parse(): Stmt[] {
        const stmts: Stmt[] = [];
        while (!this.isAtEnd()) stmts.push(this.stmt());
        return stmts;
    }

    parseTerm(): Term {
        try {
            const parsed: Term = this.termStmt();
            if (!this.isAtEnd())
                throw this.error(this.peek(), `Unexpected token '${this.peek().lexeme}'.`);
            return parsed;
        } catch (p) {
            return null;
        }
    }

    private stmt(): Stmt {
        try {
            if (this.check(TokenType.IDENTIFIER) && this.checkNext(TokenType.EQUALS))
                return this.binding();
            return this.termStmt();
        } catch (p) {
            this.synchronize();
            return null;
        }
    }

    private binding(): Binding {
        const ident: string = this.consume(TokenType.IDENTIFIER, "No identifier in binding.")
            .lexeme;
        this.consume(TokenType.EQUALS, "Expected '=' in binding.");
        const term: Term = this.term();
        this.consume(TokenType.NEWLINE, "Expected newline after binding statement.");
        return new Binding(ident, term);
    }

    private termStmt(): Term {
        const term: Term = this.term();
        this.consume(TokenType.NEWLINE, "Expected newline after term.");
        return term;
    }

    private term(): Term {
        return this.match(TokenType.LAMBDA) ? this.abstraction() : this.application();
    }

    private abstraction(): Term {
        const ident: string = this.consume(
            TokenType.IDENTIFIER,
            "No identifier in abstraction definition."
        ).lexeme;
        this.consume(
            TokenType.DOT,
            `Expected dot after abstraction declaration, got '${this.peek().lexeme}'.`
        );
        return new Abstraction(ident, this.term());
    }

    private application(): Term {
        let term: Term = this.atom();

        while (
            this.check(TokenType.LPAREN) ||
            this.check(TokenType.IDENTIFIER) ||
            this.check(TokenType.LAMBDA)
        ) {
            term = new Application(term, this.atom());
        }

        return term;
    }

    private atom(): Term {
        if (this.match(TokenType.LPAREN)) {
            const term: Term = this.term();
            this.consume(TokenType.RPAREN, "Expected ')' to close expression.");
            return term;
        }

        if (this.match(TokenType.IDENTIFIER)) return new Variable(this.previous().lexeme);

        if (this.match(TokenType.LAMBDA)) return this.abstraction();

        throw this.error(this.peek(), `Unexpected token '${this.peek().lexeme}'.`);
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

    private checkNext(type: TokenType): boolean {
        if (this.isAtEnd()) return false;
        return this.peekNext().type === type;
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

    private peekNext(): Token {
        return this.current >= this.tokens.length
            ? this.tokens[this.tokens.length - 1]
            : this.tokens[this.current + 1];
    }

    private previous(): Token {
        return this.tokens[this.current - 1];
    }

    private synchronize() {
        this.advance();

        while (!this.isAtEnd()) {
            if (this.previous().type == TokenType.NEWLINE) return;
            this.advance();
        }
    }

    private error(token: Token, message: string): LambdaError.ParseError {
        LambdaError.error(token, message);
        return new LambdaError.ParseError();
    }
}
