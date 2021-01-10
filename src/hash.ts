import { Term } from "./ast";
import { transformTerm } from "./utils";

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

function rng(seed: string): () => number {
    const s: () => number = xmur3("l4mbd4");
    return sfc32(s(), s(), s(), s());
}

export function hash(term: Term): number {
    const rand = rng("c4lcvlv5");
    return transformTerm(term, {
        absf: (abs, body) => rand() ^ 7118896751009 ^ (27868593065317 * strhash(abs.name)) ^ body,
        appf: (_, func, arg) =>
            rand() ^ 14367883950617 ^ (19247925932227 * func) ^ (28518786250657 * arg),
        vf: v => rand() ^ 1077274700101 ^ (18031070658737 * strhash(v.name)),
    });
}

export function structureHash(term: Term): number {
    const rand = rng("l4mbda"),
        ids: { [key: string]: number } = {};
    function idFor(name: string): number {
        if (!(name in ids)) ids[name] = rand();
        return ids[name];
    }
    return transformTerm<number>(term, {
        absf: (abs, body) => rand() ^ 16936798133287 ^ (29355898986269 * idFor(abs.name)) ^ body,
        appf: (_, func, arg) =>
            rand() ^ 26763705109789 ^ (5384721613309 * func) ^ (12237052197457 * arg),
        vf: v => rand() ^ 6723855822577 ^ (8456060654981 * idFor(v.name)),
    });
}
