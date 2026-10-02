// Read-only JSON-LD health check. Usage: node tools/schema-check.mjs
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BUSINESS_ID = 'https://allseasonslocksmith.com/#business';
const SKIP = new Set(['lib', 'node_modules', '.git', 'tools', 'assets']);
const BLOCK_RE = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;

function* walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!SKIP.has(e.name)) yield* walk(join(dir, e.name));
    } else if (e.name.endsWith('.html')) yield join(dir, e.name);
  }
}

function* nodes(v) {
  if (Array.isArray(v)) for (const x of v) yield* nodes(x);
  else if (v && typeof v === 'object') {
    yield v;
    for (const x of Object.values(v)) yield* nodes(x);
  }
}

const count = (m, k) => m.set(k, (m.get(k) || 0) + 1);
const types = new Map();
const names = new Map();
const invalid = [];
const businessFiles = new Set();
const saturdayFiles = new Set();
let files = 0;

for (const file of walk(root)) {
  files++;
  const rel = file.slice(root.length + 1);
  const html = readFileSync(file, 'utf8');
  for (const m of html.matchAll(BLOCK_RE)) {
    let data;
    try {
      data = JSON.parse(m[1]);
    } catch (err) {
      invalid.push(`${rel}: ${err.message}`);
      continue;
    }
    for (const n of nodes(data)) {
      if (n['@id'] === BUSINESS_ID) {
        businessFiles.add(rel);
        count(types, JSON.stringify(n['@type'] ?? null));
        count(names, JSON.stringify(n.name ?? null));
      }
      if (n.opens === '00:00' && n.closes === '00:00') saturdayFiles.add(rel);
    }
  }
}

const show = (m) => [...m].map(([k, v]) => `  ${k}: ${v}`).join('\n') || '  (none)';
console.log(`HTML files scanned: ${files}`);
console.log(`Files referencing #business: ${businessFiles.size}`);
console.log(`#business @type values (per node):\n${show(types)}`);
console.log(`#business name values (per node):\n${show(names)}`);
console.log(`Files with 00:00-00:00 hours entry: ${saturdayFiles.size}`);
console.log(`Invalid JSON-LD blocks: ${invalid.length}`);
invalid.forEach((i) => console.log(`  ${i}`));
process.exit(invalid.length ? 1 : 0);
