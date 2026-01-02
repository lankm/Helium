import { readFile, tokenize } from "./lexing/lexer.js";

const main = (argv: string[]) => {
    const inFile = argv[0] ?? './test/fixtures/valid/config.He';
    const input = readFile(inFile);
    const tokens = tokenize(input).ignore('Whitespace','Comment');
    
    console.log(tokens.reconstruct())
}


main(process.argv.slice(2));
