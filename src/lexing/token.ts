import type { AtomType } from "./atom.js";
import type { FileLocation } from "./location.js";

export class Token {
    constructor(
        public type: AtomType,
        public value: string,
        public location: FileLocation,
    ) {}
}

export class TokenStream {
    private tokens: Token[];
    private index: number = 0;
    private ignored: AtomType[] = [];

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    peek(offset = 0): Token | undefined {
        return this.tokens[this.index + offset];
    }

    hasNext(): boolean {
        return this.tokens.length > this.index;
    }

    next(): Token | undefined {
        return this.tokens[this.index++];
    }

    hasPrev(): boolean {
        return this.index !== 0;
    }

    prev(): Token | undefined {
        return this.tokens[--this.index];
    }

    all() {
        return this.tokens.filter(token => !this.ignored.includes(token.type));
    }
    reconstruct() {
        let input = '';
        for(const token of this.tokens) {
            input += token.value;
        }
        return input;
    }

    ignore(...atomTypes: AtomType[]) {
        this.ignored.concat(atomTypes);
        return this;
    }
}
