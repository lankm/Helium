import { exit } from "process";
import type { FileLocation, Token } from "./tok.js";

class SyntaxError {
    constructor(
        public message: string,
        public location: FileLocation,
    ) {}
}
class Syntax {
    constructor(
        public name: string,
        public tokens: number | null,
        public data: any,
    ) {}
}

type CfgRules = {[id:string]: CfgRule};
abstract class CfgRule {
    name: string
    constructor (name: string) {
        this.name = name;
    }

    abstract parse(tokens: Token[], cfg: Cfg): Syntax | null;

    validateRulesExist(rulenames: string[], cfg: Cfg): string[] {
        const errors: string[] = [];
        rulenames.forEach(rulename => {
            if(!cfg.rules[rulename]) {
                errors.push(`${this.name} is invalid: ${rulename} does not exist`);
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
        let consumedTokens = 0;
        let parts: Syntax[] = [];

        for(const rule of this.rules) {
            // parse single part
            const result = cfg.parseQuiet(tokens, rule);
            if(result === null) return null;

            // token buffer management
            tokens = tokens.slice(result.tokens!);
            consumedTokens += result.tokens!;
            result.tokens = null;

            // add to list if meaningful
            if(result.data) parts.push(result);
        };
        
        return {
            name: this.name,
            tokens: consumedTokens,
            data: parts,
        }
    }
}
class Disjunction extends Junction {
    parse(tokens: Token[], cfg: Cfg) {
        return this.rules
          .map(rule => cfg.parseQuiet(tokens, rule))
          .find(syntax => syntax) ?? null;
    }
}

class Terminal extends CfgRule {
    constructor (name: string) {
        super(name);
    }

    validate(cfg: Cfg) {
        return [];
    }

    parse(tokens: Token[], cfg: Cfg) {
        const nextToken = tokens[0];
        if(!nextToken) {
            return null;
        }
        if(nextToken.type !== this.name) {
            return null;
        }
        return {
            name: this.name,
            tokens: 1,
            data: nextToken.value
        }
    }
}

class List extends CfgRule {
    right: string;
    delimit: string;
    content: string;
    left: string;

    constructor (name: string, left: string, content: string, delimit: string, right: string) {
        super(name);
        this.left = left;
        this.content = content;
        this.delimit = delimit;
        this.right = right;
    }
    
    validate(cfg: Cfg) {
        return this.validateRulesExist(
            [this.left, this.content, this.delimit, this.right],
            cfg
        );
    }


    parse(tokens: Token[], cfg: Cfg) {
        let consumedTokens = 0;
        let parts: Syntax[] = [];

        // left opening
        const left = cfg.parseQuiet(tokens, this.left);
        if(left === null) return null;
        tokens = tokens.slice(left.tokens!);
        consumedTokens += left.tokens!;
        left.tokens = null;
        if(left.data) parts.push(left);

        let content = cfg.parseQuiet(tokens, this.content);
        if(content !== null) {
            // first item
            tokens = tokens.slice(content.tokens!);
            consumedTokens += content.tokens!;
            content.tokens = null;
            if(content.data) parts.push(content);
            while(true) {
                // delimeters
                const delimit = cfg.parseQuiet(tokens, this.delimit)
                if(delimit === null) break;
                tokens = tokens.slice(delimit.tokens!);
                consumedTokens += delimit.tokens!;
                delimit.tokens = null;
                if(delimit.data) parts.push(delimit);
                
                // items
                content = cfg.parseQuiet(tokens, this.content)
                if(content === null) break;
                tokens = tokens.slice(content.tokens!);
                consumedTokens += content.tokens!;
                content.tokens = null;
                if(content.data) parts.push(content);
            }
        }
        
        // right closing
        const right = cfg.parseQuiet(tokens, this.right);
        if(right === null) return null;
        tokens = tokens.slice(right.tokens!);
        consumedTokens += right.tokens!;
        right.tokens = null;
        if(right.data) parts.push(right);
        
        return {
            name: this.name,
            tokens: consumedTokens,
            data: parts,
        }
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
            console.log(errors);
            exit();
        }
    }

    parse(tokens: Token[], rulename: string) {
        const syntax = this.parseQuiet(tokens, rulename);
        if(syntax === null) {
            const lastToken = tokens[0];
            if(!lastToken) {
                console.log(`Syntax error at end of file`);
            } else {
                const {row, column} = lastToken.location;
                console.log(`Syntax error at row ${row} column ${column}`);
            }
            exit();
        }
        syntax.tokens = null;
        return syntax;
    }
    parseQuiet(tokens: Token[], rulename: string) {
        return this.rules[rulename]!.parse(tokens, this);
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
    
    terminals(tokenTypes: string[]) {
        tokenTypes.forEach(tokenType => {
            this.rules[tokenType] = new Terminal(tokenType)
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
