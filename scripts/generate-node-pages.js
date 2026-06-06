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
function escapeHtml(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function getNodeUrl(node) { return '/node/' + node.id + '/'; }
function buildConnectionsHtml(node, allNodes, allLinks) {
  const connections = allLinks.filter(l => { const s = (l.source.id || l.source); const t = (l.target.id || l.target); return s === node.id || t === node.id; });
  if (!connections.length) return '<p>No direct connections listed.</p>';
  let html = '<ul class=\"node-connections\">';
  connections.slice(0, 15).forEach(l => {
    const isSource = (l.source.id || l.source) === node.id;
    const otherId = isSource ? (l.target.id || l.target) : (l.source.id || l.source);
    const other = allNodes.find(n => n.id === otherId);
    const otherName = other ? other.name : otherId;
    const rel = l.type || 'related';
    const dir = isSource ? '->' : '<-';
    html += '<li><strong>' + escapeHtml(rel) + '</strong> ' + dir + ' <a href=\"' + getNodeUrl({id: otherId}) + '\">' + escapeHtml(otherName) + '</a></li>';
  });
  html += '</ul>';
  return html;
}
function buildProductLinesHtml(node) {
  if (!node.productLines || !node.productLines.length) return '';
  let html = '<h3>Notable Product Lines</h3><ul class=\"product-lines\">';
  node.productLines.forEach(line => { html += '<li>' + escapeHtml(line) + '</li>'; });
  html += '</ul>';
  return html;
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
  const desc = descriptions[node.id] || 'Detailed profile for ' + node.name + ' in the premium cigar industry.';
  let page = template.replace(/\{\{NAME\}\}/g, escapeHtml(node.name)).replace(/\{\{ID\}\}/g, node.id).replace(/\{\{TYPE\}\}/g, escapeHtml(node.type || 'entity')).replace(/\{\{COUNTRY\}\}/g, escapeHtml(node.country || '')).replace(/\{\{DESCRIPTION\}\}/g, desc).replace(/\{\{CONNECTIONS\}\}/g, connectionsHtml).replace(/\{\{PRODUCT_LINES\}\}/g, productHtml).replace(/\{\{BACK_TO_MAP\}\}/g, '/?node=' + node.id);
  fs.writeFileSync(path.join(dir, 'index.html'), page);
  console.log('Generated /node/' + node.id + '/');
});
console.log('SEO node pages generated successfully.');

