import * as chai from "chai";
import { Lexer } from "../src/lexer";
import { TokenType } from "../src/tokentype";
import { Token } from "../src/token";
import { logger } from "./util";

const expect = chai.expect;

describe("Lexer tests", () => {
    it("Basic lexing test", () => {
        expect(new Lexer("(", logger).lexTokens()).deep.equal([
            new Token(TokenType.LPAREN, "(", 1, 1, 1),
            new Token(TokenType.NEWLINE, "<newline>", 1, 2, 1),
            new Token(TokenType.EOF, "", 1, 2, 0),
        ]);
    });

    it("Slightly more involved test", () => {
        expect(new Lexer("((  )( L 12llo \t \n .. λlambda", logger).lexTokens()).deep.equal([
            new Token(TokenType.LPAREN, "(", 1, 1, 1),
            new Token(TokenType.LPAREN, "(", 1, 2, 1),
            new Token(TokenType.RPAREN, ")", 1, 5, 1),
            new Token(TokenType.LPAREN, "(", 1, 6, 1),
            new Token(TokenType.LAMBDA, "L", 1, 8, 1),
            new Token(TokenType.IDENTIFIER, "12llo", 1, 10, 5),
            new Token(TokenType.NEWLINE, "<newline>", 1, 18, 1),
            new Token(TokenType.DOT, ".", 2, 2, 1),
            new Token(TokenType.DOT, ".", 2, 3, 1),
            new Token(TokenType.LAMBDA, "λ", 2, 5, 1),
            new Token(TokenType.LAMBDA, "lambda", 2, 6, 6),
            new Token(TokenType.NEWLINE, "<newline>", 2, 12, 1),
            new Token(TokenType.EOF, "", 2, 12, 0),
        ]);
    });
});
