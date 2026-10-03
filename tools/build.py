#!/usr/bin/env python3
"""build.py — writes docs/index.html (English), docs/th/index.html (Thai), sitemap.xml, robots.txt,
llms.txt and icon.svg. All copy, both languages, is in copy_text.py; picture credits in credits.json.
Data files come from prep.py.

Run:  python3 tools/build.py
"""
import html
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from copy_text import UI, NAV, WORDS, SOURCES, CLAIMS  # noqa: E402

DOCS = os.path.join(HERE, "..", "docs")
BASE = "https://nanobotco.github.io/voynich/"
E = html.escape
CSS = open(os.path.join(HERE, "site.css")).read()
PICS = json.load(open(os.path.join(HERE, "credits.json")))
GOOGLE_ESCAPE = '<script>if(/[.]translate[.]goog$/.test(location.hostname))location.replace("https://"+location.hostname.slice(0,-15).replace(/--/g,"~").replace(/-/g,".").replace(/~/g,"-")+location.pathname+location.search.replace(/([?&])_x_tr_[^&]*/g,"$1").replace(/[?&]+$/,"").replace(/[?]&+/,"?")+location.hash)</script>'


def paras(ps):
    return "".join(f"<p>{p}</p>" for p in ps)


def btn(id_, label, hot=False, pressed=None, data=""):
    p = f' aria-pressed="{pressed}"' if pressed is not None else ""
    i = f' id="{id_}"' if id_ else ""
    return f'<button{i} class="pill{" hot" if hot else ""}" type="button"{p}{data}>{E(label)}</button>'


def ro(*pairs):
    return '<div class="readout">' + "".join(f'<div><span>{a}</span><b id="{b}">–</b></div>' for a, b in pairs) + "</div>"


def sec(id_, cls, kick, h, body):
    return f'<section id="{id_}" class="sec {cls}"><div class="in">{f"<p class=kick>{kick}</p>" if kick else ""}<h2>{h}</h2>{body}</div></section>\n'


def fig(key, u, root):
    p = next((x for x in PICS if x["key"] == key), None)
    if not p:
        return ""
    lic = f'<a href="{p["license_url"]}">{E(p["license"])}</a>' if p.get("license_url") else E(p["license"])
    cap = u["pic"][key]
    return f'<figure><a href="{p["commons_page"]}"><img loading="lazy" src="{root}img/{p["file"]}" width="{p["width"]}" height="{p["height"]}" alt="{E(cap)}"></a><figcaption>{cap} · <a href="{p["commons_page"]}">{E(p["author"])}</a> · {lic}</figcaption></figure>'


def page(lang):
    u = UI[lang]
    root = "" if lang == "en" else "../"
    url = BASE if lang == "en" else BASE + "th/"
    js = dict(u["js"])
    js["lang"] = lang
    nav = "".join(f'<a href="#{a}">{E(b)}</a>' for a, b in zip(NAV, u["nav"]))
    ol = u["lang_other"]
    head = f'''<!doctype html><html lang="{lang}" translate="no" class="notranslate"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="google" content="notranslate"><meta name="robots" content="notranslate">
{GOOGLE_ESCAPE}
<title>{E(u["title"])} · {E(u["other_title"])}</title>
<meta name="description" content="{E(u["desc"])}">
<meta name="theme-color" content="#1d1712">
<link rel="canonical" href="{url}">
<link rel="alternate" hreflang="en" href="{BASE}"><link rel="alternate" hreflang="th" href="{BASE}th/"><link rel="alternate" hreflang="x-default" href="{BASE}">
<meta property="og:type" content="website"><meta property="og:site_name" content="The Voynich Manuscript · ข้อเขียนวอยนิช">
<meta property="og:title" content="{E(u["title"])}"><meta property="og:description" content="{E(u["desc"])}"><meta property="og:url" content="{url}">
<meta property="og:image" content="{BASE}card.jpg"><meta property="og:image:secure_url" content="{BASE}card.jpg"><meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{E(u["card_alt"])}">
<meta property="og:locale" content="{"en_US" if lang == "en" else "th_TH"}"><meta property="og:locale:alternate" content="{"th_TH" if lang == "en" else "en_US"}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{BASE}card.jpg">
<link rel="icon" href="{root}icon.svg" type="image/svg+xml">
<link rel="alternate" type="text/plain" href="{BASE}llms.txt" title="llms.txt">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Noto+Sans+Thai:wght@400;600;700&family=Noto+Serif+Thai:wght@600;700&display=swap" rel="stylesheet">
<script>if(/[?&]card/.test(location.search))document.documentElement.classList.add("card")</script>
<style>{CSS}</style>
</head><body>
<header class="top"><div class="in"><a class="brand" href="#top"><img src="{root}icon.svg" width="28" height="28" alt=""><span>{E(u["short"])}</span></a>
<nav aria-label="{E(u["nav_label"])}">{nav}</nav>
<span class="lang"><b>{E(u["lang_this"])}</b> | <a href="{ol[0]}" hreflang="{ol[2]}">{E(ol[1])}</a></span></div></header>
'''
    hero = f'''<section id="top" class="hero"><canvas id="scene" role="img" aria-label="{E(u["hero_alt"])}"></canvas>
<div class="hero-t"><p class="kick">{E(u["kicker"])}</p><h1>{E(u["title"])}</h1><p class="lede">{E(u["lede"])}</p>
<p class="go"><a class="pill hot" href="#count">{E(u["hero_go"])}</a></p>
<p class="cardline">{E(u["other_title"])} · {E(u["cardline"])}<br><span>nanobotco.github.io/voynich</span></p></div></section>
'''
    book = sec("book", "", E(u["book_kick"]), E(u["book_h"]), paras(u["book_p"]) +
               f'<div class="ph three">{fig("f1r", u, root)}{fig("herbal", u, root)}{fig("rosettes", u, root)}</div>')

    modes = "".join(btn(None, lab, pressed="true" if k == "i" else "false", data=f' data-mapmode="{k}"') for k, lab in zip(("i", "l", "h"), u["map_modes"]))
    bmap = sec("map", "rock", E(u["map_kick"]), E(u["map_h"]), paras(u["map_p"]) + f'''
<div class="seg" role="group">{modes}</div><div id="maplegend" class="legend"></div>
<canvas id="mapcv" class="cv mapcv" role="img" aria-label="{E(u["map_h"])}"></canvas>
<p class="lab" id="mapinfo"></p><canvas id="mappage" class="cv pagecv" role="img" aria-label="{E(u["map_page"])}"></canvas>
<pre id="mapeva" class="eva"></pre><p class="note">{u["map_note"]}</p>''')

    tl = "".join(f'<li><b>{y}</b><span>{t}</span></li>' for y, t in u["hist"])
    owners = sec("owners", "", E(u["own_kick"]), E(u["own_h"]), paras(u["own_p"]) + f'<ol class="tl">{tl}</ol>' + f'<div class="ph two">{fig("voynich", u, root)}{fig("f116v", u, root)}</div>')

    date = sec("date", "dark", E(u["date_kick"]), E(u["date_h"]), paras(u["date_p"]) + f'''
<label class="lab" for="dwait">{E(u["d_wait"])} <b id="dwaitv"></b></label><input id="dwait" type="range" min="0" max="500" step="1" value="0">
<canvas id="datecv" class="cv datecv" role="img" aria-label="{E(u["date_h"])}"></canvas><p class="note">{u["date_note"]}</p>''')

    units = btn(None, u["u_eva"], pressed="true", data=' data-unit="eva"') + btn(None, u["u_glyph"], pressed="false", data=' data-unit="glyph"')
    glyphs = sec("glyphs", "", E(u["gl_kick"]), E(u["gl_h"]), paras(u["gl_p"]) + f'''
<div class="two top"><div><div id="glyphgrid" class="glyphs"></div></div>
<div><p class="gbig"><span>EVA</span> <b id="gname"></b> · <span id="gcount"></span></p><canvas id="gpos" class="cv gpos" role="img" aria-label="{E(u["g_where"])}"></canvas><p id="gnote" class="note"></p></div></div>
<h3>{E(u["count_h"])}</h3>{paras(u["count_p"])}<div class="seg" role="group">{units}</div>
{ro((E(u["u_letters"]), "u_letters"), (E(u["u_len"]), "u_len"), ("h2", "u_h2"))}
<h3>{E(u["name_h"])}</h3><p>{u["name_p"]}</p><input id="gname_in" class="txt" type="text" value="{E(u["name_default"])}" autocomplete="off" spellcheck="false" aria-label="{E(u["name_h"])}">
<canvas id="gname_cv" class="cv namecv" role="img" aria-label="{E(u["name_h"])}"></canvas><p class="eva1" id="gname_eva"></p>''')

    count = sec("count", "night", E(u["cnt_kick"]), E(u["cnt_h"]), paras(u["cnt_p"]) + f'''
<div id="benchpick" class="seg chips" role="group"></div>
<div class="bgrid"><div><h3>{E(u["b_zipf"])}</h3><canvas id="zipfcv" class="cv chart" role="img" aria-label="{E(u["b_zipf"])}"></canvas><p class="note">{u["b_zipf_note"]}</p></div>
<div><h3>{E(u["b_len"])}</h3><canvas id="lencv" class="cv chart" role="img" aria-label="{E(u["b_len"])}"></canvas><p class="note">{u["b_len_note"]}</p></div>
<div><h3>{E(u["b_h2"])}</h3><canvas id="h2cv" class="cv barcv" role="img" aria-label="{E(u["b_h2"])}"></canvas><p class="note">{u["b_h2_note"]}</p></div>
<div><h3>{E(u["b_rep_h"])}</h3><canvas id="repcv" class="cv barcv" role="img" aria-label="{E(u["b_rep_h"])}"></canvas><p class="note">{u["b_rep_note"]}</p></div></div>
<div class="tabwrap"><table id="benchtab" class="btab"></table></div>{paras(u["cnt_after"])}''')

    grammar = sec("grammar", "", E(u["gr_kick"]), E(u["gr_h"]), paras(u["gr_p"]) + f'''
<div id="slots" class="slots"></div>
<div class="two"><div><canvas id="slotcv" class="cv slotcv" role="img" aria-label="{E(u["gr_h"])}"></canvas><p class="eva1"><b id="slotword"></b> · <span id="slotfound"></span></p>
<div class="btns">{btn("spin", u["gr_spin"], hot=True)}</div>
<label class="lab" for="parse_in">{E(u["gr_try"])}</label><input id="parse_in" class="txt" type="text" placeholder="qokeedy" autocomplete="off" spellcheck="false"></div>
<div>{ro((E(u["gr_tok_l"]), "gr_tok"), (E(u["gr_ty_l"]), "gr_ty"))}<p class="note">{u["gr_note"]}</p></div></div>''')

    rep = sec("repeats", "rock", E(u["rp_kick"]), E(u["rp_h"]), paras(u["rp_p"]) + f'''
<label class="lab" for="reppage">{E(u["rp_pick"])}</label><select id="reppage" class="txt"></select>
{ro((E(u["rp_same"]), "rep_same"), (E(u["rp_near"]), "rep_near"), (E(u["rp_new"]), "rep_new"))}
<p id="reptext" class="reptext"></p><p class="note">{u["rp_note"]}</p>''')

    cb = btn(None, u["c_sub"], pressed="true", data=' data-ciph="sub"') + btn(None, u["c_verb"], pressed="false", data=' data-ciph="verbose"')
    ciph = sec("cipher", "", E(u["ci_kick"]), E(u["ci_h"]), paras(u["ci_p"]) + f'''
<div class="two top"><div><label class="lab" for="ciph_in">{E(u["c_plain"])}</label><textarea id="ciph_in" class="txt" rows="4" spellcheck="false">{E(u["c_default"])}</textarea>
<div class="seg" role="group">{cb}</div>{paras(u["ci_how"])}</div>
<div><canvas id="ciphcv" class="cv ciphcv" role="img" aria-label="{E(u["ci_h"])}"></canvas><p class="eva1" id="ciph_eva"></p>
<p class="lab">{E(u["c_bench"])}</p>{ro(("h2", "c_h2"), (E(u["b_mean"]), "c_mean"), (E(u["b_types"]), "c_types"), (E(u["b_rep"]), "c_rep"))}</div></div>
{paras(u["ci_after"])}''')

    hoax = sec("hoax", "dark", E(u["hx_kick"]), E(u["hx_h"]), paras(u["hx_p"]) + f'''
<div class="two top"><div><canvas id="grillecv" class="cv grillecv" role="img" aria-label="{E(u["hx_grille"])}"></canvas></div>
<div><p class="gbig">{E(u["hx_word"])} <b id="gr_word"></b></p>
<div class="btns">{btn("gstep", u["hx_step"], hot=True)}{btn("gcard", u["hx_card"])}{btn("gnew", u["hx_new"])}{btn("grun", u["hx_run"])}</div>
<p class="eva1" id="gr_out"></p><p class="note" id="gr_stats"></p>{paras(u["hx_grille_p"])}</div></div>
<h3>{E(u["sc_h"])}</h3>{paras(u["sc_p"])}
<canvas id="sccv" class="cv sccv" role="img" aria-label="{E(u["sc_h"])}"></canvas><p class="eva1" id="sc_last"></p>
<div class="btns">{btn("scplay", u["sc_play"], hot=True)}{btn("scrun", u["hx_run"])}</div><p class="note" id="sc_stats"></p>{paras(u["sc_after"])}''')

    lang_ = sec("language", "", E(u["lg_kick"]), E(u["lg_h"]), paras(u["lg_p"]))

    pics = sec("pictures", "rock", E(u["pc_kick"]), E(u["pc_h"]), paras(u["pc_p"]) +
               f'<div class="ph three">{fig("zodiac", u, root)}{fig("balneo", u, root)}{fig("pharma", u, root)}</div>' + paras(u["pc_after"]))

    i = 0 if lang == "en" else 1
    rows = "".join(
        f'<li class="cl {c["status"]}"><b>{c["year"]}</b><div><h3>{E(c["who"])} · {E(c["what_" + lang])}</h3><p>{c["note_" + lang]}</p></div></li>' for c in CLAIMS)
    claims = sec("claims", "", E(u["cl_kick"]), E(u["cl_h"]), paras(u["cl_p"]) + f'<ol class="claims">{rows}</ol>' + paras(u["cl_after"]))

    words = "".join(f'<div><b>{E(w[i])}</b><i>{E(w[1 - i])}</i><p>{w[2 + i]}</p></div>' for w in WORDS)
    wd = sec("words", "", "", E(u["words_h"]), f'<div class="glos">{words}</div>')
    src = "".join(f'<li><a href="{h}">{E(t)}</a></li>' for t, h in SOURCES)
    so = sec("sources", "", "", E(u["src_h"]), paras(u["src_p"]) + f'<ul class="src">{src}</ul>')

    tail = f'''<footer class="bot"><div class="in">{u["foot"]} · <a href="https://github.com/NaNoBotCo/voynich">GitHub</a> · <a href="https://motdang.net/">motdang.net</a> · <a href="https://hongdam.net/">hongdam.net</a></div></footer>
<script>window.UI={json.dumps(js, ensure_ascii=False)};</script>
<script src="{root}vms.js"></script><script src="{root}app.js"></script><script src="{root}top.js"></script>
</body></html>
'''
    return head + "<main>" + hero + book + bmap + owners + date + glyphs + count + grammar + rep + ciph + hoax + lang_ + pics + claims + wd + so + "</main>" + tail


def icon():
    # EVA "q" over "o": the commonest opening of a Voynich word, drawn as two strokes
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#efe3c4"/>'
            '<g fill="none" stroke="#3d2a1b" stroke-width="4.2" stroke-linecap="round">'
            '<path d="M22 50 C21 36 21 26 18 22 C8 30 8 40 26 38"/><ellipse cx="42" cy="38" rx="9" ry="12"/></g>'
            '<path d="M30 12 q6 -6 12 0" fill="none" stroke="#6f8f4a" stroke-width="4" stroke-linecap="round"/></svg>\n')


def main():
    os.makedirs(os.path.join(DOCS, "th"), exist_ok=True)
    for lang, path in (("en", "index.html"), ("th", "th/index.html")):
        with open(os.path.join(DOCS, path), "w") as f:
            f.write(page(lang))
    with open(os.path.join(DOCS, "icon.svg"), "w") as f:
        f.write(icon())
    with open(os.path.join(DOCS, "sitemap.xml"), "w") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                f'<url><loc>{BASE}</loc></url>\n<url><loc>{BASE}th/</loc></url>\n</urlset>\n')
    with open(os.path.join(DOCS, "robots.txt"), "w") as f:
        f.write(f"User-agent: *\nAllow: /\nSitemap: {BASE}sitemap.xml\n")
    u = UI["en"]
    strip = lambda s: html.unescape(re.sub("<[^>]+>", "", s))
    lines = ["# The Voynich Manuscript · ข้อเขียนวอยนิช", "", u["desc"], "", f"English: {BASE}", f"Thai: {BASE}th/",
             f"Data: {BASE}data/vms.json (every page of the ZL transliteration: folio, illustration, Currier language, hand, lines)", ""]
    for key in ("book", "map", "own", "date", "gl", "cnt", "gr", "rp", "ci", "hx", "lg", "pc", "cl"):
        lines += ["## " + strip(u[key + "_h"]), ""] + [strip(p) for p in u[key + "_p"]]
        for extra in ("_after", "_how"):
            if key + extra in u:
                lines += [strip(p) for p in u[key + extra]]
        if key == "own":
            lines += [f"- {y}: {strip(t)}" for y, t in u["hist"]]
        if key == "hx":
            lines += [strip(p) for p in u["hx_grille_p"] + u["sc_p"] + u["sc_after"]]
        if key == "cl":
            lines += [f"- {c['year']} · {c['who']} · {c['what_en']}: {strip(c['note_en'])}" for c in CLAIMS]
        lines.append("")
    lines += ["## Words", ""] + [f"- {a} · {b}: {strip(c)}" for a, b, c, _ in WORDS]
    lines += ["", "## Sources", ""] + [f"- {t}: {h}" for t, h in SOURCES]
    lines += ["", "## Licence", "", "Text CC BY 4.0, NaNoBotCo. Code MIT. The transliteration is René Zandbergen's ZL file (voynich.nu); pictures keep their own licences, listed on the page.", ""]
    with open(os.path.join(DOCS, "llms.txt"), "w") as f:
        f.write("\n".join(lines))
    print("built en + th -> docs/")


if __name__ == "__main__":
    main()
