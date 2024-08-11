import sys
import re

# this is just a very simple string parser. will learn abstract syntax trees
def main():
    filename = sys.argv[1]
    file = open(filename)

    state = {
        '#': False,
        '(': 0,
        ')': 0,
    }
    isComment = False

    output = ''

    for i, line in enumerate(file.readlines()):
        for char in line:
            isComment = state['#']
            if re.match(r'\s', char):
                continue
            match (char):
                case '#':
                    state['#'] = not isComment
                    continue
                case '(':
                    state['('] += 1
                case ')':
                    state[')'] += 1
            
            if state[')'] > state['(']:
                print(f'Error on line {i}')
                exit()
            
            if not isComment:
                output += char
                
    if state[')'] != state['(']:
        print(f'Error on line ${i}')
    else:
        sys.stdout.write(output)

if __name__ == '__main__':
    main()
