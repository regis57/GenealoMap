# Privacy

GeneanoMap is a static page. There is no account, no server-side code, no database, no analytics, no cookie and no advertising.

## What is guaranteed

- **Your family file is never uploaded.** It is read by your browser with the local File API and processed in memory on your device.
- **The page cannot send it elsewhere.** `index.html` carries a Content-Security-Policy that limits network connections to the folder it is served from (`connect-src 'self'`) and forbids form submissions. Even a bug could not transmit your tree to a third party: the browser would block it.
- **No third-party resource is loaded by default**: no web fonts, no CDN scripts, no trackers. The page needs only `index.html`, `world.json` and `gaz.json`.

You can check this yourself: open the browser's developer tools, "Network" tab, and load your file.

## What is relative, and why

- **Local memory.** So that you find your tree again on your next visit, the file and your settings are kept in this browser's local storage, on your device only. "Forget my file" in the settings erases them. On a shared computer, use that button or a private window.
- **Optional detailed map.** If you tick "Detailed OpenStreetMap background", your browser downloads map images from `tile.openstreetmap.org`. OpenStreetMap then sees your IP address and the area you look at - not your tree. It is off by default.
- **Links you click.** Proofs and profile links inside your file open the site they point to (Google Drive, Filae, ...), under that site's own rules.
- **The host.** Like any website, the server that hosts the page (GitHub Pages or yours) sees your IP address and the request for the three files above. It never receives your family file.
- **Other people's data.** A family tree describes living people too. If you show your screen or share screenshots, the option "Hide the names of people presumed living" helps; you remain responsible for what you share.

## For people who host a copy

Keep the Content-Security-Policy line in `index.html`, serve the three files from the same folder over HTTPS, and do not add analytics scripts if you want to repeat the guarantee above to your visitors. If you embed the page in an `<iframe>`, visitors' files stay inside that frame.

## No warranty

The software is provided "as is" under the Apache License 2.0, without warranty of any kind. Kinship titles, estimated dates and approximate positions are aids for reading a tree, not evidence.
