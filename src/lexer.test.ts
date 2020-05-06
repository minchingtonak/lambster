import { Lexer } from "./lexer";
import { TokenType } from "./tokentype";
import { Token } from "./token";

import * as mocha from "mocha";
import * as chai from "chai";

const expect = chai.expect;

describe("Lexer tests", () => {
    it("Basic lexing test", () => {
        expect(new Lexer("(").scanTokens()).deep.equal([
            new Token(TokenType.LPAREN, "(", 1),
            new Token(TokenType.EOF, "", 1),
        ]);
    });

    it("Slightly more involved test", () => {
        expect(new Lexer("((  )( L hello \t \n ..").scanTokens()).deep.equal([
            new Token(TokenType.LPAREN, "(", 1),
            new Token(TokenType.LPAREN, "(", 1),
            new Token(TokenType.RPAREN, ")", 1),
            new Token(TokenType.LPAREN, "(", 1),
            new Token(TokenType.LAMBDA, "L", 1),
            new Token(TokenType.IDENTIFIER, "hello", 1),
            new Token(TokenType.DOT, ".", 2),
            new Token(TokenType.DOT, ".", 2),
            new Token(TokenType.EOF, "", 2),
        ]);
    });
});
