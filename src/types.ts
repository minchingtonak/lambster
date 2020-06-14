import Logger, { Verbosity } from "./logger";
import { Writable } from "stream";

export interface InterpreterOptions {
    verbosity?: Verbosity;
    output_stream?: Writable;
    rename_free_vars?: boolean;
}

export interface LoggerOptions {
    verbosity?: Verbosity;
    output_stream?: Writable;
    source?: string;
}