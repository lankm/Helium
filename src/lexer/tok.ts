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
        return new RegExp(regexSource, 'y');
    }
}

type tokenTypes = {
    [type: string]: TokenType
}

export class Tokenizer {
    private location: FileLocation = new FileLocation();
    private tokens: Token[] = [];
    private isRunning = false;

    constructor(
        private input: string,
        private tokenTypes: tokenTypes,
        private beginToken: TokenType | null,
        private endToken: TokenType | null,
        private excludedTypes: string[] = []
    ) {}

    private parseNextToken() {
        let token: Token | undefined;
        // beginning and ending cases
        if (this.isRunning && this.location.index === this.input.length && this.endToken) {
            token = new Token(this.endToken.name, '', this.location);
            this.isRunning = false;
        }
        else if(!this.isRunning && this.location.index === 0 && this.beginToken) {
            token = new Token(this.beginToken.name, '', this.location.copy());
            this.isRunning = true;
        } else {
            // see which patterns match and pick the first one
            token = Object.entries(this.tokenTypes)
            .map(([name, regexData]) => {
                const regex = regexData.getRegex();

                regex.lastIndex = this.location.index;
                const match = regex.exec(this.input);

                if(!match) return undefined;
                return new Token( name, match[0], this.location.copy() );
            })
            .find(token => token);
            if(!token) { return false; }
        }


        // update index in file
        const consumed = token.value!.length;
        const start = this.location.index;
        const end = start + consumed;
        this.location.index = end;

        // update row and column info
        const consumedString = this.input.slice(start, end);
        const consumedLineCount = consumedString.split('\n').length - 1;
        this.location.row += consumedLineCount;
        this.location.column = consumedLineCount
            ? consumedString.slice(consumedString.lastIndexOf('\n')).length
            : this.location.column + consumed;
        
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
        const typeNames = Object.values(this.tokenTypes);
        if(this.beginToken) typeNames.push(this.beginToken);
        if(this.endToken) typeNames.push(this.endToken);
        return typeNames;
    }
}

export class TokenizerBuilder {
    private tokenTypes: tokenTypes = {};
    private excludedTypes: string[] = [];
    private beginToken: TokenType | null = null;
    private endToken: TokenType | null = null;

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

    public begin(name: string, match: RegExp | string) {
        this.token(name, match);
        this.beginToken = this.tokenTypes[name]!;
        delete this.tokenTypes[name];
        return this;
    }

    public end(name: string, match: RegExp | string) {
        this.token(name, match);
        this.endToken = this.tokenTypes[name]!;
        delete this.tokenTypes[name];
        return this;
    }

    public build(input: string) {
        return new Tokenizer(
            input,
            this.tokenTypes,
            this.beginToken,
            this.endToken,
            this.excludedTypes
        );
    }
}
