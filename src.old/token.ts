import { TokenType } from './tokentype';

export type Token = {
	type: TokenType;
	lexeme: string;
	line: number;
	start: number;
	length: number;
};
