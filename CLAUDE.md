# GeneanoMap - rules for anyone (human or AI assistant) changing this repository

## What it is

A static web page that plays a family tree on a map, year by year. Owner and author: Regis Hennequin (`regis57`). Licence: Apache 2.0 with `NOTICE`.

## Hard rules

1. **Privacy first.** A visitor's file never leaves the browser. No analytics, no remote font, no CDN, no cookie, no third-party request by default. Do not weaken the Content-Security-Policy in `index.html`.
2. **Three run-time files only**: `index.html`, `world.json`, `gaz.json`. No framework, no bundler, no npm dependency at run time. It must keep working when the three files are copied to any web folder.
3. **File content is untrusted.** Everything coming from a GEDCOM/CSV goes through `esc()` before reaching `innerHTML`; links go through `safeUrl()` or the `https?://` patterns. Never `eval`, never inline event attributes, never `style="…"` attributes (use a class): the policy allows one script and one style block, each by fingerprint.
4. **After any change to the script**, run `node tools/check.mjs --fix`, then `node tools/check.mjs`. CI runs the same check and must be green.
5. **Authorship.** Commits, pull requests and releases are authored by Regis Hennequin only. No "Co-Authored-By", "Generated with" or other AI/tool attribution in commit messages, PR descriptions or files.
6. **Never commit real family data.** The only people in the repository are the fictional Vernhet family (`SAMPLE` in `index.html`, `template.csv`). No real GEDCOM, no screenshot showing living people.
7. **Kinship must be true.** Blood relationship comes from the nearest common ancestor and generation counts; marriage is added to it, never substituted. No folk approximations ("à la mode de Bretagne"). Every term must exist in all languages of `KIN`.
8. **Every visible text is translated.** New interface text goes into `L` for `fr`, `en`, `de`, `it`; no hard-coded string in the code.
9. **Honest display.** Estimated dates carry `≈`, approximate positions are flagged. Never invent a person, a date or a place.
10. **Keep the docs in step**: `README.md` (features, roadmap), `FORMAT.md` (input formats), `PRIVACY.md`, `SECURITY.md`.

## Map of `index.html`

Sections, in order: i18n (`LANGS`, `L`, `KIN`, `term`) · fictional sample · state `S` · GEDCOM parser (`parseGed`, `loadGed`) · proofs and links · lives and locations (`computeLives`, `locAt`) · kinship (`blood`, `kin`, `titleOf`) · geocoding (`resolvePlaces`) · year view (`setYear`) · map drawing · timeline · panel (`renderPanel`, `personHtml`) · search, file, settings · CSV import (`csvToGed`) · language and support (`applyLang`, `SUPPORT_URL`) · `boot`.

Storage keys (browser only): `cg.ged`, `cg.name`, `cg.lang`, `cg.tiles`, `cg.tpl`, `cg.manual`, `cg.ref.*`, `cg.custom.*`.

## Publishing

`main` is served by GitHub Pages at https://regis57.github.io/GeneanoMap/. The page keeps `noindex` during the test phase.

A second copy runs at https://regis-hennequin.info/geneanomap/ (repository `regis57/regis-hennequin-site`, folder `public/geneanomap/`). That site forbids anything inline, so its copy is the same page split into `index.html`, `app.js` and `app.css`; update it whenever `index.html` changes here.
