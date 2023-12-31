import {
  equalityOperators,
  relationalOperators,
  unaryArithmeticOperators,
  unaryLogicalOperators,
} from "../constants/operators";
import { AbstractSyntaxTree } from "./AST/AbstractSyntaxTree";
import { BinaryOperatorSyntaxTree } from "./AST/BinaryOperatorSyntaxTree";
import { LiteralSyntaxTree } from "./AST/LiteralSyntaxTree";
import { UnaryOperatorSyntaxTree } from "./AST/UnaryOperatorSyntaxTree";
import Tokenizer from "./Tokenizer";

export default class Parser {
  private tokenizer: Tokenizer;

  constructor(input: string = "") {
    this.tokenizer = new Tokenizer(input);
  }

  public setInput(input: string) {
    this.tokenizer.setInput(input);
  }

  private eat(token: string) {
    const currToken = this.tokenizer.getCurrentToken();
    if (currToken.str !== token) {
      throw new Error(
        `"${token}" expected at row: "${currToken.row}" col: "${currToken.col}". Got "${currToken.str} instead."`
      );
    }
    this.tokenizer.advance();
  }

  private basePower(): AbstractSyntaxTree {
    const currToken = this.tokenizer.getNextToken();

    if (
      currToken.str in unaryArithmeticOperators ||
      currToken.str in unaryLogicalOperators
    ) {
      return new UnaryOperatorSyntaxTree(currToken, this.basePower());
    }
    if (
      !isNaN(Number(currToken.str)) ||
      currToken.str === "true" ||
      currToken.str === "false"
    ) {
      const root = new LiteralSyntaxTree(currToken);
      this.tokenizer.advance();
      return root;
    }
    if (currToken.str === "(") {
      const root = this.expression();
      this.eat(")");
      return root;
    }

    throw new Error(
      `Expression expected at row: "${currToken.row}" col: "${currToken.col}". Got "${currToken.str} instead."`
    );
  }

  private factor(): AbstractSyntaxTree {
    let root = this.basePower();

    while (this.tokenizer.getCurrentToken().str === "^") {
      root = new BinaryOperatorSyntaxTree(
        this.tokenizer.getCurrentToken(),
        root,
        this.factor()
      );
    }

    return root;
  }

  private term(): AbstractSyntaxTree {
    let root = this.factor();

    while (
      this.tokenizer.getCurrentToken().str === "*" ||
      this.tokenizer.getCurrentToken().str === "/"
    ) {
      root = new BinaryOperatorSyntaxTree(
        this.tokenizer.getCurrentToken(),
        root,
        this.factor()
      );
    }

    return root;
  }

  private arithmeitcExpression(): AbstractSyntaxTree {
    let root = this.term();

    while (
      this.tokenizer.getCurrentToken().str === "+" ||
      this.tokenizer.getCurrentToken().str === "-"
    ) {
      root = new BinaryOperatorSyntaxTree(
        this.tokenizer.getCurrentToken(),
        root,
        this.term()
      );
    }

    return root;
  }

  private relation(): AbstractSyntaxTree {
    let root = this.arithmeitcExpression();

    if (this.tokenizer.getCurrentToken().str in relationalOperators) {
      root = new BinaryOperatorSyntaxTree(
        this.tokenizer.getCurrentToken(),
        root,
        this.arithmeitcExpression()
      );
    }

    return root;
  }

  private equality(): AbstractSyntaxTree {
    let root = this.relation();

    while (this.tokenizer.getCurrentToken().str in equalityOperators) {
      root = new BinaryOperatorSyntaxTree(
        this.tokenizer.getCurrentToken(),
        root,
        this.relation()
      );
    }

    return root;
  }

  private conjunction(): AbstractSyntaxTree {
    let root = this.equality();

    while (this.tokenizer.getCurrentToken().str === "&&") {
      root = new BinaryOperatorSyntaxTree(
        this.tokenizer.getCurrentToken(),
        root,
        this.equality()
      );
    }

    return root;
  }

  private disjunction(): AbstractSyntaxTree {
    let root = this.conjunction();

    while (this.tokenizer.getCurrentToken().str === "||") {
      root = new BinaryOperatorSyntaxTree(
        this.tokenizer.getCurrentToken(),
        root,
        this.conjunction()
      );
    }

    return root;
  }

  private expression(): AbstractSyntaxTree {
    return this.disjunction();
  }

  public sentence(): AbstractSyntaxTree {
    const root = this.expression();
    this.eat(";");
    return root;
  }
}
