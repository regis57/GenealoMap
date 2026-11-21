// Builds hist/<year>.json (historical borders) from the "historical-basemaps" project of André Ourednik (GPL-3.0).
// No dependency. Usage:
//   node tools/build-hist.mjs            downloads the snapshots listed below
//   node tools/build-hist.mjs <folder>   reads world_<year>.geojson from a local folder
// Output format, one file per snapshot - same ring encoding as world.json:
//   {"y":1815,"f":[{"n":"France","s":"France","b":3,"k":[lon,lat],"p":[[x0,y0,dx,dy,...],...]},...]}
//   n name (absent: land without a recorded polity), s power it was subject to (only when different from n),
//   b border precision given by the source (1 approximate, 2 moderately precise, 3 set by international law),
//   k label point, p rings in hundredths of a degree, delta-encoded.
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';

export const YEARS = [1500, 1530, 1600, 1650, 1700, 1715, 1783, 1800, 1815, 1880, 1900, 1914, 1920, 1930, 1938, 1945, 1960, 1994, 2000, 2010];
const SRC = 'https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/';
const dir = process.argv[2];
const out = new URL('../hist/', import.meta.url);
mkdirSync(out, {recursive: true});

const area = r => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] - r[i][0]) * (r[j][1] + r[i][1]); return a / 2; };
function centroid(r) {
  let a = 0, x = 0, y = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const f = r[j][0] * r[i][1] - r[i][0] * r[j][1]; a += f; x += (r[j][0] + r[i][0]) * f; y += (r[j][1] + r[i][1]) * f; }
  if (!a) return r[0];
  return [x / (3 * a), y / (3 * a)];
}
const inside = (p, r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > p[1]) !== (r[j][1] > p[1]) && p[0] < (r[j][0] - r[i][0]) * (p[1] - r[i][1]) / (r[j][1] - r[i][1]) + r[i][0]) c = !c; return c; };
// Label point: centroid of the largest ring, moved to the middle of the widest land span on its latitude when it falls outside.
function labelPoint(r) {
  let c = centroid(r);
  if (inside(c, r)) return c;
  const xs = [];
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > c[1]) !== (r[j][1] > c[1])) xs.push((r[j][0] - r[i][0]) * (c[1] - r[i][1]) / (r[j][1] - r[i][1]) + r[i][0]);
  xs.sort((a, b) => a - b);
  let best = null;
  for (let i = 0; i + 1 < xs.length; i += 2) if (!best || xs[i + 1] - xs[i] > best[1] - best[0]) best = [xs[i], xs[i + 1]];
  return best ? [(best[0] + best[1]) / 2, c[1]] : c;
}

let total = 0;
for (const y of YEARS) {
  const name = `world_${y}.geojson`;
  const text = dir ? readFileSync(`${dir}/${name}`, 'utf8') : await (await fetch(SRC + name)).text();
  const feats = [];
  for (const f of JSON.parse(text).features) {
    if (!f.geometry) continue;
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [];
    const rings = []; let big = null, bigA = 0;
    for (const poly of polys) poly.forEach((ring, ri) => {
      const q = [];
      for (const [lo, la] of ring) { const X = Math.round(Math.max(-180, Math.min(180, lo)) * 100), Y = Math.round(Math.max(-90, Math.min(90, la)) * 100); const n = q.length; if (!n || q[n - 1][0] !== X || q[n - 1][1] !== Y) q.push([X, Y]); }
      if (q.length > 1 && q[0][0] === q[q.length - 1][0] && q[0][1] === q[q.length - 1][1]) q.pop();
      if (q.length < 3) return;
      const a = Math.abs(area(q));
      if (a < 2) return; // smaller than about 1 km²: invisible at this precision
      if (ri === 0 && a > bigA) { bigA = a; big = q; }
      const flat = []; let px = 0, py = 0;
      for (const [X, Y] of q) { flat.push(X - px, Y - py); px = X; py = Y; }
      rings.push(flat);
    });
    if (!rings.length || !big) continue;
    const p = f.properties || {}, o = {};
    const nm = (p.NAME || '').trim(), sub = (p.SUBJECTO || '').trim();
    if (nm) o.n = nm;
    if (sub && sub !== nm) o.s = sub;
    if (p.BORDERPRECISION) o.b = +p.BORDERPRECISION;
    const k = labelPoint(big); o.k = [+(k[0] / 100).toFixed(2), +(k[1] / 100).toFixed(2)];
    o.a = Math.round(bigA / 1e4); // size of the largest ring in square degrees, used to decide which labels fit
    o.p = rings;
    feats.push(o);
  }
  const json = JSON.stringify({y, f: feats});
  writeFileSync(new URL(`${y}.json`, out), json);
  total += json.length;
  console.log(`${y}: ${feats.length} territories, ${Math.round(json.length / 1024)} KB`);
}
console.log(`total ${Math.round(total / 1024)} KB`);
