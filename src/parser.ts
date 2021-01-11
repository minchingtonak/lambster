import { Token } from "./token";
import { TokenType } from "./tokentype";
import {
    Term,
    Abstraction,
    Variable,
    Application,
    BindingStmt,
    Stmt,
    CommandStmt,
    CommandType,
    TermStmt,
} from "./ast";
import Logger, { ParseError } from "./logger";

class AbstractionIndexList {
    private counter: number = 1;
    private ids: { [key: string]: number[] } = {};

    constructor(start_index: number) {
        this.counter = start_index;
    }

    currentIndex(): number {
        return this.counter;
    }

    push(name: string) {
        if (!(name in this.ids)) this.ids[name] = [];
        this.ids[name].push(this.counter++);
    }

    pop(name: string) {
        this.ids[name].pop();
        if (this.ids[name].length === 0) delete this.ids[name];
    }

    get(name: string) {
        return this.ids[name][this.ids[name].length - 1];
    }

    has(name: string) {
        return name in this.ids;
    }
}

export class Parser {
    private current: number = 0;

    private idList: AbstractionIndexList;

    constructor(private tokens: Token[] = [], private logger: Logger = new Logger(), start_index: number = 1) {
        this.idList = new AbstractionIndexList(start_index);
    }

    setTokens(tokens: Token[]) {
        this.tokens = tokens;
        this.current = 0;
    }

    currentIndex() {
        return this.idList.currentIndex();
    }

    parse(): Stmt[] {
        const stmts: Stmt[] = [];
        while (!this.isAtEnd()) stmts.push(this.stmt());
        return stmts;
    }

    parseTerm(): Term {
        try {
            const parsed: TermStmt = this.termStmt();
            if (!this.isAtEnd())
                throw this.error(this.peek(), `Unexpected token '${this.peek().lexeme}'.`);
            return parsed.term;
        } catch (p) {
            return null;
        }
    }

    private stmt(): Stmt {
        try {
            while (this.peek().type === TokenType.NEWLINE) this.advance();
            if (this.check(TokenType.IDENTIFIER) && this.checkNext(TokenType.EQUALS))
                return this.bindingStmt();
            else if (this.match(TokenType.ENV)) return this.cmdStmt(TokenType.ENV, "env");
            else if (this.match(TokenType.HELP)) return this.cmdStmt(TokenType.HELP, "help");
            else if (this.match(TokenType.UNBIND)) return this.unbindStmt();
            return this.termStmt();
        } catch (p) {
            this.synchronize();
            return null;
        }
    }

    private bindingStmt(): BindingStmt {
        const ident: string = this.consume(TokenType.IDENTIFIER, "No identifier in binding.")
            .lexeme;
        this.consume(TokenType.EQUALS, "Expected '=' in binding.");
        const term: Term = this.term();
        this.consume(TokenType.NEWLINE, "Expected newline after binding statement.");
        return new BindingStmt(ident, term);
    }

    private static tokenToCmd: CommandType[] = [
        null,
        null,
        null,
        CommandType.ENV,
        null,
        CommandType.HELP,
        null,
        null,
        null,
        null,
        null,
        null,
    ];
    private cmdStmt(type: TokenType, str: string): CommandStmt {
        this.consume(TokenType.NEWLINE, `Expected newline after ${str} command.`);
        return new CommandStmt(Parser.tokenToCmd[type]);
    }

    private unbindStmt(): CommandStmt {
        const ident: string = this.consume(
            TokenType.IDENTIFIER,
            "No identifier in unbind statement."
        ).lexeme;
        this.consume(TokenType.NEWLINE, "Expected newline after unbind command.");
        return new CommandStmt(CommandType.UNBIND, ident);
    }

    private termStmt(): TermStmt {
        const term: Term = this.term();
        this.consume(TokenType.NEWLINE, "Expected newline after term.");
        return new TermStmt(term);
    }

    private term(): Term {
        return this.match(TokenType.LAMBDA) ? this.abstraction() : this.application();
    }

    private abstraction(): Term {
        let idents: string[] = [];
        idents.push(
            this.consume(
                TokenType.IDENTIFIER,
                "Expected at least one identifier in abstraction definition."
            ).lexeme
        );

        while (this.peek().type === TokenType.IDENTIFIER) idents.push(this.advance().lexeme);

        this.consume(
            TokenType.DOT,
            `Expected dot after abstraction declaration, got '${this.peek().lexeme}'.`
        );

        // Give each abstraction its own id
        idents.forEach(ident => {
            this.idList.push(ident);
        });

        // Construct nested abstraction from the innermost out
        const reversed: string[] = idents.reverse(),
            innermost: string = reversed[0];
        let abs: Abstraction = new Abstraction(innermost, this.idList.get(innermost), this.term());
        this.idList.pop(innermost);
        reversed.slice(1).forEach(ident => {
            abs = new Abstraction(ident, this.idList.get(ident), abs);
            this.idList.pop(ident);
        });

        return abs;
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

        if (this.match(TokenType.IDENTIFIER)) {
            const name: string = this.previous().lexeme;
            return new Variable(name, this.idList.has(name) ? this.idList.get(name) : 0);
        }

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

    private error(token: Token, message: string): ParseError {
        this.logger.reportError(token, message);
        return new ParseError();
    }
}
