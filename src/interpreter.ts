import {
    Stmt,
    Term,
    Abstraction,
    Variable,
    Application,
    TermVisitor,
    StmtVisitor,
    TermStmt,
    BindingStmt,
    CommandStmt,
    CommandType,
} from "./ast";
import { Reducer } from "./reducer";
import { BindingResolver } from "./bindingresolver";
import printAst from "./astprinter";
import logger from "./logger";

export class Interpreter implements StmtVisitor<void> {
    private bindings: { [key: string]: Term } =
        // Process multikeys
        (dict => {
            Object.keys(dict).forEach(key => {
                if (key.indexOf("|") !== -1) {
                    key.split("|").forEach(subkey => {
                        dict[subkey] = dict[key];
                    });
                    delete dict[key];
                }
            });
            return dict;
        })({
            // Logic
            true: new Abstraction("t", new Abstraction("f", new Variable("t"))),
            false: new Abstraction("t", new Abstraction("f", new Variable("f"))),
            and: new Abstraction(
                "a",
                new Abstraction(
                    "b",
                    new Application(
                        new Application(new Variable("a"), new Variable("b")),
                        new Variable("a")
                    )
                )
            ),
            or: new Abstraction(
                "a",
                new Abstraction(
                    "b",
                    new Application(
                        new Application(new Variable("a"), new Variable("a")),
                        new Variable("b")
                    )
                )
            ),
            not: new Abstraction(
                "b",
                new Application(
                    new Application(new Variable("b"), new Variable("false")),
                    new Variable("true")
                )
            ),
            if: new Abstraction(
                "p",
                new Abstraction(
                    "a",
                    new Abstraction(
                        "b",
                        new Application(
                            new Application(new Variable("p"), new Variable("a")),
                            new Variable("b")
                        )
                    )
                )
            ),
            // Lists
            "pair|cons": new Abstraction(
                "x",
                new Abstraction(
                    "y",
                    new Abstraction(
                        "f",
                        new Application(
                            new Application(new Variable("f"), new Variable("x")),
                            new Variable("y")
                        )
                    )
                )
            ),
            "first|car": new Abstraction(
                "p",
                new Application(new Variable("p"), new Variable("true"))
            ),
            "second|cdr": new Abstraction(
                "p",
                new Application(new Variable("p"), new Variable("false"))
            ),
            "nil|empty": new Abstraction("x", new Variable("true")),
            "null|isempty": new Abstraction(
                "p",
                new Application(
                    new Variable("p"),
                    new Abstraction("x", new Abstraction("y", new Variable("false")))
                )
            ),
            // Trees
            tree: new Abstraction(
                "d",
                new Abstraction(
                    "l",
                    new Abstraction(
                        "r",
                        new Application(
                            new Application(new Variable("pair"), new Variable("d")),
                            new Application(
                                new Application(new Variable("pair"), new Variable("l")),
                                new Variable("r")
                            )
                        )
                    )
                )
            ),
            datum: new Abstraction("t", new Application(new Variable("first"), new Variable("t"))),
            left: new Abstraction(
                "t",
                new Application(
                    new Variable("first"),
                    new Application(new Variable("second"), new Variable("t"))
                )
            ),
            right: new Abstraction(
                "t",
                new Application(
                    new Variable("second"),
                    new Application(new Variable("second"), new Variable("t"))
                )
            ),
            // Arithmetic
            incr: new Abstraction(
                "n",
                new Abstraction(
                    "f",
                    new Abstraction(
                        "y",
                        new Application(
                            new Variable("f"),
                            new Application(
                                new Application(new Variable("n"), new Variable("f")),
                                new Variable("y")
                            )
                        )
                    )
                )
            ),
            plus: new Abstraction(
                "m",
                new Abstraction(
                    "n",
                    new Application(
                        new Application(new Variable("m"), new Variable("incr")),
                        new Variable("n")
                    )
                )
            ),
            times: new Abstraction(
                "m",
                new Abstraction(
                    "n",
                    new Application(
                        new Application(
                            new Variable("m"),
                            new Application(new Variable("plus"), new Variable("n"))
                        ),
                        new Variable("0")
                    )
                )
            ),
            iszero: new Abstraction(
                "n",
                new Application(
                    new Application(new Variable("n"), new Abstraction("y", new Variable("false"))),
                    new Variable("true")
                )
            ),
            "0|zero": new Abstraction("f", new Abstraction("x", new Variable("x"))),
            "1|one": new Abstraction(
                "f",
                new Abstraction("x", new Application(new Variable("f"), new Variable("x")))
            ),
            "2|two": new Abstraction(
                "f",
                new Abstraction(
                    "x",
                    new Application(
                        new Variable("f"),
                        new Application(new Variable("f"), new Variable("x"))
                    )
                )
            ),
            "3|three": new Abstraction(
                "f",
                new Abstraction(
                    "x",
                    new Application(
                        new Variable("f"),
                        new Application(
                            new Variable("f"),
                            new Application(new Variable("f"), new Variable("x"))
                        )
                    )
                )
            ),
            "4|four": new Abstraction(
                "f",
                new Abstraction(
                    "x",
                    new Application(
                        new Variable("f"),
                        new Application(
                            new Variable("f"),
                            new Application(
                                new Variable("f"),
                                new Application(new Variable("f"), new Variable("x"))
                            )
                        )
                    )
                )
            ),
            "5|five": new Abstraction(
                "f",
                new Abstraction(
                    "x",
                    new Application(
                        new Variable("f"),
                        new Application(
                            new Variable("f"),
                            new Application(
                                new Variable("f"),
                                new Application(
                                    new Variable("f"),
                                    new Application(new Variable("f"), new Variable("x"))
                                )
                            )
                        )
                    )
                )
            ),
            "6|six": new Abstraction(
                "f",
                new Abstraction(
                    "x",
                    new Application(
                        new Variable("f"),
                        new Application(
                            new Variable("f"),
                            new Application(
                                new Variable("f"),
                                new Application(
                                    new Variable("f"),
                                    new Application(
                                        new Variable("f"),
                                        new Application(new Variable("f"), new Variable("x"))
                                    )
                                )
                            )
                        )
                    )
                )
            ),
            "7|seven": new Abstraction(
                "f",
                new Abstraction(
                    "x",
                    new Application(
                        new Variable("f"),
                        new Application(
                            new Variable("f"),
                            new Application(
                                new Variable("f"),
                                new Application(
                                    new Variable("f"),
                                    new Application(
                                        new Variable("f"),
                                        new Application(
                                            new Variable("f"),
                                            new Application(new Variable("f"), new Variable("x"))
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            ),
            "8|eight": new Abstraction(
                "f",
                new Abstraction(
                    "x",
                    new Application(
                        new Variable("f"),
                        new Application(
                            new Variable("f"),
                            new Application(
                                new Variable("f"),
                                new Application(
                                    new Variable("f"),
                                    new Application(
                                        new Variable("f"),
                                        new Application(
                                            new Variable("f"),
                                            new Application(
                                                new Variable("f"),
                                                new Application(
                                                    new Variable("f"),
                                                    new Variable("x")
                                                )
                                            )
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            ),
            "9|nine": new Abstraction(
                "f",
                new Abstraction(
                    "x",
                    new Application(
                        new Variable("f"),
                        new Application(
                            new Variable("f"),
                            new Application(
                                new Variable("f"),
                                new Application(
                                    new Variable("f"),
                                    new Application(
                                        new Variable("f"),
                                        new Application(
                                            new Variable("f"),
                                            new Application(
                                                new Variable("f"),
                                                new Application(
                                                    new Variable("f"),
                                                    new Application(
                                                        new Variable("f"),
                                                        new Variable("x")
                                                    )
                                                )
                                            )
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            ),
        });

    private rename_free_vars: boolean;
    private resolver: BindingResolver = new BindingResolver(this.bindings);

    constructor(rename_free_vars: boolean) {
        this.rename_free_vars = rename_free_vars;
    }

    interpret(stmts: Stmt[]) {
        stmts.forEach(stmt => {
            stmt.accept(this);
        });
    }

    visitTermStmt(term_stmt: TermStmt): void {
        logger.vlog(`λ > ${printAst(term_stmt.term)}`);
        logger.log(
            `>>> ${printAst(
                new Reducer(this.rename_free_vars).reduceTerm(
                    this.resolver.resolveTerm(term_stmt.term)
                )
            )}\n`
        );
    }
    visitBindingStmt(binding: BindingStmt): void {
        this.bindings[binding.name] = binding.term;
    }
    visitCommandStmt(command: CommandStmt): void {
        switch (command.type) {
            case CommandType.ENV:
                this.printBindings();
                break;
            case CommandType.UNBIND:
                delete this.bindings[command.argument];
                break;
        }
    }

    private printBindings() {
        Object.entries(this.bindings).forEach(binding => {
            logger.log(`${binding[0]}:\t${printAst(binding[1])}`);
        });
    }
}
