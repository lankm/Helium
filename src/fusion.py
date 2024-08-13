import sys
import re
import json
from abc import ABC, abstractmethod

# Token specifications
token_specification = {
    'WORD':     r'[a-zA-Z]+',      # 
    'NUMBER':   r'\d+',      # Integer or decimal number
    'PLUS':     r'\+',       # Addition
    'MINUS':    r'-',        # Subtraction
    'MUL':      r'\*',       # Multiplication
    'DIV':      r'/',        # Division
    'LPAREN':   r'\(',       # Left Parenthesis
    'RPAREN':   r'\)',       # Right Parenthesis
    'SKIP':     r'\s+',      # Skip spaces and tabs
    'COMMENT':  r'#',        # 
    'DOT':      r'\.',        # 
    'COLON':    r':',        # 
    'LARROW':   r'<',        # 
    'RARROW':   r'>',        # 
    'COMMA':    r',',        # 
    'SCOLON':   r';',        # 
    'EQUAL':   r'=',        # 
    'EQUAL':   r'=',        # 
    'EQUAL':   r'=',        # 
}
WHITESPACE = r'^\s+'
STRSET = r'^(".*"|\'.*\'|[a-zA-Z_]+|\d+|[^\s+])'

def tokenize(input):
    tokens = []
    while input:
        match = re.match(WHITESPACE, input)
        if match:
            input = input[match.end():]
            continue

        match = re.match(STRSET, input)
        if match:
            token_value = match.group(0)
            tokens.append(token_value)
            input = input[match.end():]
            continue

        raise ValueError(f"Unexpected token: {input[0]}")
    return tokens 

def main():
    filename = sys.argv[1]
    with open(filename) as file:
        tokens = tokenize(file.read())
        print(tokens)

if __name__ == '__main__':
    main()
