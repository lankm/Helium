class Type:
    def __init__(self, name, description: str, group: str):
        self.name = name
        self.desc = description
        self.group = group
    def __lt__(self, other):
        if self.group == other.group:
            return self.name < other.name
        else:
            return self.group < other.group
    def __hash__(self):
        return hash(self.name[0:2])
    def __eq__(self, other):
        return self.name[0:2] == other.name[0:2]
    def __str__(self):
        return f'  {self.name}: {self.desc}'
    

primitives = 'Primitive'
datastructures = 'Datastructures'
operating_system = 'Operating System'
format = 'Format'
other = 'Other'

typesArray = [
    Type('int','integer',primitives),
    Type('nul','null',primitives),
    Type('bit','boolean',primitives),
    Type('chr','character',primitives),
    Type('whl','whole number',primitives),
    Type('flt','floating point number',primitives),
    Type('fxt','fixed point number',primitives),
    Type('rat','rational number',primitives),
    Type('arr','array',datastructures),
    Type('vtx','vertex',datastructures),
    Type('set','set',datastructures),
    Type('map','map',datastructures),
    Type('gph','graph',datastructures),
    Type('tre','tree',datastructures),
    Type('lst','list',datastructures),
    Type('tup','tuple',datastructures),
    Type('kvp','key value pair',datastructures),
    Type('edg','edge',datastructures),
    Type('obj','object',datastructures),
    Type('dir','directory',operating_system),
    Type('fil','file',operating_system),
    Type('thr','thread',operating_system),
    Type('htm','HyperText Markup Language',format),
    Type('csv','Comma Separated Value',format),
    Type('xml','Extensible Markup Language',format),
    Type('jsn','JavaScript Object Notation',format),
    Type('rgx','regular expression',format),
    Type('sql','Structured Query Language',format),
    Type('str','string',other),
    Type('utf','Unicode Transformation Format',other),
    Type('fun','function',other),
]

types = set(typesArray)
if len(typesArray) != len(types):
    raise Exception('duplicate key')

group = None
for type in sorted(types):
    if type.group != group:
        group = type.group
        print(group)
    print(type)
