export type TokenLocation = {
    line: number,
    column: number,
}
export type Token = {
    name: string,
    location: TokenLocation
    value?: string,
}
export const isAfter = (a: TokenLocation, b: TokenLocation) => {
    return a.line > b.line || (a.line === b.line && a.column > b.column);
}

export class Lexer {
    private patterns: Record<string, RegExp> = {}
    private ignored: string[] = []

    private patternize(patterns: Record<string, RegExp>) {
        Object.entries(patterns).forEach(([name, pattern]) => {
            this.patterns[name] = new RegExp(pattern.source, "y");
        });
    }

    // config setters
    public tokens(tokens: Record<string, RegExp>) {
        this.patternize(tokens);
        return this;
    }
    public ignore(ignore: Record<string, RegExp>) {
        this.patternize(ignore);
        this.ignored.push(...Object.keys(ignore));
        return this;
    }

    public tokenize(input: string) {
        const tokens = [];
        let i = 0;
        let line = 1;
        let column = 1;

        while (i < input.length) {
            // default value
            const token: Token = {
                name: input[i]!,
                location: {line, column}
            }

            // test for match
            for(const name in this.patterns) {
                const pattern = this.patterns[name]!;
                pattern.lastIndex = i;
                const matches = input.match(pattern)
                if(matches) {
                    token.name = name;
                    token.value = matches[0];
                    break;
                }
            }

            // add to list
            if(!this.ignored.includes(token.name)) {
                tokens.push(token);
            }

            // get next location
            const consumed = token.value ?? token.name;
            for(const char of consumed.split('')) {
                column++;
                if(char == '\n') {
                    line++;
                    column = 1;
                }
                i++;
            }
        }

        // EOF token
        tokens.push({name: "", location: {line, column}}); // TODO think about this. This is a special case
        
        return tokens;
    }
}
