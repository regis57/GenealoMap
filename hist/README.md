# Historical borders

The files `<year>.json` and `names.json` in this folder are derived from **historical-basemaps** by André Ourednik
(https://github.com/aourednik/historical-basemaps), built with `node tools/build-hist.mjs`.

They are distributed under the **GNU General Public License, version 3** (https://www.gnu.org/licenses/gpl-3.0.html),
the licence of their source - not under the Apache licence of the GenealoMap program, which only reads them as data.
If you redistribute them, keep this notice. The folder is optional: without it GenealoMap shows current borders.

The sub-folder `regions/` is different: it is derived from **Natural Earth** 1:10m first-level subdivisions
(https://www.naturalearthdata.com), which are in the **public domain**, built with `node tools/build-regions.mjs`. It holds today's
subdivisions by country and `hist.json`, the dated historical regions of `tools/hist-regions.txt`, each drawn as an exact union of
today's subdivisions.

The source describes itself as work in progress: outlines are approximate and meant for reading a map at the scale
of a country or a continent, not as evidence of where a border ran.
