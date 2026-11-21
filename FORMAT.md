# Input formats

GeneanoMap reads one file, in the browser. Two formats are accepted.

## 1. GEDCOM (recommended)

GEDCOM (`.ged`) is the exchange format every genealogy program and website can export: Filae, Geneanet, Ancestry, MyHeritage, FamilySearch, Heredis, Gramps, Family Tree Maker and others. Look for "Export" or "Download GEDCOM" in your tool. Versions 5.5, 5.5.1 and 7.0 are read; UTF-8 is preferred, ANSI/Windows-1252 is detected.

What is used:

| GEDCOM | Used for |
|---|---|
| `INDI` with `NAME`, `SEX` | people |
| `FAM` with `HUSB`, `WIFE`, `CHIL` (and `FAMC`/`FAMS`) | relationships, kinship titles |
| any event with `DATE` and/or `PLAC` (`BIRT`, `BAPM`, `DEAT`, `BURI`, `RESI`, `OCCU`, `CENS`, `EMIG`, `IMMI`, `MARR`, ...) | where each person is in a given year |
| `PLAC` + `MAP` / `LATI` / `LONG` | exact position (best result) |
| `NOTE`, `SOUR` | shown under each event; any `http(s)` address becomes a link |
| `WWW` (or `_URL`) under `INDI` | "online profile" link for that person |

Dates: `14 MAR 1968`, `MAR 1968`, `1968`, `ABT 1802`, `BEF 1850`, `AFT 1850`, `BET 1800 AND 1810`. French and German month abbreviations are tolerated.

Places without coordinates are looked up in the bundled gazetteer (towns above about 1,000 inhabitants, worldwide). Write them from the most local to the widest level, ending with the country: `Florac, Lozère, France`. Villages missing from the gazetteer are placed near neighbouring places and flagged "approximate"; you can place them by hand (Settings > Places and coordinates) and copy the resulting `MAP` lines back into your file.

Numbered proofs: a note containing `Proof 12 : https://...` (also `Preuve`, `Beleg`, `Prova`) defines proof 12; any event note mentioning `proof 12` then links to it.

## 2. CSV table (from Excel, LibreOffice, Google Sheets)

For people who keep their family in a spreadsheet. One row per person, first row = column names. Save as "CSV UTF-8". Comma, semicolon or tab separators are detected. See [`template.csv`](template.csv).

| Column | Required | Content |
|---|---|---|
| `id` | yes | any unique code for the person (`P1`, `42`, ...) |
| `given` | yes (or `surname`) | given names |
| `surname` | | family name |
| `sex` | | `M` or `F` |
| `birth_date`, `death_date` | | `1968-03-14`, `1968-03`, `1968`, `14/03/1968`; prefix `~` (about), `<` (before), `>` (after) |
| `birth_place`, `death_place` | | `Town, Region, Country`, optionally followed by coordinates: `Florac, Lozère, France @44.326,3.594` |
| `father_id`, `mother_id` | | the `id` of each parent |
| `spouse_ids` | | one or more `id`, separated by `\|` |
| `marriage_date`, `marriage_place` | | marriage with the first spouse listed |
| `residences` | | `year=place` pairs separated by `\|`: `1930=Marseille, France \| 1961=Montréal, Canada @45.508,-73.588` |
| `occupation` | | free text |
| `profile_url` | | address of the person's page on your genealogy site |
| `links` | | one or more `http(s)` addresses (scans, proofs), separated by spaces |
| `notes` | | free text |

French column names are also understood (`prenom`, `nom`, `sexe`, `pere_id`, `mere_id`, ...). The table is converted to GEDCOM inside the browser; nothing is uploaded.

A Word document or a link to a genealogy website cannot be read directly: a web page is not allowed to fetch another site on your behalf, and that restriction is what keeps your data on your device. Export a GEDCOM from the site, or fill the CSV template.
