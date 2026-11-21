# Security

GeneanoMap opens private family files. Its design keeps them on the visitor's device.

## Design rules

- **Static only.** Three files (`index.html`, `world.json`, `gaz.json`) and two optional folders of data (`hist/`, `gaz/`). No server code, no build step, no dependency loaded at run time, no cookie.
- **The page cannot talk to another site.** The Content-Security-Policy in `index.html` starts from `default-src 'none'`; connections are limited to the page's own folder, forms are forbidden, and the only script and the only style sheet allowed are the ones whose SHA-256 fingerprints are written in the policy. Injected or modified code does not run; inline handlers and style attributes are refused.
- **File content is treated as text, never as code.** Everything read from a GEDCOM, spreadsheet or CSV file is escaped before display. Compressed files (`.gdz`, `.xlsx`, `.ods`) are unpacked by the browser's own decompressor, only the entries needed are read, the unpacked size is capped, and their XML is parsed as data: no macro, formula or script in them is run. Only addresses starting with `http://` or `https://` become links, opened with `rel="noopener noreferrer"`. Files above 60 MB are refused.
- **Opt-in for anything external.** OpenStreetMap tiles are off by default; when on, tile requests carry the site's origin only (`referrerpolicy="origin"`), every other link and request carries no referrer. Exported images and videos are drawn without those tiles and saved locally.
- **A published tree is a file of the same folder.** `?file=name.ged` is accepted only as a bare file name with a known extension (no `/`, no address); it is fetched under the same `connect-src 'self'` rule, read like a visitor's file, and people presumed living are hidden unless the owner adds `living=1`.
- **Data files are data.** `fetch()` may only read the JSON files of the page's own folder, by fixed names (`world.json`, `gaz.json`, `hist/<year>.json`, `gaz/index.json`, `gaz/<country>.json`); names of historical states and places taken from them are drawn as text.
- **Checked on every change.** `tools/check.mjs` (run by GitHub Actions on each push and pull request) is followed by `tools/test.mjs`, which loads the page's script in a sandbox and checks kinship titles in every language against `tools/kinship-expected.txt`, the completeness of translations and the published-tree rules. The check fails if the fingerprint is stale, if an unexpected address appears, or if a forbidden construct (`eval`, inline handlers, other network APIs, iframes, forms, cookies) is introduced.
- **Repository.** The `main` branch cannot be force-pushed or deleted. The workflow has read-only permissions and its action is pinned to a commit.

## Reporting a vulnerability

Please use **Security > Report a vulnerability** on this repository (private report), not a public issue. Describe the steps and, if a file is needed to reproduce, send a fictional one.

## If you host a copy

Serve the files over HTTPS from the same folder, keep the policy line, and run `node tools/check.mjs --fix` after any change to the script. If your server lets you set headers, also send `X-Content-Type-Options: nosniff` and `Referrer-Policy: no-referrer`.
