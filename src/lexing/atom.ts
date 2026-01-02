export class Atom {
    pattern: RegExp;
    display: string;

    public constructor(pattern: string | RegExp, display?: string) {
        this.pattern = new RegExp('^' + (
            pattern instanceof RegExp
                ? pattern.source
                : pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        ));
        this.display = display ?? pattern.toString();
    }
}

export const Atoms = {
    Whitespace: new Atom(/\s+/, 'Whitespace'),
    Comment:    new Atom(/\%[^\%]*\%/, 'Comment'),
    String:     new Atom(/"(\\[tbnrfs'"\\]|[^"\\])*"/, 'String'),
    Character:  new Atom(/'(\\[tbnrfs'"\\]|[^'\\])'/, 'Character'),
    Identifier: new Atom(/[a-zA-Z_]\w*/, 'Identifier'),
    Float:      new Atom(/[-+]?[0-9]+(\.[0-9]+)/, 'Float'),
    Integer:    new Atom(/[-+]?[0-9]+/, 'Integer'),

    LeftSquareBracket:  new Atom('['),
    RightSquareBracket: new Atom(']'),
    LeftCurleyBracket:  new Atom('{'), 
    RightCurleyBracket: new Atom('}'),
    LeftParenthesis:    new Atom('('),
    RightParenthesis:   new Atom(')'),
    LeftCarrot:         new Atom('<'),
    RightCarrot:        new Atom('>'),
    Plus:               new Atom('+'),
    UpArrow:            new Atom('^'),
    Semicolon:          new Atom(';'),
    Comma:              new Atom(','),
    Dash:               new Atom('-'),
    Underscore:         new Atom('_'),
    Equal:              new Atom('='),
    Pipe:               new Atom('|'),
    ForwardSlash:       new Atom('/'),
    BackwardSlash:      new Atom('\\'),
    Quote:              new Atom('\''),
    DoubleQuote:        new Atom('"'),
    Colon:              new Atom(':'),
    QuestionMark:       new Atom('?'),
    ExclaimationPoint:  new Atom('!'),
    At:                 new Atom('@'),
    Hash:               new Atom('#'),
    Dollar:             new Atom('$'),
    Percent:            new Atom('%'),
    And:                new Atom('&'),
    Star:               new Atom('*'),
    Tilde:              new Atom('~'),
    Tick:               new Atom('`'),
    Period:             new Atom('.'),

    Unknown:    new Atom(/[\s\S]/, 'Unknown'),
};
export type AtomType = keyof typeof Atoms;
export const AtomTypes = Object.keys(Atoms) as AtomType[];
