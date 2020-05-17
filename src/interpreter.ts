import { Stmt, Term, Abstraction, Variable, Application } from "./ast";
import { Reducer } from "./reducer";
import { BindingResolver } from "./bindingresolver";
import { AstPrinter } from "./astprinter";

export class Interpreter {
    private bindings: { [key: string]: Term } = {
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
                new Application(
                    new Variable("b"),
                    new Abstraction("t", new Abstraction("f", new Variable("f")))
                ),
                new Abstraction("t", new Abstraction("f", new Variable("t")))
            )
        ),
    };
    private rename_free_vars: boolean;
    private printer: AstPrinter = new AstPrinter();
    private resolver: BindingResolver = new BindingResolver(this.bindings);

    constructor(rename_free_vars: boolean) {
        this.rename_free_vars = rename_free_vars;
    }

    interpret(stmts: Stmt[]) {
        stmts.forEach(stmt => {
            if (stmt instanceof Term) {
                console.log(
                    `>>> ${this.printer.print(
                        new Reducer(this.rename_free_vars).reduceTerm(
                            this.resolver.resolveTerm(stmt)
                        )
                    )}`
                );
            } else {
                this.bindings[stmt.name] = stmt.term;
            }
        });
    }
}
