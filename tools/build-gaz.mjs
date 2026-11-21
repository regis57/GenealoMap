// Builds the finer gazetteer gaz/<CC>.json (hamlets, small and vanished villages) from the GeoNames country files (CC BY 4.0).
// No dependency. Usage:
//   node tools/build-gaz.mjs FR LU BE            downloads FR.zip, LU.zip, BE.zip from download.geonames.org
//   node tools/build-gaz.mjs --from <folder> FR  reads <folder>/FR.txt (or FR.zip) instead
// Each output file is a list of [name, lat, lon] or [name, lat, lon, "other|names"]; gaz/index.json lists the countries present.
// Only populated places (feature class P) that gaz.json does not already hold are kept; abandoned, destroyed and
// historical places (PPLQ, PPLW, PPLH) are included on purpose: they are what old records mention.
import {readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync} from 'node:fs';
import {inflateRawSync} from 'node:zlib';

const args = process.argv.slice(2);
let from = null;
if (args[0] === '--from') { from = args[1]; args.splice(0, 2); }
const codes = args.map(a => a.toUpperCase()).filter(a => /^[A-Z]{2}$/.test(a));
if (!codes.length) { console.error('usage: node tools/build-gaz.mjs [--from folder] CC [CC...]'); process.exit(1); }
const out = new URL('../gaz/', import.meta.url);
mkdirSync(out, {recursive: true});

const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[-'’.]/g, ' ').replace(/\bsainte\b/g, 'ste').replace(/\bsaint\b/g, 'st').replace(/\s+/g, ' ').trim();
const base = JSON.parse(readFileSync(new URL('../gaz.json', import.meta.url), 'utf8'));

function unzipOne(buf, want) {
  let i = buf.length - 22;
  while (i >= 0 && buf.readUInt32LE(i) !== 0x06054b50) i--;
  if (i < 0) throw new Error('not a zip file');
  let n = buf.readUInt16LE(i + 10), off = buf.readUInt32LE(i + 16);
  for (; n > 0; n--) {
    const method = buf.readUInt16LE(off + 10), size = buf.readUInt32LE(off + 20), nl = buf.readUInt16LE(off + 28), el = buf.readUInt16LE(off + 30), cl = buf.readUInt16LE(off + 32), lo = buf.readUInt32LE(off + 42);
    const name = buf.toString('utf8', off + 46, off + 46 + nl); off += 46 + nl + el + cl;
    if (name !== want) continue;
    const at = lo + 30 + buf.readUInt16LE(lo + 26) + buf.readUInt16LE(lo + 28), raw = buf.subarray(at, at + size);
    return (method === 0 ? raw : inflateRawSync(raw)).toString('utf8');
  }
  throw new Error(want + ' not found in the archive');
}
async function source(cc) {
  if (from) {
    if (existsSync(`${from}/${cc}.txt`)) return readFileSync(`${from}/${cc}.txt`, 'utf8');
    return unzipOne(readFileSync(`${from}/${cc}.zip`), cc + '.txt');
  }
  const r = await fetch(`https://download.geonames.org/export/dump/${cc}.zip`);
  if (!r.ok) throw new Error(`download of ${cc}.zip failed: ${r.status}`);
  return unzipOne(Buffer.from(await r.arrayBuffer()), cc + '.txt');
}

for (const cc of codes) {
  // what gaz.json already knows in this country: same name within about 3 km is a duplicate
  const known = new Map();
  for (const c of base) if (c[1] === cc) { const k = norm(c[0]); (known.get(k) || known.set(k, []).get(k)).push(c); }
  const rows = [], seen = new Set();
  for (const line of (await source(cc)).split('\n')) {
    const f = line.split('\t');
    if (f.length < 15 || f[6] !== 'P') continue;
    const name = f[1].trim(), lat = +(+f[4]).toFixed(3), lon = +(+f[5]).toFixed(3);
    if (!name || !isFinite(lat) || !isFinite(lon)) continue;
    const k = norm(name);
    if ((known.get(k) || []).some(c => Math.abs(c[2] - lat) < .03 && Math.abs(c[3] - lon) < .04)) continue;
    const id = k + '|' + lat.toFixed(2) + '|' + lon.toFixed(2);
    if (seen.has(id)) continue; seen.add(id);
    // other names: Latin script only, different once normalised, a handful at most
    const alts = [];
    for (const a of f[3].split(',')) { const t = a.trim(); if (!t || t.length > 40 || /[^\u0000-ɏḀ-ỿ]/.test(t) || /^https?:/i.test(t)) continue; const n = norm(t); if (n && n !== k && !alts.some(x => norm(x) === n)) alts.push(t); if (alts.length >= 4) break; }
    rows.push(alts.length ? [name, lat, lon, alts.join('|')] : [name, lat, lon]);
  }
  rows.sort((a, b) => a[0].localeCompare(b[0]));
  const json = '[\n' + rows.map(r => JSON.stringify(r)).join(',\n') + '\n]\n';
  writeFileSync(new URL(`${cc}.json`, out), json);
  console.log(`${cc}: ${rows.length} places, ${Math.round(json.length / 1024)} KB`);
}
const list = readdirSync(out).filter(f => /^[A-Z]{2}\.json$/.test(f)).map(f => f.slice(0, 2)).sort();
writeFileSync(new URL('index.json', out), JSON.stringify(list) + '\n');
console.log('gaz/index.json:', list.join(' '));
