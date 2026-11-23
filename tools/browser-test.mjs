// Browser run of the page, used by CI after check.mjs and test.mjs: `node tools/browser-test.mjs`.
// It serves this folder on a local port, opens index.html in Chromium (Playwright) and drives it like a visitor,
// with fictional data only. Any console error, page error or policy violation fails the run.
// Locally it uses the `playwright` package; in CI `playwright-core` with the runner's Google Chrome.
import {createServer} from 'node:http';
import {readFileSync, existsSync, statSync} from 'node:fs';
import {createRequire} from 'node:module';
import {deflateRawSync, gzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {join, extname, normalize} from 'node:path';

const require = createRequire(import.meta.url);
let pw; for (const m of ['playwright-core', 'playwright']) { try { pw = require(m); break; } catch (e) {} }
if (!pw) { console.error('✗ playwright-core or playwright is needed: npm install --no-save playwright-core'); process.exit(1); }
const root = fileURLToPath(new URL('..', import.meta.url));

// --- fictional files served or uploaded during the run
const html = readFileSync(join(root, 'index.html'), 'utf8');
const SAMPLE = /const SAMPLE=`([\s\S]*?)`/.exec(html)[1];
function crc32(b) { let c, crc = ~0; for (let i = 0; i < b.length; i++) { c = (crc ^ b[i]) & 255; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xEDB88320 : c >>> 1; crc = (crc >>> 8) ^ c; } return ~crc >>> 0; }
function zip(files) {
  const parts = [], cd = []; let off = 0;
  for (const [name, text] of Object.entries(files)) {
    const nb = Buffer.from(name), raw = Buffer.from(text), def = deflateRawSync(raw), h = Buffer.alloc(30), c = Buffer.alloc(46);
    h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(8, 8); h.writeUInt32LE(crc32(raw), 14); h.writeUInt32LE(def.length, 18); h.writeUInt32LE(raw.length, 22); h.writeUInt16LE(nb.length, 26);
    parts.push(h, nb, def);
    c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(8, 10); c.writeUInt32LE(crc32(raw), 16); c.writeUInt32LE(def.length, 20); c.writeUInt32LE(raw.length, 24); c.writeUInt16LE(nb.length, 28); c.writeUInt32LE(off, 42);
    cd.push(c, nb); off += 30 + nb.length + def.length;
  }
  const cdb = Buffer.concat(cd), e = Buffer.alloc(22), n = Object.keys(files).length;
  e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(n, 8); e.writeUInt16LE(n, 10); e.writeUInt32LE(cdb.length, 12); e.writeUInt32LE(off, 16);
  return Buffer.concat([...parts, cdb, e]);
}
const cell = (r, v, t, s) => '<c r="' + r + '"' + (t ? ' t="' + t + '"' : '') + (s ? ' s="' + s + '"' : '') + '><v>' + v + '</v></c>';
const strs = ['id', 'given', 'surname', 'sex', 'birth_date', 'birth_place', 'father_id', 'A1', 'Anne', 'Testard', 'F', 'Florac, Lozère, France', 'A2', 'Paul', 'M', 'Mende, Lozère, France @44.518,3.501'];
const XLSX = zip({
  'xl/sharedStrings.xml': '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' + strs.map(s => '<si><t>' + s + '</t></si>').join('') + '</sst>',
  'xl/styles.xml': '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cellXfs><xf numFmtId="0"/><xf numFmtId="14"/></cellXfs></styleSheet>',
  'xl/workbook.xml': '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><workbookPr/></workbook>',
  'xl/worksheets/sheet1.xml': '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1">' + [0, 1, 2, 3, 4, 5, 6].map((i, k) => cell('ABCDEFG'[k] + '1', i, 's')).join('') + '</row>'
    + '<row r="2">' + cell('A2', 7, 's') + cell('B2', 8, 's') + cell('C2', 9, 's') + cell('D2', 10, 's') + cell('E2', 14000, null, 1) + cell('F2', 11, 's') + cell('G2', 12, 's') + '</row>'
    + '<row r="3">' + cell('A3', 12, 's') + cell('B3', 13, 's') + cell('C3', 9, 's') + cell('D3', 14, 's') + cell('E3', 1905) + cell('F3', 15, 's') + '</row></sheetData></worksheet>'});
const oc = v => '<table:table-cell office:value-type="string"><text:p>' + v + '</text:p></table:table-cell>';
const ODS = zip({'content.xml': '<?xml version="1.0"?><office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"><office:body><office:spreadsheet><table:table table:name="S"><table:table-row>'
  + ['id', 'prenom', 'nom', 'sexe', 'naissance_date', 'naissance_lieu', 'pere_id'].map(oc).join('') + '</table:table-row><table:table-row>' + oc('B1') + oc('Lise') + oc('Odsart') + oc('F')
  + '<table:table-cell office:value-type="date" office:date-value="1931-04-02"><text:p>02/04/1931</text:p></table:table-cell>' + oc('Mende, Lozère, France') + oc('B2') + '</table:table-row><table:table-row>' + oc('B2') + oc('Jean') + oc('Odsart') + oc('M') + oc('vers 1900') + '</table:table-row></table:table></office:spreadsheet></office:body></office:document-content>'});
const GDZ = zip({'gedcom.ged': SAMPLE.replace('1 CHAR UTF-8', '1 GEDC\n2 VERS 7.0')});
const CSV = readFileSync(join(root, 'template.csv'));
const GRAMPS_XML = `<?xml version="1.0" encoding="UTF-8"?>
<database xmlns="http://gramps-project.org/xml/1.7.1/">
<events>
<event handle="_e1" id="E1"><type>Birth</type><dateval val="1871-01-20"/><place hlink="_p1"/></event>
<event handle="_e2" id="E2"><type>Death</type><dateval val="1940"/><place hlink="_p2"/></event>
<event handle="_e3" id="E3"><type>Birth</type><dateval val="1876" quality="estimated"/><place hlink="_p2"/></event>
<event handle="_e4" id="E4"><type>Marriage</type><dateval val="1898"/><place hlink="_p2"/></event>
<event handle="_e5" id="E5"><type>Birth</type><dateval val="1902-10-11"/><place hlink="_p2"/></event>
</events>
<people>
<person handle="_i1" id="I1"><gender>M</gender><name type="Birth Name"><first>Firmin</first><surname>Vernhet</surname></name><eventref hlink="_e1" role="Primary"/><eventref hlink="_e2" role="Primary"/><parentin hlink="_f1"/></person>
<person handle="_i2" id="I2"><gender>F</gender><name type="Birth Name"><first>Léonie</first><surname>Pagès</surname></name><eventref hlink="_e3" role="Primary"/><parentin hlink="_f1"/></person>
<person handle="_i3" id="I3"><gender>M</gender><name type="Birth Name"><first>Augustin</first><surname>Vernhet</surname></name><eventref hlink="_e5" role="Primary"/><childof hlink="_f1"/></person>
</people>
<families>
<family handle="_f1" id="F1"><rel type="Married"/><father hlink="_i1"/><mother hlink="_i2"/><eventref hlink="_e4" role="Family"/><childref hlink="_i3"/></family>
</families>
<places>
<placeobj handle="_p1" id="P1" type="City"><pname value="Florac"/><coord long="3.594" lat="44.326"/><placeref hlink="_p3"/></placeobj>
<placeobj handle="_p2" id="P2" type="City"><pname value="Alès"/><coord long="E4°4'52&quot;" lat="N44°7'30&quot;"/><placeref hlink="_p4"/></placeobj>
<placeobj handle="_p3" id="P3" type="Department"><pname value="Lozère"/><placeref hlink="_p5"/></placeobj>
<placeobj handle="_p4" id="P4" type="Department"><pname value="Gard"/><placeref hlink="_p5"/></placeobj>
<placeobj handle="_p5" id="P5" type="Country"><pname value="France"/></placeobj>
</places>
</database>`;
const tar = (name, data) => { const h = Buffer.alloc(512); h.write(name, 0); h.write('0000644\0', 100); h.write(data.length.toString(8).padStart(11, '0') + '\0', 124); h.write('ustar', 257); return Buffer.concat([h, data, Buffer.alloc((512 - data.length % 512) % 512), Buffer.alloc(1024)]); };
const GRAMPS = gzipSync(Buffer.from(GRAMPS_XML)), GPKG = gzipSync(tar('data.gramps', GRAMPS));
const GW = Buffer.from(`encoding: utf-8
gwplus

fam VERNHET Baptiste 1838 #bp Florac,_Lozère,_France 1904 +1867 #mp Florac,_Lozère,_France AGULHON Victoire 1845 1899
beg
- h Firmin 20/1/1871 #bp Florac,_Lozère,_France 1940 #dp Alès,_Gard,_France
end
`);
const BIG = execFileSync(process.execPath, [join(root, 'tools/make-big-tree.mjs'), '20000'], {maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore']});

// --- a small static server for this folder; /test-tree.ged is a published fictional tree
const types = {'.html': 'text/html; charset=utf-8', '.json': 'application/json', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.csv': 'text/csv'};
const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path === '/test-tree.ged') { res.writeHead(200, {'content-type': 'text/plain; charset=utf-8'}); res.end(SAMPLE); return; }
  const file = normalize(join(root, path === '/' ? 'index.html' : path));
  if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {'content-type': types[extname(file)] || 'application/octet-stream'}); res.end(readFileSync(file));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = 'http://127.0.0.1:' + server.address().port + '/';

let browser;
for (const opt of process.env.CI ? [{channel: 'chrome'}, {}] : [{}, {channel: 'chrome'}]) { try { browser = await pw.chromium.launch(opt); break; } catch (e) {} }
if (!browser) { console.error('✗ no Chromium or Chrome could be started'); server.close(); process.exit(1); }

const failures = []; let count = 0;
const check = (cond, msg) => { count++; if (!cond) failures.push(msg); };
async function page(query, opt) {
  const p = await browser.newPage({viewport: {width: 1300, height: 800}, ...(opt || {})});
  p.errors = [];
  p.on('console', m => { if (m.type() === 'error') p.errors.push(m.text()); });
  p.on('pageerror', e => p.errors.push(e.message));
  await p.goto(base + 'index.html' + (query || ''));
  await p.waitForFunction(() => typeof S !== 'undefined' && S.persons.size > 0);
  await p.waitForTimeout(400);
  return p;
}
const done = async (p, label) => { check(!p.errors.length, label + ': console or page errors: ' + p.errors.slice(0, 3).join(' | ')); await p.close(); };
const step = async (label, fn) => { const t = Date.now(); try { await fn(); } catch (e) { failures.push(label + ': ' + e.message.split('\n')[0]); } console.log((Date.now() - t + ' ms').padStart(8), label); };

await step('every language loads without errors or untranslated labels', async () => {
  for (const l of ['fr', 'en', 'de', 'it', 'es', 'pt', 'nl', 'lb']) {
    const p = await page('?lang=' + l);
    const r = await p.evaluate(() => ({lang: LANG, n: S.persons.size, raw: [...document.querySelectorAll('[data-i]')].filter(e => e.textContent === e.dataset.i).map(e => e.dataset.i), title: document.title}));
    check(r.lang === l && r.n === 14 && r.title === 'GenealoMap', l + ': page did not start on the fictional example');
    check(!r.raw.length, l + ': untranslated labels ' + r.raw.join(','));
    await done(p, l);
  }
});

await step('playback, map click, search and person sheet', async () => {
  const p = await page('?lang=fr&year=1880');
  const y0 = await p.evaluate(() => S.year);
  await p.click('#play'); await p.waitForTimeout(1200);
  const y1 = await p.evaluate(() => S.year); check(y1 > y0, 'playback did not advance the year');
  await p.click('#play');
  const c = await p.evaluate(() => { setYear(1936, 2); fitAll(true); paint(); const c = S.clusters[0]; return c && {x: c.x, y: c.y}; });
  const box = await p.locator('#map').boundingBox();
  if (c) { await p.mouse.click(box.x + c.x, box.y + c.y); await p.waitForTimeout(200); }
  check(await p.evaluate(() => S.sel.type === 'place' || S.sel.type === 'cluster'), 'clicking a marker does not open the place');
  await p.fill('#q', 'firmin'); await p.click('#qres button[data-p]');
  check((await p.textContent('#panel h2')) === 'Firmin VERNHET', 'search does not open the person sheet');
  await p.evaluate(() => { setPlaying(true); selectPerson('@I4@', false); });
  check(await p.evaluate(() => !S.playing), 'opening a person does not pause playback');
  await p.keyboard.press('Escape'); check(await p.evaluate(() => S.sel.type === 'year'), 'Esc does not close the sheet');
  await done(p, 'playback');
});

await step('reference person removed and restored', async () => {
  const p = await page('?lang=fr');
  await p.click('#refchip'); check(await p.evaluate(() => S.ref === null && /Aucune/.test($('#refchip').textContent)), 'reference not removed');
  await p.click('#refchip'); check(await p.evaluate(() => S.ref === '@I1@'), 'reference not restored');
  await done(p, 'reference');
});

await step('tree view: charts, moving up and down', async () => {
  const p = await page('?lang=fr&view=tree&year=1936');
  await p.click('#trMode button[data-m=d]'); await p.evaluate(() => selectPerson('@I4@', false));
  check(await p.evaluate(() => document.querySelector('#treebody .root b').textContent) === 'Augustin VERNHET', 'descendants chart not on the selected person');
  await p.click('#treebody .trnav button[data-p="@I7@"]');
  check(await p.evaluate(() => document.querySelector('#treebody .root b').textContent) === 'Firmin VERNHET', 'cannot move up to a parent');
  await p.click('#trMode button[data-m=t]'); check(await p.locator('#treebody .nd').count() > 1, 'contemporaries chart is empty');
  await p.evaluate(() => selectPerson('@I4@', false)); await p.click('#trMode button[data-m=h]');
  check(await p.locator('#treebody .hg .tv.up .root').count() === 1 && await p.locator('#treebody .hgd .nd').count() >= 2, 'hourglass lacks ancestors or descendants');
  await p.selectOption('#trDir', 'h'); check(await p.locator('#treebody .hgh .th.rev .nd').count() >= 2, 'horizontal hourglass lacks descendants');
  await p.click('#trMode button[data-m=f]'); check(await p.locator('#treebody svg.fan g.fs').count() >= 7, 'fan chart not drawn');
  await p.locator('#treebody g[data-p="@I7@"]').click(); check(await p.evaluate(() => tree.rootId) === '@I7@', 'a fan sector does not open the person');
  await p.emulateMedia({media: 'print'});
  check(await p.evaluate(() => getComputedStyle($('#map')).display === 'none' && getComputedStyle($('#panel')).display === 'none' && getComputedStyle($('#tree')).position === 'static'), 'print layout does not show the tree alone');
  await p.emulateMedia({media: 'screen'});
  await done(p, 'tree');
});

await step('files: CSV, Excel, OpenDocument, GEDCOM 7 package, Gramps, GeneWeb', async () => {
  const p = await page('?lang=fr');
  for (const [name, buf, n] of [['t.csv', CSV, 6], ['t.xlsx', XLSX, 2], ['t.ods', ODS, 2], ['t.gdz', GDZ, 14], ['t.gramps', GRAMPS, 3], ['t.gpkg', GPKG, 3], ['t.xml', Buffer.from(GRAMPS_XML), 3], ['t.gw', GW, 3]]) {
    await p.setInputFiles('#file', {name, mimeType: 'application/octet-stream', buffer: buf});
    await p.waitForFunction(f => S.fileName === f, name);
    check(await p.evaluate(() => S.persons.size) === n, name + ': wrong number of people');
    if (/gramps|gpkg|xml/.test(name)) check(await p.evaluate(() => { const Q = S.places.get('Alès, Gard, France'); return Q && Q.q === 'gedcom' && Math.abs(Q.lat - 44.125) < 1e-3 && [...S.persons.values()].some(p => p.name === 'Augustin VERNHET' && p.b === 1902); }), name + ': places, coordinates or dates not read');
  }
  await done(p, 'files');
});

await step('published tree hides people presumed living', async () => {
  const p = await page('?lang=fr&file=test-tree.ged&year=2000');
  await p.waitForFunction(() => pub.on);
  const r = await p.evaluate(() => ({names: yearData(2000).living.map(x => x.name), chip: $('#refchip').textContent, stored: localStorage.getItem('cg.ged')}));
  check(!r.names.includes('Camille VERNHET') && !/Camille/.test(r.chip), 'a living person is visible in a published tree');
  check(!r.stored, 'a published tree was stored in the browser');
  await done(p, 'published');
});

await step('historical borders, export, keyboard', async () => {
  const p = await page('?lang=fr&year=1905');
  await p.waitForFunction(() => /1900/.test($('#histnote').textContent), null, {timeout: 10000});
  const [dl] = await Promise.all([p.waitForEvent('download'), p.evaluate(() => $('#shImg').click())]);
  check(/\.png$/.test(dl.suggestedFilename()), 'image export did not produce a PNG');
  await p.focus('#map'); await p.keyboard.press('PageDown'); await p.keyboard.press('Enter');
  check(await p.evaluate(() => S.sel.type !== 'year'), 'keyboard cannot open a place on the map');
  await done(p, 'borders');
});

await step('installable, and works offline once visited', async () => {
  const ctx = await browser.newContext({viewport: {width: 1300, height: 800}});
  const p = await ctx.newPage(); p.errors = []; p.on('pageerror', e => p.errors.push(e.message));
  await p.goto(base + 'index.html?lang=fr');
  await p.evaluate(() => navigator.serviceWorker.ready);
  await p.waitForFunction(async () => { const c = await caches.open('genealomap-1'); return !!(await c.match('world.json')) && !!(await c.match('hist/1900.json')); }, null, {timeout: 30000});
  check(await p.evaluate(() => fetch('app/manifest.webmanifest').then(r => r.json()).then(m => m.icons.length >= 2 && m.start_url === '../')), 'manifest not served');
  await ctx.setOffline(true);
  await p.reload(); await p.waitForFunction(() => typeof S !== 'undefined' && S.persons.size === 14 && S.world, null, {timeout: 15000});
  await p.evaluate(() => setYear(1836, 2)); await p.waitForFunction(() => /1815/.test($('#histnote').textContent), null, {timeout: 10000});
  check(await p.evaluate(() => /enregistrée|saved/.test($('#offMsg').textContent)), 'offline status not shown');
  check(!p.errors.length, 'offline: page errors: ' + p.errors.join(' | '));
  await ctx.close();
});

await step('large fictional tree (20,000 people) plays smoothly', async () => {
  const p = await page('?lang=fr');
  await p.setInputFiles('#file', {name: 'big.ged', mimeType: 'text/plain', buffer: BIG});
  await p.waitForFunction(() => S.persons.size === 20000, null, {timeout: 120000});
  const r = await p.evaluate(async () => {
    setYear(1750, 2); await new Promise(r => setTimeout(r, 300));
    const long = []; const po = new PerformanceObserver(l => { for (const e of l.getEntries()) long.push(e.duration); }); po.observe({type: 'longtask'});
    $('#speed').value = '15'; const y0 = S.year; setPlaying(true); await new Promise(r => setTimeout(r, 3000)); setPlaying(false); po.disconnect();
    return {years: S.year - y0, worst: Math.max(0, ...long)};
  });
  check(r.years >= 30, 'playback too slow on a large tree: ' + r.years + ' years in 3 s');
  check(r.worst < 1000, 'a single step took ' + Math.round(r.worst) + ' ms on a large tree');
  await done(p, 'large tree');
});

await browser.close(); server.close();
if (failures.length) { console.error(failures.map(f => '✗ ' + f).join('\n')); console.error(`\n${failures.length} of ${count} checks failed`); process.exit(1); }
console.log(`browser run OK (${count} checks)`);
