import re
import json
import sys

class Syntax:
    def __init__(self, label, value):
        self.label = label
        self.value = value

    def __str__(self):
        return json.dumps(self.__dict__, default = lambda o: o.__dict__, indent=2)
class ParsedSyntax:
    def __init__(self, index, syntax):
        self.index = index
        self.syntax = syntax
    def __bool__(self):
        return True

class Rule:  # abstract
    def __init__(self, value, ignore=False, collapsible=False):
        self.label = None
        self.CFG = None
        self.value = value
        self.ignore = ignore
        self.collapsible = collapsible

    def __repr__(self):
        return str(self.value)
    
class Terminal(Rule):
    def parse(self, input, index) -> ParsedSyntax | bool:
        remaining = input[index:]
        pattern = self.value
        match = re.match(pattern, remaining)
        if match:
            value = match.group()
            newIndex = index + len(value)
            return ParsedSyntax(newIndex, Syntax(self.label, value))
        return False

class NonTerminal(Rule): # abstract    
    def splitRule(rule):
        return re.split(r'(?<!^)\b', rule)
    def parseQuantifier(rule, quantifier, input, index) -> ParsedSyntax | bool:
        values = []
        curentIndex = index
        match quantifier:
            case '':
                result = rule.parse(input, curentIndex)
                if not result:
                    return False
                if not rule.ignore:
                    values.append(result.syntax)
                curentIndex = result.index
            case '+':
                result = rule.parse(input, curentIndex)
                if not result:
                    return False
                while result:
                    if not rule.ignore:
                        values.append(result.syntax)
                    curentIndex = result.index
                    result = rule.parse(input, curentIndex)
            case '*':
                result = rule.parse(input, curentIndex)
                while result:
                    if not rule.ignore:
                        values.append(result.syntax)
                    curentIndex = result.index
                    result = rule.parse(input, curentIndex)
            case '?':
                result = rule.parse(input, curentIndex)
                if result:
                    if not rule.ignore:
                        values.append(result.syntax)
                    curentIndex = result.index
        return ParsedSyntax(curentIndex, values)
class Conjunction(NonTerminal):
    def __repr__(self):
        return ' & '.join(self.value)
    
    def parse(self, input, index) -> ParsedSyntax | bool:
        rules = self.value

        curentIndex = index
        values = []
        for rule in rules:
            (rule, quantifier) = NonTerminal.splitRule(rule)
            if rule not in self.CFG:
                raise Exception(f'{rule} is not a production rule.')
            rule = self.CFG[rule]

            result = NonTerminal.parseQuantifier(rule, quantifier, input, curentIndex)
            if not result:
                return False
            curentIndex = result.index
            values.extend(result.syntax)

        if self.collapsible and len(values) == 1:
            return ParsedSyntax(curentIndex, values[0])
        return ParsedSyntax(curentIndex, Syntax(self.label, values))

class Disjunction(NonTerminal):
    def __repr__(self):
        return ' | '.join(self.value)
    
    def parse(self, input, index) -> ParsedSyntax | bool:
        rules = self.value

        curentIndex = index
        for rule in rules:
            (rule, quantifier) = NonTerminal.splitRule(rule)
            if rule not in self.CFG:
                raise Exception(f'{rule} is not a production rule.')
            rule = self.CFG[rule]

            result = rule.parse(input, curentIndex) # 1-TODO add parseQuantifier() functionality
            if result:
                self.ignore = rule.ignore
                return result
            
        return False

class CFG(dict):
    def __init__(self, dictionary):
        for key, value in dictionary.items():
            self.__setitem__(key, value)

    def __setitem__(self, key, value):
        value.label = key
        value.CFG = self
        super().__setitem__(key,value)
    
    def parse(self, input, rule) -> ParsedSyntax | bool:
        result = self.__getitem__(rule).parse(input, 0)
        if result:
            return result.syntax
        return False
    
Helium = CFG({
    'HELIUM':           Conjunction(['START','CODE_BLOCK','END']),
    'START':            Terminal(r'^', ignore=True),
    'END':              Terminal(r'$', ignore=True),

    'IDENTIFIER':       Terminal(r'[a-zA-Z_]+'),
    'BIT':              Terminal(r'[01]'),
    'WHOLE_NUMBER':     Terminal(r'[0-9]+'),
    'INTEGER':          Terminal(r'-?[0-9]+'),
    'NUMBER':           Terminal(r'-?[0-9]+(\.[0-9]+)?'),
    'STRING':           Terminal(r'".*"'),
    'CHAR':             Terminal(r'\'.\''),
    'LT':               Terminal(r'<', ignore=True),
    'GT':               Terminal(r'>', ignore=True),
    'LB':               Terminal(r'\[', ignore=True),
    'RB':               Terminal(r'\]', ignore=True),
    'LCB':              Terminal(r'{', ignore=True),
    'RCB':              Terminal(r'}', ignore=True),
    'COMMA':            Terminal(r',', ignore=True),
    'COLON':            Terminal(r':', ignore=True),
    'SEMI':             Terminal(r';', ignore=True),
    'EQUAL':            Terminal(r'=', ignore=True),
    'HASH':             Terminal(r'#'),
    'NON_HASH':         Terminal(r'[^#]*'),

    'COMMENT':          Conjunction(['HASH','NON_HASH','HASH'], ignore=True),

    'TYPEVAL':          Disjunction(['TYPE','WHOLE_NUMBER']),
    'TYPEVAL_LIST':     Conjunction(['COMMA','TYPEVAL'], collapsible=True),
    'GENERIC':          Conjunction(['LT','TYPEVAL','TYPEVAL_LIST*','GT']), # <int,32,str<8>>
    'TYPE':             Conjunction(['IDENTIFIER','GENERIC?']),

    'VALUE':            Disjunction(['STRING','CHAR','NUMBER','ARRAY','RECORD']),
    'VALUE_LIST':       Conjunction(['COMMA','VALUE'], collapsible=True),
    'ARRAY':            Conjunction(['LB','VALUE','VALUE_LIST*','RB']), # [123,""]
    'RECORD':           Conjunction(['LB','DEFINITION','DEFINITION_LIST*','RB']), # [a:int=123,b:str=""]

    'DEFINITION':       Conjunction(['IDENTIFIER','COLON','TYPE','EQUAL','VALUE']),
    'DEFINITION_LIST':  Conjunction(['COMMA', 'DEFINITION'], collapsible=True),
    'STATEMENT':        Disjunction(['DEFINITION']),
    'STATEMENT_LIST':   Conjunction(['SEMI', 'STATEMENT'], collapsible=True),

    'CODE_BLOCK':       Conjunction(['LCB','STATEMENT','STATEMENT_LIST*','RCB']), # {a:int=1;b:str=""}
})

filename = sys.argv[1]
file = open(filename)
input = file.read()
ast = Helium.parse(input,'HELIUM')
print(str(ast))
