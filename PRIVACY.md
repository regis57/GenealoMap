# Privacy

GenealoMap is a static page. There is no account, no server-side code, no database, no analytics, no cookie and no advertising.

## What is guaranteed

- **Your family file is never uploaded.** It is read by your browser with the local File API and processed in memory on your device.
- **The page cannot send it elsewhere.** `index.html` carries a Content-Security-Policy that limits network connections to the folder it is served from (`connect-src 'self'`) and forbids form submissions. Even a bug could not transmit your tree to a third party: the browser would block it.
- **No third-party resource is loaded by default**: no web fonts, no CDN scripts, no trackers. The page needs only `index.html`, `world.json` and `gaz.json`, plus two optional data folders served from the same place: `hist/` (borders of the time) and `gaz/` (finer gazetteer by country).

You can check this yourself: open the browser's developer tools, "Network" tab, and load your file.

## What is relative, and why

- **Local memory.** So that you find your tree again on your next visit, the file and your settings are kept in this browser's local storage, on your device only. "Forget my file" in the settings erases them. On a shared computer, use that button or a private window.
- **Optional detailed map.** If you tick "Detailed OpenStreetMap background", your browser downloads map images from `tile.openstreetmap.org`. OpenStreetMap then sees your IP address, the area you look at and the name of the site showing the map (for example `regis57.github.io`; OpenStreetMap refuses requests that do not say where they come from) - not the page address, not your tree. It is off by default.
- **Links you click.** Proofs and profile links inside your file open the site they point to (Google Drive, Filae, ...), under that site's own rules.
- **The host.** Like any website, the server that hosts the page (GitHub Pages or yours) sees your IP address and the requests for the files above. It never receives your family file. Two of these requests say a little about what you look at: the reference date of the historical borders on screen (`hist/1815.json`), and the country of places the main gazetteer could not find (`gaz/FR.json`). Untick "Historical borders" to avoid the first; the second only exists on copies that ship the `gaz/` folder.
- **Images and videos you export.** "Share" draws the picture or records the video inside your browser and saves it on your device; nothing is sent. People presumed living are left out unless you untick the box, and the picture then carries the mention. A person is presumed living when the file records no death and the birth is less than 100 years ago: check before you publish.
- **Offline copy.** If the host serves `sw.js` (GitHub Pages does), the browser keeps a copy of the page, the maps and the gazetteer files you used in its cache, so the page opens without a connection. That copy holds no family data: your file stays in local storage as before, and a tree published with `?file=` is not cached. "Forget my file" erases your file; the offline copy itself is removed with the site's data in the browser settings. Installing the page only adds a shortcut to that same copy.
- **Options in the page address.** `?ref=...` or `?year=...` are visible to the host like any address. Written after `#` instead, they stay in the browser.
- **Other people's data.** A family tree describes living people too. If you show your screen or share screenshots, the option "Hide the names of people presumed living" helps; you remain responsible for what you share.

## For people who host a copy

If you publish your own tree with `?file=...`, you become the publisher of that data. The page hides people presumed living, but the file itself stays downloadable by anyone who knows its name: remove living people from the file before you put it online, and ask the people concerned before using `living=1`.

Keep the Content-Security-Policy line in `index.html`, serve the files from the same folder over HTTPS, and do not add analytics scripts if you want to repeat the guarantee above to your visitors. If you embed the page in an `<iframe>`, visitors' files stay inside that frame.

## No warranty

The software is provided "as is" under the Apache License 2.0, without warranty of any kind. Kinship titles, estimated dates and approximate positions are aids for reading a tree, not evidence.
