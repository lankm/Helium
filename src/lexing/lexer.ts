import fs from 'fs';
import { Atoms, AtomTypes, type AtomType } from "./atom.js";
import { FileLocation } from "./location.js";
import { Token, TokenStream } from "./token.js";

export const readFile = (file: string) => {
    return fs.readFileSync(file, 'utf8');
}

export const tokenize = (input: string) => {
    const tokens: Token[] = [];
    let line = 1;
    let column = 1;
    let index = 0;

    while(input.length > index) {
        const remainingInput = input.slice(index);

        // find match
        const atomType = AtomTypes.find((atomType) => {
            const regex = Atoms[atomType].pattern;
            return regex.test(remainingInput);
        });
        if(atomType === undefined) {
            break;
        }

        // create token
        const match = remainingInput.match(Atoms[atomType].pattern)![0];
        tokens.push(new Token(
            atomType,
            match,
            new FileLocation(line, column),
        ));

        // calculate location
        for(const char of match) {
            column++;
            index++;

            if(char === '\n') {
                line++;
                column = 1;
            }
        }
    }

        
    return new TokenStream(tokens);
}
