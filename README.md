# GeneanoMap

**A family tree played on a map, year by year, inside the borders of the time.** Open a GEDCOM file or a spreadsheet, press play, and watch who lived where from the oldest ancestor to today - or backwards.

Everything runs in the browser. The family file is never uploaded.

> Test phase. Live copy: https://regis57.github.io/GeneanoMap/

## What it does

- **Timeline with a play button**: past to present or present to past, at 2 to 40 years per second, with a histogram of people alive.
- **Map of the world**: each place shows who lives there that year; the camera can follow the family as it moves.
- **Borders of the time**: from 1500 to today the map shows the states as they were, at 20 reference dates (1500, 1530, 1600, ... 1914, 1920, 1938, 1945, 1994, 2010). Outlines are approximate and say so: the reference date is shown with "≈", uncertain borders are dashed. The usual names of some 300 former states (Holy Roman Empire, Austria-Hungary, Two Sicilies, ...) are shown in the interface language. Can be switched off.
- **Reference person**: choose anyone; every other person gets a title relative to them (grandmother, great-uncle, first cousin once removed, uncle by marriage, ...), their Sosa/Ahnentafel number, and the nearest common ancestor. Titles can be renamed by hand.
- **Living relatives for any person and year**, with their ages: spouse, parents, children, siblings, grandparents, uncles and aunts, nephews and nieces, cousins.
- **Proofs and links**: links found in the file (scans on Google Drive, online profile, sources) are one click away from each person and event.
- **Eight languages**, interface and kinship vocabulary: French, English, German, Italian, Spanish, Portuguese, Dutch, Luxembourgish. More can be added.
- **Shareable view**: save the map as an image or record the playback as a short video. People presumed living are left out by default (a tick box), and the picture says so.
- **Keyboard and screen readers**: the map can be moved, zoomed and browsed place by place from the keyboard, and a text version lists what the animation shows.
- **Light or dark**: follows the device, or choose in the settings.
- **Hamlets and vanished villages**: a finer gazetteer for fifteen countries, fetched country by country only when a tree needs it.
- **Works from the file alone**: tested on a tree of 12 generations and about 400 people.

## Use it

1. Export your tree as **GEDCOM** (`.ged`, or the GEDCOM 7 package `.gdz`) from your genealogy software or website (Filae, Geneanet, Ancestry, MyHeritage, Heredis, Gramps, ...).
2. Open the page and click **Open a file** (or drop the file on the page).
3. Pick a reference person with the search box, then press play.

No GEDCOM? Fill the spreadsheet template [`template.csv`](template.csv) and open it as CSV, or directly as an Excel (`.xlsx`) or LibreOffice (`.ods`) file. The formats are described in [FORMAT.md](FORMAT.md).

## Put it on your own website

Copy three files into any folder of any web host - no database, no PHP, no build step:

```
index.html    the whole application
world.json    country outlines
gaz.json      world gazetteer used to locate places without coordinates
```

Two folders are optional; the page works without them and loads from them only what a tree needs:

```
hist/         borders of the time, one file per reference date, and names.json (GPL-3.0 data, see hist/README.md)
gaz/          finer gazetteer by country: hamlets and vanished villages (see below)
```

Then link to that folder, or embed it in a page:

```html
<iframe src="/geneanomap/" title="GeneanoMap" style="width:100%;height:85vh;border:0" loading="lazy"></iframe>
```

The page address can set how an embedded copy starts - after `?` or, to keep it out of the server's logs, after `#`:

| Option | Effect |
|---|---|
| `lang=fr` | interface language (`fr`, `en`, `de`, `it`, `es`, `pt`, `nl`, `lb`) |
| `ref=I12` | reference person: the identifier in the file (without `@`) or the full name |
| `year=1900` | starting year |
| `theme=dark` | `light` or `dark` instead of the device setting |
| `hist=0` | current borders only |
| `play=1` | start playing at once |

Example: `/geneanomap/#lang=de&year=1870&theme=dark`. These options describe the display only; the tree shown is still the one the visitor opened (or the fictional example).

If you change the script, run `node tools/check.mjs --fix` so the security policy accepts it.

### Finer gazetteer

`gaz.json` knows towns above about 1,000 inhabitants. Hamlets, small villages and places that no longer exist are in one file per country in `gaz/`. Fifteen countries are provided: Austria, Belgium, Canada, Czechia, France, Germany, Ireland, Italy, Luxembourg, the Netherlands, Poland, Portugal, Spain, Switzerland and the United Kingdom (14 MB in all, 0.02 to 2.6 MB each). To add or refresh a country from GeoNames:

```
node tools/build-gaz.mjs US AR
```

This writes `gaz/US.json`, ... and updates `gaz/index.json`. A visitor's browser fetches a country file only when the tree has places in that country that the main gazetteer could not find. When several hamlets share a name and nothing in the tree tells them apart, the position stays flagged "approximate".

`index.html` currently contains `<meta name="robots" content="noindex,nofollow">` because the project is in test; remove that line when you want search engines to list your copy.

## Privacy

The file is read locally and kept only in the visitor's browser; the page blocks its own network access to anything but its folder. Details, including what is only relatively private (local storage, optional OpenStreetMap tiles, links you click): [PRIVACY.md](PRIVACY.md).

## How kinship titles are computed

For two people, the program finds their nearest common ancestor and counts the generations on each side. Blood comes first: two people who share grandparents are first cousins whether or not they are married to each other; a marriage is added to the blood relationship ("wife (also first cousin)"), it never replaces or creates one. Relatives of unequal generation are named explicitly: in English with *once/twice removed*, in German and Luxembourgish with *Onkel/Neffe 2. Grades* (*Monni/Neveu 2. Grads*), in French, Italian, Spanish, Portuguese and Dutch by naming the path ("cousin germain du père", "figlia di una cugina di primo grado", "primo hermano de la madre", "zoon van een volle nicht").

Where a language has one word for two relationships, the title says which: Dutch *neef* is shown as "neef (oomzegger)" for a nephew and "volle neef" for a first cousin; Italian *nipote* as "nipote (di nonno)" or "nipote (di zio)".

## Add a language

In `index.html`, two objects hold everything: `L` (interface texts) and `KIN` (kinship vocabulary). Copy the `en` entry of each under a new code, translate it, and add the language to `LANGS`. Names of former states are in `tools/hist-names.txt`, one line per name with a column per language: add a column, then run `node tools/build-hist.mjs --names`.

## Security

Design rules, the automatic check run on every change, and how to report a problem: [SECURITY.md](SECURITY.md).

## Support

If GeneanoMap is useful to you: [buy me a beer](https://buymeacoffee.com/regis57). The same link is in the settings panel.

## Licence and credit

[Apache License 2.0](LICENSE). You may use, modify and redistribute GeneanoMap, including commercially, provided you keep the licence and the [NOTICE](NOTICE) file and say where it comes from, for example:

> Based on GeneanoMap by Regis Hennequin - https://github.com/regis57/GeneanoMap

Data: Natural Earth (public domain), GeoNames (CC BY 4.0), optional tiles © OpenStreetMap contributors. The historical borders in `hist/` come from [historical-basemaps](https://github.com/aourednik/historical-basemaps) by André Ourednik and stay under their own licence, GPL-3.0; they are data read by the program, and the folder can be left out.

## Roadmap

Ideas under consideration, in no promised order. Suggestions are welcome in the issues.

Done in November 2026: borders of the time, Spanish / Portuguese / Dutch / Luxembourgish, finer gazetteer by country, shareable image and video, page address options, GEDCOM 7 packages and spreadsheets, keyboard access and text version, light/dark choice.

Next, for people who use it:

- **Show a published tree**: let a site owner put their own file next to the page and name it in the address, so visitors see that tree instead of the fictional example. Living people hidden by default.
- **Migration paths**: draw the route of a person or of a whole line across the years (birth, moves, death), not only where people are in a given year.
- **Branches in colour**: paternal and maternal lines, or one surname, picked out on the map and the timeline.
- **Per-person links** to online trees (Filae, Geneanet, ...) without editing the file by hand.
- **More input formats**: Gramps XML and GeneWeb (`.gw`) files.
- **Use without a connection**: install the page on a phone or computer and keep it working offline.

Next, for quality:

- **Review of the newer languages** by native speakers, Luxembourgish first.
- **Historical borders**: more reference dates, regions inside states (provinces, Alsace-Lorraine, ...), and the smaller former states still named as the source writes them.
- **Smaller places**: more countries in the finer gazetteer, and old spellings of place names.
- **Larger trees**: keep playback smooth with tens of thousands of people.
- **Automatic tests**: a table of expected kinship titles in every language, and a browser run of the page, checked on each change.
- **End of the test phase**: remove `noindex` once the above has settled.
