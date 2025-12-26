import fs from 'fs';
import { Cfg } from './cfg/index.js';

const inFile  = './tmp/config.He';
const outFile = './tmp/config.json';

const readFile = (file: string) => {
    let code = fs.readFileSync(file, 'utf8');
    code = code.replaceAll(/\s*/g, '');
    return code;
}

const parseCode = (code: string) => {
    // TODO comments
    const cfg = new Cfg()
        .disjunction('VALUE',['RECORD', 'ARRAY', 'INT', 'FLOAT', 'STRING', 'CHARACTER'])
        .conjunction('STRING', ['DQUOTE', 'STR', 'DQUOTE'])
        .conjunction('CHARACTER', ['QUOTE', 'CHAR', 'QUOTE'])
        .conjunction('ASSIGN', ['LABEL', 'EQ', 'VALUE'])
        .list('RECORD', 'LB', 'ASSIGN', 'COMMA', 'RB')
        .list('ARRAY', 'LB', 'VALUE', 'COMMA', 'RB')
        .terminal('INT', /-?[0-9]+/)
        .terminal('FLOAT', /-?[0-9]+(\.[0-9]+)?/)
        .terminal('STR', /(\\[nrt"\\]|[^"\\])*/)
        .terminal('DQUOTE', /"/)
        .terminal('CHAR', /(\\[nrt'\\]|[^'\\])/)
        .terminal('QUOTE', /'/)
        .terminal('LB', /\[/)
        .terminal('RB', /\]/)
        .terminal('COMMA', /,/)
        .terminal('LABEL', /\w*/)
        .terminal('EQ', /=/)
    ;

    const result = cfg.parse(code, 'VALUE');
    if(result === null) {
        console.log("syntax is not valid");
    }
    return result;
}

const main = (argv: string[]) => {
    const code = readFile(inFile);
    const ast = parseCode(code);
    // semantic analysis
    // intermediate representation
    // optimization
    // code generation / execution
    console.log(ast);
    fs.writeFileSync(outFile, JSON.stringify(ast));
}


main(process.argv);
