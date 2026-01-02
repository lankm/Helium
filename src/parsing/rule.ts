class Rule {

}
class Conjunction extends Rule {

}
class Disjunction extends Rule {

}

const Rules = {
    Value: 1,
    Statement: 1,
    Ternary: 1,
    While: 1,
    Statements: 1,
    Assignment: 1,
    File: 1,
    Record: 1,
    Array: 1,
    Function: 1,
}
export type RuleType = keyof typeof Rules;
export const AtomTypes = Object.keys(Rules) as RuleType[];
