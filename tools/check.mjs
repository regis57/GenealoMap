// Guard for index.html. No dependency: `node tools/check.mjs` (add --fix to refresh the script fingerprint).
import {readFileSync, writeFileSync} from 'node:fs';
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
  for (const part of ["default-src 'none'", "connect-src 'self'", "form-action 'none'", "base-uri 'none'"])
    if (!csp[1].includes(part)) errors.push(`policy must keep: ${part}`);
  if (/unsafe-eval|script-src[^;]*unsafe-inline|script-src[^;]*https?:/.test(csp[1])) errors.push('policy must not allow eval, inline or remote scripts');
}

// 2. No address outside the short list below may appear anywhere in the page.
const allowed = ['https://github.com/regis57/GeneanoMap', 'https://tile.openstreetmap.org', 'https://example.org/', 'https://buymeacoffee.com/regis57'];
for (const [url] of html.matchAll(/https?:\/\/[^\s"'<>)\\]+/g))
  if (!allowed.some(a => url.startsWith(a))) errors.push(`unexpected address: ${url}`);

// 3. Constructs that have no place in a page that reads private files.
const banned = [[/\beval\s*\(/, 'eval()'], [/\bnew Function\b/, 'new Function'], [/document\.write/, 'document.write'], [/XMLHttpRequest|sendBeacon|WebSocket|EventSource/, 'network API other than fetch'],
  [/\son[a-z]+\s*=\s*["']/i, 'inline event handler attribute'], [/<(iframe|object|embed|form)\b/i, 'iframe/object/embed/form element'], [/document\.cookie/, 'cookies']];
for (const [re, name] of banned) if (re.test(html)) errors.push(`forbidden: ${name}`);
const fetches = [...html.matchAll(/\bfetch\(([^)]*)\)/g)].map(m => m[1].trim());
for (const f of fetches) if (!["'world.json'", "'gaz.json'"].includes(f)) errors.push(`fetch() may only load world.json and gaz.json, found: ${f}`);

// 4. Data files must be valid JSON.
for (const f of ['world.json', 'gaz.json']) {
  try { JSON.parse(readFileSync(new URL('../' + f, import.meta.url), 'utf8')); } catch (e) { errors.push(`${f} is not valid JSON`); }
}

if (errors.length) { console.error(errors.map(e => '✗ ' + e).join('\n')); process.exit(1); }
console.log(`index.html OK (${Math.round(html.length / 1024)} KB, script sha256-${hash})`);
