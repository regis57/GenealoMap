# Privacy

GeneanoMap is a static page. There is no account, no server-side code, no database, no analytics, no cookie and no advertising.

## What is guaranteed

- **Your family file is never uploaded.** It is read by your browser with the local File API and processed in memory on your device.
- **The page cannot send it elsewhere.** `index.html` carries a Content-Security-Policy that limits network connections to the folder it is served from (`connect-src 'self'`) and forbids form submissions. Even a bug could not transmit your tree to a third party: the browser would block it.
- **No third-party resource is loaded by default**: no web fonts, no CDN scripts, no trackers. The page needs only `index.html`, `world.json` and `gaz.json`, plus two optional data folders served from the same place: `hist/` (borders of the time) and `gaz/` (finer gazetteer by country).

You can check this yourself: open the browser's developer tools, "Network" tab, and load your file.

## What is relative, and why

- **Local memory.** So that you find your tree again on your next visit, the file and your settings are kept in this browser's local storage, on your device only. "Forget my file" in the settings erases them. On a shared computer, use that button or a private window.
- **Optional detailed map.** If you tick "Detailed OpenStreetMap background", your browser downloads map images from `tile.openstreetmap.org`. OpenStreetMap then sees your IP address and the area you look at - not your tree. It is off by default.
- **Links you click.** Proofs and profile links inside your file open the site they point to (Google Drive, Filae, ...), under that site's own rules.
- **The host.** Like any website, the server that hosts the page (GitHub Pages or yours) sees your IP address and the requests for the files above. It never receives your family file. Two of these requests say a little about what you look at: the reference date of the historical borders on screen (`hist/1815.json`), and the country of places the main gazetteer could not find (`gaz/FR.json`). Untick "Historical borders" to avoid the first; the second only exists on copies that ship the `gaz/` folder.
- **Images and videos you export.** "Share" draws the picture or records the video inside your browser and saves it on your device; nothing is sent. People presumed living are left out unless you untick the box, and the picture then carries the mention. A person is presumed living when the file records no death and the birth is less than 100 years ago: check before you publish.
- **Options in the page address.** `?ref=...` or `?year=...` are visible to the host like any address. Written after `#` instead, they stay in the browser.
- **Other people's data.** A family tree describes living people too. If you show your screen or share screenshots, the option "Hide the names of people presumed living" helps; you remain responsible for what you share.

## For people who host a copy

Keep the Content-Security-Policy line in `index.html`, serve the files from the same folder over HTTPS, and do not add analytics scripts if you want to repeat the guarantee above to your visitors. If you embed the page in an `<iframe>`, visitors' files stay inside that frame.

## No warranty

The software is provided "as is" under the Apache License 2.0, without warranty of any kind. Kinship titles, estimated dates and approximate positions are aids for reading a tree, not evidence.
