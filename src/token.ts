import { TokenType } from './tokentype';

export class Token {
	constructor(
		public type: TokenType,
		public lexeme: string,
		public line: number,
		public start: number,
		public length: number
	) {}
}
