import { LoggerTransport, Verbosity } from "./logger";

export interface InterpreterOptions {
    verbosity?: Verbosity;
    transports?: LoggerTransport[];
    rename_free_vars?: boolean;
    show_equivalent?: boolean;
}

export interface LoggerOptions {
    verbosity?: Verbosity;
    transports?: LoggerTransport[];
    source?: string;
}