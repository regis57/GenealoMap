# Security

GeneanoMap opens private family files. Its design keeps them on the visitor's device.

## Design rules

- **Static only.** Three files (`index.html`, `world.json`, `gaz.json`). No server code, no build step, no dependency loaded at run time, no cookie.
- **The page cannot talk to another site.** The Content-Security-Policy in `index.html` starts from `default-src 'none'`; connections are limited to the page's own folder, forms are forbidden, and the only script allowed to run is the one whose SHA-256 fingerprint is written in the policy. Injected or modified script does not run.
- **File content is treated as text, never as code.** Everything read from a GEDCOM or CSV file is escaped before display. Only addresses starting with `http://` or `https://` become links, opened with `rel="noopener noreferrer"`. Files above 60 MB are refused.
- **Opt-in for anything external.** OpenStreetMap tiles are off by default.
- **Checked on every change.** `tools/check.mjs` (run by GitHub Actions on each push and pull request) fails if the fingerprint is stale, if an unexpected address appears, or if a forbidden construct (`eval`, inline handlers, other network APIs, iframes, forms, cookies) is introduced.
- **Repository.** The `main` branch cannot be force-pushed or deleted. The workflow has read-only permissions and its action is pinned to a commit.

## Reporting a vulnerability

Please use **Security > Report a vulnerability** on this repository (private report), not a public issue. Describe the steps and, if a file is needed to reproduce, send a fictional one.

## If you host a copy

Serve the three files over HTTPS from the same folder, keep the policy line, and run `node tools/check.mjs --fix` after any change to the script. If your server lets you set headers, also send `X-Content-Type-Options: nosniff` and `Referrer-Policy: no-referrer`.
