// Writes a large FICTIONAL family tree (GEDCOM) to test speed: node tools/make-big-tree.mjs 30000 > /tmp/big.ged
// Names are drawn from short lists and towns from gaz.json; nobody in it exists. Never commit its output.
import {readFileSync} from 'node:fs';
const N = +(process.argv[2] || 20000);
let seed = 42; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const pick = a => a[Math.floor(rnd() * a.length)];
const GIVEN_M = ['Jean', 'Pierre', 'Louis', 'Joseph', 'François', 'Nicolas', 'Michel', 'Antoine', 'Jacques', 'Paul', 'Henri', 'Émile', 'Firmin', 'Baptiste', 'Augustin', 'Julien'];
const GIVEN_F = ['Marie', 'Anne', 'Catherine', 'Marguerite', 'Jeanne', 'Rose', 'Louise', 'Madeleine', 'Élise', 'Zélie', 'Victoire', 'Léonie', 'Hélène', 'Camille', 'Marthe', 'Lucie'];
const SUR = Array.from({length: 600}, (_, i) => ['Vern', 'Mal', 'Agul', 'Comb', 'Pag', 'Roux', 'Dur', 'Mart', 'Bern', 'Fab', 'Gir', 'Laur'][i % 12] + ['het', 'aval', 'hon', 'es', 'ès', 'ard', 'and', 'in', 'ot', 're', 'aud', 'ent'][Math.floor(i / 12) % 12] + (i >= 144 ? ['', 'e', 'y', 'oux', 'ier'][Math.floor(i / 144)] : ''));
const gaz = JSON.parse(readFileSync(new URL('../gaz.json', import.meta.url), 'utf8')).filter(c => ['FR', 'DE', 'IT', 'BE', 'CH', 'LU', 'CA', 'US', 'DZ'].includes(c[1]) && c[4] > 20);
const towns = Array.from({length: 1500}, () => pick(gaz));
const country = {FR: 'France', DE: 'Deutschland', IT: 'Italia', BE: 'Belgique', CH: 'Suisse', LU: 'Luxembourg', CA: 'Canada', US: 'USA', DZ: 'Algérie'};
const place = t => t[0] + ', ' + country[t[1]];
const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const date = y => (rnd() < .6 ? (1 + Math.floor(rnd() * 28)) + ' ' + pick(MON) + ' ' : '') + y;
const P = [], F = [];
const person = (sex, sur, b, home, famc) => { const p = {id: 'I' + (P.length + 1), sex, given: pick(sex === 'M' ? GIVEN_M : GIVEN_F), sur, b, home, famc, fams: [], resi: []}; P.push(p); return p; };
let gen = [];
for (let i = 0; i < 150; i++) { const t = pick(towns); gen.push(person(i % 2 ? 'F' : 'M', pick(SUR), 1590 + Math.floor(rnd() * 30), t, null)); }
while (P.length < N) {
  const next = [], single = {M: [], F: []};
  for (const p of gen) if (!p.fams.length) single[p.sex].push(p);
  for (const p of gen) {
    if (P.length >= N) break;
    if (p.fams.length || rnd() < .12) continue;
    const other = p.sex === 'M' ? 'F' : 'M', pool = single[other];
    let s = null; while (pool.length && !s) { const q = pool.splice(Math.floor(rnd() * pool.length), 1)[0]; if (!q.fams.length && q !== p) s = q; }
    if (!s) s = person(other, pick(SUR), p.b - 3 + Math.floor(rnd() * 7), pick(towns), null);
    const h = p.sex === 'M' ? p : s, w = p.sex === 'M' ? s : p;
    const f = {id: 'F' + (F.length + 1), h, w, y: Math.max(h.b, w.b) + 20 + Math.floor(rnd() * 8), ch: []}; F.push(f); h.fams.push(f); w.fams.push(f);
    let home = rnd() < .15 ? pick(towns) : h.home; const n = 1 + Math.floor(rnd() * 5);
    for (let k = 0; k < n && P.length < N; k++) { const y = f.y + 1 + k * 2 + Math.floor(rnd() * 2); if (y > 2020) break; if (rnd() < .08) home = pick(towns); const c = person(rnd() < .5 ? 'M' : 'F', h.sur, y, home, f); f.ch.push(c); next.push(c); if (rnd() < .3) c.resi.push([y + 20 + Math.floor(rnd() * 15), pick(towns)]); }
  }
  if (!next.length) break; gen = next;
}
const out = ['0 HEAD', '1 SOUR MAKE-BIG-TREE', '1 CHAR UTF-8'];
for (const p of P) {
  out.push('0 @' + p.id + '@ INDI', '1 NAME ' + p.given + ' /' + p.sur.toUpperCase() + '/', '1 SEX ' + p.sex, '1 BIRT', '2 DATE ' + date(p.b), '2 PLAC ' + place(p.home));
  for (const [y, t] of p.resi) out.push('1 RESI', '2 DATE ' + y, '2 PLAC ' + place(t));
  const d = p.b + 30 + Math.floor(rnd() * 60); if (d < 2024) out.push('1 DEAT', '2 DATE ' + date(d), '2 PLAC ' + place(p.resi.length ? p.resi[p.resi.length - 1][1] : p.home));
  if (p.famc) out.push('1 FAMC @' + p.famc.id + '@'); for (const f of p.fams) out.push('1 FAMS @' + f.id + '@');
}
for (const f of F) { out.push('0 @' + f.id + '@ FAM', '1 HUSB @' + f.h.id + '@', '1 WIFE @' + f.w.id + '@', '1 MARR', '2 DATE ' + f.y, '2 PLAC ' + place(f.h.home)); for (const c of f.ch) out.push('1 CHIL @' + c.id + '@'); }
out.push('0 TRLR');
process.stdout.write(out.join('\n') + '\n');
process.stderr.write(`${P.length} people, ${F.length} families\n`);
