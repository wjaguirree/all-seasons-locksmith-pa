// Bulk JSON-LD editor. Dry run by default.
//   node tools/schema-fix.mjs            (dry run, prints counts, writes nothing)
//   node tools/schema-fix.mjs --apply    (writes changed files)
// Every block is parsed before and after a fix. Any parse error aborts with exit 1.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const APPLY = process.argv.includes('--apply');
const SKIP = new Set(['lib', 'node_modules', '.git', 'tools', 'assets']);
const BLOCK_RE = /(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g;
export const BUSINESS_ID = 'https://allseasonslocksmith.com/#business';

// Width and height of a .webp file, read from its header (VP8, VP8L, VP8X).
function webpSize(file) {
  const b = readFileSync(file);
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') throw new Error(`not a webp: ${file}`);
  const kind = b.toString('ascii', 12, 16);
  if (kind === 'VP8X') return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
  if (kind === 'VP8L') {
    const v = b.readUInt32LE(21);
    return { width: 1 + (v & 0x3fff), height: 1 + ((v >> 14) & 0x3fff) };
  }
  if (kind === 'VP8 ') return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
  throw new Error(`unknown webp chunk ${kind}: ${file}`);
}

// Each fix: { id, label, apply(data, ctx) -> true if it changed data }.
// ctx = { rel } (file path relative to site root). Fixes mutate data in place.
// Claimed, live profiles (source: knowledge/tracking links logs). Extend as more citations are claimed.
export const SAME_AS = [
  'https://www.thumbtack.com/pa/harrisburg/pro/all-seasons-locksmith/service/588811581116137477',
  'https://www.bark.com/en/us/company/all-seasons-locksmith/j89qMR/',
  'https://www.alignable.com/harrisburg-pa/all-seasons-locksmith',
  'https://www.brownbook.net/business/55400588/all-seasons-locksmith',
  'https://www.hotfrog.com/company/86bb8995b5290e2719aa5c500f7ec524/all-seasons-locksmith/harrisburg/locksmiths',
  'https://www.cylex.us.com/company/all-seasons-locksmith-llc-40707120.html',
  'https://medium.com/@allseasonslocksmith',
];

export const FIXES = [
  {
    id: 'drop-saturday-zero-hours',
    label: 'remove Saturday 00:00-00:00 entry (closed = omitted)',
    apply(data) {
      let changed = false;
      for (const n of nodes(data)) {
        const spec = n.openingHoursSpecification;
        if (!Array.isArray(spec)) continue;
        const keep = spec.filter((h) => !(h.opens === '00:00' && h.closes === '00:00'));
        if (keep.length !== spec.length) {
          n.openingHoursSpecification = keep;
          changed = true;
        }
      }
      return changed;
    },
  },
  {
    id: 'homepage-sameas',
    label: 'homepage business sameAs list',
    apply(data, { rel }) {
      if (rel !== 'index.html') return false;
      let changed = false;
      for (const n of nodes(data)) {
        if (n['@id'] === BUSINESS_ID && n['@type'] === 'Locksmith' && n.address) {
          if (JSON.stringify(n.sameAs) !== JSON.stringify(SAME_AS)) {
            n.sameAs = [...SAME_AS];
            changed = true;
          }
        }
      }
      return changed;
    },
  },
  {
    id: 'blog-image-object',
    label: 'BlogPosting image string -> ImageObject',
    apply(data) {
      let changed = false;
      for (const n of nodes(data)) {
        if (n['@type'] !== 'BlogPosting' || typeof n.image !== 'string') continue;
        const url = new URL(n.image);
        const file = join(root, decodeURIComponent(url.pathname));
        if (!existsSync(file)) {
          console.error(`blog-image-object: image file not found: ${file}`);
          process.exit(1);
        }
        n.image = { '@type': 'ImageObject', url: n.image, ...webpSize(file) };
        changed = true;
      }
      return changed;
    },
  },
  {
    id: 'service-provider-ref',
    label: 'Service.provider -> bare #business reference',
    apply(data) {
      let changed = false;
      for (const n of nodes(data)) {
        const p = n['@type'] === 'Service' ? n.provider : null;
        if (p && p['@id'] === BUSINESS_ID && Object.keys(p).length > 1) {
          n.provider = { '@id': BUSINESS_ID };
          changed = true;
        }
      }
      return changed;
    },
  },
  {
    id: 'entity-type',
    label: '#business @type -> Locksmith',
    apply(data) {
      let changed = false;
      for (const n of nodes(data)) {
        if (n['@id'] === BUSINESS_ID && '@type' in n && n['@type'] !== 'Locksmith') {
          n['@type'] = 'Locksmith';
          changed = true;
        }
      }
      return changed;
    },
  },
  {
    id: 'entity-name',
    label: '#business name -> All Seasons Locksmith',
    apply(data) {
      let changed = false;
      for (const n of nodes(data)) {
        if (
          n['@id'] === BUSINESS_ID &&
          typeof n.name === 'string' &&
          n.name !== 'All Seasons Locksmith'
        ) {
          n.name = 'All Seasons Locksmith';
          changed = true;
        }
      }
      return changed;
    },
  },
];

// Page-level fixes can add whole blocks. apply(html, ctx) -> new html, or null if no change.
export const PAGE_FIXES = [
  {
    id: 'blog-breadcrumb',
    label: 'blog post and index BreadcrumbList',
    apply(html, { rel }) {
      const isIndex = rel === 'blog/index.html';
      if (!isIndex && !/^blog\/[^/]+\/index\.html$/.test(rel)) return null;
      if (hasType(html, 'BreadcrumbList')) return null;
      const home = { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://allseasonslocksmith.com/' };
      const blog = { '@type': 'ListItem', position: 2, name: 'Blog' };
      let items;
      if (isIndex) {
        items = [home, blog];
      } else {
        const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        if (!h1) {
          console.error(`blog-breadcrumb: missing h1 in ${rel}`);
          process.exit(1);
        }
        items = [home, { ...blog, item: 'https://allseasonslocksmith.com/blog/' }, { '@type': 'ListItem', position: 3, name: h1 }];
      }
      return insertBlock(html, { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items });
    },
  },
];

function hasType(html, type) {
  for (const m of html.matchAll(BLOCK_RE)) if (JSON.parse(m[2])['@type'] === type) return true;
  return false;
}

// Pretty block (matches the blog pages' style), placed after the last JSON-LD block, else before </head>.
function insertBlock(html, data) {
  const block = `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n</script>\n`;
  const ends = [...html.matchAll(BLOCK_RE)];
  if (ends.length) {
    const last = ends[ends.length - 1];
    const at = last.index + last[0].length;
    return html.slice(0, at) + '\n' + block.trimEnd() + html.slice(at);
  }
  const head = html.indexOf('</head>');
  if (head === -1) throw new Error('no </head>');
  return html.slice(0, head) + block + html.slice(head);
}

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

const counts = Object.fromEntries([...FIXES, ...PAGE_FIXES].map((f) => [f.id, new Set()]));
const changedFiles = new Set();

for (const file of walk(root)) {
  const rel = file.slice(root.length + 1);
  const html = readFileSync(file, 'utf8');
  let fileChanged = false;
  let out = html.replace(BLOCK_RE, (whole, open, body, close) => {
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
  for (const fix of PAGE_FIXES) {
    const next = fix.apply(out, { rel });
    if (next !== null && next !== out) {
      for (const m of next.matchAll(BLOCK_RE)) parse(m[2], `${rel} (after ${fix.id})`);
      out = next;
      counts[fix.id].add(rel);
      fileChanged = true;
    }
  }
  if (fileChanged) {
    changedFiles.add(rel);
    if (APPLY) writeFileSync(file, out);
  }
}

console.log(APPLY ? 'MODE: apply' : 'MODE: dry run (no files written)');
if (!FIXES.length) console.log('No fixes registered.');
for (const f of [...FIXES, ...PAGE_FIXES]) console.log(`${f.id} (${f.label}): ${counts[f.id].size} files`);
console.log(`Total files ${APPLY ? 'changed' : 'that would change'}: ${changedFiles.size}`);
