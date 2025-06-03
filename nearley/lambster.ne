stmt ->   bindingStmt
        | commandStmt
        | termStmt

bindingStmt -> IDENTIFIER _ "=" _ termStmt {%
        function(d) {
                return {
                        identifier: d[0][0],
                        term: d[4][0]
                }
        }
%}

commandStmt ->  "help" {%
        function(d) {
                return {
                        command: d[0]
                }
        }
%}
                | "env" {%
        function(d) {
                return {
                        command: d[0]
                }
        }
%}

                | "unbind" __ IDENTIFIER {%
        function(d) {
                return {
                        command: d[0],
                        identifier: d[2]
                }
        }
%}

termStmt ->     abstraction
                | application
                | grouping
                | IDENTIFIER

abstraction -> LAMBDA _ IDENTIFIER _ "." _ termStmt {%
        function(d) {
                return {
                        lambda_symbol: d[0][0],
                        identifier: d[2],
                        term: d[6][0]
                }
        }
%}              
                | LAMBDA _ IDENTIFIER ( __ IDENTIFIER ):+ _ "." _ termStmt {%
        function(d) {
                return {
                        lambda_symbol: d[0][0],
                        identifier: d[2],
                        term: d[7][0]
                }
        }
%}

application -> termStmt __ termStmt
grouping -> "(" _ termStmt _ ")"
LAMBDA -> "lambda"i | "L" | "\\" | "λ"

IDENTIFIER -> [a-z0-9]:+ {% d => d[0].join("") %}

_ -> [ \t]:*
__ -> [ \t]:+
