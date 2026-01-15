import fs from 'fs';
import { exit } from 'process';

export const readFile = (fileName: string) => {
    return fs.readFileSync(fileName, 'utf8');
}

export const getArguments = () => {
    const argv = process.argv.slice(2);
    const fileName = argv[0];
    if(!fileName) {
        console.error("Expected usage: npm start <filename>")
        exit(1);
    }
    return {fileName};
}

export const log = (data: any) => {
    console.dir(data, { depth: null, maxArrayLength: null });
}
