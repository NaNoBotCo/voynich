# The Voynich Manuscript · ข้อเขียนวอยนิช

How people try to read the Voynich manuscript, with live toys, in English and Thai.

https://nanobotco.github.io/voynich/ · https://nanobotco.github.io/voynich/th/

- `tools/prep.py` turns the sources in `tools/data/` into `docs/data/`: `vms.json` (every page of René Zandbergen's ZL transliteration, v3b, CC0: folio, illustration, Currier language, scribe, lines), and 14,000-word Latin and English samples from Project Gutenberg.
- `tools/copy_text.py` holds all copy (EN + TH); `tools/build.py` writes `docs/index.html`, `docs/th/index.html`, `llms.txt`, `sitemap.xml`, `robots.txt` and `icon.svg`.
- `docs/vms.js` is the engine: EVA glyphs drawn as pen strokes, text statistics (Zipf slope, word lengths, h1/h2 entropy, repeats), a slot grammar, and the text machines (letter swap, verbose cipher, a Rugg-style grille, self-citation after Timm & Schinner). `docs/app.js` wires the page.
- `?card` at 1200×630 renders the share card (`docs/card.jpg`); `?t=` fixes the hero's moment.
- Manuscript scans and the Voynich photograph come from Wikimedia Commons (`tools/credits.json`), public domain.

Text CC BY 4.0, NaNoBotCo. Code MIT.
