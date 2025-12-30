import { exit } from "process";
import { FileLocation, TokenType, type Token } from "../lexer/tok.js";
import chalk from "chalk";

export class SyntaxError {
    constructor(
        public message = '',
        public location = new FileLocation(),
    ) {}

    static getFurthest(a: SyntaxError, b: SyntaxError) {
        return a.location.isFurtherThan(b.location) ? a : b;
    }
}
export class Syntax {
    constructor(
        public name: string,
        public tokens: number,
        public data: any,
    ) {}

    toJSON() {
        return {name: this.name, data: this.data}
    }
}

type numberRef = {value: number};
type CfgRules = {[id:string]: CfgRule};
abstract class CfgRule {
    name: string
    constructor (name: string) {
        this.name = name;
    }

    parseNext(tokens: Token[], rule: string, cfg: Cfg, items: Syntax[], consumedTokens: numberRef) {
        // parse single part
        const result = cfg.parseNext(tokens, rule);
        if(result instanceof SyntaxError) return result;

        // token buffer management
        tokens.splice(0, result.tokens!);
        consumedTokens.value += result.tokens!;

        // add to list if meaningful
        if(result.data) items.push(result);
        return result;
    }

    abstract parse(tokens: Token[], cfg: Cfg): Syntax | SyntaxError;

    validateRulesExist(rulenames: string[], cfg: Cfg): string[] {
        const errors: string[] = [];
        rulenames.forEach(rulename => {
            if(!cfg.rules[rulename]) {
                errors.push(`Rule "${this.name}" is invalid: subrule "${rulename}" does not exist.`);
            }
        })
        return errors;
    };
    abstract validate(cfg: Cfg): string[];
}
abstract class Junction extends CfgRule {
    rules: string[];

    constructor (name: string, rules: string[]) {
        super(name);
        this.rules = rules;
    }
    validate(cfg: Cfg) {
        return this.validateRulesExist(this.rules, cfg);
    }
}
class Conjunction extends Junction {
    parse(tokens: Token[], cfg: Cfg) {
        tokens = [...tokens];
        let consumedTokens = { value: 0 };
        let items: Syntax[] = [];

        for(const rule of this.rules) {
            const result = this.parseNext(tokens, rule, cfg, items, consumedTokens);
            if(result instanceof SyntaxError) return result;
        };
        
        return new Syntax(
            this.name,
            consumedTokens.value,
            items,
        );
    }
}
class Disjunction extends Junction {
    parse(tokens: Token[], cfg: Cfg) {
        let bestMatchedError = new SyntaxError();
        for(const rule of this.rules) {
            const result = cfg.parseNext(tokens, rule);
            if(result instanceof SyntaxError) {
                bestMatchedError = SyntaxError.getFurthest(bestMatchedError, result);
                continue;
            }
            return result;
        }
        const nextToken = tokens[0]!;
        if(bestMatchedError.location.index === nextToken.location.index) {
            const {row, column} = nextToken.location;
            return new SyntaxError(
                `Syntax error at row ${row} column ${column}. Expected <${this.name}> got "${nextToken.value}"`,
                nextToken.location
            )
        }
        return bestMatchedError;
    }
}

class Terminal extends CfgRule {
    constructor (name: string, public expected: RegExp | string) {
        super(name);
    }

    validate(cfg: Cfg) {
        return [];
    }

    parse(tokens: Token[], cfg: Cfg) {
        const nextToken = tokens[0];
        if(!nextToken) {
            return new SyntaxError(
                'Syntax error at end of file',
                new FileLocation(-1, -1, Infinity)
            );
        }
        if(nextToken.type !== this.name) {
            const {row, column} = nextToken.location;
            const expectedString = this.expected instanceof RegExp ? `<${this.name}>` : `"${this.expected}"`
            return new SyntaxError(
                `Syntax error at row ${row} column ${column}. Expected ${expectedString} got "${nextToken.value}"`,
                nextToken.location
            );
        }
        return new Syntax(
            this.name,
            1,
            this.expected instanceof RegExp ? nextToken.value : null
        )
    }
}

class List extends CfgRule {
    left: string;
    delimit: string;
    content: string;
    right: string;

    constructor (name: string, left: string, content: string, delimit: string, right: string) {
        super(name);
        this.left = left;
        this.content = content;
        this.delimit = delimit;
        this.right = right;
    }
    
    validate(cfg: Cfg) {
        return this.validateRulesExist(
            [this.left, this.content, this.delimit, this.right]
                .filter(item => item !== null),
            cfg
        );
    }


    parse(tokens: Token[], cfg: Cfg) {
        tokens = [...tokens];
        const consumedTokens = {value: 0};
        const items: Syntax[] = [];
        let result: Syntax | SyntaxError;

        // left opening
        result = this.parseNext(tokens, this.left, cfg, items, consumedTokens);
        if(result instanceof SyntaxError) return result;

        // first item
        result = this.parseNext(tokens, this.content, cfg, items, consumedTokens);
        if(result instanceof SyntaxError) return result;

        let i = 0;
        while(++i) {
            // right closing
            result = this.parseNext(tokens, this.right, cfg, items, consumedTokens);
            if(result instanceof Syntax) break;

            if(i%2==1) {
                // delimeters
                result = this.parseNext(tokens, this.delimit, cfg, items, consumedTokens);
                if(result instanceof SyntaxError) return result;
            } else {
                // items
                result = this.parseNext(tokens, this.content, cfg, items, consumedTokens);
                if(result instanceof SyntaxError) return result;
            }
        }
        
        return new Syntax(
            this.name,
            consumedTokens.value,
            items,
        );
    }
}

export class Cfg {
    rules: CfgRules;
    constructor(rules: CfgRules) {
        this.rules = rules;
        this.validate();
    }

    validate() {
        let errors: string[] = [];
        Object.values(this.rules).forEach(rule => {
            errors = errors.concat(rule.validate(this));
        })
        if(errors.length) {
            errors.forEach(err => {
                console.error(chalk.red(err));
            });
            exit(1);
        }
    }

    parseAll(tokens: Token[], rulename: string) {
        const syntax = this.parseNext(tokens, rulename);
        if(syntax instanceof SyntaxError) {
            console.error(chalk.red(syntax.message));
            exit(1);
        }
        return syntax;
    }
    parseNext(tokens: Token[], rulename: string) {
        return this.rules[rulename]!.parse(tokens, this)
    }
}
export class CfgBuilder {
    rules: CfgRules = {};
    conjunction(rule: string, rules: string[]) {
        this.rules[rule] = new Conjunction(rule, rules);
        return this;
    }
    
    disjunction(rule: string, rules: string[]) {
        this.rules[rule] = new Disjunction(rule, rules);
        return this;
    }
    
    terminals(tokenTypes: TokenType[]) {
        tokenTypes.forEach(tokenType => {
            this.rules[tokenType.name] = new Terminal(tokenType.name, tokenType.regex)
        });
        return this;
    }

    list(rule: string, left: string, content: string, delimit: string, right: string) {
        this.rules[rule] = new List(rule, left, content, delimit, right);
        return this;
    }

    build() {
        return new Cfg(this.rules)
    }
}
