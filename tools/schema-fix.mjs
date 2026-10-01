// Bulk JSON-LD editor. Dry run by default.
//   node tools/schema-fix.mjs            (dry run, prints counts, writes nothing)
//   node tools/schema-fix.mjs --apply    (writes changed files)
// Every block is parsed before and after a fix. Any parse error aborts with exit 1.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const APPLY = process.argv.includes('--apply');
const SKIP = new Set(['lib', 'node_modules', '.git', 'tools', 'assets']);
const BLOCK_RE = /(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g;
export const BUSINESS_ID = 'https://allseasonslocksmith.com/#business';

// Each fix: { id, label, apply(data, ctx) -> true if it changed data }.
// ctx = { rel } (file path relative to site root). Fixes mutate data in place.
export const FIXES = [];

function* walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!SKIP.has(e.name)) yield* walk(join(dir, e.name));
    } else if (e.name.endsWith('.html')) yield join(dir, e.name);
  }
}

export function* nodes(v) {
  if (Array.isArray(v)) for (const x of v) yield* nodes(x);
  else if (v && typeof v === 'object') {
    yield v;
    for (const x of Object.values(v)) yield* nodes(x);
  }
}

// Keep each block's original style: minified stays minified, pretty keeps its indent.
function serialize(data, original) {
  if (!original.includes('\n')) return JSON.stringify(data);
  const indent = original.match(/\n([ \t]+)\S/)?.[1] ?? '  ';
  const lead = original.match(/^\s*/)[0];
  const trail = original.match(/\s*$/)[0];
  return lead + JSON.stringify(data, null, indent) + trail;
}

function parse(text, where) {
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error(`INVALID JSON-LD in ${where}: ${err.message}`);
    process.exit(1);
  }
}

const counts = Object.fromEntries(FIXES.map((f) => [f.id, new Set()]));
const changedFiles = new Set();

for (const file of walk(root)) {
  const rel = file.slice(root.length + 1);
  const html = readFileSync(file, 'utf8');
  let fileChanged = false;
  const out = html.replace(BLOCK_RE, (whole, open, body, close) => {
    const data = parse(body, rel);
    let blockChanged = false;
    for (const fix of FIXES) {
      if (fix.apply(data, { rel })) {
        counts[fix.id].add(rel);
        blockChanged = true;
      }
    }
    if (!blockChanged) return whole;
    const next = serialize(data, body);
    parse(next, `${rel} (after fix)`);
    fileChanged = true;
    return open + next + close;
  });
  if (fileChanged) {
    changedFiles.add(rel);
    if (APPLY) writeFileSync(file, out);
  }
}

console.log(APPLY ? 'MODE: apply' : 'MODE: dry run (no files written)');
if (!FIXES.length) console.log('No fixes registered.');
for (const f of FIXES) console.log(`${f.id} (${f.label}): ${counts[f.id].size} files`);
console.log(`Total files ${APPLY ? 'changed' : 'that would change'}: ${changedFiles.size}`);
