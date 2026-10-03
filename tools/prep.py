#!/usr/bin/env python3
"""prep.py — turns the source texts in tools/data/ into the compact files the page loads.

  tools/data/ZL3b-n.txt      René Zandbergen's ZL transliteration (IVTFF, EVA), voynich.nu
  tools/data/latin_raw.txt   Augustine, Confessiones (Project Gutenberg 33849)
  tools/data/english_raw.txt Culpeper, The Complete Herbal (Project Gutenberg 49513)

writes docs/data/vms.json (every page: folio, illustration, Currier language, hand, lines of words)
and docs/data/latin.txt, docs/data/english.txt (about 14,000 words each, lower case, letters only).

Run:  python3 tools/prep.py
"""
import json
import os
import re
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "data")
OUT = os.path.join(HERE, "..", "docs", "data")
N_WORDS = 14000


def clean_line(t):
    t = re.sub(r"<![^>]*>", "", t)          # comments
    t = re.sub(r"<->", ".", t)              # drawing breaks the line: a word break
    t = re.sub(r"<[^>]*>", "", t)           # paragraph and other markers
    t = re.sub(r"\[([^:\]]*):[^\]]*\]", r"\1", t)   # [a:b] readings: take the first
    t = re.sub(r"\{([^}]*)\}", r"\1", t)    # {ligatures}
    t = t.replace("'", "")
    words = []
    for w in re.split(r"[.,\s]+", t):
        if not w or "?" in w or "@" in w or "*" in w:
            continue
        if re.fullmatch(r"[a-z]+", w):
            words.append(w)
    return words


def vms():
    pages, cur = [], None
    for raw in open(os.path.join(SRC, "ZL3b-n.txt"), encoding="utf-8", errors="replace"):
        raw = raw.rstrip("\n")
        m = re.match(r"<(f\w+)>\s+<!(.*)>", raw)
        if m:
            meta = dict(re.findall(r"\$(\w)=(\w+)", m.group(2)))
            cur = {"f": m.group(1), "i": meta.get("I", "?"), "l": meta.get("L", "?"), "h": meta.get("H", "?"),
                   "q": meta.get("Q", "?"), "w": []}
            pages.append(cur)
            continue
        m = re.match(r"<(f\w+)\.(\d+[a-z]?),([^>]*)>\s+(.*)", raw)
        if m and cur:
            loc = m.group(3)
            # P = paragraph text; labels (L), circles (C), radii (R) kept apart with a leading flag
            kind = loc[1] if len(loc) > 1 else "P"
            ws = clean_line(m.group(4))
            if ws:
                cur["w"].append(("" if kind == "P" else kind + ":") + " ".join(ws))
    return [p for p in pages if p["w"]]


def plain(path, start_pat, end_pat, skip_lines=0):
    txt = open(path, encoding="utf-8").read()
    a = txt.index(start_pat) if start_pat in txt else 0
    b = txt.index(end_pat) if end_pat in txt else len(txt)
    body = txt[a:b]
    body = re.sub(r"[’']s\b", "s", body)
    body = body.replace("æ", "ae").replace("œ", "oe").replace("Æ", "ae").replace("Œ", "oe")
    body = unicodedata.normalize("NFKD", body)
    body = "".join(c for c in body if not unicodedata.combining(c)).lower()
    body = re.sub(r"\{[^}]*\}|\[[^\]]*\]|p\. \d+", " ", body)
    words = re.findall(r"[a-z]+", body)
    return " ".join(words[skip_lines:skip_lines + N_WORDS])


def main():
    os.makedirs(OUT, exist_ok=True)
    p = vms()
    with open(os.path.join(OUT, "vms.json"), "w") as f:
        json.dump(p, f, separators=(",", ":"))
    n = sum(len(l.split(":")[-1].split()) for q in p for l in q["w"])
    with open(os.path.join(OUT, "latin.txt"), "w") as f:
        f.write(plain(os.path.join(SRC, "latin_raw.txt"), "\nLIBER PRIMUS.\n", "*** END OF"))
    with open(os.path.join(OUT, "english.txt"), "w") as f:
        f.write(plain(os.path.join(SRC, "english_raw.txt"), "ADDER’S TONGUE", "*** END OF"))
    print(f"vms: {len(p)} pages, {n} words")


if __name__ == "__main__":
    main()
