/**
 * Cigar Nexus SEO page generator
 * Run on deploy: builds /node/[id]/ static pages + sitemap.xml
 *                + /directory.html and the homepage profile catalog
 *
 * Content priority per node:
 *   1. content/expanded/*.js (manual researched overrides by type)
 *   2. Auto-generated rich HTML from drawer text + graph connections
 *
 * ROLLBACK the HTML directory:
 *   ENABLE_PROFILE_DIRECTORY=0 npm run build:site
 *   or set ENABLE_PROFILE_DIRECTORY to false below, then redeploy.
 *   git revert of this commit also restores the pre-directory homepage.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execSync } = require('child_process');
const { readImageDimensions } = require('./read-image-dimensions');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://cigarnexus.app';

function envFlag(name, defaultValue) {
  const raw = process.env[name];
  if (raw == null || String(raw).trim() === '') return defaultValue;
  return !/^(0|false|off|no)$/i.test(String(raw).trim());
}

/** Homepage catalog + /directory.html. Flip false or set env 0 to roll back. */
const ENABLE_PROFILE_DIRECTORY = envFlag('ENABLE_PROFILE_DIRECTORY', true);

const PROFILE_DIRECTORY_START = '<!-- PROFILE_DIRECTORY_START -->';
const PROFILE_DIRECTORY_END = '<!-- PROFILE_DIRECTORY_END -->';

const DIRECTORY_GROUPS = [
  { type: 'brand', label: 'Brands', blurb: 'Marcas and product houses' },
  { type: 'company', label: 'Companies', blurb: 'Corporate groups and family companies' },
  { type: 'person', label: 'People', blurb: 'Founders, blenders, and operators' },
  { type: 'factory', label: 'Factories', blurb: 'Rolling houses and grower facilities' },
];

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

function loadNodeWebsites() {
  try {
    const code = readUtf8(path.join(ROOT, 'websites.js'));
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);
    return sandbox.nodeWebsites || {};
  } catch (err) {
    console.warn('websites.js not found, node pages will omit external website links:', err.message);
    return {};
  }
}

function loadAffiliateBuilder() {
  try {
    const code = readUtf8(path.join(ROOT, 'affiliates.js'));
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);
    if (typeof sandbox.buildFamousSmokeBuyHtml !== 'function') {
      throw new Error('buildFamousSmokeBuyHtml missing from affiliates.js');
    }
    return sandbox.buildFamousSmokeBuyHtml;
  } catch (err) {
    console.warn('affiliates.js not found, node pages will omit shop links:', err.message);
    return null;
  }
}

function resolveNodeWebsite(node, nodeWebsites) {
  if (node.website && String(node.website).trim()) {
    return { website: String(node.website).trim(), websiteLabel: node.websiteLabel };
  }
  const entry = nodeWebsites[node.id];
  if (!entry || !entry.website) return null;
  return entry;
}

function buildWebsiteLinkHtml(node, nodeWebsites) {
  const entry = resolveNodeWebsite(node, nodeWebsites);
  if (!entry) return '';

  const rawUrl = String(entry.website).trim();
  if (!/^https?:\/\//i.test(rawUrl)) return '';

  const label = entry.websiteLabel || 'Official website';
  const host = rawUrl.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/.*$/, '');

  return `<p class="node-website-link mt-2.5 mb-0">
    <a href="${escapeHtml(rawUrl)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-sm font-medium text-[#14817A] hover:text-[#CEA661] transition-colors" title="${escapeHtml(rawUrl)}">
      <span aria-hidden="true" class="text-[#CEA661]">↗</span>
      <span>${escapeHtml(label)}</span>
      <span class="text-[#6B8A84] font-normal hidden sm:inline">· ${escapeHtml(host)}</span>
    </a>
  </p>`;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const REPORT_CORRECTION_EMAIL = 'contact@cigarnexus.app';

/** Pre-filled mailto for "Report a correction" on SEO node pages. */
function buildReportCorrectionMailto(node) {
  const id = String(node.id || '');
  const displayName = String(node.name || id || 'Unknown');
  const subject = `Correction: ${displayName} (Cigar Nexus)`;
  const body = [
    'Hi Cigar Nexus team,',
    '',
    "I'd like to suggest a correction for this profile:",
    '',
    `Name: ${displayName}`,
    `Node ID: ${id}`,
    `Map: ${SITE}/?node=${id}`,
    `Profile: ${SITE}/node/${id}/`,
    '',
    'What should be corrected?',
    '',
    '',
    'Source / reference (optional):',
    '',
    '',
    'Thanks!',
  ].join('\n');
  return `mailto:${REPORT_CORRECTION_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
}

/** Drop leftover sprint notes (SEO: "queries", Cross-link …) from profile HTML. */
function stripEditorNotes(html) {
  if (!html) return '';
  const noteTail = /\s*(?:SEO:|For SEO[,:]|Cross-link\b)[\s\S]*$/i;
  return String(html).replace(/<p(\b[^>]*)>([\s\S]*?)<\/p>/gi, (full, attrs, inner) => {
    const cleaned = String(inner).replace(noteTail, '').trim();
    const plain = stripHtml(cleaned);
    if (!plain) return '';
    if (/^(SEO:|For SEO\b|Cross-link\b)/i.test(plain)) return '';
    return `<p${attrs}>${cleaned}</p>`;
  });
}

function truncateAtWord(text, max) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (!t || t.length <= max) return t;
  const slice = t.slice(0, max);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > Math.floor(max * 0.6) ? slice.slice(0, lastSpace) : slice;
  return cut.replace(/[.,;:]+$/, '').trim();
}

function firstParagraphPlain(html) {
  const match = String(html || '').match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
  return stripHtml(match ? match[1] : html);
}

function buildMetaDescription(html, max = 155) {
  const first = firstParagraphPlain(html);
  if (first.length >= 80 && first.length <= 160) return first;
  if (first.length > 160) return truncateAtWord(first, max);
  const all = stripHtml(html);
  if (all.length <= 160) return all;
  return truncateAtWord(all, max);
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
  html += ` in the modern premium cigar industry. Classified as a ${escapeHtml(groupLabel)}, this node appears on the <a href="/?node=${node.id}">Cigar Nexus interactive map</a>: a visual tool for exploring ownership, manufacturing, and supply-chain relationships across Nicaragua, the Dominican Republic, Honduras, and beyond.</p>`;

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
      return `<li>${escapeHtml(c.rel)}: ${dir} <a href="/node/${c.otherId}/">${escapeHtml(c.otherName)}</a></li>`;
    }).join('');
    html += `<p>Key relationships documented on Cigar Nexus:</p><ul>${items}</ul>`;
    if (connections.length > 6) {
      html += `<p>See the full connections list below for ${connections.length - 6} additional documented relationships.</p>`;
    }
  }

  html += `<p>Use the <a href="/">interactive industry map</a> to filter by country, ownership type, or boutique vs. corporate: and click any connected node to trace how ${escapeHtml(name)} fits into the wider cigar world.</p>`;
  return html;
}

function resolveDescription(node, connections, drawerDescriptions, expandedOverrides) {
  const override = expandedOverrides[node.id];
  if (override) return stripEditorNotes(wrapPlainTextAsHtml(override));
  const short = drawerDescriptions[node.id] || drawerDescriptions.default;
  return stripEditorNotes(buildAutoExpandedDescription(node, connections, short));
}

function getNodeUrl(nodeId) {
  return `/node/${nodeId}/`;
}

function buildConnectionsHtml(node, allNodes, allLinks) {
  const connections = getConnections(node.id, allNodes, allLinks);
  if (!connections.length) {
    return '<p class="text-sm text-[#6B8A84] italic">No direct connections listed.</p>';
  }

  let html = '<div class="space-y-2">';
  connections.forEach(c => {
    const dir = c.direction === 'out' ? '→' : '←';
    const url = getNodeUrl(c.otherId);
    html += `
      <div class="connection-item flex flex-col gap-1 px-2.5 py-2 rounded-xl bg-white border border-[#CFE0DC] text-xs">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="connection-type" data-rel="${escapeHtml(c.rel)}">${escapeHtml(c.rel)}</span>
          <span class="text-[#CEA661]">${dir}</span>
        </div>
        <a href="${url}" class="font-medium text-[#1A3330] hover:text-[#14817A] leading-snug">${escapeHtml(c.otherName)}</a>
      </div>`;
  });
  html += '</div>';
  return html;
}

function nodeTypeDot(n) {
  if (n.type === 'factory') return '#b45309';
  if (n.group === 'corporate') return '#CEA661';
  return '#13817b';
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

  let html = '<section class="mt-8" aria-labelledby="related-nodes-heading">';
  html += '<h2 id="related-nodes-heading" class="node-section-label">Explore Related Nodes</h2>';
  html += '<div class="flex flex-wrap gap-2">';
  final.forEach(n => {
    html += `<a href="${getNodeUrl(n.id)}" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-2xl bg-white border border-[#CFE0DC] text-[#1A3330] hover:border-[#CEA661] hover:text-[#14817A] transition-colors">
  <span style="width:7px;height:7px;border-radius:50%;background:${nodeTypeDot(n)};flex-shrink:0;display:inline-block"></span>
  ${escapeHtml(n.name)}
</a>`;
  });
  html += '</div></section>';
  return html;
}

function buildProductLinesHtml(node) {
  if (!node.productLines || !node.productLines.length) return '';
  let html = '<section class="mt-8" aria-labelledby="product-lines-heading">';
  html += '<h2 id="product-lines-heading" class="node-section-label">Notable Cigars &amp; Product Lines</h2>';
  html += '<div class="flex flex-wrap gap-1.5">';
  node.productLines.forEach(line => {
    html += `<span class="inline-block px-2.5 py-0.5 text-xs rounded-full bg-white border border-[#CFE0DC] text-[#14817A]">${escapeHtml(line)}</span>`;
  });
  html += '</div></section>';
  return html;
}

function buildFindCigarsHtml(buildFamousSmokeBuyHtml) {
  if (!buildFamousSmokeBuyHtml) return '';
  return `<section class="mt-8" aria-labelledby="find-cigars-heading">
    <h2 id="find-cigars-heading" class="node-section-label">Find These Cigars</h2>
    <div class="node-affiliate-block space-y-2 max-w-sm">
      ${buildFamousSmokeBuyHtml()}
    </div>
    <p class="text-[10px] text-[#6B8A84] mt-3">As an affiliate I may earn a commission from qualifying purchases.</p>
  </section>`;
}

function resolveSocialImage(node) {
  const fallback = `${SITE}/social-preview.jpg`;

  if (node.type === 'person' && node.photo && String(node.photo).trim()) {
    const path = node.photo.trim().replace(/^\//, '');
    return { url: `${SITE}/${path}`, kind: 'photo' };
  }
  if (node.logo && String(node.logo).trim()) {
    const path = node.logo.trim().replace(/^\//, '');
    return { url: `${SITE}/${path}`, kind: 'logo' };
  }
  if (node.photo && String(node.photo).trim()) {
    const path = node.photo.trim().replace(/^\//, '');
    return { url: `${SITE}/${path}`, kind: 'photo' };
  }
  return { url: fallback, kind: 'default' };
}

function twitterCardForSocialImage(kind) {
  // Logos and portraits are rarely 1200×630; summary avoids awkward cropping in shares.
  return kind === 'default' ? 'summary_large_image' : 'summary';
}

const OG_FALLBACK_SIZE = { width: 1200, height: 630 };

function localPathFromSiteUrl(url) {
  if (!url || !url.startsWith(`${SITE}/`)) return null;
  return path.join(ROOT, url.slice(SITE.length + 1).replace(/\//g, path.sep));
}

function resolveOgImageDimensions(socialImage) {
  const local = localPathFromSiteUrl(socialImage.url);
  if (!local || !fs.existsSync(local)) return OG_FALLBACK_SIZE;

  const dims = readImageDimensions(local);
  if (dims && dims.width > 0 && dims.height > 0) return dims;

  console.warn(`OG image dimensions unavailable for ${socialImage.url}, using fallback`);
  return OG_FALLBACK_SIZE;
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
  return `<nav aria-label="Breadcrumb" class="text-sm text-[#6B8A84] mb-6">
    <ol class="flex flex-wrap items-center gap-1.5">
      <li><a href="/" class="hover:text-[#14817A] transition-colors">Map</a></li>
      <li aria-hidden="true" class="text-[#CEA661] text-xs select-none">›</li>
      <li class="text-[#1A3330] font-medium" aria-current="page">${name}</li>
    </ol>
  </nav>`;
}

function buildBreadcrumbListJsonLd(node) {
  const name = node.name || node.id;
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Map',
        item: `${SITE}/`
      },
      {
        '@type': 'ListItem',
        position: 2,
        name,
        item: `${SITE}/node/${node.id}/`
      }
    ]
  };
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

function schemaTypeForNodeType(type) {
  if (type === 'person') return 'Person';
  if (type === 'brand') return 'Brand';
  return 'Organization';
}

function buildJsonLd(node, plainDesc, connections, nodeWebsites, allNodes) {
  const byId = new Map((allNodes || []).map(n => [n.id, n]));
  const websiteEntry = resolveNodeWebsite(node, nodeWebsites);
  const socialImage = resolveSocialImage(node);

  const entity = {
    '@type': schemaTypeForNodeType(node.type),
    name: node.name,
    url: `${SITE}/node/${node.id}/`,
    description: plainDesc
  };
  if (websiteEntry) {
    entity.sameAs = [websiteEntry.website];
  }
  if (socialImage.kind !== 'default') {
    entity.image = socialImage.url;
  }

  const related = connections.slice(0, 5).map(c => {
    const other = byId.get(c.otherId);
    return {
      '@type': schemaTypeForNodeType(other && other.type),
      name: c.otherName,
      url: `${SITE}/node/${c.otherId}/`
    };
  });

  const page = {
    '@type': 'ProfilePage',
    name: `${node.name} | Cigar Nexus`,
    description: plainDesc,
    url: `${SITE}/node/${node.id}/`,
    isPartOf: { '@type': 'WebSite', name: 'Cigar Nexus', url: SITE },
    publisher: { '@type': 'Organization', name: 'Cigar Nexus', url: SITE },
    mainEntity: entity
  };
  if (related.length) page.mentions = related;
  if (socialImage.kind !== 'default') page.image = socialImage.url;

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      page,
      buildBreadcrumbListJsonLd(node)
    ]
  }, null, 2);
}

function buildSitemap(nodes, { includeDirectory = false } = {}) {
  const today = new Date().toISOString().split('T')[0];
  const sorted = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  xml += `  <url>\n    <loc>${SITE}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
  xml += `  <url>\n    <loc>${SITE}/about.html</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  xml += `  <url>\n    <loc>${SITE}/privacy.html</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>yearly</changefreq>\n    <priority>0.3</priority>\n  </url>\n`;
  xml += `  <url>\n    <loc>${SITE}/disclosures.html</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>yearly</changefreq>\n    <priority>0.3</priority>\n  </url>\n`;
  if (includeDirectory) {
    xml += `  <url>\n    <loc>${SITE}/directory.html</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.85</priority>\n  </url>\n`;
  }
  sorted.forEach(node => {
    xml += `  <url>\n    <loc>${SITE}/node/${node.id}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
  });
  xml += '</urlset>\n';
  return xml;
}

function extraSitemapPages(includeDirectory) {
  return includeDirectory ? 5 : 4;
}

function validateSitemap(xml, nodes, { includeDirectory = false } = {}) {
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

  const hasDirectory = xml.includes(`${SITE}/directory.html`);
  if (includeDirectory && !hasDirectory) {
    throw new Error('Sitemap missing directory.html');
  }
  if (!includeDirectory && hasDirectory) {
    throw new Error('Sitemap includes directory.html while the catalog is disabled');
  }
  if (!xml.includes(`${SITE}/privacy.html`)) {
    throw new Error('Sitemap missing privacy.html');
  }
  if (!xml.includes(`${SITE}/disclosures.html`)) {
    throw new Error('Sitemap missing disclosures.html');
  }

  const expectedTotal = nodeIds.size + extraSitemapPages(includeDirectory);
  const totalUrls = (xml.match(/<loc>/g) || []).length;
  if (totalUrls !== expectedTotal) {
    throw new Error(`Sitemap has ${totalUrls} total URLs, expected ${expectedTotal}`);
  }
}

function directoryGroupClass(type) {
  if (type === 'factory') return 'factory';
  if (type === 'company') return 'corporate';
  return 'family';
}

function countDirectoryLinks(html) {
  return [...String(html).matchAll(/href="\/node\/([^/]+)\/"/g)].map((m) => m[1]);
}

function buildDirectoryGroupsHtml(nodes, { open = false } = {}) {
  const openAttr = open ? ' open' : '';
  return DIRECTORY_GROUPS.map((group) => {
    const items = nodes
      .filter((n) => n.type === group.type)
      .slice()
      .sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id), 'en', { sensitivity: 'base' }));
    const links = items.map((n) => {
      const name = escapeHtml(n.name || n.id);
      return `<li><a href="/node/${escapeHtml(n.id)}/">${name}</a></li>`;
    }).join('');
    return `<details class="profile-directory__group" data-type="${escapeHtml(group.type)}"${openAttr}>
      <summary>
        <span class="profile-directory__dot profile-directory__dot--${directoryGroupClass(group.type)}" aria-hidden="true"></span>
        <span class="profile-directory__summary-text">
          <span class="profile-directory__label">${escapeHtml(group.label)}</span>
          <span class="profile-directory__count">${items.length}</span>
        </span>
        <span class="profile-directory__blurb">${escapeHtml(group.blurb)}</span>
      </summary>
      <ul class="profile-directory__links">${links}</ul>
    </details>`;
  }).join('\n');
}

function buildHomepageDirectoryHtml(nodes) {
  const count = nodes.length;
  const groups = buildDirectoryGroupsHtml(nodes, { open: false });
  return `<section class="profile-directory profile-directory--home" aria-labelledby="profile-directory-heading">
  <div class="profile-directory__intro">
    <h2 id="profile-directory-heading" class="profile-directory__heading">Industry directory</h2>
    <p class="profile-directory__lede">Every brand, person, factory, and company on this map has a dedicated profile. ${count} pages, grouped below. Expand a group or open the full directory.</p>
    <a class="profile-directory__all" href="/directory.html">Open the full directory</a>
  </div>
  ${groups}
</section>`;
}

function buildDirectoryJsonLd(nodes) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Cigar industry directory',
    url: `${SITE}/directory.html`,
    isPartOf: { '@type': 'WebSite', name: 'Cigar Nexus', url: `${SITE}/` },
    about: 'Directory of premium cigar brands, companies, people, and factories on Cigar Nexus.',
    numberOfItems: nodes.length
  }, null, 2);
}

function injectHomepageDirectory(innerHtml) {
  const filePath = path.join(ROOT, 'index.html');
  const src = readUtf8(filePath);
  const start = src.indexOf(PROFILE_DIRECTORY_START);
  const end = src.indexOf(PROFILE_DIRECTORY_END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error('index.html is missing PROFILE_DIRECTORY_START / PROFILE_DIRECTORY_END markers');
  }
  const before = src.slice(0, start + PROFILE_DIRECTORY_START.length);
  const after = src.slice(end);
  const block = innerHtml ? `\n${innerHtml}\n            ` : '\n            ';
  const next = `${before}${block}${after}`;
  fs.writeFileSync(filePath, next, 'utf8');
}

function writeDirectoryPage(nodes) {
  const outPath = path.join(ROOT, 'directory.html');
  if (!ENABLE_PROFILE_DIRECTORY) {
    if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
    return;
  }
  const templatePath = path.join(__dirname, 'directory-template.html');
  let page = readUtf8(templatePath);
  const groups = buildDirectoryGroupsHtml(nodes, { open: true });
  page = page
    .replace(/\{\{COUNT\}\}/g, String(nodes.length))
    .replace(/\{\{DIRECTORY_GROUPS\}\}/g, groups)
    .replace(/\{\{JSON_LD\}\}/g, buildDirectoryJsonLd(nodes));
  fs.writeFileSync(outPath, page, 'utf8');
}

function publishProfileDirectory(nodes) {
  const directoryPath = path.join(ROOT, 'directory.html');
  if (!ENABLE_PROFILE_DIRECTORY) {
    injectHomepageDirectory('');
    if (fs.existsSync(directoryPath)) fs.unlinkSync(directoryPath);
    console.log('Profile directory disabled (ENABLE_PROFILE_DIRECTORY=0). Homepage catalog cleared.');
    return;
  }

  const homeHtml = buildHomepageDirectoryHtml(nodes);
  injectHomepageDirectory(homeHtml);
  writeDirectoryPage(nodes);

  const homeIds = countDirectoryLinks(homeHtml);
  const pageIds = countDirectoryLinks(readUtf8(directoryPath));
  const expected = nodes.map((n) => n.id).sort();
  const check = (ids, label) => {
    const sorted = [...ids].sort();
    if (sorted.length !== expected.length) {
      throw new Error(`${label} has ${sorted.length} profile links, expected ${expected.length}`);
    }
    const missing = expected.filter((id) => !ids.includes(id));
    if (missing.length) {
      throw new Error(`${label} missing profile links: ${missing.slice(0, 8).join(', ')}`);
    }
  };
  check(homeIds, 'Homepage directory');
  check(pageIds, 'directory.html');
  console.log(`Profile directory: ${nodes.length} links on homepage and directory.html`);
}

// --- Main ---
const baseGraphData = loadGraphData();
const drawerDescriptions = loadDrawerDescriptions();
const expandedOverrides = loadExpandedOverrides();
const nodeWebsites = loadNodeWebsites();
const buildFamousSmokeBuyHtml = loadAffiliateBuilder();
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

function generateAllNodePages() {
  let overrideCount = 0;
  let autoCount = 0;

  for (const node of baseGraphData.nodes) {
    const dir = path.join(outputBase, node.id);
    fs.mkdirSync(dir, { recursive: true });

    const connections = getConnections(node.id, baseGraphData.nodes, allLinks);
    const descHtml = resolveDescription(node, connections, drawerDescriptions, expandedOverrides);
    if (expandedOverrides[node.id]) overrideCount++;
    else autoCount++;

    const plainDesc = buildMetaDescription(descHtml);
    const canonical = `${SITE}/node/${node.id}/`;
    const mapUrl = `/?node=${node.id}`;
    const socialImage = resolveSocialImage(node);
    const ogDimensions = resolveOgImageDimensions(socialImage);
    const ogImageAlt = `${node.name || node.id} | Cigar Nexus`;

    const page = template
      .replace(/\{\{NAME\}\}/g, escapeHtml(node.name))
      .replace(/\{\{ID\}\}/g, node.id)
      .replace(/\{\{CANONICAL\}\}/g, canonical)
      .replace(/\{\{META_DESCRIPTION\}\}/g, escapeHtml(plainDesc))
      .replace(/\{\{OG_IMAGE\}\}/g, escapeHtml(socialImage.url))
      .replace(/\{\{OG_IMAGE_WIDTH\}\}/g, String(ogDimensions.width))
      .replace(/\{\{OG_IMAGE_HEIGHT\}\}/g, String(ogDimensions.height))
      .replace(/\{\{OG_IMAGE_ALT\}\}/g, escapeHtml(ogImageAlt))
      .replace(/\{\{TWITTER_CARD\}\}/g, twitterCardForSocialImage(socialImage.kind))
      .replace(/\{\{DESCRIPTION_HTML\}\}/g, descHtml)
      .replace(/\{\{META_PILLS\}\}/g, buildMetaPills(node))
      .replace(/\{\{WEBSITE_LINK\}\}/g, buildWebsiteLinkHtml(node, nodeWebsites))
      .replace(/\{\{BREADCRUMBS\}\}/g, buildBreadcrumbs(node))
      .replace(/\{\{CONNECTIONS\}\}/g, buildConnectionsHtml(node, baseGraphData.nodes, allLinks))
      .replace(/\{\{RELATED\}\}/g, buildRelatedHtml(node, baseGraphData.nodes, allLinks))
      .replace(/\{\{PRODUCT_LINES\}\}/g, buildProductLinesHtml(node))
      .replace(/\{\{FIND_CIGARS\}\}/g, buildFindCigarsHtml(buildFamousSmokeBuyHtml))
      .replace(/\{\{LOGO_BOX\}\}/g, buildLogoBoxHtml(node))
      .replace(/\{\{BACK_TO_MAP\}\}/g, mapUrl)
      .replace(/\{\{REPORT_MAILTO\}\}/g, escapeHtml(buildReportCorrectionMailto(node)))
      .replace(/\{\{JSON_LD\}\}/g, buildJsonLd(node, plainDesc, connections, nodeWebsites, baseGraphData.nodes));

    fs.writeFileSync(path.join(dir, 'index.html'), page, 'utf8');
  }

  // Static HTML redirects for renamed node IDs (old bookmarks / external links)
  const nodeIdRedirects = {
    attabey: 'atabey',
  };
  let redirectCount = 0;
  for (const [fromId, toId] of Object.entries(nodeIdRedirects)) {
    if (!baseGraphData.nodes.some(n => n.id === toId)) {
      console.warn(`Skip redirect ${fromId} → ${toId}: target missing from data.js`);
      continue;
    }
    const dir = path.join(outputBase, fromId);
    fs.mkdirSync(dir, { recursive: true });
    const target = `${SITE}/node/${toId}/`;
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0;url=${target}">
  <link rel="canonical" href="${target}">
  <title>Moved - Cigar Nexus</title>
  <script>location.replace(${JSON.stringify(target)});</script>
</head>
<body>
  <p>This page has moved to <a href="${target}">${escapeHtml(toId)}</a>.</p>
</body>
</html>
`;
    fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
    redirectCount++;
  }

  const websiteIds = new Set(Object.keys(nodeWebsites));
  const missingWebsites = baseGraphData.nodes
    .map(n => n.id)
    .filter(id => !websiteIds.has(id) && !baseGraphData.nodes.find(n => n.id === id && n.website));
  console.log(`Generated ${baseGraphData.nodes.length} node pages (${overrideCount} manual overrides, ${autoCount} auto-expanded).`);
  if (redirectCount) console.log(`Legacy node redirects: ${redirectCount}.`);
  console.log(`Website links: ${baseGraphData.nodes.length - missingWebsites.length}/${baseGraphData.nodes.length} nodes${missingWebsites.length ? ` (no URL: ${missingWebsites.join(', ')})` : ''}.`);

  publishProfileDirectory(baseGraphData.nodes);

  const sitemapPath = path.join(ROOT, 'sitemap.xml');
  const sitemap = buildSitemap(baseGraphData.nodes, { includeDirectory: ENABLE_PROFILE_DIRECTORY });
  validateSitemap(sitemap, baseGraphData.nodes, { includeDirectory: ENABLE_PROFILE_DIRECTORY });
  fs.writeFileSync(sitemapPath, sitemap, 'utf8');
  const extra = extraSitemapPages(ENABLE_PROFILE_DIRECTORY);
  console.log(`Updated sitemap.xml (${baseGraphData.nodes.length + extra} URLs, synced with data.js).`);
}

try {
  generateAllNodePages();
} catch (err) {
  console.error(err);
  process.exit(1);
}