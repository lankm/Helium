import sys
from collections import ChainMap, namedtuple
import re
from abc import ABC, abstractmethod
import json

def Syntax(label, value):
    return {label: value}

def merge(syntax_list):
    return dict(ChainMap(*syntax_list))

ParsedSyntax = namedtuple('ParsedSyntax', ['length','syntax'])

class ContextFreeGrammer(dict):
    singleton = None
    def __init__(self, starting_rule, rules):
        self.starting_rule = starting_rule
        for key, value in rules.items():
            self.__setitem__(key, value)
        ContextFreeGrammer.singleton = self

    def __setitem__(self, key, value):
        value.label = key
        super().__setitem__(key,value)
    
    def parse(self, input):
        result = self.__getitem__(self.starting_rule).parse(input)
        if result:
            return result.syntax
        return False
    
class Rule(ABC):
    CFG = ContextFreeGrammer.singleton
    def __init__(self, value, isSyntax=True, isList=False, expose=False):
        self.value = value # content describing the rule
        self.isSyntax = isSyntax # include in the syntax tree
        self.isList = isList # differentiate between list and dict
        self.expose = expose # simplyfy or act like an other rule
    
    def splitRule(rule):
        return re.split(r'(?<!^)\b', rule)
    def parseQuantifier(rule, quantifier, input) -> ParsedSyntax | bool:
        values = []
        curentIndex = 0
        match quantifier:
            case '':
                result = rule.parse(input[curentIndex:])
                if not result:
                    return False
                values.append(result.syntax)
                curentIndex += result.length
            case '*':
                result = rule.parse(input[curentIndex:])
                while result:
                    values.append(result.syntax)
                    curentIndex += result.length
                    result = rule.parse(input[curentIndex:])
            case '?':
                result = rule.parse(input[curentIndex:])
                if result:
                    values.append(result.syntax)
                    curentIndex += result.length
        return ParsedSyntax(curentIndex, values)
    
    @abstractmethod
    def parse(self, input: str) -> ParsedSyntax | bool: pass

class Terminal(Rule):
    def parse(self, input: str) -> ParsedSyntax | bool:
        match = re.match(self.value, input)
        if not match:
            return False
        value = match.group()
        return ParsedSyntax(len(value), Syntax(self.label, value))
class Conjunction(Rule):
    def parse(self, input: str) -> ParsedSyntax | bool:
        index = 0
        values = []
        for rule in self.value:
            (rule, quantifier) = Rule.splitRule(rule)
            rule = CFG[rule]
            result = Rule.parseQuantifier(rule, quantifier, input[index:])

            if not result:
                return False
            
            index += result.length
            if rule.isSyntax:
                values.extend(result.syntax)

        if self.expose and self.isList: # simplify the list if all of the same type
            return ParsedSyntax(index, Syntax(self.label, list(map(lambda s: s[self.expose],values))))

        if self.expose:
            return ParsedSyntax(index, Syntax(self.expose, merge(values)[self.expose]))
        
        if not self.isList:
            values = merge(values)
        return ParsedSyntax(index, Syntax(self.label, values))
class Disjunction(Rule):
    def parse(self, input: str) -> ParsedSyntax | bool:
        for rule in self.value:
            rule = CFG[rule]

            result = rule.parse(input)
            if result:
                return ParsedSyntax(result.length, Syntax(self.label, result.syntax))
        return False
class List(Rule):
    def __init__(self, left, content, delimit, right, expose=False):
        self.left = left
        self.content = content
        self.delimit = delimit
        self.right = right
        self.expose = expose
        self.isSyntax = True
    def parse(self, input: str) -> ParsedSyntax | bool:
        index = 0
        
        left_result = CFG[self.left].parse(input[index:])
        if not left_result: return False
        index += left_result.length

        values = []
        content_result = CFG[self.content].parse(input[index:])
        if not content_result: return False
        while content_result:
            index += content_result.length
            values.append(content_result.syntax[self.content])
            
            delimit_result = CFG[self.delimit].parse(input[index:])
            if delimit_result:
                index += delimit_result.length
                content_result = CFG[self.content].parse(input[index:])
            else:
                break

        right_result = CFG[self.right].parse(input[index:])
        if not right_result: return False
        index += right_result.length

        return ParsedSyntax(index, Syntax(self.label, values))


def parseArgs():
    inputStream = sys.stdin
    if len(sys.argv) > 1:
        inputFileName = sys.argv[1]
        inputStream = open(inputFileName, 'r')

    outputStream = sys.stdout
    if len(sys.argv) > 2:
        outputFileName = sys.argv[2]
        outputStream = open(outputFileName, 'w')

    return (inputStream, outputStream)

if __name__ == '__main__':
    (inputStream, outputStream) = parseArgs()
    input = re.sub(r'\s', '', inputStream.read())

    CFG = ContextFreeGrammer("HELIUM", {
        'HELIUM':           Conjunction(['START','CODE_BLOCK','END']),
        'START':            Terminal(r'^', isSyntax=False),
        'END':              Terminal(r'$', isSyntax=False),

        'IDENTIFIER':       Terminal(r'[a-zA-Z_]+'),
        'BIT':              Terminal(r'[01]'),
        'WHOLE_NUMBER':     Terminal(r'[0-9]+'),
        'INTEGER':          Terminal(r'-?[0-9]+'),
        'NUMBER':           Terminal(r'-?[0-9]+(\.[0-9]+)?'),
        'STRING':           Terminal(r'".*"'),
        'CHAR':             Terminal(r'\'.\''),
        'LT':               Terminal(r'<', isSyntax=False),
        'GT':               Terminal(r'>', isSyntax=False),
        'LB':               Terminal(r'\[', isSyntax=False),
        'RB':               Terminal(r'\]', isSyntax=False),
        'LCB':              Terminal(r'{', isSyntax=False),
        'RCB':              Terminal(r'}', isSyntax=False),
        'COMMA':            Terminal(r',', isSyntax=False),
        'COLON':            Terminal(r':', isSyntax=False),
        'SEMI':             Terminal(r';', isSyntax=False),
        'EQUAL':            Terminal(r'=', isSyntax=False),
        'HASH':             Terminal(r'#'),
        'NON_HASH':         Terminal(r'[^#]*'),

        'COMMENT':          Conjunction(['HASH','NON_HASH','HASH'], isSyntax=False),

        'TYPEVAL':          Disjunction(['TYPE','WHOLE_NUMBER']),
        'VALUE':            Disjunction(['STRING','CHAR','NUMBER','ARRAY','RECORD']),
        'STATEMENT':        Disjunction(['DEFINITION']),

        'DEFINITION':       Conjunction(['IDENTIFIER','COLON','TYPE','EQUAL','VALUE']),
        'TYPE':             Conjunction(['IDENTIFIER','GENERIC?']), # TODO make this optional

        'ARRAY':            List("LB","VALUE",     "COMMA","RB"),
        'RECORD':           List("LB","DEFINITION","COMMA","RB"),
        'GENERIC':          List("LT","TYPEVAL",   "COMMA","GT"),
        'CODE_BLOCK':       List("LCB","STATEMENT","SEMI","RCB"),


    })

    AST = CFG.parse(input)
    outputStream.write(json.dumps(AST, indent=2))
