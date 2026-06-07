/**
 * One-time helper: split expanded-descriptions.js into content/expanded/*.js
 * Run: node scripts/split-expanded-descriptions.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'content', 'expanded');

const expanded = require(path.join(ROOT, 'expanded-descriptions.js'));
const code = fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8');
const sb = {};
vm.createContext(sb);
vm.runInContext(code, sb);
const byId = new Map(sb.baseGraphData.nodes.map((n) => [n.id, n]));

const BUCKET = {
  brand: 'brands.js',
  factory: 'factories.js',
  person: 'people.js',
  company: 'corporate.js'
};

const buckets = {
  'brands.js': {},
  'factories.js': {},
  'people.js': {},
  'corporate.js': {}
};

for (const [id, text] of Object.entries(expanded)) {
  if (id === 'default') continue;
  const node = byId.get(id);
  const type = node ? node.type : 'company';
  const file = BUCKET[type] || 'corporate.js';
  if (buckets[file][id]) {
    console.warn(`Duplicate key skipped in ${file}: ${id}`);
    continue;
  }
  buckets[file][id] = text;
}

fs.mkdirSync(OUT, { recursive: true });

const header = (title) => `/**
 * ${title}
 * Long-form SEO overrides for /node/[id]/ pages.
 * Add entries here; keys must match node id in data.js exactly.
 */
module.exports = `;

for (const [file, entries] of Object.entries(buckets)) {
  const title = file.replace('.js', '');
  const body = JSON.stringify(entries, null, 2)
    .replace(/"([^"]+)": "/g, '"$1": `')
    .replace(/",\n/g, '`,\n')
    .replace(/`\n\}/, '`\n}');
  // JSON.stringify escapes badly for template literals — write properly below
}

// Use JSON for reliability (generator accepts plain strings too)
for (const [file, entries] of Object.entries(buckets)) {
  const title = file.replace('.js', '');
  const lines = [`/**`, ` * ${title} — long-form SEO overrides`, ` */`, 'module.exports = {'];
  for (const [id, text] of Object.entries(entries)) {
    const safe = JSON.stringify(text);
    lines.push(`  ${JSON.stringify(id)}: ${safe},`);
  }
  lines.push('};', '');
  fs.writeFileSync(path.join(OUT, file), lines.join('\n'), 'utf8');
  console.log(`Wrote ${file}: ${Object.keys(entries).length} entries`);
}

// default.js
fs.writeFileSync(
  path.join(OUT, 'default.js'),
  `/** Fallback when no node-specific override exists */\nmodule.exports = ${JSON.stringify(expanded.default || '', null, 2)};\n`,
  'utf8'
);

console.log('Done. Review content/expanded/ then update load-expanded.js');