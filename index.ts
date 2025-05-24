import nearley from "nearley";
import grammar from "./nearley/lambster_parser.js";

const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

parser.feed("Lx.x");
console.log(parser.results);
