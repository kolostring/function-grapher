import {
  equalityOperators,
  relationalOperators,
  unaryArithmeticOperators,
  unaryLogicalOperators,
} from "../constants/operators";
import { TokenKind } from "../constants/tokenKinds";
import { AbstractSyntaxTree } from "./AST/AbstractSyntaxTree";
import { BinaryOperatorSyntaxTree } from "./AST/BinaryOperatorSyntaxTree";
import { LiteralSyntaxTree } from "./AST/LiteralSyntaxTree";
import { ProgramSyntaxTree } from "./AST/ProgramSyntaxTree";
import { UnaryOperatorSyntaxTree } from "./AST/UnaryOperatorSyntaxTree";
import { VariableDeclarationSyntaxTree } from "./AST/VariableDeclarationSyntaxTree";
import { VariableSyntaxTree } from "./AST/VariableSyntaxTree";
import Tokenizer from "./Tokenizer";

export default class Parser {
  private tokenizer: Tokenizer;

  constructor(input: string = "") {
    this.tokenizer = new Tokenizer(input);
  }

  public setInput(input: string) {
    this.tokenizer.setInput(input);
  }

  private eat(token: TokenKind) {
    const currToken = this.tokenizer.getCurrentToken();
    if (currToken.type !== token) {
      throw new Error(
        `<${TokenKind[token]}> expected at row: "${currToken.row}" col: "${currToken.col}". Got <${TokenKind[currToken.type]}>("${currToken.str}") instead.`
      );
    }
    this.tokenizer.advance();
  }

  private basePower(): AbstractSyntaxTree {
    const currToken = this.tokenizer.getCurrentToken();
    this.tokenizer.advance();
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
      return new LiteralSyntaxTree(currToken);
    }
    if (currToken.str === "(") {
      const root = this.expression();
      this.eat(TokenKind.R_PARENTHESIS);
      return root;
    }
    if (currToken.type === TokenKind.SYMBOL){
      return new VariableSyntaxTree(currToken);
    }

    throw new Error(
      `Expression expected at row: "${currToken.row}" col: "${currToken.col}". Got <${TokenKind[currToken.type]}>("${currToken.str}") instead."`
    );
  }

  private factor(): AbstractSyntaxTree {
    let root = this.basePower();

    let currToken;
    while (this.tokenizer.getCurrentToken().str === "^") {
      currToken = this.tokenizer.getCurrentToken();
      this.tokenizer.advance();
      root = new BinaryOperatorSyntaxTree(
        currToken,
        root,
        this.factor()
      );
    }

    return root;
  }

  private term(): AbstractSyntaxTree {
    let root = this.factor();

    let currToken;
    while (
      this.tokenizer.getCurrentToken().str === "*" ||
      this.tokenizer.getCurrentToken().str === "/"
    ) {
      currToken = this.tokenizer.getCurrentToken();
      this.tokenizer.advance();
      root = new BinaryOperatorSyntaxTree(
        currToken,
        root,
        this.factor()
      );
    }

    return root;
  }

  private arithmeitcExpression(): AbstractSyntaxTree {
    let root = this.term();
    
    let currToken;
    while (
      this.tokenizer.getCurrentToken().str === "+" ||
      this.tokenizer.getCurrentToken().str === "-"
    ) {
      currToken = this.tokenizer.getCurrentToken();
      this.tokenizer.advance();
      root = new BinaryOperatorSyntaxTree(
        currToken,
        root,
        this.term()
      );
    }

    return root;
  }

  private relation(): AbstractSyntaxTree {
    let root = this.arithmeitcExpression();

    let currToken;
    if (this.tokenizer.getCurrentToken().str in relationalOperators) {
      currToken = this.tokenizer.getCurrentToken();
      this.tokenizer.advance();
      root = new BinaryOperatorSyntaxTree(
        currToken,
        root,
        this.arithmeitcExpression()
      );
    }

    return root;
  }

  private equality(): AbstractSyntaxTree {
    let root = this.relation();

    let currToken;
    while (this.tokenizer.getCurrentToken().str in equalityOperators) {
      currToken = this.tokenizer.getCurrentToken();
      this.tokenizer.advance();
      root = new BinaryOperatorSyntaxTree(
        currToken,
        root,
        this.relation()
      );
    }

    return root;
  }

  private conjunction(): AbstractSyntaxTree {
    let root = this.equality();

    let currToken;
    while (this.tokenizer.getCurrentToken().str === "&&") {
      currToken = this.tokenizer.getCurrentToken();
      this.tokenizer.advance();
      root = new BinaryOperatorSyntaxTree(
        currToken,
        root,
        this.equality()
      );
    }

    return root;
  }

  private disjunction(): AbstractSyntaxTree {
    let root = this.conjunction();

    let currToken;
    while (this.tokenizer.getCurrentToken().str === "||") {
      currToken = this.tokenizer.getCurrentToken();
      this.tokenizer.advance();
      root = new BinaryOperatorSyntaxTree(
        currToken,
        root,
        this.conjunction()
      );
    }

    return root;
  }

  private expression(): AbstractSyntaxTree {
    return this.disjunction();
  }

  private variableAssignment(): AbstractSyntaxTree {
    let root = new VariableSyntaxTree(this.tokenizer.getCurrentToken());
    
    let currToken = this.tokenizer.getNextToken();
    this.tokenizer.advance();
    root = new BinaryOperatorSyntaxTree(currToken, root, this.expression())

    return root;
  }

  private variableDeclaration() : AbstractSyntaxTree {
    const root = new VariableDeclarationSyntaxTree(this.tokenizer.getCurrentToken());

    do{
      if(this.tokenizer.peekToken(2).type === TokenKind.ASSIGN){
        this.tokenizer.advance();
        root.addChild(this.variableAssignment());
      }else{
        root.addChild(new VariableSyntaxTree(this.tokenizer.getNextToken()))
        this.tokenizer.advance();
      }
    }while(this.tokenizer.getCurrentToken().type === TokenKind.COMMA)

    return root;
  }

  private sentence(): AbstractSyntaxTree {
    let root;

    if(this.tokenizer.peekToken(0).type === TokenKind.SYMBOL &&
      this.tokenizer.peekToken(1).type === TokenKind.ASSIGN){
        root = this.variableAssignment()
    }
    else if(this.tokenizer.peekToken(0).type === TokenKind.SYMBOL &&
      this.tokenizer.peekToken(1).type === TokenKind.SYMBOL){
        root = this.variableDeclaration()
    }
    else{
      root = this.expression()
    }

    this.eat(TokenKind.SEMI);
    return root;
  }

  public program(): AbstractSyntaxTree {
    const root = new ProgramSyntaxTree(this.tokenizer.getCurrentToken());
    this.tokenizer.advance();
    while(this.tokenizer.peekToken(0).type !== TokenKind.EOF)
    {
      root.addChild(this.sentence());
    }
    return root;
  }
}
