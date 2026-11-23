// Writes app/icon.svg, app/icon-192.png and app/icon-512.png from tools/icon.svg (needs Playwright and Chromium): node tools/build-icons.mjs
import {readFileSync, writeFileSync, copyFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
let pw; for (const m of ['playwright-core', 'playwright']) { try { pw = require(m); break; } catch (e) {} }
const svg = readFileSync(new URL('icon.svg', import.meta.url), 'utf8').trim();
copyFileSync(new URL('icon.svg', import.meta.url), new URL('../app/icon.svg', import.meta.url));
const b = await pw.chromium.launch();
for (const n of [192, 512]) {
  const p = await b.newPage({viewport: {width: n, height: n}});
  await p.setContent('<body style="margin:0"><img width="' + n + '" height="' + n + '" src="data:image/svg+xml,' + encodeURIComponent(svg) + '"></body>');
  writeFileSync(new URL(`../app/icon-${n}.png`, import.meta.url), await p.screenshot({omitBackground: true}));
  await p.close();
}
await b.close();
console.log('app/icon.svg, app/icon-192.png, app/icon-512.png written');
