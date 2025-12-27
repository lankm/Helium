import chalk from "chalk";
import { exit } from "process";

export class FileLocation {
    constructor(
        public row: number= 1,
        public column: number = 1,
        public index: number = 0,
    ) {}

    isFurtherThan(other: FileLocation) {
        return this.index > other.index;
    }
    copy() {
        return new FileLocation(this.row, this.column, this.index);
    }
}
export class Token {
    constructor(
        public type: string,
        public value: string,
        public location: FileLocation,
    ) {}
}
export class TokenType {
    constructor(
        public name: string,
        public regex: RegExp | string,
    ) {}

    getRegex() {
        const regexSource = this.regex instanceof RegExp
            ? this.regex.source
            : this.regex.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp('^' + regexSource);
    }
}

type tokenTypes = {
    [type: string]: TokenType
}

export class Tokenizer {
    private input: string;
    private location: FileLocation = new FileLocation();

    private tokenTypes: tokenTypes;
    private excludedTypes: string[];
    private tokens: Token[] = [];

    constructor(input: string, tokenTypes: tokenTypes, excludedTypes: string[] = []) {
        this.input = input;
        this.tokenTypes = tokenTypes;
        this.excludedTypes = excludedTypes;
    }

    private parseNextToken() {
        // see which patterns match and pick the first one
        const token: Token | undefined = Object.entries(this.tokenTypes)
          .map(([name, regexData]) => {
            const match = this.input.match(regexData.getRegex());
            if(!match) return undefined;
            return new Token( name, match[0], this.location.copy() );
          })
          .find(token => token);
        if(!token) { return false; }

        // update state for next token
        const consumed = token.value!.length;
        const consumedString = this.input.slice(0, consumed);
        const consumedLineCount = consumedString.split('\n').length - 1;
        this.location.index += consumed;
        this.location.row += consumedLineCount;
        this.location.column = consumedLineCount
            ? consumedString.slice(consumedString.lastIndexOf('\n')).length
            : this.location.column + consumed;
        this.input = this.input.slice(token.value!.length);
        
        // add token to list
        if(!this.excludedTypes.includes(token.type)) {
            this.tokens.push(token);
        }
        return true;
    }

    public getToken(i: number) {
        while(i > this.tokens.length && this.parseNextToken()) {}
        return this.tokens[i];
    }
    public getAllTokens() {
        while(this.parseNextToken()) {}
        return this.tokens;
    }
    public getTokenTypes() {
        return Object.values(this.tokenTypes);
    }
}

export class TokenizerBuilder {
    private tokenTypes: tokenTypes = {};
    private excludedTypes: string[] = [];

    public token(name: string, match: RegExp | string) {
        if(name in this.tokenTypes) {
            console.error(chalk.red(`Duplicate token name: "${name}"`));
            exit(1);
        }
        this.tokenTypes[name] = new TokenType(
            name,
            match,
        );
        return this;
    }
    public exclude(...names: string[]) {
        this.excludedTypes = this.excludedTypes.concat(names);
        return this;
    }
    public getTokenTypes() {
        return Object.keys(this.tokenTypes);
    }
    public build(input: string) {
        return new Tokenizer(input, this.tokenTypes, this.excludedTypes);
    }
}
