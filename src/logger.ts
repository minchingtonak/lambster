class Logger {
    private verbosity: number = 0;
    setVerbosity(verbosity_in: number) {
        this.verbosity = verbosity_in;
    }
    incrVerbosity(amount: number) {
        this.verbosity += amount;
    }

    private print(message: string, target: number) {
        if (this.verbosity < target) return;
        console.log(message);
    }

    log(message: string) {
        this.print(message, 0);
    }

    vlog(message: string) {
        this.print(message, 1);
    }

    vvlog(message: string) {
        this.print(message, 2);
    }
}

export default new Logger();