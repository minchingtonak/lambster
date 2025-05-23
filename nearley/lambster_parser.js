// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }
var grammar = {
    Lexer: undefined,
    ParserRules: [
    {"name": "IDENTIFIER$ebnf$1", "symbols": [/[a-z0-9]/]},
    {"name": "IDENTIFIER$ebnf$1", "symbols": ["IDENTIFIER$ebnf$1", /[a-z0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "IDENTIFIER", "symbols": ["IDENTIFIER$ebnf$1"]},
    {"name": "LAMBDA$subexpression$1", "symbols": [/[lL]/, /[aA]/, /[mM]/, /[bB]/, /[dD]/, /[aA]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "LAMBDA", "symbols": ["LAMBDA$subexpression$1"]},
    {"name": "LAMBDA", "symbols": [{"literal":"L"}]},
    {"name": "LAMBDA", "symbols": [{"literal":"\\"}]},
    {"name": "LAMBDA", "symbols": [{"literal":"λ"}]},
    {"name": "grouping", "symbols": [{"literal":"("}, "term", {"literal":")"}]},
    {"name": "application", "symbols": ["term", "term"]},
    {"name": "abstraction$ebnf$1", "symbols": ["IDENTIFIER"]},
    {"name": "abstraction$ebnf$1", "symbols": ["abstraction$ebnf$1", "IDENTIFIER"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "abstraction", "symbols": ["LAMBDA", "abstraction$ebnf$1", {"literal":"."}, "term"]},
    {"name": "bindingStmt", "symbols": ["IDENTIFIER", {"literal":"="}, "term", {"literal":"\n"}]},
    {"name": "commandStmt$string$1", "symbols": [{"literal":"h"}, {"literal":"e"}, {"literal":"l"}, {"literal":"p"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "commandStmt", "symbols": ["commandStmt$string$1", {"literal":"\n"}]},
    {"name": "commandStmt$string$2", "symbols": [{"literal":"e"}, {"literal":"n"}, {"literal":"v"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "commandStmt", "symbols": ["commandStmt$string$2", {"literal":"\n"}]},
    {"name": "commandStmt$string$3", "symbols": [{"literal":"u"}, {"literal":"n"}, {"literal":"b"}, {"literal":"i"}, {"literal":"n"}, {"literal":"d"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "commandStmt", "symbols": ["commandStmt$string$3", "IDENTIFIER", {"literal":"\n"}]},
    {"name": "term", "symbols": ["IDENTIFIER"]},
    {"name": "term", "symbols": ["abstraction"]},
    {"name": "term", "symbols": ["application"]},
    {"name": "term", "symbols": ["grouping"]},
    {"name": "termStmt", "symbols": ["term", {"literal":"\n"}]},
    {"name": "stmt", "symbols": ["bindingStmt"]},
    {"name": "stmt", "symbols": ["commandStmt"]},
    {"name": "stmt", "symbols": ["termStmt"]},
    {"name": "stmt", "symbols": [{"literal":"\n"}]},
    {"name": "main$subexpression$1", "symbols": ["stmt"]},
    {"name": "main", "symbols": ["main$subexpression$1"]}
]
  , ParserStart: "IDENTIFIER"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
