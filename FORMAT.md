# Input formats

GenealoMap reads one file, in the browser. Three families of formats are accepted: GEDCOM, the files of Gramps and GeneWeb, and a table of people.

## 1. GEDCOM (recommended)

GEDCOM (`.ged`) is the exchange format every genealogy program and website can export: Filae, Geneanet, Ancestry, MyHeritage, FamilySearch, Heredis, Gramps, Family Tree Maker and others. Look for "Export" or "Download GEDCOM" in your tool. Versions 5.5, 5.5.1 and 7.0 are read; UTF-8 is preferred, ANSI/Windows-1252 is detected. A GEDCOM 7 package (`.gdz`, a zip archive holding `gedcom.ged` and media) is opened directly: only the GEDCOM inside is read, the media are ignored.

What is used:

| GEDCOM | Used for |
|---|---|
| `INDI` with `NAME`, `SEX` | people |
| `FAM` with `HUSB`, `WIFE`, `CHIL` (and `FAMC`/`FAMS`) | relationships, kinship titles |
| any event with `DATE` and/or `PLAC` (`BIRT`, `BAPM`, `DEAT`, `BURI`, `RESI`, `OCCU`, `CENS`, `EMIG`, `IMMI`, `MARR`, ...) | where each person is in a given year |
| `PLAC` + `MAP` / `LATI` / `LONG` | exact position (best result) |
| `NOTE`, `SOUR` | shown under each event; any `http(s)` address becomes a link |
| `WWW` (or `_URL`) under `INDI` | "online profile" link for that person |

Dates: `14 MAR 1968`, `MAR 1968`, `1968`, `ABT 1802`, `BEF 1850`, `AFT 1850`, `BET 1800 AND 1810`. French, German, Spanish, Dutch and Portuguese month abbreviations are tolerated.

Places without coordinates are looked up in the bundled gazetteer (towns above about 1,000 inhabitants, worldwide). Write them from the most local to the widest level, ending with the country: `Florac, Lozère, France`. If the copy you use has the finer gazetteer for the country (folder `gaz/`), hamlets, vanished villages and old names of places (including the names of 1793-1794 in France) are looked up there next; then a loose spelling is tried inside the country (doubled letters, y/i, silent final letters), always flagged "approximate". Villages still missing are placed near neighbouring places and flagged "approximate"; you can place them by hand (Settings > Places and coordinates) and copy the resulting `MAP` lines back into your file.

Numbered proofs: a note containing `Proof 12 : https://...` (also `Preuve`, `Beleg`, `Prova`, `Prueba`, `Bewijs`, `Beweis`) defines proof 12; any event note mentioning `proof 12` then links to it.

## 2. Table of people (Excel, LibreOffice, Google Sheets, CSV)

For people who keep their family in a spreadsheet. One row per person, first row = column names. See [`template.csv`](template.csv).

The table can be opened as:

- an Excel workbook (`.xlsx`) or an OpenDocument spreadsheet (`.ods`): the first sheet is read; cells formatted as dates are understood, and a plain number such as `1968` is a year;
- a CSV file saved as "CSV UTF-8": comma, semicolon or tab separators are detected.

Older `.xls` files are not read: save them as `.xlsx`.

| Column | Required | Content |
|---|---|---|
| `id` | yes | any unique code for the person (`P1`, `42`, ...) |
| `given` | yes (or `surname`) | given names |
| `surname` | | family name |
| `sex` | | `M` or `F` |
| `birth_date`, `death_date` | | `1968-03-14`, `1968-03`, `1968`, `14/03/1968`; prefix `~` (about), `<` (before), `>` (after), or the word in your language (`vers`, `about`, `um`, `circa`, `hacia`, `rond`, `cerca`; `avant`, `before`, `vor`, `voor`, `antes`; `après`, `after`, `nach`, `na`, `después`, `depois`) |
| `birth_place`, `death_place` | | `Town, Region, Country`, optionally followed by coordinates: `Florac, Lozère, France @44.326,3.594` |
| `father_id`, `mother_id` | | the `id` of each parent |
| `spouse_ids` | | one or more `id`, separated by `\|` |
| `marriage_date`, `marriage_place` | | marriage with the first spouse listed |
| `residences` | | `year=place` pairs separated by `\|`: `1930=Marseille, France \| 1961=Montréal, Canada @45.508,-73.588` |
| `occupation` | | free text |
| `profile_url` | | address of the person's page on your genealogy site |
| `links` | | one or more `http(s)` addresses (scans, proofs), separated by spaces |
| `notes` | | free text |

French column names are also understood (`prenom`, `nom`, `sexe`, `pere_id`, `mere_id`, ...), and the usual words for given name, surname and sex in German, Italian, Spanish, Dutch and Portuguese. The table is converted to GEDCOM inside the browser; nothing is uploaded.

## 3. Gramps and GeneWeb

Both are converted to GEDCOM inside the browser, then read as above.

**Gramps**: use *Family Trees > Export > Gramps XML* (`.gramps`, compressed), or a *Gramps package* (`.gpkg`, which also holds media: only the tree inside is read), or an uncompressed Gramps XML file (`.xml`). Read: people (first name, main surname, gender), families, events where the person is the main participant (birth, death, baptism, burial, residence, occupation, census, emigration, marriage, divorce and the other usual ones; others become a plain event with their type), dates (exact, about, before, after, estimated or calculated, ranges and spans), places with their enclosing places (`Florac, Lozère, France`) and coordinates (decimal or degrees-minutes-seconds), notes and the first web address of each person.

**GeneWeb**: the `.gw` file made by *gwu* or by the GeneWeb export. Read: `fam` lines (parents, marriage date and place, divorce), children between `beg` and `end`, birth, baptism, death and burial dates and places, occupations, `notes` blocks and the events of `pevt` / `fevt` blocks (residence, census, emigration, ...). Words joined by `_` are read with spaces. Dates `~` (about), `<` (before), `>` (after), `..` (between) are kept; dates of the French republican calendar are converted to the approximate year and marked "about". Sources, witnesses and relations are not used.

A Word document or a link to a genealogy website cannot be read directly: a web page is not allowed to fetch another site on your behalf, and that restriction is what keeps your data on your device. Export a GEDCOM from the site, or fill the CSV template.
