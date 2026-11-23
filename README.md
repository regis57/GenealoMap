# GenealoMap

**A family tree played on a map, year by year, inside the borders of the time.** Open a GEDCOM file or a spreadsheet, press play, and watch who lived where from the oldest ancestor to today - or backwards.

Everything runs in the browser. The family file is never uploaded.

> Test phase. Live copy: https://regis57.github.io/GenealoMap/

## What it does

- **Playback pauses when you open a person or a place**, so you can read; leaving the selection (name at the top, Esc, or a second click on the box in the tree) does not stop it. Space plays and pauses.
- **Timeline with a play button**: past to present or present to past, at 2 to 40 years per second, with a histogram of people alive.
- **Map of the world**: each place shows who lives there that year; the camera can follow the family as it moves.
- **Borders of the time**: from the year 800 to today the map shows the states as they were, at 30 reference dates (800, 900, 1000, 1100, 1200, 1279, 1300, 1400, 1492, 1500, 1530, ... 1815, 1878, 1880, ... 1914, 1920, 1938, 1945, 1994, 2010). Outlines are approximate and say so: the reference date is shown with "≈", uncertain borders are dashed. The usual names of some 400 former states (Carolingian Empire, Holy Roman Empire, Kievan Rus, Austria-Hungary, Two Sicilies, ...) are shown in the interface language; names of peoples stay as the source writes them. Can be switched off.
- **Regions**: zoomed in, the map shows today's first-level subdivisions (départements, provinces, Länder, states...), marked "current regions" under the year; historical regions known exactly, such as Alsace-Lorraine (1871-1918), are drawn for their own years with their dates.
- **Tree view**: one button swaps the map for a chart, vertical or horizontal, 3 to 16 generations. Five buttons choose the chart: *ancestors*, *descendants*, *hourglass* (ancestors above, descendants below - or right and left), *fan chart* (ancestors in rings, father's side on the left, up to 8 generations) show the whole line whatever the year (people not alive that year are only faded); *contemporaries of the year* shows only the family alive in the year shown and changes as the timeline plays. *Print* prints the chart alone, landscape, reduced to the page width. The tree stays on the last person you opened, even after closing their sheet. A strip above the tree lets you move with one click: up to the parents from a descendants chart, down to the children from an ancestors chart, sideways to a spouse. The last two need a person: with no reference and nobody selected, the list is greyed, a note says why, and the chart of the year is shown; your choice comes back as soon as a person is chosen. Each box carries the title relative to the reference person and the colour in use; people not alive in the year shown are faded, so the timeline plays on the tree too. Click a box to move the tree to that person.
- **Routes**: select a person and the map draws where they went, stop by stop with the years - or the route of their paternal or maternal line from the oldest known ancestor. The same route is listed as text.
- **Lines in colour**: colour people by kinship, by paternal and maternal line of the reference person, or by who bears their surname - on the map, in the lists and as curves on the timeline.
- **Reference person**: choose anyone, or none: the "Reference" label at the top removes the reference person with one click (kinship titles and kinship colours go away, playback is not interrupted) and puts it back with another; the link "remove the reference" on its own sheet does the same, and Esc leaves the person or place you opened. Without a reference, the tree shows everyone alive in the year; every other person gets a title relative to them (grandmother, great-uncle, first cousin once removed, uncle by marriage, ...), their Sosa/Ahnentafel number, and the nearest common ancestor. Titles can be renamed by hand.
- **Living relatives for any person and year**, with their ages: spouse, parents, children, siblings, grandparents, uncles and aunts, nephews and nieces, cousins.
- **Proofs and links**: links found in the file (scans on Google Drive, online profile, sources) are one click away from each person and event.
- **Eight languages**, interface and kinship vocabulary: French, English, German, Italian, Spanish, Portuguese, Dutch, Luxembourgish. More can be added.
- **Shareable view**: save the map as an image or record the playback as a short video. People presumed living are left out by default (a tick box), and the picture says so.
- **Keyboard and screen readers**: the map can be moved, zoomed and browsed place by place from the keyboard, and a text version lists what the animation shows.
- **Light or dark**: follows the device, or choose in the settings.
- **Works offline, installs like an app**: after a first visit the page and its maps are kept in the browser and open without a connection; Chrome, Edge and Android offer to install it (Settings > Offline > Install the app), iPhone and iPad through Share > Add to Home Screen. Your tree is never part of that copy.
- **Hamlets, vanished villages and old names**: a finer gazetteer for 42 countries, with old and revolutionary-era names and a loose match for old spellings, fetched country by country only when a tree needs it.
- **Large trees**: playback stays smooth with tens of thousands of people (measured on fictional trees of 20,000 to 60,000 people). On such trees the year view lists a few people per place, with the rest one click away, and kinship titles appear when playback pauses.
- **Works from the file alone**: tested on a tree of 12 generations and about 400 people.

## Use it

1. Export your tree as **GEDCOM** (`.ged`, or the GEDCOM 7 package `.gdz`) from your genealogy software or website (Filae, Geneanet, Ancestry, MyHeritage, Heredis, Gramps, ...). Gramps files (`.gramps`, `.gpkg`, Gramps XML) and GeneWeb files (`.gw`) are also read directly.
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

Some files are optional; the page works without them and loads from them only what a tree needs:

```
sw.js         offline copy: keeps the page and its maps in the browser so it opens without a connection
app/          manifest and icons, so the page can be installed like an app on a phone or computer
hist/         borders of the time, one file per reference date, and names.json (GPL-3.0 data); hist/regions/: today's subdivisions and dated historical regions (Natural Earth, public domain); see hist/README.md
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

If you change the script, run `node tools/check.mjs --fix` so the security policy accepts it, then `node tools/test.mjs` and `node tools/browser-test.mjs` (needs Playwright and Chromium).

### Finer gazetteer

`gaz.json` knows towns above about 1,000 inhabitants. Hamlets, small villages and places that no longer exist are in one file per country in `gaz/`. 42 countries are provided (47 MB in all, 0.03 to 11 MB each, smaller once compressed by the server):

- Europe: Austria, Belarus, Belgium, Croatia, Czechia, Denmark, Estonia, Finland, France, Germany, Greece, Hungary, Ireland, Italy, Latvia, Lithuania, Luxembourg, the Netherlands, Norway, Poland, Portugal, Romania, Slovakia, Slovenia, Spain, Sweden, Switzerland, Ukraine, the United Kingdom;
- countries of emigration: Argentina, Australia, Brazil, Canada, Chile, Mexico, New Zealand, South Africa, the United States, Uruguay;
- North Africa: Algeria, Morocco, Tunisia.

Each place carries its **old names** when GeoNames knows them: names in the languages of old records (German, Latin, Occitan, Breton, Alsatian, ...), names flagged historic, and the names French communes bore in 1793-1794 ("Yèvre-la-Patriote" for Yèvre-le-Châtel); big towns get their old names too ("Diedenhofen" for Thionville). A place still not found is tried with a loose spelling - doubled letters, y/i, ph/f, silent final letters ("Mallroy" for Malroy, "Mets" for Metz) - inside its country only and near the other places of the same region; such a match is always flagged "approximate".

To add or refresh a country from GeoNames:

```
node tools/build-gaz.mjs RU JP
```

This writes `gaz/RU.json`, ... and updates `gaz/index.json`. A visitor's browser fetches a country file only when the tree has places in that country that the main gazetteer could not find. When several hamlets share a name and nothing in the tree tells them apart, the position stays flagged "approximate".

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

Done in November 2026: borders of the time, Spanish / Portuguese / Dutch / Luxembourgish, finer gazetteer by country, shareable image and video, page address options, GEDCOM 7 packages and spreadsheets, keyboard access and text version, light/dark choice, routes of people and lines, colours by line or surname, publishing one's own tree, automatic tests of kinship titles, tree view, smooth playback of large trees, browser tests on every change, hourglass and fan charts, printing, Gramps and GeneWeb files, offline use and installation, finer gazetteer for 42 countries with old names and spellings, 30 border dates from the year 800, regions and Alsace-Lorraine.

Next, for people who use it:

- **Per-person links** to online trees (Filae, Geneanet, ...) without editing the file by hand.

Next, for quality:

- **Review of the newer languages** by native speakers, Luxembourgish first.
- **Historical borders**: more historical regions (each must be an exact union of today's subdivisions: add a line to `tools/hist-regions.txt`), and the names of smaller former states (`tools/hist-names.txt`).
- **Smaller places**: more countries (Russia, Japan, ...) when trees need them.
- **End of the test phase**: remove `noindex` once the above has settled.
