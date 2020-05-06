import { Lexer } from "../src/lexer";
import { TokenType } from "../src/tokentype";
import { Token } from "../src/token";

import * as mocha from "mocha";
import * as chai from "chai";

const expect = chai.expect;

describe("Lexer tests", () => {
    it("Basic lexing test", () => {
        expect(new Lexer("(").scanTokens()).deep.equal([
            new Token(TokenType.LPAREN, "(", 1, 1, 1),
            new Token(TokenType.EOF, "", 1, 1, 0),
        ]);
    });

    it("Slightly more involved test", () => {
        expect(new Lexer("((  )( L hello \t \n ..").scanTokens()).deep.equal([
            new Token(TokenType.LPAREN, "(", 1, 1, 1),
            new Token(TokenType.LPAREN, "(", 1, 2, 1),
            new Token(TokenType.RPAREN, ")", 1, 5, 1),
            new Token(TokenType.LPAREN, "(", 1, 6, 1),
            new Token(TokenType.LAMBDA, "L", 1, 8, 1),
            new Token(TokenType.IDENTIFIER, "hello", 1, 10, 5),
            new Token(TokenType.DOT, ".", 2, 20, 1),
            new Token(TokenType.DOT, ".", 2, 21, 1),
            new Token(TokenType.EOF, "", 2, 21, 0),
        ]);
    });
});
