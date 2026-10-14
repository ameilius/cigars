/**
 * Build-time Open Graph cards (1200x630 PNG) for every node + a default card.
 * Text is rendered as vector paths (opentype.js) so output never depends on
 * system fonts. Images are cached by content hash in og/manifest.json.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const FONT_DIR = path.join(ROOT, 'assets', 'og-fonts');
const MARK_SVG = path.join(ROOT, 'logos', 'cigarnexus-svg-crop.svg'); // CN monogram + wordmark; we keep the monogram only
const OUT_DIR = path.join(ROOT, 'og');
const W = 1200;
const H = 630;
const RENDER_VERSION = 7; // bump to force a full re-render

const C = {
  gold: '#CEA661',
  goldDim: '#A8854A',
  cream: '#F4E9D6',
  creamDim: '#D9C8AE',
  teal: '#14817A'
};

let opentype;
let sharp;
let fonts;
let markPng;

function loadDeps() {
  if (fonts) return;
  opentype = require('opentype.js');
  sharp = require('sharp');
  const load = (f) => opentype.loadSync(path.join(FONT_DIR, f));
  fonts = {
    serif: load('DMSerifDisplay-Regular.ttf'),
    sans: load('Lato-Regular.ttf'),
    sansBold: load('Lato-Bold.ttf'),
    caps: load('CormorantSC-SemiBold.ttf')
  };
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function width(font, text, size, ls = 0) {
  return font.getAdvanceWidth(text, size, { kerning: true }) + ls * size * Math.max(0, [...text].length - 1);
}

/** Text as an SVG <path>. anchor: start|middle|end. ls = letter spacing in em. */
function textPath(font, text, size, x, y, fill, { anchor = 'start', ls = 0, opacity = 1 } = {}) {
  const w = width(font, text, size, ls);
  let cx = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  let d = '';
  if (!ls) {
    d = font.getPath(text, cx, y, size, { kerning: true }).toPathData(2);
  } else {
    for (const ch of text) {
      d += font.getPath(ch, cx, y, size).toPathData(2);
      cx += font.getAdvanceWidth(ch, size) + ls * size;
    }
  }
  return `<path d="${d}" fill="${fill}"${opacity < 1 ? ` fill-opacity="${opacity}"` : ''}/>`;
}

/** Greedy word wrap into at most maxLines lines; last line gets an ellipsis if needed. */
function wrap(font, text, size, maxW, maxLines) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (let i = 0; i < words.length; i++) {
    const next = cur ? `${cur} ${words[i]}` : words[i];
    if (width(font, next, size) <= maxW || !cur) { cur = next; continue; }
    lines.push(cur);
    cur = words[i];
    if (lines.length === maxLines) { cur = null; break; }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines || (cur === null)) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    while (last && width(font, `${last}…`, size) > maxW) last = last.replace(/\s*\S+$/, '');
    kept[maxLines - 1] = `${last}…`;
    return kept;
  }
  return lines;
}

function fitName(name) {
  const maxW = 1040;
  for (let size = 96; size >= 56; size -= 4) {
    const lines = wrap(fonts.serif, name, size, maxW, 2);
    if (lines.length === 1 || size <= 72) {
      if (!lines[lines.length - 1].endsWith('…') || size === 56) return { size, lines };
    }
  }
  return { size: 56, lines: wrap(fonts.serif, name, 56, maxW, 2) };
}

function frame() {
  return `
  <defs>
    <linearGradient id="leather" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3B2416"/>
      <stop offset="0.55" stop-color="#24150C"/>
      <stop offset="1" stop-color="#130B06"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.28" cy="0.30" r="0.85">
      <stop offset="0" stop-color="#6B4428" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75">
      <stop offset="0.6" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.55"/>
    </radialGradient>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="n"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="table" tableValues="0 0.10"/></feComponentTransfer>
    </filter>
    <linearGradient id="goldline" x1="0" x2="1">
      <stop offset="0" stop-color="${C.gold}" stop-opacity="0"/>
      <stop offset="0.15" stop-color="${C.gold}"/>
      <stop offset="0.85" stop-color="${C.gold}"/>
      <stop offset="1" stop-color="${C.gold}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#leather)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" filter="url(#grain)"/>
  <rect width="${W}" height="${H}" fill="url(#vignette)"/>
  <rect x="26" y="26" width="${W - 52}" height="${H - 52}" rx="14" fill="none" stroke="${C.gold}" stroke-opacity="0.85" stroke-width="2"/>
  <rect x="36" y="36" width="${W - 72}" height="${H - 72}" rx="9" fill="none" stroke="${C.gold}" stroke-opacity="0.35" stroke-width="1"/>`;
}

function wordmark(x, y) {
  // mark image is composited separately at (x, y-38) 64px tall; text follows
  return textPath(fonts.caps, 'Cigar Nexus', 34, x + 102, y, C.gold, { ls: 0.12 });
}

function pill(label, rightX, y) {
  const size = 19;
  const ls = 0.22;
  const tw = width(fonts.sansBold, label, size, ls);
  const padX = 20;
  const h = 40;
  const x = rightX - tw - padX * 2;
  return `<rect x="${x}" y="${y - 28}" width="${tw + padX * 2}" height="${h}" rx="20" fill="#000" fill-opacity="0.25" stroke="${C.gold}" stroke-width="1.5"/>` +
    textPath(fonts.sansBold, label, size, x + padX, y, C.gold, { ls });
}

function nodeSvg(card) {
  const parts = [frame()];
  parts.push(wordmark(80, 116));
  if (card.typeLabel) parts.push(pill(card.typeLabel.toUpperCase(), W - 80, 112));

  const { size, lines } = fitName(card.name);
  const lineH = size * 1.08;
  const factsCount = Math.min(card.facts.length, 2);
  const blockH = lines.length * lineH + 40 + factsCount * 50;
  let y = Math.max(250, 340 - blockH / 2 + size * 0.8);
  for (const line of lines) {
    parts.push(textPath(fonts.serif, line, size, 80, y, C.cream));
    y += lineH;
  }
  y = y - lineH + 38;
  parts.push(`<rect x="80" y="${y}" width="140" height="3" fill="url(#goldline)"/>`);
  y += 62;
  for (const f of card.facts.slice(0, 2)) {
    const label = f.label.toUpperCase();
    const ls = 0.16;
    parts.push(textPath(fonts.sansBold, label, 20, 80, y, C.gold, { ls }));
    const lx = 80 + width(fonts.sansBold, label, 20, ls) + 18;
    const val = wrap(fonts.sans, f.value, 30, W - 80 - lx, 1)[0];
    parts.push(textPath(fonts.sans, val, 30, lx, y + 1, C.cream, { opacity: 0.92 }));
    y += 50;
  }
  parts.push(textPath(fonts.sans, 'cigarnexus.app', 22, 80, H - 70, C.creamDim, { opacity: 0.8, ls: 0.04 }));
  const dotX = 80 + width(fonts.sans, 'cigarnexus.app', 22, 0.04) + 18;
  parts.push(`<circle cx="${dotX}" cy="${H - 77}" r="2.5" fill="${C.goldDim}"/>`);
  parts.push(textPath(fonts.sans, 'Premium Cigar Industry Map', 22, dotX + 18, H - 70, C.goldDim, { ls: 0.04 }));
  if (card.country) parts.push(textPath(fonts.sansBold, card.country.toUpperCase(), 19, W - 80, H - 70, C.goldDim, { anchor: 'end', ls: 0.2 }));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${parts.join('')}</svg>`;
}

function defaultSvg(stats) {
  const parts = [frame()];
  parts.push(textPath(fonts.caps, 'Cigar Nexus', 104, W / 2, 400, C.gold, { anchor: 'middle', ls: 0.1 }));
  parts.push(`<rect x="${W / 2 - 160}" y="432" width="320" height="3" fill="url(#goldline)"/>`);
  parts.push(textPath(fonts.serif, 'The interactive map of the premium cigar industry', 38, W / 2, 492, C.cream, { anchor: 'middle' }));
  parts.push(textPath(fonts.sans, stats, 24, W / 2, 545, C.creamDim, { anchor: 'middle', ls: 0.04, opacity: 0.85 }));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${parts.join('')}</svg>`;
}

async function getMark(height) {
  if (!markPng) markPng = {};
  if (!markPng[height]) {
    // The source art stacks the CN monogram (top ~77%) over a small wordmark; crop to the monogram.
    const full = Math.round(height / 0.77) + 8;
    const big = await sharp(MARK_SVG, { density: 600 }).resize(null, full).png().toBuffer();
    const md = await sharp(big).metadata();
    const mono = await sharp(big).extract({ left: 0, top: 0, width: md.width, height: Math.round(md.height * 0.775) }).png().toBuffer();
    const monoTrim = await sharp(mono).trim().png().toBuffer();
    markPng[height] = await sharp(monoTrim).resize(null, height).png().toBuffer();
  }
  return markPng[height];
}

async function renderPng(svg, marks) {
  const comps = [];
  for (const m of marks) comps.push({ input: await getMark(m.h), left: m.left(await sharp(await getMark(m.h)).metadata()), top: m.top });
  return sharp(Buffer.from(svg)).composite(comps).jpeg({ quality: 86, mozjpeg: true, chromaSubsampling: '4:4:4' }).toBuffer();
}

function hash(obj) {
  return crypto.createHash('sha1').update(JSON.stringify({ v: RENDER_VERSION, ...obj })).digest('hex').slice(0, 10);
}

/**
 * cards: [{ id, name, typeLabel, facts:[{label,value}], country }]
 * returns Map id -> { file, url-path, version } ; id "_default" for the default card.
 */
async function buildOgCards(cards, { stats = '' } = {}) {
  loadDeps();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifestPath = path.join(OUT_DIR, 'manifest.json');
  let manifest = {};
  try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch (_) {}
  const result = new Map();
  let rendered = 0;

  const jobs = cards.map((c) => ({ id: c.id, h: hash(c), svg: () => nodeSvg(c),
    marks: [{ h: 48, top: 116 - 39, left: () => 80 }] }));
  jobs.push({ id: '_default', h: hash({ stats }), svg: () => defaultSvg(stats),
    marks: [{ h: 150, top: 110, left: (md) => Math.round((W - md.width) / 2) }] });

  for (const j of jobs) {
    const file = path.join(OUT_DIR, `${j.id === '_default' ? 'default' : j.id}.jpg`);
    if (manifest[j.id] !== j.h || !fs.existsSync(file)) {
      fs.writeFileSync(file, await renderPng(j.svg(), j.marks));
      manifest[j.id] = j.h;
      rendered++;
    }
    result.set(j.id, { file, path: `/og/${path.basename(file)}`, version: j.h });
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));
  return { result, rendered };
}

module.exports = { buildOgCards, OG_W: W, OG_H: H };

// CLI: node scripts/og-cards.js <cards.json>  -> prints JSON {id: {path, version}}
if (require.main === module) {
  const input = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  buildOgCards(input.cards, { stats: input.stats })
    .then(({ result, rendered }) => {
      const out = {};
      for (const [id, v] of result) out[id] = { path: v.path, version: v.version };
      process.stdout.write(JSON.stringify({ rendered, cards: out }));
    })
    .catch((err) => { console.error(err && err.stack || err); process.exit(1); });
}
