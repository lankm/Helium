export class FileLocation {
    constructor(
        public line: number,
        public column: number,
    ) {}

    public compareTo(other: FileLocation) {
        return this.line - other.line || this.column - other.column
    }
}
