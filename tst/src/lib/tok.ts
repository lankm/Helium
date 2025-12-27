type location = {
    row: number,
    col: number,
}
export type token = {
    type: string,
    value?: string,
    location: location
}
type tokenTypes = {
    [type: string]: {regex: RegExp, constant: boolean}
}

export class Tokenizer {
    private input: string;
    private location: location = {row:1,col:1};

    private tokenTypes: tokenTypes;
    private excludedTypes: string[];
    private tokens: token[] = [];

    constructor(input: string, tokenTypes: tokenTypes, excludedTypes: string[] = []) {
        this.input = input;
        this.tokenTypes = tokenTypes;
        this.excludedTypes = excludedTypes;
    }

    private parseNextToken() {
        // see which patterns match and pick the first one
        const token: token | undefined = Object.entries(this.tokenTypes)
          .map(([name, regexData]) => {
            const match = this.input.match(regexData.regex);
            if(!match) return undefined;
            return {
                type: name,
                value: match[0],
                location: {
                    row: this.location.row,
                    col: this.location.col,
                }
            }
          })
          .find(token => token);
        if(!token) { return false; }

        // update state for next token
        const consumed = token.value!.length;
        const consumedString = this.input.slice(0, consumed);
        const consumedLineCount = consumedString.split('\n').length - 1;
        this.location.row += consumedLineCount;
        this.location.col = consumedLineCount
            ? consumedString.slice(consumedString.lastIndexOf('\n')).length
            : this.location.col + consumed;
        this.input = this.input.slice(token.value!.length);
        
        // add token to list
        if(!this.excludedTypes.includes(token.type)) {
            if(this.tokenTypes[token.type]!.constant){
                delete token.value;
            }
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
        return Object.keys(this.tokenTypes);
    }
}

export class TokenizerBuilder {
    private tokenTypes: tokenTypes = {};
    private excludedTypes: string[] = [];

    public token(name: string, match: RegExp | string) {
        const isString = typeof match === 'string';
        const regex = isString
            ? match.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
            : match.source;
        this.tokenTypes[name] = {
            regex: new RegExp('^' + regex),
            constant: isString,
        };
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
