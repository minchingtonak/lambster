class SourceData {
    private source: string = "";
    private sourcelines: string[] = [];
    setSource(source: string) {
        this.source = source;
        this.sourcelines = this.source.split("\n");
    }
    getSource(): string {
        return this.source;
    }
    getSourceLine(line: number): string {
        return this.sourcelines[line - 1];
    }
}

export default new SourceData();
