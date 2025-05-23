const nearley = require("nearley");
const grammar = require("./nearley/lambster_parser.js");

const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

parser.feed("Lx.x");
console.log(parser.results);
