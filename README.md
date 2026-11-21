# GeneanoMap

**A family tree played on a map, year by year.** Open a GEDCOM file, press play, and watch who lived where from the oldest ancestor to today - or backwards.

Everything runs in the browser. The family file is never uploaded.

> Test phase. Live copy: https://regis57.github.io/GeneanoMap/

## What it does

- **Timeline with a play button**: past to present or present to past, at 2 to 40 years per second, with a histogram of people alive.
- **Map of the world**: each place shows who lives there that year; the camera can follow the family as it moves.
- **Reference person**: choose anyone; every other person gets a title relative to them (grandmother, great-uncle, first cousin once removed, uncle by marriage, ...), their Sosa/Ahnentafel number, and the nearest common ancestor. Titles can be renamed by hand.
- **Living relatives for any person and year**, with their ages: spouse, parents, children, siblings, grandparents, uncles and aunts, nephews and nieces, cousins.
- **Proofs and links**: links found in the file (scans on Google Drive, online profile, sources) are one click away from each person and event.
- **Four languages**, interface and kinship vocabulary: French, English, German, Italian. More can be added.
- **Works from the file alone**: tested on a tree of 12 generations and about 400 people.

## Use it

1. Export your tree as **GEDCOM** (`.ged`) from your genealogy software or website (Filae, Geneanet, Ancestry, MyHeritage, Heredis, Gramps, ...).
2. Open the page and click **Open a file** (or drop the file on the page).
3. Pick a reference person with the search box, then press play.

No GEDCOM? Fill the spreadsheet template [`template.csv`](template.csv). Both formats are described in [FORMAT.md](FORMAT.md).

## Put it on your own website

Copy three files into any folder of any web host - no database, no PHP, no build step:

```
index.html    the whole application
world.json    country outlines
gaz.json      world gazetteer used to locate places without coordinates
```

Then link to that folder, or embed it in a page:

```html
<iframe src="/geneanomap/" title="GeneanoMap" style="width:100%;height:85vh;border:0" loading="lazy"></iframe>
```

`index.html` currently contains `<meta name="robots" content="noindex,nofollow">` because the project is in test; remove that line when you want search engines to list your copy.

## Privacy

The file is read locally and kept only in the visitor's browser; the page blocks its own network access to anything but its folder. Details, including what is only relatively private (local storage, optional OpenStreetMap tiles, links you click): [PRIVACY.md](PRIVACY.md).

## How kinship titles are computed

For two people, the program finds their nearest common ancestor and counts the generations on each side. Blood comes first: two people who share grandparents are first cousins whether or not they are married to each other; a marriage is added to the blood relationship ("wife (also first cousin)"), it never replaces or creates one. Relatives of unequal generation are named explicitly: in English with *once/twice removed*, in German with *Onkel/Neffe 2. Grades*, in French and Italian by naming the path ("cousin germain du père", "figlia di una cugina di primo grado").

## Add a language

In `index.html`, two objects hold everything: `L` (interface texts) and `KIN` (kinship vocabulary). Copy the `en` entry of each under a new code, translate it, and add the language to `LANGS`.

## Support

A "buy me a beer" link will be added here and in the settings panel. Placeholder: [`.github/FUNDING.yml`](.github/FUNDING.yml) and `SUPPORT_URL` in `index.html`.

## Licence and credit

[Apache License 2.0](LICENSE). You may use, modify and redistribute GeneanoMap, including commercially, provided you keep the licence and the [NOTICE](NOTICE) file and say where it comes from, for example:

> Based on GeneanoMap by Regis Hennequin - https://github.com/regis57/GeneanoMap

Data: Natural Earth (public domain), GeoNames (CC BY 4.0), optional tiles © OpenStreetMap contributors.
