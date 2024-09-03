import sys
from abc import ABC, abstractmethod
from typing import List, Dict, Pattern, Tuple
import re
import json
import subprocess

class AbstractSyntaxNode:
    def __init__(self, type: str, values: List[str]):
        self.type = type
        self.values = values

    def to_dict(self):
        return self.__dict__

    def __str__(self):
        return json.dumps(self.__dict__, default = lambda o: o.__dict__, indent=4) 

class ParsedAbstractSyntaxNode:
    def __init__(self, index: int, node: AbstractSyntaxNode):
        self.index = index
        self.node = node


class ProductionRule(ABC):
    @abstractmethod
    def consume(self, name: str, input: str, index: int, CFG) -> ParsedAbstractSyntaxNode | None: pass

class Terminal(ProductionRule):
    def __init__(self, pattern: str, ignored=False):
        self.pattern = re.compile(pattern)
        self.ignored = ignored

    def consume(self, name: str, input: str, index: int, CFG) -> ParsedAbstractSyntaxNode | None:
        remaining = input[index:]
        match = self.pattern.match(remaining)
        if not match:
            return None
        
        value = match.group()
        newIndex = index + len(value)
        return ParsedAbstractSyntaxNode(newIndex, AbstractSyntaxNode(name, [value]))

class NonTerminal(ProductionRule):
    def __init__(self, rules: List[str], ignored=False):
        self.rules = rules
        self.ignored = ignored

    def consume(self, name: str, input: str, index: int, CFG) -> ParsedAbstractSyntaxNode | None:
        curIndex = index
        values = []
        for rule in self.rules:
            if rule not in CFG:
                raise Exception(f'{rule} is not a production rule.')
            
            remaining = input[curIndex:]
            result: ParsedAbstractSyntaxNode | None = CFG[rule].consume(rule, input, curIndex, CFG)
            if result == None: # no match
                return None
            else: # consumed input
                curIndex = result.index
                if not CFG[rule].ignored:
                    values.append(result.node)
        return ParsedAbstractSyntaxNode(curIndex, AbstractSyntaxNode(name, values))


class ContextFreeGrammer:
    def __init__(self, rules: Dict[str, ProductionRule]):
        self.productionRules = rules
    
    def parse(self, input: str, rule: str) -> AbstractSyntaxNode:
        index = 0
        if rule not in self.productionRules:
            raise Exception(f'{rule} is not a production rule.')

        result: ParsedAbstractSyntaxNode | None = self.productionRules[rule].consume(rule, input, index, self.productionRules)
        if result is None:
            return None
        
        return result.node
            


def main():
    filename = sys.argv[1]
    file = open(filename)
    input = file.read()

    CFG = ContextFreeGrammer({
        'HELIUM':     NonTerminal(['START','TEST','END']),
        'START':         Terminal('^', ignored=True),
        'END':           Terminal('$', ignored=True),
        'HASH':          Terminal('#'),
        'COLON':         Terminal(':'),
        'EQUAL':         Terminal('='),
        'NONHASH':       Terminal('[^#]*'),
        'COMMENT':    NonTerminal(['HASH','NONHASH','HASH'], ignored=True),
        'LABEL':         Terminal('[a-zA-Z_]+'),
        'NUMBER':        Terminal('\d+'),
        'ASSIGNMENT': NonTerminal(['LABEL','EQUAL','NUMBER']),
        'TEST':       NonTerminal(['COMMENT','ASSIGNMENT','COMMENT']),
    })
    AST = CFG.parse(input, 'HELIUM')
    print(AST)
    

if __name__ == '__main__':
    main()
