import { exit } from "process";

type syntax = {_name_:string, _type_:string, _length_:number, [data:string]: any};

abstract class CfgRule {
    name: string
    constructor (name: string) {
        this.name = name;
    }
    abstract parse(input:string, cfg: Cfg): syntax | null;
}
abstract class Junction extends CfgRule {
    rules: string[];

    constructor (name: string, rules: string[]) {
        super(name);
        this.rules = rules;
    }
}
class Conjunction extends Junction {
    parse(input:string, cfg: Cfg) {
        let offset = 0;
        let syntax = [];
        for(let i=0; i < this.rules.length; i++) {
            const rulename = this.rules[i]!;
            const remaining = input.slice(offset);
            const result = cfg.parse(remaining, rulename);

            if(result === null) {
                return null
            }

            offset += result._length_;
            syntax.push(result);
        }
        return {
            _name_: this.name,
            _type_: 'conjunction',
            _length_: offset,
            parts: syntax
        };
    }
}
class Disjunction extends Junction {
    parse(input:string, cfg: Cfg) {
        for(let i=0; i < this.rules.length; i++) {
            const rulename = this.rules[i]!;
            const result = cfg.parse(input, rulename);

            if(result === null) {
                continue;
            }
            return result;
        }
        return null;
    }
}
class Terminal extends CfgRule {
    regex: RegExp;

    constructor (name: string, regex: RegExp) {
        super(name);
        this.regex = regex;
    }
    parse(input:string, cfg: Cfg) {
        const result = input.match(this.regex);
        if(result === null) {
            return null;
        }
        const match = result[0];
        if(!input.startsWith(match)) {
            return null;
        }
        return {
            _name_: this.name,
            _type_: 'terminal',
            _length_: match.length,
            value: match
        };
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
    parse(input: string, cfg: Cfg) {
        let offset = 0;

        const left = cfg.parse(input.slice(offset), this.left);
        if(left === null) { return null; }
        offset += left._length_;

        const parts = [];
        let item = cfg.parse(input.slice(offset), this.content);
        if(item !== null) {
            parts.push(item)
            offset += item._length_;

            while(true) {
                const delimit = cfg.parse(input.slice(offset), this.delimit);
                if(delimit === null) { break; }
                offset += delimit._length_;
                
                item = cfg.parse(input.slice(offset), this.content);
                if(item === null) { break; }
                offset += item._length_;
                parts.push(item);
            }
        }

        const right = cfg.parse(input.slice(offset), this.right);
        if(right === null) { return null; }
        offset += right._length_;


        return {
            _name_: this.name,
            _type_: 'list',
            _length_: offset,
            parts: parts,
        }
    }
}

export class Cfg {
    rules: {[id:string]:CfgRule} = {};

    conjunction(rule: string, rules: string[]) {
        this.rules[rule] = new Conjunction(rule, rules);
        return this;
    }
    
    disjunction(rule: string, rules: string[]) {
        this.rules[rule] = new Disjunction(rule, rules);
        return this;
    }
    
    terminal(rule: string, regex: RegExp) {
        this.rules[rule] = new Terminal(rule, regex);
        return this;
    }

    list(rule: string, left: string, content: string, delimit: string, right: string) {
        this.rules[rule] = new List(rule, left, content, delimit, right);
        return this;
    }

    parse(input: string, rulename: string) {
        const rule = this.rules[rulename];
        if(rule === undefined) {
            console.log('Unknown rule name', rulename);
            exit();
        }
        return rule.parse(input, this);
    }
}
