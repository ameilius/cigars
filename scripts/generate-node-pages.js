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

function loadAffiliateClickUrl() {
  try {
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(readUtf8(path.join(ROOT, 'affiliates.js')), sandbox);
    return (sandbox.famousSmokeAffiliate && sandbox.famousSmokeAffiliate.clickUrl) || null;
  } catch (err) {
    return null;
  }
}

function loadAffiliateLines() {
  try {
    return require(path.join(ROOT, 'content', 'affiliate-lines.js')) || {};
  } catch (err) {
    return {};
  }
}

function loadMetaPins() {
  try {
    return require(path.join(ROOT, 'content', 'meta-pins.js')) || {};
  } catch (err) {
    return {};
  }
}
const META_PINS = loadMetaPins();

const AFFILIATE_CLICK_URL = loadAffiliateClickUrl();
const AFFILIATE_LINES = loadAffiliateLines();

// Only emitted on pages that have product-line shop links, so other pages stay byte-identical.
const PRODUCT_SHOP_CSS = `.product-chip--shop.inline-block { text-decoration: none; cursor: pointer; transition: transform .15s, box-shadow .15s, border-color .15s; } .product-chip--shop.inline-block:hover { border-color: #B8873E !important; box-shadow: 0 3px 10px rgba(90,58,30,.16); transform: translateY(-1px); } .product-chip__shop { margin-left: 5px; font-size: 11px; color: #13817b; font-weight: 700; } .product-chip-note { margin: 8px 0 0; font-size: 11.5px; color: #7A6A50; }`;

function productLineShopUrl(node, line) {
  const map = AFFILIATE_LINES[node.id];
  const dest = map && map[line];
  if (!dest || !AFFILIATE_CLICK_URL) return null;
  return `${AFFILIATE_CLICK_URL}?url=${encodeURIComponent(dest)}`;
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
    if (/^(SEO:|For SEO\b|Cross-link\b|On Cigar Nexus\b)/i.test(plain)) return '';
    if (/^Map [A-Z][\s\S]{0,90}\bas\b/i.test(plain)) return '';
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

function decodeEntities(str) {
  return String(str || '')
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

function firstParagraphPlain(html) {
  const match = String(html || '').match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
  return decodeEntities(stripHtml(match ? match[1] : html));
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

// -----------------------------
// Node header summary ("who makes it" line) + kind accent
// -----------------------------
const HEADER_EXCLUDE = /historical|early|former|some production|before/i;
const MADE_AT_OUT = /manufactured at|contract manufactured|associated factory|manufactured by|production at|produced at|rolled at|made at|contract production|operates own factory|manufactures at/i;
const MADE_AT_IN = /^manufactures( \(|$)|^contract production|^produces|^rolls/i;
const OWNED_OUT = /^owned by|^brand of|^sold by|^operated by/i;
const OWNED_IN = /^owns|^operates|^sells/i;
const FOUNDED_OUT = /^founded by|^co-founded by|^created by/i;
const FOUNDED_IN = /^founded( \/|$)|^co-founded$|^created$/i;

function nodeKind(n) {
  if (!n) return 'other';
  if (n.type === 'factory') return 'factory';
  if (n.group === 'corporate') return 'corporate';
  if (n.group === 'family') return 'family';
  return 'other';
}

function buildHeaderFacts(node, allNodes, allLinks) {
  const byId = new Map(allNodes.map(n => [n.id, n]));
  const pick = (outRe, inRe, filter) => {
    const ids = [];
    allLinks.forEach(l => {
      const rel = String(l.type || '');
      if (HEADER_EXCLUDE.test(rel)) return;
      let other = null;
      if (l.source === node.id && outRe && outRe.test(rel)) other = l.target;
      else if (l.target === node.id && inRe && inRe.test(rel)) other = l.source;
      if (!other || other === node.id || ids.includes(other)) return;
      const o = byId.get(other);
      if (!o || (filter && !filter(o))) return;
      ids.push(other);
    });
    return ids;
  };
  const isFactory = o => o.type === 'factory';
  const notFactory = o => o.type !== 'factory';
  const isBrand = o => o.type === 'brand';
  const facts = [];
  const add = (label, ids, max) => { if (ids.length) facts.push({ label, ids, max }); };

  if (node.type === 'factory') {
    const brands = pick(/^manufactures|^contract production|^produces/i, new RegExp(MADE_AT_OUT.source + '|originated at', 'i'), o => o.type === 'brand' || o.type === 'company');
    if (brands.length) facts.push({ label: `Makes ${brands.length} brand${brands.length === 1 ? '' : 's'}`, ids: brands, max: 3, makes: true });
    add('Operated by', pick(/^operated by|^owned by/i, /^operates|^owns/i, notFactory), 2);
  } else if (node.type === 'brand') {
    add('Made at', pick(MADE_AT_OUT, MADE_AT_IN), 2);
    add('Owned by', pick(OWNED_OUT, OWNED_IN, notFactory), 2);
    if (facts.length < 2) add('Founded by', pick(FOUNDED_OUT, FOUNDED_IN, o => o.type === 'person'), 2);
  } else if (node.type === 'person') {
    add('Founded', pick(/^founded( \/|$)|^co-founded$|^created$/i, FOUNDED_OUT), 3);
    add('Owns', pick(/^owns/i, /^owned by/i), 2);
    if (facts.length < 2) add('Makes', pick(/^manufactures|^contract production|^produces/i, MADE_AT_OUT, o => o.type === 'brand' || o.type === 'company'), 3);
  } else {
    add('Made at', pick(MADE_AT_OUT, MADE_AT_IN), 3);
    add('Owns', pick(/^owns|^operates|^sells/i, OWNED_OUT, isBrand), 3);
    if (facts.length < 2) add('Operates', pick(/^operates(?! own factory)/i, /^operated by/i, isFactory), 2);
    if (facts.length < 2) add('Founded by', pick(FOUNDED_OUT, FOUNDED_IN), 2);
  }
  return facts;
}

function buildHeaderSummary(node, allNodes, allLinks) {
  const byId = new Map(allNodes.map(n => [n.id, n]));
  const link = id => {
    const o = byId.get(id);
    return `<a href="${getNodeUrl(id)}" class="node-summary__link node-summary__link--${nodeKind(o)}">${escapeHtml(o.name)}</a>`;
  };
  const list = (ids, max) => {
    const shown = ids.slice(0, max).map(link).join(', ');
    return ids.length > max ? `${shown} <span class="node-summary__more">+${ids.length - max} more</span>` : shown;
  };
  const parts = buildHeaderFacts(node, allNodes, allLinks).map(f =>
    `<span class="node-summary__part"><span class="node-summary__label">${f.label}</span> ${list(f.ids, f.max)}</span>`);
  if (!parts.length) return '';
  return `<p class="node-summary">${parts.join('<span class="node-summary__sep" aria-hidden="true">·</span>')}</p>`;
}

// -----------------------------
// Social previews: OG cards + short share descriptions
// -----------------------------
const OG_TYPE_LABEL = { brand: 'Brand', factory: 'Factory', person: 'Person', company: 'Company' };
const OG_COUNTRY = { usa: 'United States', dominican: 'Dominican Republic', 'costa rica': 'Costa Rica' };
const ABBREV = /(?:\b(?:Jr|Sr|Dr|Mr|Mrs|Ms|St|Co|Inc|Ltd|Corp|Bros|vs|No|Mt|Ft|approx|Av|Ave)|\b[A-Z]|\bS\.A|\bS\. de R\.L|\bU\.S|\bE\.P|\bA\.J|\bJ\.C|\bL\.P)\.$/;

function ogCountry(c) {
  if (!c) return '';
  const k = String(c).toLowerCase();
  return OG_COUNTRY[k] || k.replace(/\b\w/g, ch => ch.toUpperCase());
}

function splitSentences(text) {
  const out = [];
  let buf = '';
  const parts = String(text).split(/(?<=[.!?]["\u201d']?)\s+(?=["\u201c]?[A-Z0-9])/);
  for (const p of parts) {
    buf = buf ? `${buf} ${p}` : p;
    if (!ABBREV.test(buf)) { out.push(buf); buf = ''; }
  }
  if (buf) out.push(buf);
  return out;
}

function factValue(f, byId, max = 2) {
  const names = f.ids.slice(0, max).map(id => (byId.get(id) || {}).name || id);
  const more = f.ids.length - names.length;
  return names.join(', ') + (more > 0 ? ` +${more} more` : '');
}

function buildShareDescription(node, descHtml, facts, byId, max = 150) {
  const first = firstParagraphPlain(descHtml).replace(/\s+/g, ' ').replace(/\s+(['\u2019]s\b|[,.;:!?)])/g, '$1').trim();
  const sentences = splitSentences(first).filter(s => /[.!?]["\u201d']?$/.test(s));
  let out = '';
  for (const sentence of sentences) {
    const next = out ? `${out} ${sentence}` : sentence;
    if (next.length > max) break;
    out = next;
  }
  if (out.length >= 60) return out;
  // Fallback: one factual sentence from the header facts.
  const name = node.name || node.id;
  const type = formatType(node.type);
  const article = /^[aeiou]/i.test(type) ? 'an' : 'a';
  const f = facts[0];
  let s = `${name} is ${article} ${type}`;
  if (f) {
    const v = factValue(f, byId, 2).replace(/ \+\d+ more$/, '').replace(/, (?![^(]*\))([^,]*)$/, ' and $1');
    const lbl = f.label.toLowerCase();
    // "made at" / "owned by" read as participles; bare verbs ("operates", "founded") need "that".
    const rel = node.type === 'person' ? 'who' : 'that';
    const verb = f.makes ? `${rel} makes` : (/ (by|at|in)$/.test(lbl) ? lbl : `${rel} ${lbl}`);
    s += ` ${verb} ${v}`;
  } else if (node.country) {
    s += ` in ${formatCountry(node.country)}`;
  }
  s = s.replace(/\.*$/, '.');
  if (s.length <= max) {
    const tail = ` Explore ${node.type === 'person' ? 'their' : 'its'} connections on the Cigar Nexus map.`;
    return (s + tail).length <= max ? s + tail : s;
  }
  return out || s;
}

let OG_CARDS = null;
function buildAllOgCards(nodes, links) {
  const byId = new Map(nodes.map(n => [n.id, n]));
  const cards = nodes.map(node => ({
    id: node.id,
    name: node.name || node.id,
    typeLabel: OG_TYPE_LABEL[node.type] || 'Profile',
    country: ogCountry(node.country),
    facts: buildHeaderFacts(node, nodes, links).slice(0, 2).map(f => ({
      label: f.makes ? 'Makes' : f.label,
      value: factValue(f, byId, f.makes ? 3 : 2)
    }))
  }));
  const counts = nodes.reduce((a, n) => { a[n.type] = (a[n.type] || 0) + 1; return a; }, {});
  const stats = `${nodes.length} brands, factories, people and companies`;
  const tmp = path.join(require('os').tmpdir(), `og-cards-${process.pid}.json`);
  try {
    fs.writeFileSync(tmp, JSON.stringify({ cards, stats }));
    const out = execSync(`${JSON.stringify(process.execPath)} ${JSON.stringify(path.join(__dirname, 'og-cards.js'))} ${JSON.stringify(tmp)}`, { maxBuffer: 16 * 1024 * 1024, stdio: ['ignore', 'pipe', 'inherit'] });
    const parsed = JSON.parse(String(out));
    console.log(`OG cards: ${Object.keys(parsed.cards).length} ready (${parsed.rendered} rendered)`);
    return parsed.cards;
  } catch (err) {
    console.warn('OG cards unavailable, falling back to logo/social-preview images:', err.message);
    return null;
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) {}
  }
}

function getNodeUrl(nodeId) {
  return `/node/${nodeId}/`;
}

function buildConnectionsHtml(node, allNodes, allLinks) {
  const connections = getConnections(node.id, allNodes, allLinks);
  if (!connections.length) {
    return '<p class="text-sm text-[#6B8A84] italic">No direct connections listed.</p>';
  }

  const byId = new Map(allNodes.map(n => [n.id, n]));
  const kindOf = (n) => {
    if (!n) return 'other';
    if (n.type === 'factory') return 'factory';
    if (n.group === 'corporate') return 'corporate';
    if (n.group === 'family') return 'family';
    return 'other';
  };
  const kindLabel = { factory: 'Factory', corporate: 'Corporate group', family: 'Family / independent', other: 'Node' };

  // One card per connected node: same-node pairs (e.g. "contract production" + "manufactures")
  // collapse into a single card with every role shown as a pill. Exact repeat roles are dropped.
  const grouped = new Map();
  connections.forEach(c => {
    if (!grouped.has(c.otherId)) grouped.set(c.otherId, { otherId: c.otherId, otherName: c.otherName, roles: [] });
    const g = grouped.get(c.otherId);
    if (!g.roles.some(r => r.rel === c.rel && r.direction === c.direction)) g.roles.push({ rel: c.rel, direction: c.direction });
  });

  let html = '<ul class="connection-grid" role="list">';
  grouped.forEach(g => {
    const url = getNodeUrl(g.otherId);
    const kind = kindOf(byId.get(g.otherId));
    const pills = g.roles.map(r => {
      const dir = r.direction === 'out' ? '→' : '←';
      return `<span class="connection-role"><span class="connection-type" data-rel="${escapeHtml(r.rel)}" title="${escapeHtml(r.rel)}">${escapeHtml(r.rel)}</span><span class="connection-card__dir" aria-hidden="true">${dir}</span></span>`;
    }).join('');
    html += `
      <li class="connection-item connection-card connection-card--${kind}">
        <span class="connection-card__top">${pills}</span>
        <a href="${url}" class="connection-card__link"><span class="connection-card__dot" title="${kindLabel[kind]}" aria-hidden="true"></span>${escapeHtml(g.otherName)}</a>
      </li>`;
  });
  html += '</ul>';
  return html;
}

function linkType(link) {
  return String(link.type || '').toLowerCase();
}

// Same idea as getLinkCategory in script.js: free-text labels, matched by includes.
// "production" and "rolled" cover labels such as "production at" and "rolled at".
function isProductionLink(link) {
  const t = linkType(link);
  return t.includes('contract') || t.includes('manufactur') || t.includes('produced')
    || t.includes('production') || t.includes('rolled');
}

// The floor end of a production edge. "manufactures" / "manufactures for" put the
// floor on the source. "manufactured at", "produced at", and "production at" put it
// on the target.
function productionPlaceId(link) {
  if (!isProductionLink(link)) return null;
  const t = linkType(link);
  const sourceIsPlace = (t.includes('manufactures') && !t.includes('manufactured') && !t.includes('manufactures at'))
    || t.includes(' for ');
  return sourceIsPlace ? link.source : link.target;
}

function isOwnershipLink(link) {
  const t = linkType(link);
  return t.includes('owned') || t.includes('subsidiary') || t.includes('owns') || t.includes('brand of');
}

// "owns" : source is the parent. "owned by", "brand of", "subsidiary of": target is.
function ownershipParentId(link) {
  if (!isOwnershipLink(link)) return null;
  const t = linkType(link);
  if (t.includes('owns') && !t.includes('owned')) return link.source;
  return link.target;
}

function isListedBrand(node) {
  if (!node) return false;
  if (node.type === 'brand') return true;
  return node.type === 'company' && Array.isArray(node.productLines) && node.productLines.length > 0;
}

function preferBrands(indexOf) {
  return (a, b) => {
    const rank = (n) => (n.type === 'brand' ? 0 : 1);
    const byType = rank(a) - rank(b);
    if (byType) return byType;
    return (indexOf.get(a.id) || 0) - (indexOf.get(b.id) || 0);
  };
}

const RELATED_BRAND_CAP = 8;

function relatedBrandLinks(nodes) {
  return nodes.map(n => (
    `<a href="${getNodeUrl(n.id)}" class="related-chip related-chip--${nodeKind(n)} inline-flex items-center px-3 py-1.5 text-sm rounded-2xl bg-white border border-[#CFE0DC] text-[#1A3330] hover:border-[#CEA661] hover:text-[#14817A] transition-colors"><span class="related-chip__dot" aria-hidden="true"></span>${escapeHtml(n.name)}</a>`
  )).join('\n');
}

function relatedBrandSection(id, title, nodes) {
  if (!nodes.length) return '';
  return `<div class="mt-8">
    <h2 id="${id}" class="node-section-label">${title}</h2>
    <div class="related-chip-row flex flex-wrap gap-2">
      ${relatedBrandLinks(nodes)}
    </div>
  </div>`;
}

// Two-hop brands from baseGraphData only. No file-order filler.
// Also made at this factory: other brands that share a factory the current node
// reaches by a production edge. A brand counts as that factory when other brands
// are manufactured there (My Father is the example).
// Same parent company: other brands that share a company (or brand) the current
// node reaches by an ownership edge (owned by, owns, brand of, subsidiary).
// Drop a section with no matches. Drop the whole box when both are empty.
function buildRelatedHtml(node, allNodes, allLinks) {
  const byId = new Map(allNodes.map(n => [n.id, n]));
  const indexOf = new Map(allNodes.map((n, i) => [n.id, i]));

  const placeIsHub = (placeId) => {
    const place = byId.get(placeId);
    return !!(place && (place.type === 'factory' || place.type === 'brand') && place.id !== node.id);
  };

  const factoryIds = new Set();
  for (const link of allLinks) {
    if (link.source !== node.id && link.target !== node.id) continue;
    const place = productionPlaceId(link);
    if (place && placeIsHub(place)) factoryIds.add(place);
  }

  const factorySeen = new Set([node.id]);
  const factoryBrands = [];
  for (const link of allLinks) {
    const place = productionPlaceId(link);
    if (!place || !factoryIds.has(place)) continue;
    const otherId = place === link.source ? link.target : link.source;
    if (!otherId || otherId === place || factorySeen.has(otherId)) continue;
    const other = byId.get(otherId);
    if (!isListedBrand(other)) continue;
    factorySeen.add(otherId);
    factoryBrands.push(other);
  }
  factoryBrands.sort(preferBrands(indexOf));

  const parentIds = new Set();
  for (const link of allLinks) {
    const parent = ownershipParentId(link);
    if (!parent || parent === node.id) continue;
    const child = parent === link.source ? link.target : link.source;
    if (child !== node.id) continue;
    const parentNode = byId.get(parent);
    if (!parentNode || (parentNode.type !== 'company' && parentNode.type !== 'brand')) continue;
    parentIds.add(parent);
  }

  const parentSeen = new Set([node.id]);
  const parentBrands = [];
  for (const link of allLinks) {
    const parent = ownershipParentId(link);
    if (!parent || !parentIds.has(parent)) continue;
    const child = parent === link.source ? link.target : link.source;
    if (!child || child === parent || parentSeen.has(child)) continue;
    const other = byId.get(child);
    if (!isListedBrand(other)) continue;
    parentSeen.add(child);
    parentBrands.push(other);
  }
  parentBrands.sort(preferBrands(indexOf));

  const factoryHtml = relatedBrandSection(
    'also-made-heading',
    'Also made at this factory',
    factoryBrands.slice(0, RELATED_BRAND_CAP)
  );
  const parentHtml = relatedBrandSection(
    'same-parent-heading',
    'Same parent company',
    parentBrands.slice(0, RELATED_BRAND_CAP)
  );
  if (!factoryHtml && !parentHtml) return '';
  return `<section class="related-brands" aria-label="Related brands">${factoryHtml}${parentHtml}</section>`;
}

function buildProductLinesHtml(node) {
  if (!node.productLines || !node.productLines.length) return '';
  let html = '<section class="mt-8" aria-labelledby="product-lines-heading">';
  html += '<h2 id="product-lines-heading" class="node-section-label">Notable Cigars &amp; Product Lines</h2>';
  html += '<div class="product-chip-row flex flex-wrap gap-1.5">';
  let shopLinks = 0;
  node.productLines.forEach(line => {
    const shopUrl = productLineShopUrl(node, line);
    if (shopUrl) {
      shopLinks++;
      html += `<a href="${escapeHtml(shopUrl)}" target="_blank" rel="sponsored noopener noreferrer" class="product-chip product-chip--shop inline-block px-2.5 py-0.5 text-xs rounded-full bg-white border border-[#CFE0DC] text-[#14817A]" title="Shop ${escapeHtml(line)} at Famous Smoke Shop">${escapeHtml(line)}<span class="product-chip__shop" aria-hidden="true">↗</span></a>`;
    } else {
      html += `<span class="product-chip inline-block px-2.5 py-0.5 text-xs rounded-full bg-white border border-[#CFE0DC] text-[#14817A]">${escapeHtml(line)}</span>`;
    }
  });
  html += '</div>';
  if (shopLinks) html += `<style>${PRODUCT_SHOP_CSS}</style>`;
  if (shopLinks) html += '<p class="product-chip-note">↗ Linked lines open Famous Smoke Shop. As an affiliate I may earn a commission from qualifying purchases.</p>';
  html += '</section>';
  return html;
}

function buildFindCigarsHtml(buildFamousSmokeBuyHtml) {
  if (!buildFamousSmokeBuyHtml) return '';
  return `<section class="find-card mt-8" aria-labelledby="find-cigars-heading">
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
  const rel = url.slice(SITE.length + 1).replace(/\?.*$/, '');
  return path.join(ROOT, rel.replace(/\//g, path.sep));
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

const DIRECTORY_FLAGS = {
  nicaragua: ['🇳🇮', 'Nicaragua'], dominican: ['🇩🇴', 'Dominican Republic'], honduras: ['🇭🇳', 'Honduras'],
  usa: ['🇺🇸', 'United States'], 'costa rica': ['🇨🇷', 'Costa Rica'], belgium: ['🇧🇪', 'Belgium'],
  denmark: ['🇩🇰', 'Denmark'], switzerland: ['🇨🇭', 'Switzerland'],
};

function directoryNodeKind(n) {
  if (n.type === 'factory') return 'factory';
  if (n.group === 'corporate') return 'corporate';
  if (n.group === 'family') return 'family';
  return 'other';
}

function directoryLetter(name) {
  const c = String(name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(c) ? c : '#';
}

/** Full /directory.html: tabs + A–Z + filter. Every profile is a plain static <a href>. */
function buildDirectoryPageHtml(nodes) {
  const sections = DIRECTORY_GROUPS.map((group) => {
    const items = nodes
      .filter((n) => n.type === group.type)
      .slice()
      .sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id), 'en', { sensitivity: 'base' }));
    let lastLetter = '';
    const lis = items.map((n) => {
      const name = escapeHtml(n.name || n.id);
      const letter = directoryLetter(n.name || n.id);
      let head = '';
      if (letter !== lastLetter) {
        lastLetter = letter;
        head = `<li class="dir-letter" id="${group.type}-${letter === '#' ? 'num' : letter}" data-letter="${letter}" aria-hidden="true">${letter}</li>`;
      }
      const flag = DIRECTORY_FLAGS[String(n.country || '').toLowerCase()];
      const flagHtml = flag ? `<span class="dir-flag" title="${flag[1]}" aria-label="${flag[1]}">${flag[0]}</span>` : '';
      return `${head}<li class="dir-item dir-item--${directoryNodeKind(n)}" data-letter="${letter}"><span class="dir-dot" aria-hidden="true"></span><a href="/node/${escapeHtml(n.id)}/">${name}</a>${flagHtml}</li>`;
    }).join('');
    return `<section class="dir-section profile-directory__group" id="dir-${group.type}" data-type="${escapeHtml(group.type)}">
      <div class="dir-section__head">
        <span class="profile-directory__dot profile-directory__dot--${directoryGroupClass(group.type)}" aria-hidden="true"></span>
        <span class="profile-directory__label">${escapeHtml(group.label)}</span>
        <span class="profile-directory__count">${items.length}</span>
        <span class="profile-directory__blurb">${escapeHtml(group.blurb)}</span>
      </div>
      <ul class="dir-list">${lis}</ul>
    </section>`;
  }).join('\n');

  const tabs = [`<button type="button" class="dir-tab is-active" data-tab="all">All <span>${nodes.length}</span></button>`]
    .concat(DIRECTORY_GROUPS.map((g) => `<button type="button" class="dir-tab" data-tab="${g.type}">${escapeHtml(g.label)} <span>${nodes.filter((n) => n.type === g.type).length}</span></button>`))
    .join('');
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    .map((l) => `<button type="button" class="dir-az__l" data-jump="${l}">${l}</button>`).join('');

  return `<div class="dir-toolbar" role="toolbar" aria-label="Directory navigation">
  <div class="dir-toolbar__row">
    <nav class="dir-tabs" aria-label="Sections">${tabs}</nav>
    <label class="dir-filter"><span class="dir-visually-hidden">Filter the directory</span><input type="search" id="dir-filter" placeholder="Filter names…" autocomplete="off" spellcheck="false"></label>
  </div>
  <div class="dir-az" aria-label="Jump to letter">${letters}</div>
  <p class="dir-empty" id="dir-empty" hidden>No names match that filter.</p>
</div>
${sections}`;
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
  const groups = buildDirectoryPageHtml(nodes);
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
  OG_CARDS = buildAllOgCards(baseGraphData.nodes, allLinks);
  const nodesById = new Map(baseGraphData.nodes.map(n => [n.id, n]));
  let overrideCount = 0;
  let autoCount = 0;

  for (const node of baseGraphData.nodes) {
    const dir = path.join(outputBase, node.id);
    fs.mkdirSync(dir, { recursive: true });

    const connections = getConnections(node.id, baseGraphData.nodes, allLinks);
    const descHtml = resolveDescription(node, connections, drawerDescriptions, expandedOverrides);
    if (expandedOverrides[node.id]) overrideCount++;
    else autoCount++;

    const plainDesc = META_PINS[node.id] || buildMetaDescription(descHtml);
    const canonical = `${SITE}/node/${node.id}/`;
    const mapUrl = `/?node=${node.id}`;
    const facts = buildHeaderFacts(node, baseGraphData.nodes, allLinks);
    const shareDesc = buildShareDescription(node, descHtml, facts, nodesById);
    const card = OG_CARDS && OG_CARDS[node.id];
    let socialImage, ogDimensions, ogImageAlt, twitterCard;
    if (card) {
      socialImage = { url: `${SITE}${card.path}?v=${card.version}`, kind: 'card' };
      ogDimensions = { width: 1200, height: 630 };
      const typeWord = OG_TYPE_LABEL[node.type] || 'Profile';
      const f = facts[0];
      ogImageAlt = `${node.name || node.id}: ${typeWord} profile on Cigar Nexus${f ? ` (${f.makes ? 'makes' : f.label.toLowerCase()} ${factValue(f, nodesById, 2)})` : ''}`;
      twitterCard = 'summary_large_image';
    } else {
      socialImage = resolveSocialImage(node);
      ogDimensions = resolveOgImageDimensions(socialImage);
      ogImageAlt = `${node.name || node.id} | Cigar Nexus`;
      twitterCard = twitterCardForSocialImage(socialImage.kind);
    }

    const page = template
      .replace(/\{\{NAME\}\}/g, escapeHtml(node.name))
      .replace(/\{\{ID\}\}/g, node.id)
      .replace(/\{\{CANONICAL\}\}/g, canonical)
      .replace(/\{\{META_DESCRIPTION\}\}/g, escapeHtml(plainDesc))
      .replace(/\{\{OG_IMAGE\}\}/g, escapeHtml(socialImage.url))
      .replace(/\{\{OG_IMAGE_WIDTH\}\}/g, String(ogDimensions.width))
      .replace(/\{\{OG_IMAGE_HEIGHT\}\}/g, String(ogDimensions.height))
      .replace(/\{\{OG_IMAGE_ALT\}\}/g, escapeHtml(ogImageAlt))
      .replace(/\{\{TWITTER_CARD\}\}/g, twitterCard)
      .replace(/\{\{OG_TITLE\}\}/g, escapeHtml(node.name || node.id))
      .replace(/\{\{OG_DESCRIPTION\}\}/g, escapeHtml(shareDesc))
      .replace(/\{\{DESCRIPTION_HTML\}\}/g, descHtml)
      .replace(/\{\{META_PILLS\}\}/g, buildMetaPills(node))
      .replace(/\{\{HEADER_SUMMARY\}\}/g, buildHeaderSummary(node, baseGraphData.nodes, allLinks))
      .replace(/\{\{NODE_KIND\}\}/g, nodeKind(node))
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