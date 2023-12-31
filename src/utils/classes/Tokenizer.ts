import { operators } from "../constants/operators";
import { TOKEN } from "../constants/tokenTypes";

export type Token = {
  str: string;
  type: number;
  row: number;
  col: number;
};

export default class Tokenizer {
  private input: string = "";
  private ptr: number = 0;
  private row: number = 0;
  private col: number = -1;
  private currentToken: Token = {
    str: "bof",
    type: TOKEN.BOF,
    col: this.col,
    row: this.row
  };

  constructor(str: string = "") {
    this.setInput(str);
  }

  public setInput(input: string) {
    this.input = input;
    this.ptr = 0;
    this.row = 0;
    this.col = -1;
    this.currentToken = {
      str: "bof",
      type: TOKEN.BOF,
      col: this.col,
      row: this.row
    }
  }

  private setCurrentToken(str: string, tokenID: number) {
    this.currentToken = {
      str: str,
      type: tokenID,
      row: this.row,
      col: this.col - str.length,
    };
  }

  private getCurrentChar() {
    return this.input.charAt(this.ptr);
  }

  private skipWhiteSpaces() {
    while (this.getCurrentChar() === " " || this.getCurrentChar() === "\n") {
      this.ptr++;
      this.col++;
      if (this.getCurrentChar() === "\n") {
        this.col = 0;
        this.row++;
      }
    }
  }

  private getOperator(): string {
    let str = "";

    do {
      str += this.getCurrentChar();
      this.ptr++;
    } while (
      this.ptr < this.input.length &&
      str + this.getCurrentChar() in operators
    );

    return str;
  }

  public advance(): void {
    let str = "";

    if (this.ptr >= this.input.length) {
      this.currentToken = {
        str: "\0",
        type: TOKEN.EOF,
        row: this.row,
        col: this.col,
      };
      return;
    }

    if (this.getCurrentChar() === " " || this.getCurrentChar() === "\n") {
      this.skipWhiteSpaces();
    }

    if (this.getCurrentChar() in operators) {
      str = this.getOperator();
      this.setCurrentToken(str, operators[str].tokenID);
      return;
    }

    do {
      str += this.getCurrentChar();
      this.ptr++;
      this.col++;
    } while (
      this.ptr < this.input.length &&
      this.getCurrentChar() !== " " &&
      this.getCurrentChar() !== "\n" &&
      !(this.getCurrentChar() in operators)
    );

    this.setCurrentToken(str, TOKEN.VARIABLE);
  }

  public getCurrentPosition() {
    return this.ptr;
  }

  public getCurrentToken(): Token {
    return this.currentToken;
  }

  public getNextToken() {
    this.advance();
    return this.getCurrentToken();
  }
}
