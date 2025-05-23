IDENTIFIER -> [a-z0-9]:+

LAMBDA -> "lambda"i | "L" | "\\" | "λ"

grouping -> "(" term ")"

application -> term term

abstraction -> LAMBDA IDENTIFIER:+ "." term

bindingStmt -> IDENTIFIER "=" term "\n"

commandStmt ->  "help" "\n"
                | "env" "\n"
                | "unbind" IDENTIFIER "\n"

term ->   IDENTIFIER
          | abstraction
          | application
          | grouping

termStmt -> term "\n"

stmt ->   bindingStmt
        | commandStmt
        | termStmt
        | "\n"

main -> (stmt)
