const fs = require('fs');
const path = require('path');
const vm = require('vm');
let dataCode = fs.readFileSync(path.join(__dirname, '../data.js'), 'utf8');
dataCode = dataCode.replace(/^\uFEFF/, '');
const dataSandbox = {};
vm.createContext(dataSandbox);
vm.runInContext(dataCode, dataSandbox);
const baseGraphData = dataSandbox.baseGraphData || {nodes: [], links: []};
let descriptions = {};
try {
  let scriptCode = fs.readFileSync(path.join(__dirname, '../script.js'), 'utf8');
  scriptCode = scriptCode.replace(/^\uFEFF/, '');
  const descMatch = scriptCode.match(/const descriptions = \{[\s\S]*?\n\};/);
  if (descMatch) {
    const descCode = descMatch[0];
    const descSandbox = {};
    vm.createContext(descSandbox);
    vm.runInContext(descCode, descSandbox);
    descriptions = descSandbox.descriptions || {};
  }
} catch(e) { console.warn('Descriptions load skipped, using fallbacks'); }

// Long node page content lives in a dedicated clean data module (easy to edit,
// no more stuffing huge objects into browser script.js or fragile VM extraction).
const expandedDescriptions = require('../expanded-descriptions.js') || {};
function escapeHtml(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function getNodeUrl(node) { return '/node/' + node.id + '/'; }
function buildConnectionsHtml(node, allNodes, allLinks) {
  const connections = allLinks.filter(l => { const s = (l.source.id || l.source); const t = (l.target.id || l.target); return s === node.id || t === node.id; });
  if (!connections.length) return '<p class="text-sm text-[#8b6f5c] italic">No direct connections listed.</p>';
  let html = '<div class="space-y-2 max-w-md">';
  connections.slice(0, 15).forEach(l => {
    const isSource = (l.source.id || l.source) === node.id;
    const otherId = isSource ? (l.target.id || l.target) : (l.source.id || l.source);
    const other = allNodes.find(n => n.id === otherId);
    const otherName = other ? other.name : otherId;
    const rel = escapeHtml(l.type || 'related');
    const dir = isSource ? '→' : '←';
    const url = getNodeUrl({id: otherId});
    // Attractive card matching the live drawer's connection style (Tailwind works via CDN on node pages)
    html += `
      <div class="connection-item flex flex-col gap-1 px-2.5 py-2 rounded-xl bg-white border border-[#d4c4a8] text-xs">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="font-medium text-[10px] px-1.5 py-0.5 rounded bg-[#f4e9d8] text-[#8b6f5c]">${rel}</span>
          <span class="text-[#c5a26f]">${dir}</span>
        </div>
        <a href="${url}" class="font-medium text-[#3f2a2a] hover:text-[#5c2e2e] leading-snug">${escapeHtml(otherName)}</a>
      </div>`;
  });
  html += '</div>';
  return html;
}
function buildProductLinesHtml(node) {
  if (!node.productLines || !node.productLines.length) return '';
  let html = '<div class="text-xs font-semibold text-[#8b6f5c] mb-2.5 tracking-[0.8px] uppercase mt-8">Notable Product Lines</div><div class="flex flex-wrap gap-1.5">';
  node.productLines.forEach(line => {
    html += '<span class="inline-block px-2.5 py-0.5 text-xs rounded-full bg-white border border-[#d4c4a8] text-[#5c2e2e]">' + escapeHtml(line) + '</span>';
  });
  html += '</div>';
  return html;
}
function buildLogoBoxHtml(node) {
  if (!node.logo || !node.logo.trim()) return '';
  const src = '../../' + node.logo;
  const alt = escapeHtml(node.name || node.id) + ' logo';
  return '<div class="node-logo-box"><img src="' + src + '" alt="' + alt + '"></div>';
}
let template = fs.readFileSync(path.join(__dirname, 'node-template.html'), 'utf8');
template = template.replace(/^\uFEFF/, '');
const outputBase = path.join(__dirname, '../node');
if (fs.existsSync(outputBase)) { fs.rmSync(outputBase, { recursive: true, force: true }); }
baseGraphData.nodes.forEach(node => {
  const dir = path.join(outputBase, node.id);
  fs.mkdirSync(dir, { recursive: true });
  const connectionsHtml = buildConnectionsHtml(node, baseGraphData.nodes, baseGraphData.links);
  const productHtml = buildProductLinesHtml(node);
  const logoBoxHtml = buildLogoBoxHtml(node);
  let desc = expandedDescriptions[node.id] || descriptions[node.id];
  if (!desc) {
    const type = node.type || 'entity';
    const country = node.country ? node.country.charAt(0).toUpperCase() + node.country.slice(1) : 'the premium cigar industry';
    desc = `${node.name} is a ${type} based in ${country}.`;
  }
  let page = template
    .replace(/\{\{NAME\}\}/g, escapeHtml(node.name))
    .replace(/\{\{ID\}\}/g, node.id)
    .replace(/\{\{TYPE\}\}/g, escapeHtml(node.type || 'entity'))
    .replace(/\{\{COUNTRY\}\}/g, escapeHtml(node.country || ''))
    .replace(/\{\{DESCRIPTION\}\}/g, desc)
    .replace(/\{\{CONNECTIONS\}\}/g, connectionsHtml)
    .replace(/\{\{PRODUCT_LINES\}\}/g, productHtml)
    .replace(/\{\{LOGO_BOX\}\}/g, logoBoxHtml)
    .replace(/\{\{BACK_TO_MAP\}\}/g, '/?node=' + node.id);
  fs.writeFileSync(path.join(dir, 'index.html'), page);
  console.log('Generated /node/' + node.id + '/');
});
console.log('SEO node pages generated successfully.');

// Also regenerate sitemap.xml with all current pages (home + about + every /node/)
const today = new Date().toISOString().split('T')[0];
let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
sitemap += '  <url>\n    <loc>https://cigarnexus.app/</loc>\n    <lastmod>' + today + '</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n';
sitemap += '  <url>\n    <loc>https://cigarnexus.app/about.html</loc>\n    <lastmod>' + today + '</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n';
baseGraphData.nodes.forEach(node => {
  sitemap += '  <url>\n    <loc>https://cigarnexus.app/node/' + node.id + '/</loc>\n    <lastmod>' + today + '</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n';
});
sitemap += '</urlset>\n';
const sitemapPath = path.join(__dirname, '../sitemap.xml');
fs.writeFileSync(sitemapPath, sitemap);
console.log('Updated sitemap.xml with ' + baseGraphData.nodes.length + ' node pages + main routes.');

