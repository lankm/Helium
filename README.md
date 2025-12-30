# Helium

Helium is a language without keywords with a focus on syntactic consistency.

No keywords you say, how can that be? Yes keywords like "while", "if", "else", and "class" do not exist for Helium. Instead symbols and syntactic structures take their place. Ever thought that a if-else does the same thing as a ternary, well now their the same. Classes... nope, just constructor functions which return class like records. Pesky types like "int" and "string"... no more types, just values with inferred types. What about the main function... its simply a file which returns a function and given as the entry point to the compiler. Many things are possible once you put your mind to it!

## example.He

More examples can be found in /test/fixtures

```
stdlib = /"helium.dev/stdlib@1.0.0";

int = 0;
float = 0.0;
char = '';
string = "";

main = (argv=[string]):{
    stdlib.io.print("Welcome to Helium");
    ^ 0;
};
^ main;

```
```
helium example.He

```

## Setup

For now Simply run `npm start` to see the current progress. I'm working on getting a compiler working in Node first. The end goal to make the Helium compiler in Helium.

## Authors

- Landon Moon
