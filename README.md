# GenealoMap

**A family tree played on a map, year by year, inside the borders of the time.** Open a GEDCOM file or a spreadsheet, press play, and watch who lived where from the oldest ancestor to today - or backwards.

Everything runs in the browser. The family file is never uploaded.

> Test phase. Live copy: https://regis57.github.io/GenealoMap/

## What it does

- **Playback pauses when you open a person or a place**, so you can read; leaving the selection (name at the top, Esc, or a second click on the box in the tree) does not stop it. Space plays and pauses.
- **Timeline with a play button**: past to present or present to past, at 2 to 40 years per second, with a histogram of people alive.
- **Map of the world**: each place shows who lives there that year; the camera can follow the family as it moves.
- **Borders of the time**: from 1500 to today the map shows the states as they were, at 20 reference dates (1500, 1530, 1600, ... 1914, 1920, 1938, 1945, 1994, 2010). Outlines are approximate and say so: the reference date is shown with "≈", uncertain borders are dashed. The usual names of some 300 former states (Holy Roman Empire, Austria-Hungary, Two Sicilies, ...) are shown in the interface language. Can be switched off.
- **Tree view**: one button swaps the map for a chart, vertical or horizontal, 3 to 16 generations. Three buttons choose the chart: *ancestors* and *descendants* show the whole line whatever the year (people not alive that year are only faded), *contemporaries of the year* shows only the family alive in the year shown and changes as the timeline plays. The tree stays on the last person you opened, even after closing their sheet. A strip above the tree lets you move with one click: up to the parents from a descendants chart, down to the children from an ancestors chart, sideways to a spouse. The last two need a person: with no reference and nobody selected, the list is greyed, a note says why, and the chart of the year is shown; your choice comes back as soon as a person is chosen. Each box carries the title relative to the reference person and the colour in use; people not alive in the year shown are faded, so the timeline plays on the tree too. Click a box to move the tree to that person.
- **Routes**: select a person and the map draws where they went, stop by stop with the years - or the route of their paternal or maternal line from the oldest known ancestor. The same route is listed as text.
- **Lines in colour**: colour people by kinship, by paternal and maternal line of the reference person, or by who bears their surname - on the map, in the lists and as curves on the timeline.
- **Reference person**: choose anyone, or none: the "Reference" label at the top removes the reference person with one click (kinship titles and kinship colours go away, playback is not interrupted) and puts it back with another; the link "remove the reference" on its own sheet does the same, and Esc leaves the person or place you opened. Without a reference, the tree shows everyone alive in the year; every other person gets a title relative to them (grandmother, great-uncle, first cousin once removed, uncle by marriage, ...), their Sosa/Ahnentafel number, and the nearest common ancestor. Titles can be renamed by hand.
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
<iframe src="/genealomap/" title="GenealoMap" style="width:100%;height:85vh;border:0" loading="lazy"></iframe>
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
| `view=tree` | open on the tree view instead of the map |
| `file=tree.ged` | show a tree you publish: a file placed in the same folder as the page (see below) |
| `living=1` | with `file`: also show people presumed living |

Example: `/genealomap/#lang=de&year=1870&theme=dark`. Without `file`, the tree shown is the one the visitor opened (or the fictional example).

### Publish your own tree

Put your file (`.ged`, `.gdz`, `.csv`, `.xlsx` or `.ods`) in the same folder as `index.html` and name it in the address:

```
https://your-site.example/genealomap/?file=tree.ged&ref=I12&lang=fr
```

Visitors then see your tree instead of the fictional example. People presumed living (no death recorded, born less than 100 years ago) are not shown: not on the map, not in lists, searches or titles. Add `living=1` only if everyone concerned agrees.

Two things to know. The file itself can be downloaded by anyone who knows its name, whatever the page displays: **export it without living people** from your genealogy program before publishing. And only a file in that folder can be named - a name with a `/` or an address is ignored. The published file is not stored in the visitor's browser, and a visitor can still open their own file.

If you change the script, run `node tools/check.mjs --fix` so the security policy accepts it, then `node tools/test.mjs`.

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

Relatives by marriage are named through the blood relative who links them: the wife of a great-grandson is "wife of Jean (great-grandson)", her father is "father-in-law of Jean (great-grandson)", her grandmother "grandmother of Marie (wife of Jean (great-grandson))". The shortest such path is kept. "No known relationship" is shown only when the file holds no path of that kind.

Where a language has one word for two relationships, the title says which: Dutch *neef* is shown as "neef (oomzegger)" for a nephew and "volle neef" for a first cousin; Italian *nipote* as "nipote (di nonno)" or "nipote (di zio)".

## Add a language

In `index.html`, two objects hold everything: `L` (interface texts) and `KIN` (kinship vocabulary). Copy the `en` entry of each under a new code, translate it, and add the language to `LANGS`. Names of former states are in `tools/hist-names.txt`, one line per name with a column per language: add a column, then run `node tools/build-hist.mjs --names`.

## Security

Design rules, the automatic check run on every change, and how to report a problem: [SECURITY.md](SECURITY.md).

## Support

If GenealoMap is useful to you: [buy me a beer](https://buymeacoffee.com/regis57). The same link is in the settings panel.

## Licence and credit

[Apache License 2.0](LICENSE). You may use, modify and redistribute GenealoMap, including commercially, provided you keep the licence and the [NOTICE](NOTICE) file and say where it comes from, for example:

> Based on GenealoMap by Regis Hennequin - https://github.com/regis57/GenealoMap

Data: Natural Earth (public domain), GeoNames (CC BY 4.0), optional tiles © OpenStreetMap contributors. The historical borders in `hist/` come from [historical-basemaps](https://github.com/aourednik/historical-basemaps) by André Ourednik and stay under their own licence, GPL-3.0; they are data read by the program, and the folder can be left out.

## Roadmap

Ideas under consideration, in no promised order. Suggestions are welcome in the issues.

Done in November 2026: borders of the time, Spanish / Portuguese / Dutch / Luxembourgish, finer gazetteer by country, shareable image and video, page address options, GEDCOM 7 packages and spreadsheets, keyboard access and text version, light/dark choice, routes of people and lines, colours by line or surname, publishing one's own tree, automatic tests of kinship titles, tree view.

Next, for people who use it:

- **Tree view**: hourglass (ancestors and descendants together), fan chart, and printing.
- **Per-person links** to online trees (Filae, Geneanet, ...) without editing the file by hand.
- **More input formats**: Gramps XML and GeneWeb (`.gw`) files.
- **Use without a connection**: install the page on a phone or computer and keep it working offline.

Next, for quality:

- **Review of the newer languages** by native speakers, Luxembourgish first.
- **Historical borders**: more reference dates, regions inside states (provinces, Alsace-Lorraine, ...), and the smaller former states still named as the source writes them.
- **Smaller places**: more countries in the finer gazetteer, and old spellings of place names.
- **Larger trees**: keep playback smooth with tens of thousands of people.
- **Automatic tests**: a browser run of the page on each change (the kinship table, completeness of the languages and the published-tree rules are already checked by `tools/test.mjs`).
- **End of the test phase**: remove `noindex` once the above has settled.
