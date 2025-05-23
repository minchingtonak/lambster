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
    {"name": "bindingStmt", "symbols": ["IDENTIFIER", {"literal":"="}, "term"]},
    {"name": "commandStmt$string$1", "symbols": [{"literal":"h"}, {"literal":"e"}, {"literal":"l"}, {"literal":"p"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "commandStmt", "symbols": ["commandStmt$string$1"]},
    {"name": "commandStmt$string$2", "symbols": [{"literal":"e"}, {"literal":"n"}, {"literal":"v"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "commandStmt", "symbols": ["commandStmt$string$2"]},
    {"name": "commandStmt$string$3", "symbols": [{"literal":"u"}, {"literal":"n"}, {"literal":"b"}, {"literal":"i"}, {"literal":"n"}, {"literal":"d"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "commandStmt", "symbols": ["commandStmt$string$3", "IDENTIFIER"]},
    {"name": "termStmt", "symbols": ["term"]},
    {"name": "term", "symbols": ["IDENTIFIER"]},
    {"name": "term", "symbols": ["abstraction"]},
    {"name": "term", "symbols": ["application"]},
    {"name": "term", "symbols": ["grouping"]},
    {"name": "abstraction", "symbols": ["LAMBDA", "IDENTIFIER", {"literal":"."}, "term"]},
    {"name": "application", "symbols": ["term", "term"]},
    {"name": "grouping", "symbols": [{"literal":"("}, "term", {"literal":")"}]},
    {"name": "LAMBDA$subexpression$1", "symbols": [/[lL]/, /[aA]/, /[mM]/, /[bB]/, /[dD]/, /[aA]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "LAMBDA", "symbols": ["LAMBDA$subexpression$1"]},
    {"name": "LAMBDA", "symbols": [{"literal":"L"}]},
    {"name": "LAMBDA", "symbols": [{"literal":"\\"}]},
    {"name": "LAMBDA", "symbols": [{"literal":"λ"}]},
    {"name": "IDENTIFIER$ebnf$1", "symbols": [/[a-z0-9]/]},
    {"name": "IDENTIFIER$ebnf$1", "symbols": ["IDENTIFIER$ebnf$1", /[a-z0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "IDENTIFIER", "symbols": ["IDENTIFIER$ebnf$1"]}
]
  , ParserStart: "stmt"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
