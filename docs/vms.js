/* vms.js — the engine: EVA glyphs drawn as pen strokes, text statistics, and the machines that make
   Voynich-like text (cipher, grille, self-citation). No page code here; app.js wires it up. */
(function (root) {
  "use strict";
  var V = {};

  /* ---------- seeded random ---------- */
  V.rng = function (seed) {
    var s = (seed >>> 0) || 1;
    return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  };

  /* ---------- EVA: split a word into glyphs ---------- */
  var MULTI = ["ckh", "cth", "cph", "cfh", "ch", "sh"];
  V.glyphs = function (w) {
    var out = [], i = 0;
    while (i < w.length) {
      var hit = null;
      for (var k = 0; k < MULTI.length; k++) if (w.substr(i, MULTI[k].length) === MULTI[k]) { hit = MULTI[k]; break; }
      if (!hit) hit = w[i];
      out.push(hit); i += hit.length;
    }
    return out;
  };

  /* ---------- glyph shapes: polylines in a box, x right, y up, baseline 0, x-height 1 ---------- */
  function arc(cx, cy, rx, ry, a0, a1, n) {
    var p = []; n = n || 18;
    for (var i = 0; i <= n; i++) { var a = a0 + (a1 - a0) * i / n; p.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
    return p;
  }
  function bez(p0, p1, p2, p3, n) {
    var p = []; n = n || 16;
    for (var i = 0; i <= n; i++) {
      var t = i / n, u = 1 - t;
      p.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
              u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]);
    }
    return p;
  }
  var PI = Math.PI;
  function cShape(x) { return arc(x + 0.36, 0.5, 0.34, 0.48, -0.25 * PI, -1.85 * PI, 20).map(function (q) { return [q[0], q[1]]; }); }
  function minim(x) { return bez([x + 0.05, 1.0], [x + 0.12, 0.6], [x + 0.08, 0.2], [x + 0.22, 0.0], 10); }
  function gallowsLoop(x, w) { return bez([x, 0.0], [x, 1.2], [x, 2.0], [x + 0.18, 2.1], 12).concat(bez([x + 0.18, 2.1], [x + 0.5 * w, 2.15], [x + w, 1.6], [x + w * 0.85, 1.0], 12).slice(1)); }
  var G = {
    o: { w: 0.8, s: [arc(0.4, 0.5, 0.36, 0.48, 0.5 * PI, 2.5 * PI, 26)] },
    e: { w: 0.62, s: [arc(0.34, 0.5, 0.3, 0.46, -0.2 * PI, -1.8 * PI, 18).map(function (q) { return [q[0], q[1]]; })] },
    a: { w: 0.85, s: [arc(0.36, 0.5, 0.32, 0.46, -0.15 * PI, -1.85 * PI, 18), bez([0.66, 0.95], [0.7, 0.5], [0.66, 0.15], [0.84, 0.0], 10)] },
    i: { w: 0.32, s: [minim(0.04)] },
    n: { w: 0.55, s: [bez([0.06, 1.0], [0.12, 0.55], [0.06, 0.05], [0.22, 0.02], 10).concat(bez([0.22, 0.02], [0.5, 0.0], [0.55, 0.7], [0.36, 1.05], 12).slice(1))] },
    m: { w: 0.7, s: [bez([0.06, 1.0], [0.12, 0.55], [0.06, 0.05], [0.24, 0.02], 10).concat(bez([0.24, 0.02], [0.75, 0.0], [0.72, 0.9], [0.4, 0.75], 12).slice(1))] },
    r: { w: 0.5, s: [bez([0.08, 0.95], [0.14, 0.55], [0.08, 0.15], [0.22, 0.0], 10), bez([0.12, 0.8], [0.25, 1.1], [0.45, 1.05], [0.48, 0.82], 10)] },
    s: { w: 0.6, s: [bez([0.1, 0.9], [0.16, 0.5], [0.08, 0.1], [0.24, 0.0], 10), bez([0.14, 0.75], [0.2, 1.15], [0.6, 1.05], [0.5, 0.75], 12), bez([0.12, 0.85], [0.0, 1.1], [0.25, 1.25], [0.32, 1.1], 8)] },
    y: { w: 0.78, s: [arc(0.38, 0.55, 0.3, 0.42, 0.1 * PI, 2.1 * PI, 22), bez([0.68, 0.6], [0.7, 0.0], [0.5, -0.65], [0.05, -0.55], 14)] },
    d: { w: 0.8, s: [arc(0.36, 0.45, 0.3, 0.42, 0.2 * PI, 2.0 * PI, 20).concat(bez([0.66, 0.45], [0.72, 1.3], [0.4, 1.9], [0.12, 1.55], 14).slice(1))] },
    l: { w: 0.7, s: [bez([0.42, 1.75], [0.05, 1.5], [0.22, 0.6], [0.3, 0.3], 14).concat(arc(0.36, 0.28, 0.24, 0.26, PI, 3 * PI, 18).slice(1)).concat(bez([0.6, 0.28], [0.66, 0.1], [0.7, 0.0], [0.72, -0.02], 5).slice(1))] },
    q: { w: 0.72, s: [bez([0.55, 0.0], [0.5, 0.7], [0.5, 1.2], [0.4, 1.35], 10), bez([0.4, 1.35], [0.0, 0.9], [0.0, 0.45], [0.7, 0.5], 14)] },
    k: { w: 1.0, s: [gallowsLoop(0.15, 0.55), bez([0.62, 1.05], [0.7, 0.6], [0.66, 0.2], [0.8, 0.0], 10), bez([0.15, 0.0], [0.15, 0.4], [0.15, 0.8], [0.15, 1.2], 4)] },
    t: { w: 1.1, s: [gallowsLoop(0.2, 0.5), bez([0.2, 1.6], [-0.05, 1.9], [-0.1, 1.2], [0.2, 1.0], 12), bez([0.62, 1.05], [0.7, 0.6], [0.66, 0.2], [0.82, 0.0], 10)] },
    p: { w: 1.25, s: [gallowsLoop(0.45, 0.55), bez([-0.05, 1.9], [0.2, 2.15], [0.35, 2.05], [0.55, 2.12], 10), bez([0.92, 1.05], [1.0, 0.6], [0.96, 0.2], [1.1, 0.0], 10)] },
    f: { w: 1.3, s: [gallowsLoop(0.5, 0.5), bez([0.5, 1.6], [0.25, 1.9], [0.2, 1.2], [0.5, 1.0], 12), bez([-0.05, 1.9], [0.2, 2.15], [0.35, 2.05], [0.55, 2.12], 10), bez([0.92, 1.05], [1.0, 0.6], [0.96, 0.2], [1.12, 0.0], 10)] },
    g: { w: 0.8, s: [arc(0.38, 0.55, 0.3, 0.42, 0.1 * PI, 2.1 * PI, 22), bez([0.68, 0.6], [0.7, 0.0], [0.6, -0.6], [0.3, -0.4], 12)] },
    x: { w: 0.7, s: [bez([0.05, 0.0], [0.3, 0.4], [0.4, 0.6], [0.65, 1.0], 6), bez([0.05, 1.0], [0.3, 0.6], [0.4, 0.4], [0.65, 0.0], 6)] },
    v: { w: 0.6, s: [bez([0.05, 1.0], [0.2, 0.3], [0.3, 0.0], [0.55, 1.1], 10)] }
  };
  function shift(strokes, dx) { return strokes.map(function (s) { return s.map(function (q) { return [q[0] + dx, q[1]]; }); }); }
  function bar(x0, x1) { return bez([x0, 1.02], [x0 + (x1 - x0) * 0.3, 1.1], [x0 + (x1 - x0) * 0.7, 1.1], [x1, 1.02], 8); }
  // ch: two e's tied at the top; sh: ch with a plume
  G.ch = { w: 1.15, s: [cShape(0)[0] ? cShape(0) : [], cShape(0.5), bar(0.3, 0.82)] };
  G.ch.s = [arc(0.32, 0.5, 0.28, 0.46, -0.2 * PI, -1.8 * PI, 16), arc(0.8, 0.5, 0.28, 0.46, -0.2 * PI, -1.8 * PI, 16), bar(0.2, 0.92)];
  G.sh = { w: 1.15, s: G.ch.s.concat([bez([0.45, 1.08], [0.4, 1.5], [0.7, 1.55], [0.75, 1.3], 10)]) };
  ["k", "t", "p", "f"].forEach(function (g) {
    // bench gallows: c + gallows + h, the gallows standing over the bar
    var gw = G[g].w;
    G["c" + g + "h"] = { w: gw + 0.9, s: [arc(0.32, 0.5, 0.28, 0.46, -0.2 * PI, -1.8 * PI, 16)].concat(shift(G[g].s, 0.35)).concat([arc(gw + 0.55, 0.5, 0.28, 0.46, -0.2 * PI, -1.8 * PI, 16), bar(0.2, gw + 0.75)]) };
  });
  G.h = { w: 0.5, s: [bar(0.0, 0.45)] };
  V.G = G;
  V.glyphWidth = function (g) { return (G[g] || G.o).w; };

  /* draw one word with a pen. ctx, word, x, y (baseline), size (x-height px). opt: {jit, rnd, upto(0..1), ink} returns width */
  V.drawWord = function (ctx, word, x, y, sz, opt) {
    opt = opt || {};
    var gs = V.glyphs(word), cx = x, rnd = opt.rnd || Math.random, jit = opt.jit == null ? 0.04 : opt.jit;
    var total = gs.length, upto = opt.upto == null ? total : opt.upto * total;
    for (var i = 0; i < gs.length; i++) {
      var g = G[gs[i]] || G.o;
      var part = Math.max(0, Math.min(1, upto - i));
      if (part > 0) {
        var dx = (rnd() - 0.5) * jit, dy = (rnd() - 0.5) * jit, sl = 0.08 + (rnd() - 0.5) * jit;
        ctx.beginPath();
        g.s.forEach(function (st) {
          var n = Math.max(2, Math.ceil(st.length * part));
          for (var j = 0; j < n; j++) {
            var px = cx + (st[j][0] + dx + st[j][1] * sl) * sz, py = y - (st[j][1] + dy) * sz;
            if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
        });
        ctx.stroke();
      }
      cx += (g.w + 0.12) * sz;
    }
    return cx - x;
  };
  V.wordWidth = function (word, sz) {
    return V.glyphs(word).reduce(function (a, g) { return a + ((G[g] || G.o).w + 0.12) * sz; }, 0);
  };

  /* ---------- statistics ---------- */
  // units: "eva" counts EVA letters; "glyph" counts ch, sh, ckh… as one glyph each
  V.units = function (w, mode) { return mode === "glyph" ? V.glyphs(w) : w.split(""); };
  V.stats = function (words, mode) {
    var n = words.length, freq = {}, lens = [], rep = 0, i;
    for (i = 0; i < n; i++) {
      var w = words[i]; freq[w] = (freq[w] || 0) + 1;
      var L = V.units(w, mode).length; lens[L] = (lens[L] || 0) + 1;
      if (i && words[i - 1] === w) rep++;
    }
    // characters, with the word break as one more symbol
    var c1 = {}, c2 = {}, N = 0, prev = " ";
    for (i = 0; i < n; i++) {
      var u = V.units(words[i], mode).concat([" "]);
      for (var j = 0; j < u.length; j++) {
        c1[u[j]] = (c1[u[j]] || 0) + 1; c2[prev + "|" + u[j]] = (c2[prev + "|" + u[j]] || 0) + 1; prev = u[j]; N++;
      }
    }
    var h1 = 0, h12 = 0, k;
    for (k in c1) h1 -= c1[k] / N * Math.log2(c1[k] / N);
    for (k in c2) h12 -= c2[k] / N * Math.log2(c2[k] / N);
    var ranked = Object.keys(freq).sort(function (a, b) { return freq[b] - freq[a]; });
    var fr = ranked.map(function (w) { return freq[w]; });
    // Zipf slope over the first 1,000 ranks
    var m = Math.min(1000, fr.length), sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (i = 0; i < m; i++) { var X = Math.log(i + 1), Y = Math.log(fr[i]); sx += X; sy += Y; sxx += X * X; sxy += X * Y; }
    var slope = m > 2 ? (m * sxy - sx * sy) / (m * sxx - sx * sx) : 0;
    for (i = 0; i < lens.length; i++) lens[i] = (lens[i] || 0) / n;
    var mean = 0; for (i = 0; i < lens.length; i++) mean += i * lens[i];
    return { n: n, types: ranked.length, top: ranked.slice(0, 10), fr: fr, letters: Object.keys(c1).length - 1,
             h1: h1, h2: h12 - h1, lens: lens, mean: mean, zipf: slope, rep: rep / n * 1000 };
  };

  /* ---------- one-letter edits: how near is a word to one seen before? ---------- */
  V.near = function (a, b) {
    if (a === b) return 0;
    var A = V.glyphs(a), B = V.glyphs(b);
    if (Math.abs(A.length - B.length) > 1) return 9;
    var i = 0, j = 0, d = 0;
    while (i < A.length && j < B.length) {
      if (A[i] === B[j]) { i++; j++; continue; }
      if (++d > 1) return 9;
      if (A.length > B.length) i++; else if (B.length > A.length) j++; else { i++; j++; }
    }
    return d + (A.length - i) + (B.length - j);
  };

  /* ---------- a slot grammar: one way to describe Voynich words ---------- */
  V.SLOTS = [
    ["", "q", "s", "d", "y", "l", "ol", "qol"],
    ["", "o", "y", "a"],
    ["", "ch", "sh"],
    ["", "e", "o"],
    ["", "k", "t", "p", "f", "ckh", "cth", "cph", "cfh"],
    ["", "ch", "sh"],
    ["", "e", "ee", "eee"],
    ["", "k", "t", "o", "a"],
    ["", "i", "ii", "iii", "o", "e"],
    ["", "d", "l", "r", "s", "n", "m"],
    ["", "y", "dy", "in", "iin", "ain", "aiin", "ar", "al", "or", "ol"]
  ];
  // does the word parse, slot by slot, left to right? returns the pieces or null
  V.parse = function (w) {
    var S = V.SLOTS;
    function go(i, pos, acc) {
      if (i === S.length) return pos === w.length ? acc : null;
      for (var k = S[i].length - 1; k >= 0; k--) {
        var p = S[i][k];
        if (p && w.substr(pos, p.length) !== p) continue;
        var r = go(i + 1, pos + p.length, acc.concat([p]));
        if (r) return r;
      }
      return null;
    }
    return w ? go(0, 0, []) : null;
  };

  /* ---------- cipher machines ---------- */
  var LAT = "abcdefghiklmnopqrstuvxyz";
  var SUB = ["o", "a", "ch", "d", "e", "f", "k", "sh", "y", "l", "s", "n", "or", "p", "q", "r", "t", "ol", "ee", "ar", "dy", "al", "m", "in"];
  V.substitute = function (w) {
    return w.split("").map(function (c) { var i = LAT.indexOf(c === "j" ? "i" : c === "w" ? "v" : c); return i < 0 ? "" : SUB[i]; }).join("");
  };
  // verbose cipher: each plaintext letter becomes a syllable; a word's letters come out as two or three Voynich-like words
  var VERB = { a: "ok", b: "qo", c: "ch", d: "dy", e: "ee", f: "ckh", g: "kch", h: "sh", i: "ai", k: "ot", l: "ol", m: "am", n: "aiin", o: "o", p: "op", q: "qok", r: "ar", s: "s", t: "che", u: "y", v: "y", x: "ty", y: "y", z: "ch", j: "ai", w: "y" };
  V.verbose = function (w) {
    var out = [], cur = "";
    w.split("").forEach(function (c, i) {
      cur += VERB[c] || "";
      if (cur.length >= 4 || i === w.length - 1) { out.push(cur); cur = ""; }
    });
    return out.filter(Boolean);
  };
  V.encipher = function (words, how) {
    var out = [];
    words.forEach(function (w) {
      if (how === "verbose") out.push.apply(out, V.verbose(w)); else { var s = V.substitute(w); if (s) out.push(s); }
    });
    return out;
  };

  /* ---------- Rugg's grille ---------- */
  V.grilleTable = function (rows, seed) {
    var r = V.rng(seed || 7);
    var P = ["qo", "o", "ch", "sh", "", "d", "y", "qok", "ok", "ot", "", "s", "cth", "ckh", "so", "do", "cho", "sho"];
    var M = ["", "k", "t", "e", "ke", "te", "ee", "kee", "tee", "o", "ai", "che", "she", "", "ckhe", "a"];
    var X = ["dy", "y", "aiin", "ain", "ol", "or", "al", "ar", "edy", "eey", "iin", "l", "r", "s", "am", "chy", "", "ody"];
    var t = [];
    for (var i = 0; i < rows; i++) t.push([P[(r() * P.length) | 0], M[(r() * M.length) | 0], X[(r() * X.length) | 0]]);
    return t;
  };
  // the card has a hole in each column; the holes sit at row offsets off[0..2]
  V.grilleWord = function (table, row, off) {
    var n = table.length;
    return table[(row + off[0]) % n][0] + table[(row + off[1]) % n][1] + table[(row + off[2]) % n][2];
  };
  V.grilleText = function (table, n, seed) {
    var r = V.rng(seed || 3), out = [];
    var cards = [[0, 2, 5], [0, 1, 3], [1, 4, 2], [0, 3, 1]];
    while (out.length < n) {
      var card = cards[(r() * cards.length) | 0], start = (r() * table.length) | 0, run = 4 + ((r() * 9) | 0);
      for (var k = 0; k < run && out.length < n; k++) { var w = V.grilleWord(table, start + k, card); if (w) out.push(w); }
    }
    return out;
  };

  /* ---------- self-citation (after Timm & Schinner): copy an earlier word, change a little ---------- */
  var SWAP = { k: "t", t: "k", p: "f", f: "p", ch: "sh", sh: "ch", d: "l", l: "r", r: "s", s: "d", e: "ee", ee: "e", o: "a", a: "o", y: "o", ckh: "cth", cth: "ckh" };
  var ADD = ["y", "dy", "aiin", "ol", "or", "ar", "al", "ey", "edy"];
  V.mutate = function (w, r) {
    var g = V.glyphs(w), roll = r();
    if (roll < 0.45) {
      var i = (r() * g.length) | 0; if (SWAP[g[i]]) g[i] = SWAP[g[i]];
    } else if (roll < 0.6) {
      if (g[0] === "q") g.shift(); else if (g[0] === "o") g.unshift("q"); else if (g[0] === "y") g[0] = "o"; else g.unshift(r() < 0.5 ? "o" : "qo");
    } else if (roll < 0.8) {
      // trade the ending
      if (g.length > 2) g.pop();
      g.push(ADD[(r() * ADD.length) | 0]);
    } else if (g.length > 4) {
      g.splice(1 + ((r() * (g.length - 2)) | 0), 1);
    } else {
      g.splice(1 + ((r() * (g.length - 1)) | 0), 0, ["e", "k", "t", "ch", "o"][(r() * 5) | 0]);
    }
    return g.join("");
  };
  V.selfCite = function (seedWords, n, seed, lineLen) {
    var r = V.rng(seed || 11), out = seedWords.slice(), L = lineLen || 9;
    while (out.length < n) {
      var back = r() < 0.4 ? L + ((r() * 3) | 0) - 1 : 1 + ((r() * Math.min(out.length, 120)) | 0);
      var src = out[Math.max(0, out.length - back)];
      var w = r() < 0.08 ? src : V.mutate(src, r);
      if (w !== src && (!V.parse(w) || /eee|[oa]{2}|^[eai]|^.?$|q[^o]|iiii|[ei]i?[ei]/.test(w) || /q/.test(w.slice(1)))) w = src;
      out.push(w.length > 9 ? V.glyphs(w).slice(0, 4).join("") : w);
    }
    return out;
  };

  root.VMS = V;
  if (typeof module !== "undefined") module.exports = V;
})(typeof window !== "undefined" ? window : globalThis);
