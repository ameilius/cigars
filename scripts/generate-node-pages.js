/**
 * Cigar Nexus SEO page generator
 * Run on deploy: builds /node/[id]/ static pages + sitemap.xml
 *
 * Content priority per node:
 *   1. content/expanded/*.js (manual researched overrides by type)
 *   2. Auto-generated rich HTML from drawer text + graph connections
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://cigarnexus.app';

function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
}

function loadGraphData() {
  const code = readUtf8(path.join(ROOT, 'data.js'));
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.baseGraphData || { nodes: [], links: [] };
}

function loadDrawerDescriptions() {
  return require(path.join(ROOT, 'descriptions.js')) || {};
}

function loadExpandedOverrides() {
  try {
    const loader = path.join(ROOT, 'content', 'expanded', 'index.js');
    delete require.cache[require.resolve(loader)];
    return require(loader) || {};
  } catch (err) {
    console.warn('content/expanded not found, using auto-generated copy only:', err.message);
    return {};
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(text, max) {
  if (!text || text.length <= max) return text;
  return text.slice(0, max - 1).trim() + '…';
}

function formatCountry(country) {
  if (!country) return '';
  const c = country.toLowerCase();
  if (c === 'usa') return 'the United States';
  if (c === 'nicaragua') return 'Nicaragua';
  if (c === 'dominican') return 'the Dominican Republic';
  if (c === 'honduras') return 'Honduras';
  return country.charAt(0).toUpperCase() + country.slice(1);
}

function formatType(type) {
  const map = {
    brand: 'premium cigar brand',
    person: 'key industry figure',
    factory: 'cigar factory',
    company: 'cigar company'
  };
  return map[type] || type || 'entity';
}

function normalizeLinks(rawLinks) {
  return rawLinks.map(l => ({
    ...l,
    source: typeof l.source === 'object' ? l.source.id : l.source,
    target: typeof l.target === 'object' ? l.target.id : l.target
  }));
}

function getConnections(nodeId, allNodes, allLinks) {
  const byId = new Map(allNodes.map(n => [n.id, n]));
  return allLinks
    .filter(l => l.source === nodeId || l.target === nodeId)
    .map(l => {
      const isSource = l.source === nodeId;
      const otherId = isSource ? l.target : l.source;
      const other = byId.get(otherId);
      return {
        rel: l.type || 'related',
        otherId,
        otherName: other ? other.name : otherId,
        direction: isSource ? 'out' : 'in'
      };
    });
}

function wrapPlainTextAsHtml(text) {
  const t = String(text || '').trim();
  if (!t) return '';
  if (t.includes('<p>') || t.includes('<p ')) return t;
  return `<p>${escapeHtml(t)}</p>`;
}

function buildAutoExpandedDescription(node, connections, shortDesc) {
  const name = node.name || node.id;
  const typeLabel = formatType(node.type);
  const countryLabel = formatCountry(node.country);
  const groupLabel = node.group === 'corporate' ? 'corporate group' : 'family-owned or independent operation';

  let html = `<p><strong>${escapeHtml(name)}</strong> is a ${escapeHtml(typeLabel)}`;
  if (countryLabel) html += ` with strong ties to ${escapeHtml(countryLabel)}`;
  html += ` in the modern premium cigar industry. Classified as a ${escapeHtml(groupLabel)}, this node appears on the <a href="/?node=${node.id}">Cigar Nexus interactive map</a> — a visual tool for exploring ownership, manufacturing, and supply-chain relationships across Nicaragua, the Dominican Republic, Honduras, and beyond.</p>`;

  if (shortDesc) {
    html += `<p>${escapeHtml(shortDesc)}</p>`;
  }

  if (node.productLines && node.productLines.length) {
    html += `<p>Notable cigars and product lines associated with ${escapeHtml(name)} include <strong>${node.productLines.map(escapeHtml).join(', ')}</strong>.</p>`;
  }

  if (connections.length) {
    const top = connections.slice(0, 6);
    const items = top.map(c => {
      const dir = c.direction === 'out' ? 'connects to' : 'is linked from';
      return `<li>${escapeHtml(c.rel)} — ${dir} <a href="/node/${c.otherId}/">${escapeHtml(c.otherName)}</a></li>`;
    }).join('');
    html += `<p>Key relationships documented on Cigar Nexus:</p><ul>${items}</ul>`;
    if (connections.length > 6) {
      html += `<p>See the full connections list below for ${connections.length - 6} additional documented relationships.</p>`;
    }
  }

  html += `<p>Use the <a href="/">interactive industry map</a> to filter by country, ownership type, or boutique vs. corporate — and click any connected node to trace how ${escapeHtml(name)} fits into the wider cigar world.</p>`;
  return html;
}

function resolveDescription(node, connections, drawerDescriptions, expandedOverrides) {
  const override = expandedOverrides[node.id];
  if (override && node.id !== 'default') {
    return wrapPlainTextAsHtml(override);
  }
  const short = drawerDescriptions[node.id] || drawerDescriptions.default;
  return buildAutoExpandedDescription(node, connections, short);
}

function getNodeUrl(nodeId) {
  return `/node/${nodeId}/`;
}

function buildConnectionsHtml(node, allNodes, allLinks) {
  const connections = getConnections(node.id, allNodes, allLinks);
  if (!connections.length) {
    return '<p class="text-sm text-[#8b6f5c] italic">No direct connections listed.</p>';
  }

  let html = '<div class="space-y-2">';
  connections.forEach(c => {
    const dir = c.direction === 'out' ? '→' : '←';
    const url = getNodeUrl(c.otherId);
    html += `
      <div class="connection-item flex flex-col gap-1 px-2.5 py-2 rounded-xl bg-white border border-[#d4c4a8] text-xs">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="font-medium text-[10px] px-1.5 py-0.5 rounded bg-[#f4e9d8] text-[#8b6f5c]">${escapeHtml(c.rel)}</span>
          <span class="text-[#c5a26f]">${dir}</span>
        </div>
        <a href="${url}" class="font-medium text-[#3f2a2a] hover:text-[#5c2e2e] leading-snug">${escapeHtml(c.otherName)}</a>
      </div>`;
  });
  html += '</div>';
  return html;
}

function buildRelatedHtml(node, allNodes, allLinks) {
  const connections = getConnections(node.id, allNodes, allLinks);
  const relatedIds = new Set(connections.map(c => c.otherId));

  // Same country peers (excluding already connected)
  const countryPeers = allNodes
    .filter(n => n.id !== node.id && n.country === node.country && !relatedIds.has(n.id))
    .slice(0, 4);

  // Same group peers
  const groupPeers = allNodes
    .filter(n => n.id !== node.id && n.group === node.group && n.country !== node.country && !relatedIds.has(n.id))
    .slice(0, 3);

  const picks = [];
  const seen = new Set([node.id]);
  [...connections.slice(0, 4).map(c => allNodes.find(n => n.id === c.otherId)).filter(Boolean),
   ...countryPeers,
   ...groupPeers].forEach(n => {
    if (n && !seen.has(n.id)) {
      seen.add(n.id);
      picks.push(n);
    }
  });

  const final = picks.slice(0, 8);
  if (!final.length) return '';

  let html = '<div class="text-xs font-semibold text-[#8b6f5c] mb-2.5 tracking-[0.8px] uppercase mt-10">Explore Related Nodes</div>';
  html += '<div class="flex flex-wrap gap-2">';
  final.forEach(n => {
    html += `<a href="${getNodeUrl(n.id)}" class="inline-flex items-center px-3 py-1.5 text-sm rounded-2xl bg-white border border-[#d4c4a8] text-[#3f2a2a] hover:border-[#c5a26f] hover:text-[#5c2e2e] transition-colors">${escapeHtml(n.name)}</a>`;
  });
  html += '</div>';
  return html;
}

function buildProductLinesHtml(node) {
  if (!node.productLines || !node.productLines.length) return '';
  let html = '<div class="text-xs font-semibold text-[#8b6f5c] mb-2.5 tracking-[0.8px] uppercase mt-8">Notable Cigars &amp; Product Lines</div><div class="flex flex-wrap gap-1.5">';
  node.productLines.forEach(line => {
    html += `<span class="inline-block px-2.5 py-0.5 text-xs rounded-full bg-white border border-[#d4c4a8] text-[#5c2e2e]">${escapeHtml(line)}</span>`;
  });
  html += '</div>';
  return html;
}

function buildLogoBoxHtml(node) {
  const name = escapeHtml(node.name || node.id);

  if (node.type === 'person' && node.photo && String(node.photo).trim()) {
    const src = '../../' + node.photo.trim();
    return `<div class="node-photo-box"><img src="${src}" alt="${name} portrait" loading="lazy"></div>`;
  }

  if (!node.logo || !node.logo.trim()) return '';
  const src = '../../' + node.logo.trim();
  return `<div class="node-logo-box"><img src="${src}" alt="${name} logo" loading="lazy"></div>`;
}

function buildBreadcrumbs(node) {
  const name = escapeHtml(node.name || node.id);
  return `<nav aria-label="Breadcrumb" class="text-sm text-[#8b6f5c] mb-6">
    <ol class="flex flex-wrap items-center gap-1.5">
      <li><a href="/" class="hover:text-[#5c2e2e] transition-colors">Map</a></li>
      <li aria-hidden="true" class="text-[#c5a26f]">/</li>
      <li><a href="/about.html" class="hover:text-[#5c2e2e] transition-colors">About</a></li>
      <li aria-hidden="true" class="text-[#c5a26f]">/</li>
      <li class="text-[#3f2a2a] font-medium" aria-current="page">${name}</li>
    </ol>
  </nav>`;
}

function countryPillClass(country) {
  const c = (country || '').toLowerCase();
  if (c.includes('nicaragua')) return 'nicaragua';
  if (c.includes('dominican')) return 'dominican';
  if (c.includes('honduras')) return 'honduras';
  return 'neutral';
}

function buildMetaPills(node) {
  const pills = [];
  if (node.type) pills.push(`<span class="meta-pill meta-pill--neutral">${escapeHtml(node.type)}</span>`);
  if (node.group) {
    const cls = node.group === 'corporate' ? 'corporate' : 'family';
    pills.push(`<span class="meta-pill meta-pill--${cls}">${escapeHtml(node.group)}</span>`);
  }
  if (node.country) {
    pills.push(`<span class="meta-pill meta-pill--${countryPillClass(node.country)}">${escapeHtml(formatCountry(node.country))}</span>`);
  }
  return pills.join('');
}

function buildJsonLd(node, plainDesc, connections) {
  const related = connections.slice(0, 5).map(c => ({
    '@type': 'Organization',
    name: c.otherName,
    url: `${SITE}/node/${c.otherId}/`
  }));

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${node.name} | Premium Cigar Industry Profile`,
    description: plainDesc,
    url: `${SITE}/node/${node.id}/`,
    author: { '@type': 'Organization', name: 'Cigar Nexus' },
    publisher: { '@type': 'Organization', name: 'Cigar Nexus', url: SITE },
    mainEntityOfPage: `${SITE}/node/${node.id}/`,
    about: {
      '@type': 'Thing',
      name: node.name,
      description: plainDesc
    }
  };

  if (related.length) schema.mentions = related;
  return JSON.stringify(schema, null, 2);
}

// --- Main ---
const baseGraphData = loadGraphData();
const drawerDescriptions = loadDrawerDescriptions();
const expandedOverrides = loadExpandedOverrides();
const allLinks = normalizeLinks(baseGraphData.links || []);

let template = readUtf8(path.join(__dirname, 'node-template.html'));
const outputBase = path.join(ROOT, 'node');
if (fs.existsSync(outputBase)) {
  if (typeof fs.rmSync === 'function') {
    fs.rmSync(outputBase, { recursive: true, force: true });
  } else {
    execSync(`rm -rf ${JSON.stringify(outputBase)}`);
  }
}

let overrideCount = 0;
let autoCount = 0;

baseGraphData.nodes.forEach(node => {
  const dir = path.join(outputBase, node.id);
  fs.mkdirSync(dir, { recursive: true });

  const connections = getConnections(node.id, baseGraphData.nodes, allLinks);
  const descHtml = resolveDescription(node, connections, drawerDescriptions, expandedOverrides);
  if (expandedOverrides[node.id] && node.id !== 'default') overrideCount++;
  else autoCount++;

  const plainDesc = truncate(stripHtml(descHtml), 155);
  const canonical = `${SITE}/node/${node.id}/`;
  const mapUrl = `/?node=${node.id}`;

  const page = template
    .replace(/\{\{NAME\}\}/g, escapeHtml(node.name))
    .replace(/\{\{ID\}\}/g, node.id)
    .replace(/\{\{CANONICAL\}\}/g, canonical)
    .replace(/\{\{META_DESCRIPTION\}\}/g, escapeHtml(plainDesc))
    .replace(/\{\{DESCRIPTION_HTML\}\}/g, descHtml)
    .replace(/\{\{META_PILLS\}\}/g, buildMetaPills(node))
    .replace(/\{\{BREADCRUMBS\}\}/g, buildBreadcrumbs(node))
    .replace(/\{\{CONNECTIONS\}\}/g, buildConnectionsHtml(node, baseGraphData.nodes, allLinks))
    .replace(/\{\{RELATED\}\}/g, buildRelatedHtml(node, baseGraphData.nodes, allLinks))
    .replace(/\{\{PRODUCT_LINES\}\}/g, buildProductLinesHtml(node))
    .replace(/\{\{LOGO_BOX\}\}/g, buildLogoBoxHtml(node))
    .replace(/\{\{BACK_TO_MAP\}\}/g, mapUrl)
    .replace(/\{\{JSON_LD\}\}/g, buildJsonLd(node, plainDesc, connections));

  fs.writeFileSync(path.join(dir, 'index.html'), page, 'utf8');
});

console.log(`Generated ${baseGraphData.nodes.length} node pages (${overrideCount} manual overrides, ${autoCount} auto-expanded).`);

function buildSitemap(nodes) {
  const today = new Date().toISOString().split('T')[0];
  const sorted = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  xml += `  <url>\n    <loc>${SITE}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
  xml += `  <url>\n    <loc>${SITE}/about.html</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  sorted.forEach(node => {
    xml += `  <url>\n    <loc>${SITE}/node/${node.id}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
  });
  xml += '</urlset>\n';
  return xml;
}

function validateSitemap(xml, nodes) {
  const nodeIds = new Set(nodes.map(n => n.id));
  const found = [...xml.matchAll(/<loc>https:\/\/cigarnexus\.app\/node\/([^/]+)\//g)].map(m => m[1]);

  if (found.length !== nodeIds.size) {
    throw new Error(`Sitemap has ${found.length} node URLs, expected ${nodeIds.size}`);
  }
  if (new Set(found).size !== found.length) {
    throw new Error('Sitemap contains duplicate node URLs');
  }

  const extras = found.filter(id => !nodeIds.has(id));
  if (extras.length) {
    throw new Error(`Sitemap has stale node URLs: ${extras.join(', ')}`);
  }

  const foundSet = new Set(found);
  const missing = [...nodeIds].filter(id => !foundSet.has(id));
  if (missing.length) {
    throw new Error(`Sitemap missing node URLs: ${missing.join(', ')}`);
  }

  const totalUrls = (xml.match(/<loc>/g) || []).length;
  if (totalUrls !== nodeIds.size + 2) {
    throw new Error(`Sitemap has ${totalUrls} total URLs, expected ${nodeIds.size + 2}`);
  }
}

const sitemapPath = path.join(ROOT, 'sitemap.xml');
const sitemap = buildSitemap(baseGraphData.nodes);
validateSitemap(sitemap, baseGraphData.nodes);
fs.writeFileSync(sitemapPath, sitemap, 'utf8');
console.log(`Updated sitemap.xml (${baseGraphData.nodes.length + 2} URLs, synced with data.js).`);