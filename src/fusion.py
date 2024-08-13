import sys
import re


input = ''
location = 0

def parse(text):
    global input, location
    match = re.search(text, input[location:])
    if match:
        string = match.group()
        length = len(string)
        location += length
        return True
    else:
        return False


def parseComment():
    return parse(r'^\s*#[^#]*#')
def parseInt():
    return parse(r'^\s*\w*\s*:\s*int<(8|16|32|64)>')
def main():
    global input, location
    filename = sys.argv[1]
    file = open(filename)
    input = file.read()

    parseComment()
    parseComment()
    parseInt()

    print(input[location:])

if __name__ == '__main__':
    main()


#
# Lexing ( splitting into tokens )
# Parsing ( generationg abstract syntax tree )
# Semantic Analysis ( check syntax is correct )
# Optimization
#