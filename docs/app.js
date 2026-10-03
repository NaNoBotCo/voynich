/* app.js — everything that moves on the page. Engine in vms.js; words from window.UI (EN or TH). */
(function () {
  "use strict";
  var V = window.VMS, U = window.UI, $ = function (id) { return document.getElementById(id); };
  var ROOT = U.lang === "en" ? "" : "../";
  var INK = "#3d2a1b", VELLUM = "#efe3c4", GREEN = "#6f8f4a", BLUE = "#4f79a8", RED = "#a4473a", GOLD = "#c9962e";
  var SEC = { H: "#6f8f4a", A: "#4f79a8", Z: "#8a6bb0", B: "#3f9a9a", C: "#c9962e", P: "#a4473a", S: "#d07a3a", T: "#8a7a66" };
  var HAND = ["#6f8f4a", "#4f79a8", "#a4473a", "#c9962e", "#8a6bb0"];
  var DATA = null, CORP = {}, N = 12000;
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var Q = new URLSearchParams(location.search);

  function fit(cv) {
    var r = cv.getBoundingClientRect(), w = Math.max(10, r.width), h = Math.max(10, r.height);
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    var c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0); return { c: c, w: w, h: h };
  }
  function fmt(x, d) { return x.toLocaleString(U.lang === "th" ? "th-TH" : "en-US", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }
  function pages(sel) { return DATA.filter(sel); }
  function textWords(pg) { var o = []; pg.forEach(function (p) { p.w.forEach(function (l) { if (l.indexOf(":") < 0) o.push.apply(o, l.split(" ")); }); }); return o; }
  function allWords(p) { var o = []; p.w.forEach(function (l) { o.push.apply(o, l.replace(/^[A-Z]:/, "").split(" ")); }); return o; }
  function lines(p) { return p.w.filter(function (l) { return l.indexOf(":") < 0; }).map(function (l) { return l.split(" "); }); }
  function onVisible(el, fn) {
    if (!("IntersectionObserver" in window)) return fn();
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); fn(); } }); }, { rootMargin: "300px" });
    io.observe(el);
  }

  /* ---------- the plant: roots, stem, leaves, a flower, washed in green and blue ---------- */
  function plant(c, x, y, h, rnd) {
    c.save(); c.lineCap = "round"; c.lineJoin = "round";
    // roots
    c.strokeStyle = INK; c.fillStyle = "rgba(150,105,60,.55)";
    function root(px, py, ang, len, w, d) {
      if (d > 4 || len < 4) return;
      var ex = px + Math.cos(ang) * len, ey = py + Math.sin(ang) * len;
      c.lineWidth = w; c.beginPath(); c.moveTo(px, py);
      c.quadraticCurveTo(px + Math.cos(ang + 0.5) * len * 0.5, py + Math.sin(ang + 0.5) * len * 0.5, ex, ey); c.stroke();
      var k = 1 + ((rnd() * 2.2) | 0);
      for (var i = 0; i < k; i++) root(ex, ey, ang + (rnd() - 0.5) * 1.3, len * (0.55 + rnd() * 0.25), w * 0.7, d + 1);
    }
    var bulb = h * 0.07;
    c.beginPath(); c.ellipse(x, y + bulb * 0.6, bulb * 1.4, bulb, 0, 0, 7); c.fill(); c.lineWidth = 1.4; c.stroke();
    for (var i = 0; i < 5; i++) root(x + (i - 2) * bulb * 0.5, y + bulb * 1.4, Math.PI / 2 + (i - 2) * 0.35, h * 0.12, 2, 0);
    // stem
    var top = y - h * 0.78, sway = (rnd() - 0.5) * h * 0.12;
    c.lineWidth = 2.4; c.strokeStyle = INK; c.beginPath(); c.moveTo(x, y);
    c.bezierCurveTo(x + sway, y - h * 0.3, x - sway, y - h * 0.55, x + sway * 0.4, top); c.stroke();
    function stemAt(t) {
      var u = 1 - t, X = u * u * u * x + 3 * u * u * t * (x + sway) + 3 * u * t * t * (x - sway) + t * t * t * (x + sway * 0.4);
      var Y = u * u * u * y + 3 * u * u * t * (y - h * 0.3) + 3 * u * t * t * (y - h * 0.55) + t * t * t * top;
      return [X, Y];
    }
    // leaves: a superellipse-ish blade with a midrib and veins
    var nL = 4 + ((rnd() * 4) | 0), lob = rnd() < 0.5;
    for (i = 0; i < nL; i++) {
      var t = 0.12 + 0.62 * i / nL, p = stemAt(t), side = i % 2 ? 1 : -1, L = h * (0.32 - 0.16 * t) * (0.8 + rnd() * 0.4), W = L * (0.28 + rnd() * 0.18);
      var ang = side * (0.5 + rnd() * 0.5) - Math.PI / 2 + side * 0.9;
      c.save(); c.translate(p[0], p[1]); c.rotate(ang);
      c.beginPath();
      for (var k = 0; k <= 40; k++) {
        var s = k / 40, yy = Math.sin(Math.PI * s) * W * (lob ? 1 + 0.18 * Math.sin(s * Math.PI * 7) : 1);
        if (k === 0) c.moveTo(0, 0); else c.lineTo(s * L, -yy);
      }
      for (k = 40; k >= 0; k--) {
        s = k / 40; yy = Math.sin(Math.PI * s) * W * (lob ? 1 + 0.18 * Math.sin(s * Math.PI * 7 + 1) : 1);
        c.lineTo(s * L, yy);
      }
      c.closePath(); c.fillStyle = rnd() < 0.75 ? "rgba(111,143,74,.72)" : "rgba(79,121,168,.6)"; c.fill();
      c.lineWidth = 1.2; c.strokeStyle = INK; c.stroke();
      c.lineWidth = 0.8; c.beginPath(); c.moveTo(0, 0); c.lineTo(L * 0.95, 0);
      for (k = 1; k < 6; k++) { var vx = L * k / 6.5; c.moveTo(vx, 0); c.lineTo(vx + W * 0.5, -W * 0.6 * Math.sin(Math.PI * k / 6.5)); c.moveTo(vx, 0); c.lineTo(vx + W * 0.5, W * 0.6 * Math.sin(Math.PI * k / 6.5)); }
      c.stroke(); c.restore();
    }
    // flower
    var f = stemAt(1), np = 5 + ((rnd() * 4) | 0), pr = h * (0.07 + rnd() * 0.04), col = rnd() < 0.5 ? "rgba(79,121,168,.75)" : "rgba(164,71,58,.65)";
    for (i = 0; i < np; i++) {
      var a = -Math.PI / 2 + (i - (np - 1) / 2) * (Math.PI * 1.2 / np);
      c.save(); c.translate(f[0], f[1]); c.rotate(a);
      c.beginPath(); c.ellipse(pr * 0.9, 0, pr, pr * 0.38, 0, 0, 7); c.fillStyle = col; c.fill(); c.lineWidth = 1.1; c.strokeStyle = INK; c.stroke();
      c.restore();
    }
    c.beginPath(); c.arc(f[0], f[1], pr * 0.42, 0, 7); c.fillStyle = "rgba(201,150,46,.85)"; c.fill(); c.stroke();
    c.restore();
  }
  function vellum(c, w, h, rnd) {
    var g = c.createRadialGradient(w * 0.5, h * 0.45, h * 0.1, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
    g.addColorStop(0, "#f3e8cc"); g.addColorStop(1, "#d8c59a"); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.globalAlpha = 0.06; c.fillStyle = "#6b4e2a";
    for (var i = 0; i < 420; i++) { c.beginPath(); c.arc(rnd() * w, rnd() * h, rnd() * 2.2, 0, 7); c.fill(); }
    c.globalAlpha = 1;
  }

  /* ---------- hero: a page writes itself ---------- */
  function hero() {
    var cv = $("scene"); if (!cv) return;
    var herbal = pages(function (p) { return p.i === "H" && lines(p).length >= 8; });
    var pick = Q.has("card") ? herbal[3] : herbal[(Math.random() * herbal.length) | 0];
    var seed = Q.has("card") ? 40 : (Math.random() * 1e9) | 0, t0 = performance.now();
    var tFixed = Q.has("t") ? parseFloat(Q.get("t")) : null;
    function draw(now) {
      var F = fit(cv), c = F.c, w = F.w, h = F.h, rnd = V.rng(seed);
      vellum(c, w, h, rnd);
      var narrow = w < 720, sz = narrow ? 8.5 : Math.max(10, Math.min(14, w / 100));
      var px = narrow ? w * 0.8 : w * 0.75, base = narrow ? h * 0.95 : h * 0.88, ph = narrow ? h * 0.3 : h * 0.5;
      plant(c, px, base, ph, V.rng(seed + 1));
      // text: top of the right-hand page on wide screens; beside the plant, under the title, on phones
      var x0 = narrow ? 16 : w * 0.53, x1 = narrow ? w * 0.6 : w * 0.96, y = narrow ? h * 0.66 : h * 0.12, yEnd = narrow ? h * 0.98 : h * 0.4, lh = sz * 3.1;
      var t = tFixed != null ? tFixed : (now - t0) / 1000, cps = reduce ? 1e9 : 9;
      var budget = t * cps;
      c.strokeStyle = INK; c.lineWidth = Math.max(1.1, sz * 0.13); c.lineCap = "round"; c.lineJoin = "round";
      var ls = lines(pick), wr = V.rng(seed + 2);
      for (var i = 0; i < ls.length && y < yEnd; i++) {
        var x = x0;
        for (var j = 0; j < ls[i].length; j++) {
          var word = ls[i][j], ww = V.wordWidth(word, sz);
          if (x + ww > x1) break;
          var gN = V.glyphs(word).length;
          if (budget <= 0) return t < 400;
          var up = Math.min(1, budget / gN); budget -= gN;
          V.drawWord(c, word, x, y, sz, { rnd: wr, upto: up, jit: 0.05 });
          x += ww + sz * 0.9;
        }
        y += lh;
      }
      return false;
    }
    function loop(now) { if (draw(now)) requestAnimationFrame(loop); }
    requestAnimationFrame(loop);
    var lastW = 0;
    addEventListener("resize", function () { if (Math.abs(cv.getBoundingClientRect().width - lastW) > 40) { lastW = cv.getBoundingClientRect().width; t0 = performance.now() - 1e6; requestAnimationFrame(loop); } });
    cv.addEventListener("click", function () { seed = (Math.random() * 1e9) | 0; pick = herbal[(Math.random() * herbal.length) | 0]; t0 = performance.now(); requestAnimationFrame(loop); });
  }

  /* ---------- map of the book ---------- */
  function bookMap() {
    var cv = $("mapcv"); if (!cv) return;
    var mode = "i", sel = null, rects = [];
    var totals = {};
    DATA.forEach(function (p) { var n = allWords(p).length; totals[p.i] = (totals[p.i] || 0) + n; });
    function colour(p) {
      if (mode === "i") return SEC[p.i] || "#999";
      if (mode === "l") return p.l === "A" ? BLUE : p.l === "B" ? RED : "#b9ad96";
      return HAND[(+p.h || 0) - 1] || "#b9ad96";
    }
    function draw() {
      var F = fit(cv), c = F.c, w = F.w, h = F.h, n = DATA.length;
      c.clearRect(0, 0, w, h);
      var cols = w < 600 ? 19 : 38, rows = Math.ceil(n / cols), gap = 3, cw = (w - gap * (cols - 1)) / cols, ch = Math.min(46, (h - gap * (rows - 1)) / rows);
      var mx = 0; DATA.forEach(function (p) { mx = Math.max(mx, allWords(p).length); });
      rects = [];
      DATA.forEach(function (p, i) {
        var X = (i % cols) * (cw + gap), Y = ((i / cols) | 0) * (ch + gap), k = allWords(p).length / mx;
        c.fillStyle = "rgba(61,42,27,.08)"; c.fillRect(X, Y, cw, ch);
        c.fillStyle = colour(p); c.fillRect(X, Y + ch * (1 - Math.max(0.08, Math.sqrt(k))), cw, ch * Math.max(0.08, Math.sqrt(k)));
        if (sel === i) { c.strokeStyle = INK; c.lineWidth = 2.5; c.strokeRect(X - 1, Y - 1, cw + 2, ch + 2); }
        rects.push([X, Y, cw, ch]);
      });
      cv.style.height = (rows * (ch + gap)) + "px";
    }
    function legend() {
      var el = $("maplegend"), items;
      if (mode === "i") items = Object.keys(U.sections).map(function (k) { return [SEC[k], U.sections[k] + (totals[k] ? " · " + fmt(totals[k]) + " " + U.words_unit : "")]; });
      else if (mode === "l") items = [[BLUE, U.lang_a], [RED, U.lang_b], ["#b9ad96", U.unknown]];
      else items = HAND.map(function (c, i) { return [c, U.hand + " " + (i + 1)]; }).concat([["#b9ad96", U.unknown]]);
      el.innerHTML = items.map(function (x) { return '<span><i style="background:' + x[0] + '"></i>' + x[1] + "</span>"; }).join("");
    }
    function show(i) {
      sel = i; draw();
      var p = DATA[i], box = $("mappage"), ls = lines(p);
      $("mapinfo").textContent = p.f + " · " + U.sections[p.i] + " · " + (p.l === "A" ? U.lang_a : p.l === "B" ? U.lang_b : U.unknown) + " · " + (p.h !== "?" ? U.hand + " " + p.h : U.unknown) + " · " + fmt(allWords(p).length) + " " + U.words_unit;
      var F = fit(box), c = F.c, w = F.w;
      var sz = Math.max(8, Math.min(13, w / 70)), lh = sz * 3, need = Math.min(ls.length, 7) * lh + sz * 3;
      box.style.height = need + "px"; F = fit(box); c = F.c;
      c.fillStyle = VELLUM; c.fillRect(0, 0, F.w, F.h); c.strokeStyle = INK; c.lineWidth = Math.max(1, sz * 0.13); c.lineCap = "round";
      var y = sz * 2.4, rnd = V.rng(i + 1);
      for (var r = 0; r < Math.min(7, ls.length); r++) {
        var x = 12;
        for (var j = 0; j < ls[r].length; j++) { var ww = V.wordWidth(ls[r][j], sz); if (x + ww > F.w - 10) break; V.drawWord(c, ls[r][j], x, y, sz, { rnd: rnd }); x += ww + sz * 0.8; }
        y += lh;
      }
      $("mapeva").textContent = ls.slice(0, 7).map(function (l) { return l.join(" "); }).join("\n");
    }
    document.querySelectorAll("[data-mapmode]").forEach(function (b) {
      b.addEventListener("click", function () {
        mode = b.getAttribute("data-mapmode");
        document.querySelectorAll("[data-mapmode]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        draw(); legend();
      });
    });
    cv.addEventListener("click", function (e) {
      var r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      for (var i = 0; i < rects.length; i++) { var q = rects[i]; if (x >= q[0] && x <= q[0] + q[2] && y >= q[1] && y <= q[1] + q[3]) { show(i); return; } }
    });
    draw(); legend(); show(0);
    addEventListener("resize", function () { draw(); if (sel != null) show(sel); });
  }

  /* ---------- who could have written it: the vellum date against the candidates ---------- */
  function dates() {
    var cv = $("datecv"); if (!cv) return;
    var sl = $("dwait"), lo = 1200, hi = 2000;
    function draw() {
      var wait = +sl.value; $("dwaitv").textContent = fmt(wait) + " " + U.years;
      var F = fit(cv), c = F.c, w = F.w, h = F.h, padL = 22, padR = 26;
      c.clearRect(0, 0, w, h);
      var X = function (y) { return padL + (y - lo) / (hi - lo) * (w - padL - padR); };
      // axis
      c.strokeStyle = "rgba(243,232,204,.35)"; c.fillStyle = "#cdbf9f"; c.font = "13px system-ui"; c.lineWidth = 1;
      for (var y = lo; y <= hi; y += (w < 600 ? 200 : 100)) { c.beginPath(); c.moveTo(X(y), 18); c.lineTo(X(y), h - 22); c.stroke(); c.fillText(y, X(y) - 15, h - 6); }
      // vellum band + the shelf it might have waited on
      c.fillStyle = "rgba(201,150,46,.85)"; c.fillRect(X(1404), 18, X(1438) - X(1404), h - 40);
      c.fillStyle = "rgba(201,150,46,.25)"; c.fillRect(X(1438), 18, X(1438 + wait) - X(1438), h - 40);
      c.fillStyle = "#ffe4a3"; c.font = "bold 13px system-ui"; c.fillText(U.vellum_band, X(1404) + 4, 34);
      // people: [name, from, to]
      var rowH = (h - 70) / U.cands.length;
      U.cands.forEach(function (p, i) {
        var yy = 48 + i * rowH, a = p[1], b = p[2], ok = a <= 1438 + wait && b >= 1404;
        c.fillStyle = ok ? "#7ed0a0" : "rgba(243,232,204,.45)";
        c.fillRect(X(a), yy, Math.max(3, X(b) - X(a)), Math.max(6, rowH * 0.42));
        c.font = "13px system-ui"; c.fillStyle = ok ? "#e9fff1" : "rgba(243,232,204,.7)";
        var tx = X(b) + 6, label = p[0] + (ok ? " ✓" : "");
        if (tx + c.measureText(label).width > w) tx = X(a) - c.measureText(label).width - 6;
        c.fillText(label, tx, yy + Math.max(6, rowH * 0.42) - 1);
      });
    }
    sl.addEventListener("input", draw); addEventListener("resize", draw); draw();
  }

  /* ---------- glyphs: each one, where it stands in a word ---------- */
  function glyphTable() {
    var box = $("glyphgrid"); if (!box) return;
    var all = textWords(DATA), cnt = {}, pos = {};
    all.forEach(function (w) {
      var g = V.glyphs(w);
      g.forEach(function (x, i) {
        cnt[x] = (cnt[x] || 0) + 1;
        var p = pos[x] || (pos[x] = [0, 0, 0]);
        p[g.length === 1 ? 1 : i === 0 ? 0 : i === g.length - 1 ? 2 : 1]++;
      });
    });
    var order = ["o", "e", "ch", "d", "y", "a", "i", "k", "l", "r", "n", "s", "t", "sh", "q", "p", "m", "ckh", "cth", "f", "cph", "cfh", "g", "x", "v"];
    order = order.filter(function (g) { return cnt[g]; });
    box.innerHTML = order.map(function (g) { return '<button type="button" class="gl" data-g="' + g + '"><canvas width="10" height="10"></canvas><span>' + g + "</span></button>"; }).join("");
    box.querySelectorAll(".gl").forEach(function (b) {
      var cv = b.querySelector("canvas"), g = b.getAttribute("data-g");
      var F = fit(cv), c = F.c, sz = F.h * 0.3; c.strokeStyle = INK; c.lineWidth = 2; c.lineCap = "round";
      var wd = V.wordWidth(g, sz); V.drawWord(c, g, (F.w - wd) / 2 + sz * 0.06, F.h * 0.68, sz, { jit: 0 });
      b.addEventListener("click", function () { pickG(g); box.querySelectorAll(".gl").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); });
    });
    var total = all.reduce(function (a, w) { return a + V.glyphs(w).length; }, 0);
    function pickG(g) {
      var p = pos[g], s = p[0] + p[1] + p[2];
      $("gname").textContent = g;
      $("gcount").textContent = fmt(cnt[g]) + " (" + fmt(cnt[g] / total * 100, 1) + "%)";
      var cv = $("gpos"), F = fit(cv), c = F.c, w = F.w, h = F.h; c.clearRect(0, 0, w, h);
      var labels = U.g_pos;
      p.forEach(function (v, i) {
        var bw = (w - 20) / 3, bh = (h - 40) * v / s, X = 10 + i * bw;
        c.fillStyle = [GREEN, BLUE, RED][i]; c.fillRect(X + 6, h - 24 - bh, bw - 12, bh);
        c.fillStyle = INK; c.font = "13px system-ui"; c.fillText(labels[i] + " " + Math.round(v / s * 100) + "%", X + 6, h - 6);
      });
      var ex = U.g_note[g] || "";
      $("gnote").innerHTML = ex;
    }
    pickG("q"); box.querySelector('[data-g="q"]').setAttribute("aria-pressed", "true");

    // write your own name in Voynich letters (a made-up mapping, the substitution cipher below)
    var inp = $("gname_in"), out = $("gname_cv");
    function nm() {
      var t = (inp.value || "").toLowerCase().replace(/[^a-z ]/g, "").trim();
      var ws = t.split(/\s+/).filter(Boolean).map(V.substitute).filter(Boolean);
      var F = fit(out), c = F.c; c.fillStyle = VELLUM; c.fillRect(0, 0, F.w, F.h);
      c.strokeStyle = INK; c.lineWidth = 2; c.lineCap = "round";
      var sz = Math.min(F.h * 0.26, 22), x = 14, tot = ws.reduce(function (a, w) { return a + V.wordWidth(w, sz) + sz; }, 0);
      if (tot > F.w - 20) sz *= (F.w - 20) / tot;
      ws.forEach(function (w) { x += V.drawWord(c, w, x, F.h * 0.66, sz, { jit: 0.03, rnd: V.rng(7) }) + sz; });
      $("gname_eva").textContent = ws.join(" ");
    }
    inp.addEventListener("input", nm); nm();

    // ch as one glyph or two letters: the counting choice moves the numbers
    function unitStats(mode) {
      var s = V.stats(all.slice(0, N), mode);
      return s;
    }
    var se = unitStats("eva"), sg = unitStats("glyph");
    function ub(mode) {
      var s = mode === "eva" ? se : sg;
      $("u_letters").textContent = fmt(s.letters); $("u_len").textContent = fmt(s.mean, 2); $("u_h2").textContent = fmt(s.h2, 2);
    }
    document.querySelectorAll("[data-unit]").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll("[data-unit]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        ub(b.getAttribute("data-unit"));
      });
    });
    ub("eva");
  }

  /* ---------- the bench: one set of tests, many texts ---------- */
  var BENCH = { on: { va: true, vb: true, la: true, en: true }, redraw: null };
  var BCOL = { va: BLUE, vb: RED, la: GREEN, en: GOLD, sub: "#8a6bb0", verb: "#3f9a9a", gr: "#d07a3a", sc: "#6b5544", rnd: "#999" };
  function addCorpus(key, words) { CORP[key] = { words: words, s: V.stats(words.slice(0, N), "eva") }; if (BENCH.redraw) BENCH.redraw(); }
  function bench() {
    var box = $("benchpick"); if (!box) return;
    var keys = ["va", "vb", "la", "en", "sub", "verb", "gr", "sc", "rnd"];
    box.innerHTML = keys.map(function (k) { return '<button type="button" class="pill chip" data-c="' + k + '" aria-pressed="' + (BENCH.on[k] ? "true" : "false") + '"><i style="background:' + BCOL[k] + '"></i>' + U.corp[k] + "</button>"; }).join("");
    box.querySelectorAll("[data-c]").forEach(function (b) {
      b.addEventListener("click", function () { var k = b.getAttribute("data-c"); BENCH.on[k] = !BENCH.on[k]; b.setAttribute("aria-pressed", BENCH.on[k] ? "true" : "false"); draw(); });
    });
    function act() { return keys.filter(function (k) { return BENCH.on[k] && CORP[k]; }); }
    function axes(c, w, h, L, B, xl, yl) {
      c.strokeStyle = "rgba(61,42,27,.35)"; c.lineWidth = 1; c.beginPath(); c.moveTo(L, 8); c.lineTo(L, h - B); c.lineTo(w - 6, h - B); c.stroke();
      c.fillStyle = "#6b5a48"; c.font = "12px system-ui"; c.fillText(xl, w - 6 - c.measureText(xl).width, h - B - 6); c.save(); c.translate(12, 10); c.fillText(yl, 0, 0); c.restore();
    }
    function zipf() {
      var F = fit($("zipfcv")), c = F.c, w = F.w, h = F.h, L = 30, B = 26; c.clearRect(0, 0, w, h);
      axes(c, w, h, L, B, U.b_rank, U.b_count);
      var lx = Math.log(3000), ly = Math.log(1500);
      act().forEach(function (k) {
        var fr = CORP[k].s.fr; c.strokeStyle = BCOL[k]; c.lineWidth = 2; c.beginPath();
        for (var i = 0; i < Math.min(fr.length, 3000); i++) {
          var X = L + Math.log(i + 1) / lx * (w - L - 8), Y = h - B - Math.log(fr[i]) / ly * (h - B - 12);
          if (i === 0) c.moveTo(X, Y); else c.lineTo(X, Y);
        }
        c.stroke();
      });
      // the Zipf line, slope −1
      var ks = act(); if (!ks.length) return;
      var f1 = CORP[ks[0]].s.fr[0];
      c.setLineDash([5, 5]); c.strokeStyle = "rgba(61,42,27,.55)"; c.beginPath();
      c.moveTo(L, h - B - Math.log(f1) / ly * (h - B - 12)); c.lineTo(L + Math.log(f1) / lx * (w - L - 8), h - B); c.stroke(); c.setLineDash([]);
    }
    function lens() {
      var F = fit($("lencv")), c = F.c, w = F.w, h = F.h, L = 30, B = 26; c.clearRect(0, 0, w, h);
      axes(c, w, h, L, B, U.b_letters, U.b_share);
      var max = 14, ks = act();
      ks.forEach(function (k) {
        var ls = CORP[k].s.lens; c.strokeStyle = BCOL[k]; c.lineWidth = 2; c.beginPath();
        for (var i = 1; i <= max; i++) {
          var X = L + (i - 1) / (max - 1) * (w - L - 10), Y = h - B - (ls[i] || 0) / 0.32 * (h - B - 12);
          if (i === 1) c.moveTo(X, Y); else c.lineTo(X, Y);
        }
        c.stroke();
      });
      c.fillStyle = "#6b5a48"; c.font = "11px system-ui";
      for (var i = 1; i <= max; i += 2) c.fillText(i, L + (i - 1) / (max - 1) * (w - L - 10) - 3, h - B + 14);
    }
    function bars(id, key, mx, fmtd) {
      var F = fit($(id)), c = F.c, w = F.w, h = F.h; c.clearRect(0, 0, w, h);
      var ks = act(), bh = Math.min(26, (h - 6) / Math.max(1, ks.length)), lab = 0;
      c.font = "13px system-ui"; ks.forEach(function (k) { lab = Math.max(lab, c.measureText(U.corp[k]).width); });
      lab = Math.min(lab + 10, w * 0.45);
      ks.forEach(function (k, i) {
        var v = CORP[k].s[key], y = 4 + i * bh;
        c.fillStyle = "#3d2a1b"; c.fillText(U.corp[k], 0, y + bh * 0.68, lab - 8);
        c.fillStyle = BCOL[k]; var bw = Math.max(2, (w - lab - 50) * Math.min(1, v / mx)); c.fillRect(lab, y + 3, bw, bh - 7);
        c.fillStyle = "#3d2a1b"; c.fillText(fmt(v, fmtd), lab + bw + 6, y + bh * 0.68);
      });
      $(id).style.height = (ks.length * bh + 10) + "px";
    }
    function table() {
      var t = $("benchtab"); if (!t) return;
      t.innerHTML = "<tr><th></th><th>" + U.b_types + "</th><th>" + U.b_mean + "</th><th>h2</th><th>Zipf</th><th>" + U.b_rep + "</th><th>" + U.b_top + "</th></tr>" +
        act().map(function (k) { var s = CORP[k].s; return '<tr><td><i style="background:' + BCOL[k] + '"></i>' + U.corp[k] + "</td><td>" + fmt(s.types) + "</td><td>" + fmt(s.mean, 2) + "</td><td>" + fmt(s.h2, 2) + "</td><td>" + fmt(s.zipf, 2) + "</td><td>" + fmt(s.rep, 1) + "</td><td class=top>" + s.top.slice(0, 5).join(" ") + "</td></tr>"; }).join("");
    }
    function draw() { zipf(); lens(); bars("h2cv", "h2", 3.6, 2); bars("repcv", "rep", 40, 1); table(); }
    BENCH.redraw = draw; draw();
    addEventListener("resize", draw);
  }

  /* ---------- slot grammar ---------- */
  function grammar() {
    var box = $("slots"); if (!box) return;
    var all = textWords(DATA), types = {}, rnd = V.rng(5);
    all.forEach(function (w) { types[w] = (types[w] || 0) + 1; });
    var tok = all.filter(function (w) { return V.parse(w); }).length, ty = Object.keys(types).filter(function (w) { return V.parse(w); }).length;
    $("gr_tok").textContent = fmt(tok / all.length * 100, 1) + "%"; $("gr_ty").textContent = fmt(ty / Object.keys(types).length * 100, 1) + "%";
    box.innerHTML = V.SLOTS.map(function (s, i) { return '<div class="slot" data-i="' + i + '">' + s.map(function (x) { return '<span data-v="' + x + '">' + (x || "·") + "</span>"; }).join("") + "</div>"; }).join("");
    function mark(parts) {
      box.querySelectorAll(".slot").forEach(function (d, i) {
        d.querySelectorAll("span").forEach(function (sp) { sp.classList.toggle("on", parts && sp.getAttribute("data-v") === parts[i]); });
      });
    }
    function showWord(w, parts) {
      var cv = $("slotcv"), F = fit(cv), c = F.c; c.fillStyle = VELLUM; c.fillRect(0, 0, F.w, F.h);
      c.strokeStyle = INK; c.lineWidth = 2.2; c.lineCap = "round";
      var sz = Math.min(F.h * 0.28, 26), ww = V.wordWidth(w, sz); V.drawWord(c, w, (F.w - ww) / 2, F.h * 0.68, sz, { jit: 0.03, rnd: V.rng(w.length) });
      $("slotword").textContent = w;
      $("slotfound").textContent = types[w] ? U.gr_found.replace("{n}", fmt(types[w])) : U.gr_new;
      mark(parts);
    }
    function spin() {
      // weight each slot towards empty so words stay short
      var parts = V.SLOTS.map(function (s) { return rnd() < 0.55 ? "" : s[1 + ((rnd() * (s.length - 1)) | 0)]; });
      var w = parts.join("");
      if (w.length < 2) return spin();
      showWord(w, parts);
    }
    $("spin").addEventListener("click", spin);
    var inp = $("parse_in");
    inp.addEventListener("input", function () {
      var w = inp.value.toLowerCase().replace(/[^a-z]/g, ""); if (!w) return;
      var p = V.parse(w); showWord(w, p);
      if (!p) $("slotfound").textContent = U.gr_nofit + (types[w] ? " · " + U.gr_found.replace("{n}", fmt(types[w])) : "");
    });
    showWord("qokeedy", V.parse("qokeedy"));
    addEventListener("resize", function () { showWord($("slotword").textContent, V.parse($("slotword").textContent)); });
  }

  /* ---------- repeats on a page ---------- */
  function repeats() {
    var sel = $("reppage"); if (!sel) return;
    var choices = ["f75r", "f103r", "f1r", "f2r", "f78r", "f108v", "f111r", "f26v", "f43v", "f84r"].filter(function (f) { return DATA.some(function (p) { return p.f === f; }); });
    sel.innerHTML = choices.map(function (f) { var p = DATA.filter(function (q) { return q.f === f; })[0]; return '<option value="' + f + '">' + f + " · " + U.sections[p.i] + " · " + (p.l === "A" ? U.lang_a : U.lang_b) + "</option>"; }).join("");
    function run() {
      var p = DATA.filter(function (q) { return q.f === sel.value; })[0], ls = lines(p), seen = [], html = [], same = 0, near = 0, n = 0;
      ls.forEach(function (l) {
        html.push(l.map(function (w) {
          var cls = "", d = 9;
          for (var i = 0; i < seen.length && d; i++) d = Math.min(d, V.near(w, seen[i]));
          if (d === 0) { cls = "same"; same++; } else if (d === 1) { cls = "near"; near++; }
          seen.push(w); n++;
          return cls ? '<b class="' + cls + '">' + w + "</b>" : w;
        }).join(" "));
      });
      $("reptext").innerHTML = html.join("<br>");
      $("rep_same").textContent = fmt(same / n * 100) + "%"; $("rep_near").textContent = fmt(near / n * 100) + "%"; $("rep_new").textContent = fmt((n - same - near) / n * 100) + "%";
    }
    sel.addEventListener("change", run); run();
  }

  /* ---------- cipher ---------- */
  function cipher() {
    var ta = $("ciph_in"); if (!ta) return;
    var how = "sub";
    function run() {
      var ws = ta.value.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean);
      var out = V.encipher(ws, how);
      var F = fit($("ciphcv")), c = F.c; c.fillStyle = VELLUM; c.fillRect(0, 0, F.w, F.h);
      c.strokeStyle = INK; c.lineWidth = 1.8; c.lineCap = "round";
      var sz = Math.max(9, Math.min(14, F.w / 60)), x = 12, y = sz * 2.6, lh = sz * 3, rnd = V.rng(3);
      out.forEach(function (w) {
        var ww = V.wordWidth(w, sz);
        if (x + ww > F.w - 10) { x = 12; y += lh; }
        if (y < F.h - 4) V.drawWord(c, w, x, y, sz, { rnd: rnd });
        x += ww + sz * 0.8;
      });
      $("ciph_eva").textContent = out.join(" ");
      var s = CORP[how === "sub" ? "sub" : "verb"].s;
      $("c_h2").textContent = fmt(s.h2, 2); $("c_mean").textContent = fmt(s.mean, 2); $("c_types").textContent = fmt(s.types); $("c_rep").textContent = fmt(s.rep, 1);
    }
    document.querySelectorAll("[data-ciph]").forEach(function (b) {
      b.addEventListener("click", function () {
        how = b.getAttribute("data-ciph");
        document.querySelectorAll("[data-ciph]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        run();
      });
    });
    ta.addEventListener("input", run); run();
    addEventListener("resize", run);
  }

  /* ---------- Rugg's grille ---------- */
  function grille() {
    var cv = $("grillecv"); if (!cv) return;
    var rows = 36, table = V.grilleTable(rows, 7), card = [0, 2, 5], row = 0, made = [];
    var CARDS = [[0, 2, 5], [0, 1, 3], [1, 4, 2], [0, 3, 1]];
    function draw() {
      var F = fit(cv), c = F.c, w = F.w, h = F.h; c.clearRect(0, 0, w, h);
      var show = 12, rh = (h - 10) / show, cw = (w - 20) / 3, fs = Math.min(18, rh * 0.55);
      c.font = fs + "px ui-monospace,Menlo,monospace"; c.textBaseline = "middle";
      for (var r = 0; r < show; r++) {
        var tr = table[(row + r) % rows];
        for (var k = 0; k < 3; k++) {
          var X = 10 + k * cw, Y = 5 + r * rh, hole = card[k] === r;
          c.fillStyle = hole ? "#fff6d8" : "rgba(239,227,196,.16)"; c.fillRect(X + 2, Y + 2, cw - 4, rh - 4);
          c.fillStyle = hole ? INK : "rgba(239,227,196,.55)"; c.fillText(tr[k] || "·", X + 10, Y + rh / 2);
          if (hole) { c.strokeStyle = GOLD; c.lineWidth = 2.5; c.strokeRect(X + 2, Y + 2, cw - 4, rh - 4); }
        }
      }
      // the card itself: dark over everything but its holes
      c.fillStyle = "rgba(20,14,9,.0)";
      var w0 = V.grilleWord(table, row, card);
      $("gr_word").textContent = w0 || "·";
    }
    function step() { var w0 = V.grilleWord(table, row, card); if (w0) made.push(w0); row = (row + 1) % rows; draw(); $("gr_out").textContent = made.slice(-40).join(" "); }
    $("gstep").addEventListener("click", step);
    $("gcard").addEventListener("click", function () { var i = (CARDS.indexOf(card) + 1) % CARDS.length; card = CARDS[i]; draw(); });
    $("gnew").addEventListener("click", function () { table = V.grilleTable(rows, (Math.random() * 1e6) | 0); made = []; draw(); $("gr_out").textContent = ""; });
    $("grun").addEventListener("click", function () {
      addCorpus("gr", V.grilleText(table, N, (Math.random() * 1e6) | 0)); BENCH.on.gr = true;
      var b = document.querySelector('[data-c="gr"]'); if (b) b.setAttribute("aria-pressed", "true");
      if (BENCH.redraw) BENCH.redraw(); var s = CORP.gr.s;
      $("gr_stats").textContent = U.gr_ran.replace("{types}", fmt(s.types)).replace("{h2}", fmt(s.h2, 2)).replace("{z}", fmt(s.zipf, 2));
    });
    draw(); addEventListener("resize", draw);
  }

  /* ---------- self-citation: a scribe copies from the lines above ---------- */
  function selfCite() {
    var cv = $("sccv"); if (!cv) return;
    var start = lines(DATA.filter(function (p) { return p.f === "f103r"; })[0] || DATA[0])[0].slice(0, 9);
    var text = V.selfCite(start, 120, 21, 9), shown = 9, timer = null;
    function draw() {
      var F = fit(cv), c = F.c, w = F.w, h = F.h; c.fillStyle = VELLUM; c.fillRect(0, 0, w, h);
      var sz = Math.max(8, Math.min(13, w / 75)), lh = sz * 3.2, x = 12, y = sz * 2.4, pos = [];
      c.lineCap = "round";
      for (var i = 0; i < shown && i < text.length; i++) {
        var ww = V.wordWidth(text[i], sz);
        if (x + ww > w - 10) { x = 12; y += lh; }
        if (y > h - 6) break;
        c.strokeStyle = i === shown - 1 ? RED : INK; c.lineWidth = Math.max(1, sz * 0.14);
        V.drawWord(c, text[i], x, y, sz, { rnd: V.rng(i + 3) });
        pos.push([x, y, ww]); x += ww + sz * 0.9;
      }
      // a line from the newest word to its nearest earlier word
      var k = Math.min(shown, pos.length) - 1;
      if (k > 0) {
        var best = -1, bd = 9;
        for (var j = k - 1; j >= 0 && j >= k - 40; j--) { var d = V.near(text[k], text[j]); if (d < bd) { bd = d; best = j; } }
        if (best >= 0 && bd <= 1) {
          c.strokeStyle = "rgba(164,71,58,.55)"; c.lineWidth = 1.5; c.setLineDash([4, 4]); c.beginPath();
          c.moveTo(pos[best][0] + pos[best][2] / 2, pos[best][1] + sz * 0.5); c.lineTo(pos[k][0] + pos[k][2] / 2, pos[k][1] - sz * 1.4); c.stroke(); c.setLineDash([]);
          $("sc_last").textContent = text[best] + " → " + text[k];
        }
      }
    }
    function play() {
      clearInterval(timer);
      timer = setInterval(function () { shown++; draw(); if (shown >= text.length) clearInterval(timer); }, reduce ? 60 : 420);
    }
    $("scplay").addEventListener("click", function () { text = V.selfCite(start, 120, (Math.random() * 1e6) | 0, 9); shown = 9; play(); });
    $("scrun").addEventListener("click", function () {
      addCorpus("sc", V.selfCite(start, N, (Math.random() * 1e6) | 0, 9)); BENCH.on.sc = true;
      var b = document.querySelector('[data-c="sc"]'); if (b) b.setAttribute("aria-pressed", "true");
      if (BENCH.redraw) BENCH.redraw(); var s = CORP.sc.s;
      $("sc_stats").textContent = U.gr_ran.replace("{types}", fmt(s.types)).replace("{h2}", fmt(s.h2, 2)).replace("{z}", fmt(s.zipf, 2));
    });
    draw(); onVisible(cv, play); addEventListener("resize", draw);
  }

  /* ---------- load, then start ---------- */
  function get(u, kind) { return fetch(ROOT + u).then(function (r) { return kind === "json" ? r.json() : r.text(); }); }
  Promise.all([get("data/vms.json", "json"), get("data/latin.txt"), get("data/english.txt")]).then(function (r) {
    DATA = r[0];
    var lat = r[1].split(/\s+/).filter(Boolean), eng = r[2].split(/\s+/).filter(Boolean);
    var va = textWords(pages(function (p) { return p.l === "A"; })), vb = textWords(pages(function (p) { return p.l === "B"; }));
    // random letters, drawn with the manuscript's own letter shares and word lengths
    var all = textWords(DATA), pool = all.join("").split(""), rr = V.rng(9), rnd = [];
    for (var i = 0; i < N; i++) { var L = all[(rr() * all.length) | 0].length, w = ""; for (var j = 0; j < L; j++) w += pool[(rr() * pool.length) | 0]; rnd.push(w); }
    addCorpus("va", va); addCorpus("vb", vb); addCorpus("la", lat); addCorpus("en", eng);
    addCorpus("sub", V.encipher(lat, "sub")); addCorpus("verb", V.encipher(lat, "verbose")); addCorpus("rnd", rnd);
    hero();
    [["mapcv", bookMap], ["datecv", dates], ["glyphgrid", glyphTable], ["benchpick", bench], ["slots", grammar], ["reppage", repeats], ["ciph_in", cipher], ["grillecv", grille], ["sccv", selfCite]].forEach(function (x) {
      var el = $(x[0]); if (el) onVisible(el, x[1]);
    });
  });
})();
