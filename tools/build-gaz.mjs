// Builds the finer gazetteer gaz/<CC>.json (hamlets, small and vanished villages) from the GeoNames country files (CC BY 4.0).
// No dependency. Usage:
//   node tools/build-gaz.mjs FR LU BE            downloads FR.zip, LU.zip, BE.zip from download.geonames.org
//   node tools/build-gaz.mjs --from <folder> FR  reads <folder>/FR.txt (or FR.zip) instead
// Each output file is a list of [name, lat, lon] or [name, lat, lon, "other|names"]; gaz/index.json lists the countries present.
// Only populated places (feature class P) that gaz.json does not already hold are kept; abandoned, destroyed and
// historical places (PPLQ, PPLW, PPLH) are included on purpose: they are what old records mention.
// Other names come from the GeoNames alternate names of the country (alternatenames/<CC>.zip, read from the same folder or
// downloaded): names in the languages of old records (local, French, German, Latin, Occitan, Breton, Alsatian, ...), names
// flagged historic, and the names French communes bore in 1793-1794 (GeoNames code fr_1793). For towns that gaz.json
// already holds, a row is written only to carry such old names ("Diedenhofen" for Thionville).
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
// languages kept for other names; '' = no language given (often the local or an old spelling)
const LANGS = new Set(['', 'fr', 'de', 'it', 'es', 'pt', 'nl', 'lb', 'la', 'oc', 'br', 'ca', 'eu', 'co', 'gsw', 'wa', 'pcd', 'frp', 'fr_1793', 'en', 'pl', 'cs', 'sk', 'hu', 'ro', 'hr', 'sl', 'sv', 'no', 'nb', 'nn', 'da', 'fi', 'lt', 'lv', 'et', 'el', 'uk', 'be', 'ga', 'gd', 'cy']);
const latin = t => !/[^\u0000-\u024F\u1E00-\u1EFF]/.test(t);
async function altNames(cc) {
  let text = null;
  if (from && existsSync(`${from}/alt/${cc}.zip`)) text = unzipOne(readFileSync(`${from}/alt/${cc}.zip`), cc + '.txt');
  else if (!from) { const r = await fetch(`https://download.geonames.org/export/dump/alternatenames/${cc}.zip`); if (r.ok) text = unzipOne(Buffer.from(await r.arrayBuffer()), cc + '.txt'); }
  const m = new Map(); if (!text) return null;
  for (const line of text.split('\n')) {
    const f = line.split('\t'); if (f.length < 4) continue;
    const lang = f[2], hist = f[7] === '1';
    if (!LANGS.has(lang) && !(hist && !/^(post|link|wkdt|unlc|iata|icao|faac|abbr|lauc|uicn|tcid)$/.test(lang))) continue;
    let t = f[3].replace(/\s*\(a\.\s*\d+\)\s*$/, '').trim();
    if (!t || t.length > 40 || !latin(t) || /[,;:]|https?:|^\d|\d{2}/.test(t) || t.split(' ').length > 5) continue;
    (m.get(f[1]) || m.set(f[1], []).get(f[1])).push({t, rank: lang === 'fr_1793' || hist ? 0 : lang === '' ? 1 : 2});
  }
  return m;
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
  const rows = [], seen = new Set(), alt = await altNames(cc);
  for (const line of (await source(cc)).split('\n')) {
    const f = line.split('\t');
    if (f.length < 15 || f[6] !== 'P') continue;
    const name = f[1].trim(), lat = +(+f[4]).toFixed(3), lon = +(+f[5]).toFixed(3);
    if (!name || !isFinite(lat) || !isFinite(lon)) continue;
    const k = norm(name);
    const dup = (known.get(k) || []).find(c => Math.abs(c[2] - lat) < .03 && Math.abs(c[3] - lon) < .04);
    const id = k + '|' + lat.toFixed(2) + '|' + lon.toFixed(2);
    if (seen.has(id)) continue; seen.add(id);
    // other names: old names first (1793, historic), then names without language, then the others; Latin script only, a few at most
    const have = new Set([k, ...(dup && dup[5] ? dup[5].split('|').map(norm) : [])]), alts = [];
    const cand = alt ? (alt.get(f[0]) || []).sort((a, b) => a.rank - b.rank).map(a => a.t) : f[3].split(',').map(a => a.trim()).filter(t => t && t.length <= 40 && latin(t) && !/^https?:/i.test(t));
    for (const t of cand) { const n = norm(t); if (n && !have.has(n)) { have.add(n); alts.push(t); } if (alts.length >= (dup ? 6 : 8)) break; }
    if (dup) { if (alts.length) rows.push([name, lat, lon, alts.join('|')]); continue; }  // a town of gaz.json: only its old names
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
