// Builds the regions layer from Natural Earth (public domain), 1:10m first-level subdivisions:
//   hist/regions/<CC>.json   today's subdivisions of a country (départements, provinces, Länder, states, ...)
//   hist/regions/index.json  the countries present, with their bounding box (the page loads a country only when it is on screen)
//   hist/regions/hist.json   dated historical regions defined in tools/hist-regions.txt as unions of today's subdivisions
// No dependency. Usage:
//   node tools/build-regions.mjs                 downloads ne_10m_admin_1_states_provinces.geojson
//   node tools/build-regions.mjs <file.geojson>  reads a local copy
// Format of a country file: {"f":[{"n":["local","fr","de","it","es","pt","nl"],"c":"FR-57","k":[lon,lat],"a":area,"p":[rings]}]}
// Rings use the encoding of world.json and hist/<year>.json (hundredths of a degree, delta-encoded).
import {readFileSync, writeFileSync, mkdirSync, rmSync} from 'node:fs';

const SRC = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson';
const text = process.argv[2] ? readFileSync(process.argv[2], 'utf8') : await (await fetch(SRC)).text();
const feats = JSON.parse(text).features;
const out = new URL('../hist/regions/', import.meta.url);
rmSync(out, {recursive: true, force: true}); mkdirSync(out, {recursive: true});

// Douglas-Peucker in degrees
function simplify(pts, tol) {
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1; const st = [[0, pts.length - 1]];
  while (st.length) {
    const [a, b] = st.pop(); let md = 0, mi = -1; const [x1, y1] = pts[a], [x2, y2] = pts[b], dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy;
    for (let i = a + 1; i < b; i++) { const [x, y] = pts[i]; let t = L ? ((x - x1) * dx + (y - y1) * dy) / L : 0; t = Math.max(0, Math.min(1, t)); const ex = x1 + t * dx - x, ey = y1 + t * dy - y, d = ex * ex + ey * ey; if (d > md) { md = d; mi = i; } }
    if (mi > 0 && md > tol * tol) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
const area = r => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] - r[i][0]) * (r[j][1] + r[i][1]); return a / 2; };
const inside = (p, r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > p[1]) !== (r[j][1] > p[1]) && p[0] < (r[j][0] - r[i][0]) * (p[1] - r[i][1]) / (r[j][1] - r[i][1]) + r[i][0]) c = !c; return c; };
function labelPoint(r) {
  let a = 0, x = 0, y = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const f = r[j][0] * r[i][1] - r[i][0] * r[j][1]; a += f; x += (r[j][0] + r[i][0]) * f; y += (r[j][1] + r[i][1]) * f; }
  const c = a ? [x / (3 * a), y / (3 * a)] : r[0]; if (inside(c, r)) return c;
  const xs = []; for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > c[1]) !== (r[j][1] > c[1])) xs.push((r[j][0] - r[i][0]) * (c[1] - r[i][1]) / (r[j][1] - r[i][1]) + r[i][0]);
  xs.sort((p, q) => p - q); let best = null; for (let i = 0; i + 1 < xs.length; i += 2) if (!best || xs[i + 1] - xs[i] > best[1] - best[0]) best = [xs[i], xs[i + 1]];
  return best ? [(best[0] + best[1]) / 2, c[1]] : c;
}
const enc = ring => { const flat = []; let px = 0, py = 0; for (const [x, y] of ring) { const X = Math.round(x * 100), Y = Math.round(y * 100); if (flat.length && X === px && Y === py) continue; flat.push(X - px, Y - py); px = X; py = Y; } return flat; };
const polys = g => !g ? [] : g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
const clean = s => String(s || '').replace(/^(Département|Kanton|Provinz|Region|Woiwodschaft|Bezirk|Distrikt|Gouvernement|Grafschaft) /, '').trim();
const TOL = 0.015;

const byCC = new Map(), byCode = new Map();
for (const f of feats) {
  const p = f.properties, cc = p.iso_a2; byCode.set(p.iso_3166_2, f);
  if (!/^[A-Z]{2}$/.test(cc || '')) continue;
  const rings = []; let big = null, bigA = 0;
  for (const poly of polys(f.geometry)) poly.forEach((ring, ri) => {
    const s = simplify(ring, TOL); if (s.length < 4) return; const a = Math.abs(area(s)); if (a < 1e-4) return;
    if (ri === 0 && a > bigA) { bigA = a; big = s; } rings.push(enc(s));
  });
  if (!rings.length || !big) continue;
  const k = labelPoint(big), n = [p.name, ...['fr', 'de', 'it', 'es', 'pt', 'nl'].map(l => clean(p['name_' + l]))].map(x => clean(x) || clean(p.name));
  (byCC.get(cc) || byCC.set(cc, []).get(cc)).push({n, c: p.iso_3166_2, k: [+k[0].toFixed(2), +k[1].toFixed(2)], a: +bigA.toFixed(2), p: rings, box: polys(f.geometry).flat(2)});
}
const index = {};
let total = 0;
for (const [cc, list] of [...byCC].sort()) {
  if (list.length < 2) continue;  // a country with a single subdivision has nothing to show
  let x0 = 180, y0 = 90, x1 = -180, y1 = -90;
  for (const r of list) { for (const [x, y] of r.box) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } delete r.box; }
  const json = JSON.stringify({f: list}); writeFileSync(new URL(cc + '.json', out), json); total += json.length;
  index[cc] = [+x0.toFixed(1), +y0.toFixed(1), +x1.toFixed(1), +y1.toFixed(1)];
}
writeFileSync(new URL('index.json', out), JSON.stringify(index));

// Historical regions: union of today's subdivisions. The outline keeps only the edges that are not shared by two members.
const H = [];
for (const line of readFileSync(new URL('hist-regions.txt', import.meta.url), 'utf8').split('\n')) {
  if (!line.trim() || line.startsWith('#')) continue;
  const c = line.split('|').map(x => x.trim()); if (c.length !== 11) throw new Error('hist-regions.txt: bad line: ' + line);
  const [y0, y1, codes, ...names] = c, members = codes.split(/\s+/).map(code => { const f = byCode.get(code); if (!f) throw new Error('unknown subdivision ' + code); return f; });
  const key = ([x, y]) => Math.round(x * 1e5) + ',' + Math.round(y * 1e5), seg = new Map(), fill = []; let big = null, bigA = 0;
  for (const f of members) for (const poly of polys(f.geometry)) poly.forEach((ring, ri) => {
    const s = simplify(ring, TOL); if (s.length >= 4) { fill.push(enc(s)); const a = Math.abs(area(s)); if (ri === 0 && a > bigA) { bigA = a; big = s; } }
    for (let i = 0; i + 1 < ring.length; i++) { const a = key(ring[i]), b = key(ring[i + 1]), k = a < b ? a + '|' + b : b + '|' + a; seg.set(k, seg.has(k) ? null : [ring[i], ring[i + 1]]); }
  });
  // chain the remaining edges into lines, then simplify them
  const next = new Map(); for (const s of seg.values()) if (s) { for (const [p, q] of [[s[0], s[1]], [s[1], s[0]]]) (next.get(key(p)) || next.set(key(p), []).get(key(p))).push(q); }
  const used = new Set(), lines = [];
  for (const [k0, outs] of next) for (const q0 of outs) {
    const e0 = k0 < key(q0) ? k0 + '|' + key(q0) : key(q0) + '|' + k0; if (used.has(e0)) continue; used.add(e0);
    const pts = [k0.split(',').map(v => +v / 1e5), q0]; let cur = q0;
    for (;;) { const nx = (next.get(key(cur)) || []).find(q => { const e = key(cur) < key(q) ? key(cur) + '|' + key(q) : key(q) + '|' + key(cur); return !used.has(e); }); if (!nx) break; const e = key(cur) < key(nx) ? key(cur) + '|' + key(nx) : key(nx) + '|' + key(cur); used.add(e); pts.push(nx); cur = nx; }
    const s = simplify(pts, TOL); if (s.length >= 2) lines.push(enc(s));
  }
  const k = labelPoint(big);
  H.push({y0: +y0, y1: +y1, n: names, c: codes, k: [+k[0].toFixed(2), +k[1].toFixed(2)], fill, line: lines});
}
writeFileSync(new URL('hist.json', out), JSON.stringify({langs: ['en', 'fr', 'de', 'it', 'es', 'pt', 'nl', 'lb'], r: H}));
console.log(`${Object.keys(index).length} countries, ${Math.round(total / 1024)} KB; ${H.length} historical regions`);
