import { TermVisitor, Abstraction, Application, Variable, Term } from "./ast";

// https://stackoverflow.com/a/7616484/13334328
function strhash(str: string): number {
    var hash: number = 0,
        i: number,
        chr: number;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

// https://stackoverflow.com/a/47593316/13334328
function xmur3(str: string): () => number {
    for (var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
        (h = Math.imul(h ^ str.charCodeAt(i), 3432918353)), (h = (h << 13) | (h >>> 19));
    return (): number => {
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        return (h ^= h >>> 16) >>> 0;
    };
}

function sfc32(a: number, b: number, c: number, d: number): () => number {
    return (): number => {
        a >>>= 0;
        b >>>= 0;
        c >>>= 0;
        d >>>= 0;
        var t = (a + b) | 0;
        a = b ^ (b >>> 9);
        b = (c + (c << 3)) | 0;
        c = (c << 21) | (c >>> 11);
        d = (d + 1) | 0;
        t = (t + d) | 0;
        c = (c + t) | 0;
        return (t >>> 0) / 4294967296;
    };
}

abstract class Hasher implements TermVisitor<number> {
    rand: () => number;
    seedrng(seed: string) {
        const s: () => number = xmur3("l4mbd4");
        this.rand = sfc32(s(), s(), s(), s());
    }
    hash(term: Term): number {
        throw new Error("Method not implemented.");
    }
    visitAbstraction(abstraction: Abstraction): number {
        throw new Error("Method not implemented.");
    }
    visitApplication(application: Application): number {
        throw new Error("Method not implemented.");
    }
    visitVariable(variable: Variable): number {
        throw new Error("Method not implemented.");
    }
}

class TermStructureHasher extends Hasher {
    private names: { [key: string]: number } = {};
    hash(term: Term): number {
        this.seedrng("l4mbd4");
        this.names = {};
        return term.accept(this);
    }

    visitAbstraction(abstraction: Abstraction): number {
        return (
            this.rand() ^
            16936798133287 ^
            (29355898986269 * this.getName(abstraction.name)) ^
            abstraction.body.accept(this)
        );
    }
    visitApplication(application: Application): number {
        return (
            this.rand() ^
            26763705109789 ^
            (5384721613309 * application.func.accept(this)) ^
            (12237052197457 * application.argument.accept(this))
        );
    }
    visitVariable(variable: Variable): number {
        return this.rand() ^ 6723855822577 ^ (8456060654981 * this.getName(variable.name));
    }

    private getName(name: string): number {
        if (!(name in this.names)) this.names[name] = this.rand();
        return this.names[name];
    }
}

class TermHasher extends Hasher {
    hash(term: Term): number {
        this.seedrng("c4lcvlv5");
        return term.accept(this);
    }
    visitAbstraction(abstraction: Abstraction): number {
        return (
            this.rand() ^
            7118896751009 ^
            (27868593065317 * strhash(abstraction.name)) ^
            abstraction.body.accept(this)
        );
    }
    visitApplication(application: Application): number {
        return (
            this.rand() ^
            14367883950617 ^
            (19247925932227 * application.func.accept(this)) ^
            (28518786250657 * application.argument.accept(this))
        );
    }
    visitVariable(variable: Variable): number {
        return this.rand() ^ 1077274700101 ^ (18031070658737 * strhash(variable.name));
    }
}

const s_hasher: TermStructureHasher = new TermStructureHasher(),
    hasher: TermHasher = new TermHasher();
export function hashTermStructure(term: Term) {
    return s_hasher.hash(term);
}
export function hashTerm(term: Term) {
    return hasher.hash(term);
}
