import { Lexer } from "./lexing/Lexer.js";
import { Parser } from "./parsing/Parser.js";
import { getArguments, log, readFile } from "./util/Input.js";

const lexer = new Lexer()
    .tokens({
        Identifier: /[^\W\d]\w*/,
        Float:      /\d+(\.\d+)/,
        Integer:    /\d+/,
        String:     /"(\\.|[^"\\])*"/,
        Character:  /'(\\.|[^'\\])*'/,
    })
    .ignore({
        Comment:    /\%[^\%]*\%/,
        Whitespace: /\s+/,
    });

const parser = new Parser()
    .conjoin({
        File:        ["Statements", ""],
        Assignment:  ["Identifier", "=", "Expression"],
        Ternary:     ["?", "Expression", ":", "Expression", "!", "Expression"],
        While:       ["@", "Expression", ":", "Block"],
        Import:      ["/", "String"],
        Block:       ["{", "Statements", "}"],
        Array:       ["[", "Expressions", "]"],
        Record:      ["[", "Assignments", "]"],
        Destructure: ["[", "Identifiers", "]", "=", "Expression"],
    })
    .disjoin({
        Value:      ["Integer", "Float", "String", "Character", "_", "Identifier", "Record", "Array", "Import"],
        Statement:  ["Assignment", "Destructure", "Ternary", "While"],
        Expression: ["Sum"],
    })
    .delimit({
        Statements:  ["Statement", ";"],
        Assignments: ["Assignment", ","],
        Expressions: ["Expression", ","],
        Identifiers: ["Identifier", ","],

        Sum: ["Product", "+"],
        Product: ["Value", "*"],
    });

const main = () => {
    const {fileName} = getArguments();
    const input = readFile(fileName);
    const tokens = lexer.tokenize(input);
    const ast = parser.parse(tokens, "File");

    // log(tokens);
    log(ast);
};
main();

