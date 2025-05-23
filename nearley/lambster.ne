stmt ->   bindingStmt
        | commandStmt
        | termStmt
bindingStmt -> IDENTIFIER "=" term
commandStmt ->  "help"
                | "env"
                | "unbind" IDENTIFIER
termStmt -> term
term ->   IDENTIFIER
          | abstraction
          | application
          | grouping
abstraction -> LAMBDA IDENTIFIER "." term
application -> term term
grouping -> "(" term ")"
LAMBDA -> "lambda"i | "L" | "\\" | "λ"
IDENTIFIER -> [a-z0-9]:+
