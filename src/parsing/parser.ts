import { isAfter, type Token, type TokenLocation } from "../lexing/Lexer.js";

class ParseNode {
    public constructor(
        public name: string,
        public value?: any,
    ) {}
}
class ParseError {
    public constructor(
        public message: string,
        public location: TokenLocation,
    ) {}
}
type ParseResult = ParseNode | ParseError;

export class Parser {
    // index in list of tokens
    private index = 0;
    private tokens: Token[] = [];
    public parse(tokens: Token[], rule: string) {
        this.index = 0;
        this.tokens = tokens;
        return this.consume(rule);
    }


    // conjunction. must match all rules in order
    private conjunctions: Record<string, string[]> = {};
    public conjoin(rules: Record<string, string[]>) {
        Object.assign(this.conjunctions, rules);
        return this;
    }
    private consumeConjunction(name: string) {
        const required = this.conjunctions[name]!;

        const conjunction = [];
        for(const rule of required) {
            const result = this.consume(rule);
            if(result instanceof ParseError) {
                return result;
            }
            conjunction.push(result);
        }
        return new ParseNode(name, conjunction);
    }


    // disjunction. must match at least one rule
    private disjunctions: Record<string, string[]> = {};
    public disjoin(rules: Record<string, string[]>) {
        Object.assign(this.disjunctions, rules);
        return this;
    }
    private consumeDisjunction(name: string) {
        const options = this.disjunctions[name]!;

        // default error if no options partially match
        const token = this.tokens[this.index]!;
        const {line, column} = token.location;
        let deepestError = new ParseError(`Expected "${name}" got "${token.name}" at line ${line} column ${column}`, token.location);

        // attempt options
        for(const rule of options) {
            const result = this.consume(rule);

            if(result instanceof ParseNode) {
                return result;
            }
            
            if(isAfter(result.location, deepestError.location)) {
                deepestError = result;
            }
        }

        return deepestError;
    }


    // delimited list. must match one or more items
    private delimits: Record<string, [string, string]> = {};
    private simplifyDelimit: string[] = [];
    public delimit(rules: Record<string, [string, string]>) {
        Object.assign(this.delimits, rules);
        return this;
    }
    private consumeDelimit(name: string) {
        const [item, delimit] = this.delimits[name]!;

        const items = [];

        let result = this.consume(item);
        if(result instanceof ParseError) return result;
        items.push(result);

        while(true) {
            result = this.consume(delimit);
            if(result instanceof ParseError) break;
            items.push(result);

            result = this.consume(item);
            if(result instanceof ParseError) return result;
            items.push(result);
        }

        if(items.length === 1 && this.simplifyDelimit.includes(name)) {
            return items[0]!;
        }

        return new ParseNode(name, items);
    }

    
    // operator precidence. only supports infix
    public priority(rules: Record<string, Record<string, string[]>>) {
        Object.entries(rules).forEach(([name, subRules]) => {
            let previousRule: string;
            Object.entries(subRules).forEach(([subRule, ruleData], i) => {
                if(i === 0) {
                    this.disjoin({[subRule]: ruleData});
                } else {
                    const operatorsName = "_" + subRule;
                    this.simplifyDelimit.push(subRule);
                    this.disjoin({[operatorsName]: ruleData});
                    this.delimit({[subRule]: [previousRule, operatorsName]});
                }
                previousRule = subRule;
            });
            this.disjoin({[name]: [previousRule!]});
        });
        return this;
    }


    // consume token or return error
    private consumeToken(name: string) {
        const token = this.tokens[this.index]!;

        if (token.name !== name) {
            const {line, column} = token.location;
            return new ParseError(`Expected "${name}" got "${token.name}" at line ${line} column ${column}`, token.location);
        }

        this.index++;
        return new ParseNode(token.name, token.value);
    }


    // execute a rule
    private consume(rule: string): ParseResult {
        const indexCopy = this.index;

        let result;
        if(rule in this.conjunctions) {
            result = this.consumeConjunction(rule);
        }
        else if(rule in this.disjunctions) {
            result = this.consumeDisjunction(rule);
        }
        else if(rule in this.delimits) {
            result = this.consumeDelimit(rule);
        }
        else {
            result = this.consumeToken(rule);
        }

        // if failed to consume, reset index
        if(result instanceof ParseError) {
            this.index = indexCopy;
        }

        return result;
    }
}
