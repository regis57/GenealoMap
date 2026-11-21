// Guard for index.html. No dependency: `node tools/check.mjs` (add --fix to refresh the script fingerprint).
import {readFileSync, writeFileSync, existsSync, readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';

const file = new URL('../index.html', import.meta.url);
let html = readFileSync(file, 'utf8');
const errors = [];

// 1. Exactly one inline script, and its fingerprint must be the one allowed by the Content-Security-Policy.
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
if (scripts.length !== 1 || scripts[0][1].trim() !== '') errors.push('index.html must contain exactly one inline <script> with no attribute');
const hash = createHash('sha256').update(scripts[0]?.[2] ?? '', 'utf8').digest('base64');
const csp = /<meta http-equiv="Content-Security-Policy" content="([^"]*)">/.exec(html);
if (!csp) errors.push('Content-Security-Policy meta tag is missing');
else {
  const want = `script-src 'sha256-${hash}'`;
  if (!csp[1].includes(want)) {
    if (process.argv.includes('--fix')) {
      html = html.replace(/script-src 'sha256-[^']*'/, want);
      writeFileSync(file, html);
      console.log('fingerprint updated');
    } else errors.push('script fingerprint in the policy is out of date: run node tools/check.mjs --fix');
  }
  // Same for the single <style> block; style attributes are not allowed at all.
  const styles = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)];
  if (styles.length !== 1) errors.push('index.html must contain exactly one <style> block');
  const wantCss = `style-src 'sha256-${createHash('sha256').update(styles[0]?.[1] ?? '', 'utf8').digest('base64')}'`;
  if (!csp[1].includes(wantCss)) {
    if (process.argv.includes('--fix')) {
      html = html.replace(/style-src 'sha256-[^']*'/, wantCss);
      writeFileSync(file, html);
      console.log('style fingerprint updated');
    } else errors.push('style fingerprint in the policy is out of date: run node tools/check.mjs --fix');
  }
  for (const part of ["default-src 'none'", "connect-src 'self'", "form-action 'none'", "base-uri 'none'"])
    if (!csp[1].includes(part)) errors.push(`policy must keep: ${part}`);
  if (/unsafe-eval|unsafe-inline|script-src[^;]*https?:/.test(csp[1])) errors.push('policy must not allow eval, inline code or remote scripts');
}

// 2. No address outside the short list below may appear anywhere in the page.
const allowed = ['https://github.com/regis57/GenealoMap', 'https://tile.openstreetmap.org', 'https://example.org/', 'https://buymeacoffee.com/regis57'];
for (const [url] of html.matchAll(/https?:\/\/[^\s"'<>)\\]+/g))
  if (!allowed.some(a => url.startsWith(a))) errors.push(`unexpected address: ${url}`);

// 3. Constructs that have no place in a page that reads private files.
const banned = [[/\beval\s*\(/, 'eval()'], [/\bnew Function\b/, 'new Function'], [/document\.write/, 'document.write'], [/XMLHttpRequest|sendBeacon|WebSocket|EventSource/, 'network API other than fetch'],
  [/\son[a-z]+\s*=\s*["']/i, 'inline event handler attribute'], [/<(iframe|object|embed|form)\b/i, 'iframe/object/embed/form element'], [/document\.cookie/, 'cookies'], [/\sstyle\s*=\s*["']/i, 'style attribute (use a class)']];
for (const [re, name] of banned) if (re.test(html)) errors.push(`forbidden: ${name}`);
const fetches = [...html.matchAll(/\bfetch\(([^)]*)\)/g)].map(m => m[1].trim());
// Besides the two base files: historical borders (hist/<year>.json) and the finer gazetteer by country (gaz/index.json, gaz/<CC>.json), all in this folder.
const mayFetch = ["'world.json'", "'gaz.json'", "'hist/'+y+'.json'", "'hist/names.json'", "'gaz/index.json'", "'gaz/'+cc+'.json'", 'pubFile'];
// pubFile is the tree a site owner publishes next to the page: a bare file name (no slash), checked by the pattern in `pub`.
if (!/const pub=\{name:\/\^\[\\w\.\\- \]\{1,80\}\\\./.test(html)) errors.push('the published file name must stay limited to a bare name in the same folder');
for (const f of fetches) if (!mayFetch.includes(f)) errors.push(`fetch() may only load the data files of this folder, found: ${f}`);

// 4. Data files must be valid JSON.
const data = ['world.json', 'gaz.json'];
for (const d of ['hist', 'gaz']) if (existsSync(new URL('../' + d, import.meta.url))) for (const f of readdirSync(new URL('../' + d, import.meta.url))) if (f.endsWith('.json')) data.push(d + '/' + f);
for (const f of data) {
  try { JSON.parse(readFileSync(new URL('../' + f, import.meta.url), 'utf8')); } catch (e) { errors.push(`${f} is not valid JSON`); }
}
// Every snapshot the script may ask for must exist, and the list of fine gazetteers must match the files present.
const years = (/const HIST=\[([\d,]+)\]/.exec(html) || [])[1];
if (!years) errors.push('HIST list of snapshot years not found in the script');
else for (const y of years.split(',')) if (!data.includes(`hist/${y}.json`)) errors.push(`hist/${y}.json is missing (run node tools/build-hist.mjs)`);
try {
  const idx = JSON.parse(readFileSync(new URL('../gaz/index.json', import.meta.url), 'utf8'));
  for (const cc of idx) if (!data.includes(`gaz/${cc}.json`)) errors.push(`gaz/index.json lists ${cc} but gaz/${cc}.json is missing`);
} catch (e) { errors.push('gaz/index.json is missing or invalid'); }

if (errors.length) { console.error(errors.map(e => '✗ ' + e).join('\n')); process.exit(1); }
console.log(`index.html OK (${Math.round(html.length / 1024)} KB, script sha256-${hash})`);
