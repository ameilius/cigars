/**
 * Regenerate favicons, PWA icons, and social preview from logos/cigarnexus-svg-crop.svg
 * Run: node scripts/generate-brand-assets.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const toIco = require('to-ico');

const ROOT = path.join(__dirname, '..');
const SRC_SVG = path.join(ROOT, 'logos', 'cigarnexus-svg-crop.svg');
const SRC_PNG = path.join(ROOT, 'logos', 'cigarnexus.png');

const BRAND = {
  teal: '#14817A',
  gold: '#CEA661',
  black: '#0a0a0a',
};

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    alpha: 1,
  };
}

async function markBuffer(maxWidth = 512) {
  return sharp(SRC_SVG)
    .resize(maxWidth, null, { fit: 'inside' })
    .png()
    .toBuffer();
}

async function squarePng(size, { padding = 0.1, background = BRAND.black } = {}) {
  const mark = await markBuffer(size * 2);
  const inner = Math.round(size * (1 - padding * 2));
  const resized = await sharp(mark)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const bg = background ? hexToRgb(background) : { r: 0, g: 0, b: 0, alpha: 0 };

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: bg,
    },
  })
    .composite([{ input: resized, gravity: 'centre' }])
    .png()
    .toBuffer();
}

async function writeSquare(size, filename, opts) {
  const buf = await squarePng(size, opts);
  const out = path.join(ROOT, filename);
  fs.writeFileSync(out, buf);
  console.log('Wrote', filename, `(${size}x${size})`);
  return buf;
}

async function writeFaviconIco() {
  const sizes = [16, 32, 48];
  const pngs = await Promise.all(sizes.map((s) => squarePng(s, { padding: 0.08 })));
  const ico = await toIco(pngs);
  fs.writeFileSync(path.join(ROOT, 'favicon.ico'), ico);
  console.log('Wrote favicon.ico');
}

async function writeFaviconSvg() {
  const cropRaw = fs.readFileSync(SRC_SVG, 'utf8');
  const inner = cropRaw
    .replace(/<\?xml[^>]*>/i, '')
    .replace(/<svg[^>]*>/i, '')
    .replace(/<\/svg>\s*$/i, '')
    .trim();

  const logoW = 379;
  const logoH = 260;
  const canvas = 32;
  const pad = 2;
  const scale = (canvas - pad * 2) / logoW;
  const scaledH = logoH * scale;
  const tx = pad;
  const ty = (canvas - scaledH) / 2;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas} ${canvas}">
  <rect width="${canvas}" height="${canvas}" fill="${BRAND.black}"/>
  <g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(6)})">
${inner}
  </g>
</svg>`;

  fs.writeFileSync(path.join(ROOT, 'favicon.svg'), svg, 'utf8');
  console.log('Wrote favicon.svg (vector logo on black)');
}

async function writeSocialPreview() {
  const W = 1200;
  const H = 630;
  const logo = await sharp(SRC_SVG)
    .resize(820, null, { fit: 'inside' })
    .png()
    .toBuffer();

  const bgSvg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${BRAND.black}"/>
    <rect x="0" y="${H - 6}" width="100%" height="6" fill="${BRAND.teal}" opacity="0.85"/>
    <rect x="0" y="0" width="100%" height="3" fill="${BRAND.gold}" opacity="0.55"/>
  </svg>`);

  await sharp(bgSvg)
    .resize(W, H)
    .composite([{ input: logo, gravity: 'centre' }])
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(path.join(ROOT, 'social-preview.jpg'));

  console.log('Wrote social-preview.jpg (1200x630, black background)');
}

async function writeHeaderMark() {
  if (!fs.existsSync(SRC_PNG)) return;
  const meta = await sharp(SRC_PNG).metadata();
  const cropH = Math.round(meta.height * 0.68);
  const mark = await sharp(SRC_PNG)
    .extract({ left: 0, top: 0, width: meta.width, height: cropH })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(ROOT, 'logos', 'cigarnexus-mark.png'), mark);
  console.log('Wrote logos/cigarnexus-mark.png (transparent monogram crop)');
}

async function main() {
  if (!fs.existsSync(SRC_SVG)) throw new Error(`Missing source: ${SRC_SVG}`);

  await writeHeaderMark();
  await writeSquare(96, 'favicon-96x96.png', { padding: 0.08 });
  await writeSquare(180, 'apple-touch-icon.png', { padding: 0.14 });
  await writeSquare(192, 'web-app-manifest-192x192.png', { padding: 0.18 });
  await writeSquare(512, 'web-app-manifest-512x512.png', { padding: 0.22 });
  await writeFaviconIco();
  await writeFaviconSvg();
  await writeSocialPreview();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});