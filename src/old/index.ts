import fs from 'fs';
import { CfgBuilder, Syntax } from './ast.js';
import { Tokenizer, TokenizerBuilder } from './tok.js';

const inFile  = './test/fixtures//valid/config.He';
const outFile = './out/config.json';

const readFile = (file: string) => {
    return fs.readFileSync(file, 'utf8');
}
const getTokenizer = (input: string) => {
    const tokenizer = new TokenizerBuilder()
        .token('W', /\s+/).exclude('W')
        .token('COMMENT', /\%[^\%]*\%/).exclude('COMMENT')
        .token('LB', '[')
        .token('RB', ']')
        // .token('LCB', '{')
        // .token('RCB', '}')
        .token('COMMA', ',')
        // .token('SEMI', ';')
        // .token('HUH', '?')
        // .token('COLON', ':')
        // .token('EXCLAM', '!')
        // .token('AT', '@')
        // .token('CARROT', '^')
        // .token('MUL', '*')
        // .token('DIV', '/')
        .token('EQ', '=')
        .token('ID', /[a-zA-Z_]\w*/)
        .token('NUM', /[-+]?[0-9]+(\.[0-9]+)/)
        .token('INT', /[-+]?[0-9]+/)
        // .token('ADD', '+')
        // .token('SUB', '-')
        .token('STR', /"(\\[tbnrfs'"\\]|[^"\\])*"/)
        .token('CHAR', /'(\\[tbnrfs'"\\]|[^'\\])'/)
        .token('NA', /[\s\S]/)
        .begin('BOF', /^/)
        .end('EOF', /$/)
        .build(input)
    ;
    // console.log(tokenizer.getAllTokens());
    return tokenizer;
}

const getAst = (tokenizer: Tokenizer) => {
    const cfg = new CfgBuilder()
        .disjunction('VALUE', ['RECORD', 'ARRAY', 'INT', 'NUM', 'STR', 'CHAR'])
        .conjunction('ASSIGN', ['ID', 'EQ', 'VALUE'])
        .conjunction('FILE', ['BOF', 'VALUE', 'EOF'])
        .list('RECORD', 'LB', 'ASSIGN', 'COMMA', 'RB')
        .list('ARRAY', 'LB', 'VALUE', 'COMMA', 'RB')
        .terminals(tokenizer.getTokenTypes())
        .build()
    ;

    const ast = cfg.parseAll(tokenizer.getAllTokens(), 'FILE');
    console.log(ast);
    return ast;
}

const getIR = (ast: Syntax) => {
    // name resolution
    // type checks
    // IR generation
    return "";
}

const getJSON = (ir: string) => {
    return "";
}

const main = (argv: string[]) => {
    const code = readFile(inFile);
    const tokenizer = getTokenizer(code);
    const ast = getAst(tokenizer);
    const ir = getIR(ast); // TODO
    const json = getJSON(ir); // TODO
    fs.writeFileSync(outFile, JSON.stringify(ast));
}


main(process.argv);
