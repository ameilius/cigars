/**
 * Audit SEO body content on generated /node/ pages.
 * Run after: node scripts/generate-node-pages.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const code = fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8');
const sb = {};
vm.createContext(sb);
vm.runInContext(code, sb);

const drawer = require(path.join(ROOT, 'descriptions.js'));
const expanded = require(path.join(ROOT, 'content', 'expanded', 'index.js'));
const expandedKeys = new Set(Object.keys(expanded).filter((k) => k !== 'default'));

const links = sb.baseGraphData.links.map((l) => ({
  ...l,
  source: typeof l.source === 'object' ? l.source.id : l.source,
  target: typeof l.target === 'object' ? l.target.id : l.target
}));

function getConn(id) {
  return links.filter((l) => l.source === id || l.target === id).length;
}

function extractBody(html) {
  const start = html.indexOf('class="node-body');
  if (start === -1) return '';
  const open = html.indexOf('>', start);
  const end = html.indexOf('</div>', open);
  if (open === -1 || end === -1) return '';
  return html.slice(open + 1, end).trim();
}

const rows = sb.baseGraphData.nodes.map((n) => {
  const file = path.join(ROOT, 'node', n.id, 'index.html');
  const html = fs.readFileSync(file, 'utf8');
  const body = extractBody(html);
  const plain = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const paras = (body.match(/<p/g) || []).length;
  const hasManual = expandedKeys.has(n.id);
  const short = drawer[n.id];
  const genericShort = !short || short === drawer.default;

  return {
    id: n.id,
    name: n.name,
    chars: plain.length,
    paras,
    hasManual,
    genericShort,
    conn: getConn(n.id),
    prods: (n.productLines || []).length,
    url: `https://cigarnexus.app/node/${n.id}/`
  };
});

const manual = rows.filter((r) => r.hasManual);
const auto = rows.filter((r) => !r.hasManual);
const priority = auto.filter((r) => r.chars < 900).sort((a, b) => a.chars - b.chars);
const medium = auto.filter((r) => r.chars >= 900 && r.chars < 1200).sort((a, b) => a.chars - b.chars);
const solid = auto.filter((r) => r.chars >= 1200).sort((a, b) => a.name.localeCompare(b.name));

console.log(`Total nodes: ${rows.length}`);
console.log(`Manual expanded overrides: ${manual.length}`);
console.log(`Auto-generated only: ${auto.length}`);
console.log('');

console.log(`PRIORITY — add to content/expanded/*.js (${priority.length} pages, <900 chars body):`);
priority.forEach((r) => {
  console.log(`  ${r.chars}ch | ${r.id} | ${r.name} | conn=${r.conn} | ${r.url}`);
});

console.log('');
console.log(`MEDIUM — auto OK but could improve (${medium.length} pages, 900–1199 chars):`);
medium.forEach((r) => {
  console.log(`  ${r.chars}ch | ${r.id} | ${r.name} | ${r.url}`);
});

console.log('');
console.log(`SOLID AUTO — decent without manual override (${solid.length} pages, ≥1200 chars):`);
solid.forEach((r) => {
  console.log(`  ${r.chars}ch | ${r.id} | ${r.name}`);
});