// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }
var grammar = {
    Lexer: undefined,
    ParserRules: [
    {"name": "stmt", "symbols": ["bindingStmt"]},
    {"name": "stmt", "symbols": ["commandStmt"]},
    {"name": "stmt", "symbols": ["termStmt"]},
    {"name": "bindingStmt", "symbols": ["IDENTIFIER", "_", {"literal":"="}, "_", "termStmt"], "postprocess": 
        function(d) {
                return {
                        identifier: d[0][0],
                        term: d[4][0]
                }
        }
        },
    {"name": "commandStmt$string$1", "symbols": [{"literal":"h"}, {"literal":"e"}, {"literal":"l"}, {"literal":"p"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "commandStmt", "symbols": ["commandStmt$string$1"], "postprocess": 
        function(d) {
                return {
                        command: d[0]
                }
        }
        },
    {"name": "commandStmt$string$2", "symbols": [{"literal":"e"}, {"literal":"n"}, {"literal":"v"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "commandStmt", "symbols": ["commandStmt$string$2"], "postprocess": 
        function(d) {
                return {
                        command: d[0]
                }
        }
        },
    {"name": "commandStmt$string$3", "symbols": [{"literal":"u"}, {"literal":"n"}, {"literal":"b"}, {"literal":"i"}, {"literal":"n"}, {"literal":"d"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "commandStmt", "symbols": ["commandStmt$string$3", "_", "IDENTIFIER"], "postprocess": 
        function(d) {
                return {
                        command: d[0],
                        identifier: d[2]
                }
        }
        },
    {"name": "termStmt", "symbols": ["abstraction"]},
    {"name": "termStmt", "symbols": ["application"]},
    {"name": "termStmt", "symbols": ["grouping"]},
    {"name": "termStmt", "symbols": ["IDENTIFIER"]},
    {"name": "abstraction", "symbols": ["LAMBDA", "_", "IDENTIFIER", "_", {"literal":"."}, "_", "termStmt"], "postprocess": 
        function(d) {
                return {
                        lambda_symbol: d[0][0],
                        identifier: d[2],
                        term: d[6][0]
                }
        }
        },
    {"name": "application", "symbols": ["termStmt", "__", "termStmt"]},
    {"name": "grouping", "symbols": [{"literal":"("}, "_", "termStmt", "_", {"literal":")"}]},
    {"name": "LAMBDA$subexpression$1", "symbols": [/[lL]/, /[aA]/, /[mM]/, /[bB]/, /[dD]/, /[aA]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "LAMBDA", "symbols": ["LAMBDA$subexpression$1"]},
    {"name": "LAMBDA", "symbols": [{"literal":"L"}]},
    {"name": "LAMBDA", "symbols": [{"literal":"\\"}]},
    {"name": "LAMBDA", "symbols": [{"literal":"λ"}]},
    {"name": "IDENTIFIER$ebnf$1", "symbols": [/[a-z0-9]/]},
    {"name": "IDENTIFIER$ebnf$1", "symbols": ["IDENTIFIER$ebnf$1", /[a-z0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "IDENTIFIER", "symbols": ["IDENTIFIER$ebnf$1"], "postprocess": d => d[0].join("")},
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", /[ \t]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_", "symbols": ["_$ebnf$1"]},
    {"name": "__$ebnf$1", "symbols": [/[ \t]/]},
    {"name": "__$ebnf$1", "symbols": ["__$ebnf$1", /[ \t]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "__", "symbols": ["__$ebnf$1"]}
]
  , ParserStart: "stmt"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
