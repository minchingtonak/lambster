import * as chai from "chai";
import { Lexer } from "../src/lexer";
import { TokenType } from "../src/tokentype";
import { Token } from "../src/token";

const expect = chai.expect;

describe("Lexer tests", () => {
    it("Basic lexing test", () => {
        console.log(new Lexer("(").scanTokens())
        expect(new Lexer("(").scanTokens()).deep.equal([
            new Token(TokenType.LPAREN, "(", 1, 1, 1),
            new Token(TokenType.NEWLINE, "<newline>", 1, 2, 1),
            new Token(TokenType.EOF, "", 1, 2, 0),
        ]);
    });

    it("Slightly more involved test", () => {
        expect(new Lexer("((  )( L 12llo \t \n .. λlambda").scanTokens()).deep.equal([
            new Token(TokenType.LPAREN, "(", 1, 1, 1),
            new Token(TokenType.LPAREN, "(", 1, 2, 1),
            new Token(TokenType.RPAREN, ")", 1, 5, 1),
            new Token(TokenType.LPAREN, "(", 1, 6, 1),
            new Token(TokenType.LAMBDA, "L", 1, 8, 1),
            new Token(TokenType.IDENTIFIER, "12llo", 1, 10, 5),
            new Token(TokenType.NEWLINE, "<newline>", 1, 18, 1),
            new Token(TokenType.DOT, ".", 2, 20, 1),
            new Token(TokenType.DOT, ".", 2, 21, 1),
            new Token(TokenType.LAMBDA, "λ", 2, 23, 1),
            new Token(TokenType.LAMBDA, "lambda", 2, 24, 6),
            new Token(TokenType.NEWLINE, "<newline>", 2, 30, 1),
            new Token(TokenType.EOF, "", 2, 30, 0),
        ]);
    });
});
