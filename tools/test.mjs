// Tests for index.html, run by CI after check.mjs. No dependency: `node tools/test.mjs`.
// The page's own script is loaded in a sandbox with a stand-in for the browser, then questioned:
//   1. every language has every interface text and every kinship term;
//   2. kinship titles match tools/kinship-expected.txt in all languages (rule: kinship must be true).
//      After a deliberate change of vocabulary, review the difference and run `node tools/test.mjs --update`;
//   3. blood relationships are consistent both ways on a fictional family, marriage never replaces blood;
//   4. dates, tables and the published-tree mode (living people hidden) behave as documented.
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = /<script>([\s\S]*?)<\/script>/.exec(html)[1];

// A stand-in that accepts anything: enough for the page to start without a screen.
const blank = new Proxy(function () {}, {
  get: (t, k) => k === Symbol.toPrimitive ? () => '' : k === 'then' ? undefined : k === Symbol.iterator ? function* () {} : blank,
  apply: () => blank, construct: () => blank, set: () => true,
});
const els = new Map();
const el = sel => { if (!els.has(sel)) { const own = {}; els.set(sel, new Proxy(function () {}, { get: (t, k) => k in own ? own[k] : blank[k] ?? blank, set: (t, k, v) => { own[k] = v; return true; }, apply: () => blank })); } return els.get(sel); };
function sandbox(search) {
  els.clear();
  const ctx = {
    document: {querySelector: el, querySelectorAll: () => [], documentElement: el(':root'), createElement: () => blank, addEventListener() {}, body: blank, activeElement: null},
    window: {addEventListener() {}, devicePixelRatio: 1}, location: {search: search || '', hash: ''}, navigator: {language: 'en'},
    localStorage: {getItem: () => null, setItem() {}, removeItem() {}, key: () => null, length: 0},
    matchMedia: () => ({matches: false, addEventListener() {}}), getComputedStyle: () => ({getPropertyValue: () => ''}),
    requestAnimationFrame: () => 0, cancelAnimationFrame() {}, MutationObserver: class { observe() {} }, Path2D: class { addPath() {} moveTo() {} lineTo() {} closePath() {} }, Image: class {},
    fetch: () => Promise.reject(new Error('no network in tests')), performance, URLSearchParams, URL, Intl, TextDecoder, Blob, console, setTimeout, Promise,
  };
  ctx.globalThis = ctx;
  el('#anon').checked = false; el('#tint').value = ''; el('#route').value = 'person'; el('#tpl').value = ''; el('#speed').value = '6'; el('#speed').options = [];
  el('#follow').checked = false; el('#lines').checked = false; el('#shLiving').checked = true;
  vm.runInNewContext(script + '\n;globalThis.T={S,loose,gazAdd,resolvePlaces,gwToGed,degOf,treeEra,L,LANGS,KIN,term,kin,titleOf,blood,loadGed,SAMPLE,parseDate,csvDate,csvToGed,rowsToGed,yearData,routeOf,tint,histYear,pub,P,setLang:l=>{LANG=l;S.kinCache.clear()}};', ctx);
  return ctx.T;
}

const T = sandbox('');
const errors = [];
const ok = (cond, msg) => { if (!cond) errors.push(msg); };
const eq = (a, b, msg) => ok(a === b, `${msg}: got "${a}", expected "${b}"`);
const langs = Object.keys(T.LANGS);

// 1. completeness
for (const l of langs) {
  ok(T.L[l], `L has no entry for ${l}`); ok(T.KIN[l], `KIN has no entry for ${l}`);
  if (!T.L[l] || !T.KIN[l]) continue;
  for (const k of Object.keys(T.L.en)) ok(T.L[l][k] != null, `L.${l}.${k} is missing`);
  for (const k of Object.keys(T.L[l])) ok(T.L.en[k] != null, `L.${l}.${k} exists but not in English`);
  ok(T.L[l].cats.length === 10, `L.${l}.cats must have 10 entries`);
  for (const k of Object.keys(T.L.en.ev)) ok(T.L[l].ev[k], `L.${l}.ev.${k} is missing`);
  for (const k of ['anc', 'desc', 'sib', 'uncle', 'nephew', 'cousin', 'older', 'younger', 'title', 'spouse', 'stepParent', 'childIn', 'sibIn', 'parentIn', 'byMarriage', 'spouseOf', 'spouseSide', 'also', 'self', 'none', 'sosa'])
    ok(T.KIN[l][k] != null, `KIN.${l}.${k} is missing`);
  for (const k of Object.keys(T.L.en)) if (typeof T.L.en[k] === 'string') {
    const want = (T.L.en[k].match(/\{\d\}/g) || []).sort().join(), got = (T.L[l][k].match(/\{\d\}/g) || []).sort().join();
    ok([...new Set(want.split(','))].join() === [...new Set(got.split(','))].join(), `L.${l}.${k} does not use the same {n} slots as English`);
    ok(T.L.en[k].includes('|') === T.L[l][k].includes('|'), `L.${l}.${k}: singular|plural form differs from English`);
  }
}

// 2. kinship titles, all languages. du = generations from the reference person up to the common ancestor, dx = from the other person.
const cases = [];
for (const [du, dx] of [[1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [9, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 9], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [8, 1], [1, 2], [1, 3], [1, 4], [1, 6], [2, 2], [3, 3], [4, 4], [6, 6], [3, 2], [4, 2], [4, 3], [2, 3], [2, 4], [3, 4]])
  for (const sex of ['M', 'F']) cases.push([du, dx, sex, {aSex: 'F', cSex: 'F', upSex: 'M', half: false}]);
cases.push([2, 0, 'U', undefined], [1, 1, 'M', {aSex: 'U', cSex: 'U', upSex: 'U', half: true}], [1, 1, 'F', {aSex: 'U', cSex: 'U', upSex: 'U', half: true}], [3, 2, 'M', {aSex: 'M', cSex: 'U', upSex: 'M'}], [3, 2, 'F', {aSex: 'U', cSex: 'U', upSex: 'U'}], [2, 3, 'M', {aSex: 'U', cSex: 'M', upSex: 'U'}]);
const lines = [];
for (const l of langs) {
  T.setLang(l); const K = T.KIN[l];
  for (const [du, dx, sex, c] of cases) lines.push(`${l} ${du}/${dx} ${sex}${c && c.half ? ' half' : ''}${c ? ' ' + c.aSex + c.cSex : ''} = ${T.term(du, dx, sex, c)}`);
  for (const s of ['M', 'F']) lines.push(`${l} spouse ${s} = ${K.spouse(s)}`, `${l} step-parent ${s} = ${K.stepParent(s)}`, `${l} child-in-law ${s} = ${K.childIn(s)}`, `${l} sibling-in-law ${s} = ${K.sibIn(s)}`, `${l} parent-in-law ${s} = ${K.parentIn(s)}`,
    `${l} uncle by marriage ${s} = ${K.byMarriage(T.term(2, 1, s), s, T.term(2, 1, s === 'M' ? 'F' : 'M'), s === 'M' ? 'F' : 'M')}`);
  lines.push(`${l} title = ${K.title(T.term(2, 0, 'F'), 'Camille')}`, `${l} spouse of = ${K.spouseOf('F', 'Julien VERNHET', T.term(2, 1, 'M'))}`, `${l} spouse side = ${K.spouseSide(T.term(2, 2, 'F'), 'Rose MALAVAL')}`,
    `${l} also = ${K.also(K.spouse('F'), T.term(2, 2, 'F'))}`, `${l} self = ${K.self}`, `${l} none = ${K.none}`, `${l} sosa = ${K.sosa(12)}`);
}
const goldFile = new URL('kinship-expected.txt', import.meta.url);
const head = '# Expected kinship titles, checked by tools/test.mjs. Each line: language, generations up from the reference person / up from the other person,\n# sex of the other person, context = title. Review any change by hand before running: node tools/test.mjs --update\n';
if (process.argv.includes('--update') || !existsSync(goldFile)) { writeFileSync(goldFile, head + lines.join('\n') + '\n'); console.log(`kinship-expected.txt written (${lines.length} titles)`); }
else {
  const gold = readFileSync(goldFile, 'utf8').split('\n').filter(x => x && !x.startsWith('#'));
  const have = new Map(lines.map(x => [x.slice(0, x.indexOf(' = ')), x]));
  for (const g of gold) { const k = g.slice(0, g.indexOf(' = ')); if (!have.has(k)) errors.push(`kinship: case no longer produced: ${k}`); else if (have.get(k) !== g) errors.push(`kinship changed: expected "${g}" but the page gives "${have.get(k).slice(k.length + 3)}"`); have.delete(k); }
  for (const k of have.keys()) errors.push(`kinship: new case not in kinship-expected.txt: ${k} (run --update after review)`);
}

// 3. a fictional family: grandparents G1+G2, children A (m. X) and B (m. Y), cousins C (of A) and D (of B) who marry each other and have E; H is A's half-brother.
const fam = `0 HEAD
0 @G1@ INDI
1 NAME Jean /Test/
1 SEX M
1 BIRT
2 DATE 1800
1 DEAT
2 DATE 1870
1 FAMS @F0@
1 FAMS @F9@
0 @G2@ INDI
1 NAME Marie /Essai/
1 SEX F
1 BIRT
2 DATE 1802
1 DEAT
2 DATE 1860
1 FAMS @F0@
0 @G3@ INDI
1 NAME Anne /Autre/
1 SEX F
1 BIRT
2 DATE 1805
1 DEAT
2 DATE 1880
1 FAMS @F9@
0 @A@ INDI
1 NAME Paul /Test/
1 SEX M
1 BIRT
2 DATE 1825
1 DEAT
2 DATE 1890
1 FAMC @F0@
1 FAMS @F1@
0 @X@ INDI
1 NAME Lise /Dehors/
1 SEX F
1 BIRT
2 DATE 1828
1 DEAT
2 DATE 1895
1 FAMS @F1@
1 FAMC @FX@
0 @XP@ INDI
1 NAME Marc /Dehors/
1 SEX M
1 BIRT
2 DATE 1795
1 DEAT
2 DATE 1860
1 FAMS @FX@
1 FAMC @FXG@
0 @XB@ INDI
1 NAME Remi /Dehors/
1 SEX M
1 BIRT
2 DATE 1830
1 DEAT
2 DATE 1890
1 FAMC @FX@
0 @XG@ INDI
1 NAME Yves /Dehors/
1 SEX M
1 BIRT
2 DATE 1765
1 DEAT
2 DATE 1830
1 FAMS @FXG@
0 @B@ INDI
1 NAME Rose /Test/
1 SEX F
1 BIRT
2 DATE 1827
1 DEAT
2 DATE 1899
1 FAMC @F0@
1 FAMS @F2@
0 @Y@ INDI
1 NAME Louis /Venu/
1 SEX M
1 BIRT
2 DATE 1824
1 DEAT
2 DATE 1888
1 FAMS @F2@
0 @H@ INDI
1 NAME Luc /Test/
1 SEX M
1 BIRT
2 DATE 1840
1 DEAT
2 DATE 1900
1 FAMC @F9@
0 @C@ INDI
1 NAME Henri /Test/
1 SEX M
1 BIRT
2 DATE 1850
1 DEAT
2 DATE 1920
1 FAMC @F1@
1 FAMS @F3@
0 @D@ INDI
1 NAME Jeanne /Venu/
1 SEX F
1 BIRT
2 DATE 1853
1 DEAT
2 DATE 1925
1 FAMC @F2@
1 FAMS @F3@
0 @E@ INDI
1 NAME Zoe /Test/
1 SEX F
1 BIRT
2 DATE 1990
1 FAMC @F3@
0 @FX@ FAM
1 HUSB @XP@
1 CHIL @X@
1 CHIL @XB@
0 @FXG@ FAM
1 HUSB @XG@
1 CHIL @XP@
0 @F0@ FAM
1 HUSB @G1@
1 WIFE @G2@
1 CHIL @A@
1 CHIL @B@
0 @F9@ FAM
1 HUSB @G1@
1 WIFE @G3@
1 CHIL @H@
0 @F1@ FAM
1 HUSB @A@
1 WIFE @X@
1 CHIL @C@
0 @F2@ FAM
1 HUSB @Y@
1 WIFE @B@
1 CHIL @D@
0 @F3@ FAM
1 HUSB @C@
1 WIFE @D@
1 CHIL @E@
0 TRLR`;
T.loadGed(fam, 'test', false); T.setLang('fr');
const lab = (a, b) => T.kin(a, b).label;
eq(lab('@C@', '@G1@'), 'grand-père', 'grandfather');
eq(lab('@A@', '@B@'), 'sœur', 'sister');
eq(lab('@A@', '@H@'), 'demi-frère', 'half-brother');
eq(lab('@C@', '@B@'), 'tante', 'aunt');
eq(lab('@B@', '@C@'), 'neveu', 'nephew');
eq(lab('@C@', '@D@'), 'épouse (et cousine germaine)', 'wife who is also a first cousin: blood is kept, marriage is added');
eq(T.kin('@C@', '@D@').cat, 'blood', 'a spouse who is a cousin stays a blood relative');
eq(lab('@C@', '@Y@'), 'oncle par alliance', 'uncle by marriage');
eq(T.kin('@C@', '@Y@').cat, 'ally', 'an uncle by marriage is not a blood relative');
eq(lab('@A@', '@X@'), 'épouse', 'wife');
eq(lab('@X@', '@G1@'), 'beau-père', 'father-in-law');
eq(lab('@G1@', '@X@'), 'belle-fille', 'daughter-in-law');
eq(lab('@X@', '@B@'), 'belle-sœur', 'sister-in-law');
eq(lab('@E@', '@H@'), 'grand-oncle', 'great-uncle (half-brother of a grandparent)');
eq(lab('@X@', '@G3@'), 'sans lien de parenté connu', 'no invented relationship');
// relatives of the spouse of a blood relative: named through that relative, never left as "no known relationship"
eq(lab('@G1@', '@X@'), 'belle-fille', 'daughter-in-law');
eq(lab('@G1@', '@XP@'), 'beau-père de Paul TEST (fils)', 'father of a son\'s wife');
eq(lab('@G1@', '@XB@'), 'beau-frère de Paul TEST (fils)', 'brother of a son\'s wife');
eq(lab('@G1@', '@XG@'), 'grand-père de Lise DEHORS (épouse de Paul TEST (fils))', 'grandfather of a son\'s wife');
eq(T.kin('@G1@', '@XP@').cat, 'ally', 'a relative of a spouse is by marriage, not by blood');
eq(lab('@H@', '@XP@'), 'beau-père de Paul TEST (demi-frère)', 'father-in-law of a half-brother');
eq(lab('@XG@', '@G1@'), 'beau-père de Lise DEHORS (petite-fille)', 'the same link seen from the other family');
const ids = [...T.S.persons.keys()];
for (const a of ids) for (const b of ids) { if (a === b) continue; const x = T.blood(a, b), y = T.blood(b, a); ok(!x === !y, `blood(${a},${b}) and blood(${b},${a}) disagree`); if (x && y) ok(x.du === y.dx && x.dx === y.du, `generations between ${a} and ${b} are not mirrored`); const k = T.kin(a, b); ok(!x || k.cat === 'direct' || k.cat === 'blood', `${a}/${b}: a blood relationship is shown as "${k.cat}"`); ok(x || k.cat === 'ally' || k.cat === 'none', `${a}/${b}: no common ancestor but shown as "${k.cat}"`); }
// lines of the reference person E: father's side through C, mother's side through D; G1 is on both
T.S.ref = '@E@'; els.get('#tint').value = 'branch';
eq(T.tint('@X@'), 'pat', 'paternal line'); eq(T.tint('@A@'), 'both', 'the parents are cousins: their common family is on both lines'); eq(T.tint('@Y@'), 'mat', 'maternal line'); eq(T.tint('@G1@'), 'both', 'ancestor on both lines'); eq(T.tint('@G3@'), 'ally', 'unrelated person');
els.get('#tint').value = '';

// 4. dates, tables, routes, published tree
const d = T.parseDate('ABT 14 MAR 1802'); ok(d && d.y === 1802 && d.m === 3 && d.d === 14 && d.q === '~', 'parseDate ABT 14 MAR 1802');
ok(T.parseDate('BEF 1850').q === '<' && T.parseDate('AFT 1850').q === '>' && T.parseDate('') === null, 'parseDate qualifiers');
eq(T.csvDate('1968-03-14'), '14 MAR 1968', 'csvDate ISO'); eq(T.csvDate('~1802'), 'ABT 1802', 'csvDate about'); eq(T.csvDate('14/03/1968'), '14 MAR 1968', 'csvDate day first');
const ged = T.csvToGed('id;prenom;nom;sexe;naissance_date;pere_id\nP1;Ann;Test;F;1850;P2\nP2;Bob;Test;M;1820;\n');
ok(ged && /0 @P1@ INDI/.test(ged) && /1 FAMC @F1@/.test(ged) && /1 HUSB @P2@/.test(ged), 'CSV table with French headers and semicolons becomes GEDCOM');
ok(T.csvToGed('just some text\nwithout columns') === null, 'a text that is not a table is refused');
ok(T.histYear(1836) === 1815 && T.histYear(1500) === 1500 && T.histYear(1400) === 1500 && T.histYear(2020) === 0, 'reference date of historical borders');
T.loadGed(T.SAMPLE, 'sample', true);
const r = T.routeOf('@I7@', 'person').map(s => s.y + ' ' + s.k.split(',')[0]).join(' > ');
eq(r, '1871 Florac > 1898 Alès', 'route of a person follows dated, located events');
ok(T.routeOf('@I2@', 'pat')[0].k.startsWith('Florac'), 'route of a paternal line starts with the oldest ancestor');
// tree of contemporaries: follows the year
const era = y => { T.S.year = y; const n = {c: 0}; const h = T.treeEra(T.P('@I1@'), 6, n); return [...h.matchAll(/data-p="([^"]+)"/g)].map(m => m[1]).join(' '); };
eq(era(1936), '@I7@ @I4@ @I6@ @I2@', 'in 1936 the tree starts from the oldest living ancestor and holds the living family only');
eq(era(1880), '@I12@ @I10@ @I7@ @I14@', 'in 1880 it has moved up: a dead parent appears only to link the living brother and sister');
eq(era(2000), '@I4@ @I6@ @I2@ @I1@', 'in 2000 the reference person appears with her living father and aunt');
ok(T.yearData(2000).living.some(p => p.id === '@I1@'), 'a living person is shown in an ordinary tree');
const P2 = sandbox('?file=tree.ged'); P2.pub.on = true; P2.loadGed(P2.SAMPLE, 'tree.ged', false);
ok(P2.P('@I1@').hid === true && !P2.P('@I7@').hid, 'published tree: people presumed living are marked hidden');
ok(!P2.yearData(2000).living.some(p => p.hid), 'published tree: hidden people are not in the year view');
ok(![...P2.S.events.values()].flat().some(e => e.p === '@I1@'), 'published tree: no event of a hidden person in the text version');
ok(!/Camille/.test(P2.titleOf('@I2@').text), 'published tree: the name of a hidden reference person is not used in titles');
// GeneWeb file (fictional Vernhet family): people, families, places, notes and events read
const GW = `encoding: utf-8
gwplus

fam VERNHET Jean ~1802 #bp Florac,_Lozère,_France 1866 #dp Florac,_Lozère,_France +1836 #mp Florac,_Lozère,_France COMBES Marguerite 1809 #bp Mende,_Lozère,_France 1871 #dp Florac,_Lozère,_France
beg
- h Baptiste 1838 #bp Florac,_Lozère,_France 1904 #dp Florac,_Lozère,_France
- f Zélie 1841 #bp Florac,_Lozère,_France 1920 #dp Mende,_Lozère,_France
end

fam VERNHET Baptiste +1867 #mp Florac,_Lozère,_France AGULHON Victoire 1845 1899
beg
- h Firmin 20/1/1871 #bp Florac,_Lozère,_France #occu Mineur 1940 #dp Alès,_Gard,_France
end

notes VERNHET Firmin
beg
Mineur à Alès.
end notes

pevt VERNHET Firmin
#resi 1898 #p Alès,_Gard,_France
end pevt
`;
const gw = T.gwToGed(GW);
ok(/1 NAME Firmin \/VERNHET\//.test(gw) && /2 DATE 20 JAN 1871/.test(gw) && /2 DATE ABT 1802/.test(gw) && /1 RESI\n2 DATE 1898\n2 PLAC Alès, Gard, France/.test(gw) && /1 NOTE Mineur à Alès\./.test(gw) && /1 OCCU Mineur/.test(gw), 'GeneWeb: people, dates, places, notes and events');
T.loadGed(gw, 'test.gw', false);
const byName = n => [...T.S.persons.values()].find(p => p.name === n).id;
eq(T.S.persons.size, 6, 'GeneWeb: six people'); eq(T.S.fams.size, 2, 'GeneWeb: two families');
T.setLang('fr'); eq(T.kin(byName('Firmin VERNHET'), byName('Jean VERNHET')).label, 'grand-père', 'GeneWeb: grandfather link read through two families');
eq(T.kin(byName('Firmin VERNHET'), byName('Zélie VERNHET')).label, 'tante', 'GeneWeb: aunt (child listed between beg and end)');
ok(Math.abs(T.degOf('N44°7\'30"') - 44.125) < 1e-6 && Math.abs(T.degOf('W73.588') + 73.588) < 1e-9 && Math.abs(T.degOf('-3,5') + 3.5) < 1e-9, 'coordinates in degrees-minutes-seconds and decimals');

// old or faulty spellings of places: matched loosely, inside the country only, and always flagged approximate
eq(T.loose('Mallroy'), T.loose('Malroy'), 'loose spelling: doubled letters and y/i'); eq(T.loose('Mets'), T.loose('Metz'), 'loose spelling: silent final letters');
eq(T.loose('Saint-Julien'), T.loose('St Julien'), 'loose spelling: saint / st'); ok(T.loose('Metz') !== T.loose('Nancy'), 'loose spelling keeps different places apart');
T.S.gaz = [['Malroy', 'FR', 49.17, 6.21, 500, ''], ['Thionville', 'FR', 49.36, 6.16, 40000, 'Diedenhofen'], ['Malroy', 'BE', 50.6, 4.4, 300, '']];
T.S.gazIndex = new Map(); T.S.gazGrid = new Map(); T.S.gazLoose = new Map(); T.gazAdd(0);
T.loadGed('0 HEAD\n0 @A@ INDI\n1 NAME Ann /Test/\n1 BIRT\n2 DATE 1850\n2 PLAC Mallroy, Moselle, France\n1 DEAT\n2 DATE 1900\n2 PLAC Diedenhofen, Moselle, France\n0 TRLR', 'loose', false);
T.resolvePlaces();
const Qm = T.S.places.get('Mallroy, Moselle, France'), Qd = T.S.places.get('Diedenhofen, Moselle, France');
ok(Qm && Qm.q === 'approx' && Math.abs(Qm.lat - 49.17) < .01, 'an old spelling is placed, flagged approximate, in its own country');
ok(Qd && Qd.q === 'exact' && Math.abs(Qd.lat - 49.36) < .01, 'an old name listed in the gazetteer is placed exactly');
T.S.gaz = null;

// no reference person: no title, neutral colours, and a tree of everybody alive that year
T.loadGed(T.SAMPLE, 'sample', true); T.S.ref = null;
eq(T.titleOf('@I4@').text, '', 'no reference: no kinship title'); eq(T.titleOf('@I4@').cat, 'ally', 'no reference: neutral category');
eq(T.tint('@I4@'), 'ally', 'no reference: neutral colour'); eq(T.kin(null, '@I4@').label, '', 'kin() without a reference gives no label');
const eraAll = y => { T.S.year = y; return [...T.treeEra(null, 6, {c: 0}).matchAll(/data-p="([^"]+)"/g)].map(m => m[1]).join(' '); };
eq(eraAll(1936), '@I7@ @I4@ @I6@ @I2@', 'no reference, 1936: the living family of the year, each person once');
eq(eraAll(1916), '@I12@ @I10@ @I7@ @I9@ @I4@ @I14@', 'no reference, 1916: one tree, nobody twice (a dead ancestor links two living branches)');
eq(eraAll(1810), '@I12@', 'no reference, 1810: the only person alive');
ok(eraAll(1700) === '', 'no reference, 1700: nobody, no failure');
T.S.ref = '@I1@';
ok(sandbox('?file=../secret.ged').pub.name === '' && sandbox('?file=https://x.org/a.ged').pub.name === '' && sandbox('?file=tree.ged').pub.name === 'tree.ged', 'published file must be a bare name in the same folder');
const P3 = sandbox('?file=tree.ged&living=1'); P3.pub.on = true; P3.loadGed(P3.SAMPLE, 'tree.ged', false);
ok(!P3.P('@I1@').hid, 'published tree with living=1 shows everyone');

if (errors.length) { console.error(errors.map(e => '✗ ' + e).join('\n')); console.error(`\n${errors.length} failure(s)`); process.exit(1); }
console.log(`tests OK (${langs.length} languages, ${lines.length} kinship titles)`);
