import fs from 'fs';
import { Cfg, CfgBuilder } from './lib/ast.js';
import { Tokenizer, TokenizerBuilder } from './lib/tok.js';

const inFile  = './tmp/config.He';
const outFile = './tmp/config.json';

const readFile = (file: string) => {
    return fs.readFileSync(file, 'utf8');
}
const getTokenizer = (input: string) => {
    const tokenizer = new TokenizerBuilder()
        .token('W', /\s+/).exclude('W')
        .token('LB', '[')
        .token('RB', ']')
        .token('ID', /[a-zA-Z_]\w*/)
        .token('EQ', '=')
        .token('INT', /-?[0-9]+/)
        .token('NUM', /-?[0-9]+(\.[0-9]+)?/)
        .token('STR', /"(\\[nrt"\\]|[^"\\])*"/)
        .token('CHAR', /'(\\[nrt'\\]|[^'\\])'/)
        .token('COMMA', ',')
        .token('COMMENT', /\%[^\%]*\%/).exclude('COMMENT')
        .token('NA', /[\s\S]/)
        .build(input)
    ;
    // console.log(tokenizer.getAllTokens());
    return tokenizer;
}

const getAst = (tokenizer: Tokenizer) => {
    const cfg = new CfgBuilder()
        .disjunction('VALUE', ['RECORD', 'ARRAY', 'INT', 'NUM', 'STR', 'CHAR'])
        .conjunction('ASSIGN', ['ID', 'EQ', 'VALUE'])
        .list('RECORD', 'LB', 'ASSIGN', 'COMMA', 'RB')
        .list('ARRAY', 'LB', 'VALUE', 'COMMA', 'RB')
        .terminals(tokenizer.getTokenTypes())
        .build()
    ;

    const ast = cfg.parseAll(tokenizer.getAllTokens(), 'VALUE');
    console.log(ast);
    return ast;
}

const main = (argv: string[]) => {
    const code = readFile(inFile);
    const tokenizer = getTokenizer(code);
    const ast = getAst(tokenizer);
    
    // semantic analysis
    // intermediate representation

    // optimization

    // code generation / execution
    // console.log(ast);
    fs.writeFileSync(outFile, JSON.stringify(ast));
}


main(process.argv);
