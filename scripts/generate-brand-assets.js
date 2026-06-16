/**
 * Regenerate favicons, PWA icons, and social preview from logos/cigarnexus.png
 * Run: node scripts/generate-brand-assets.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const toIco = require('to-ico');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'logos', 'cigarnexus.png');
const FULL_SRC = path.join(ROOT, 'logos', 'cigarnexus.png');

const BRAND = {
  teal: '#14817A',
  gold: '#CEA661',
  bg: '#F6F8F7',
  surface: '#ECF4F2',
};

async function markBuffer() {
  const meta = await sharp(SRC).metadata();
  const cropH = Math.round(meta.height * 0.68);
  return sharp(SRC)
    .extract({ left: 0, top: 0, width: meta.width, height: cropH })
    .png()
    .toBuffer();
}

async function squarePng(size, { padding = 0.1, background = null } = {}) {
  const mark = await markBuffer();
  const inner = Math.round(size * (1 - padding * 2));
  const resized = await sharp(mark)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const bg = background
    ? (() => {
        const h = background.replace('#', '');
        return {
          r: parseInt(h.slice(0, 2), 16),
          g: parseInt(h.slice(2, 4), 16),
          b: parseInt(h.slice(4, 6), 16),
          alpha: 1,
        };
      })()
    : { r: 0, g: 0, b: 0, alpha: 0 };

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
  const mark = await markBuffer();
  const meta = await sharp(mark).metadata();
  const b64 = (await sharp(mark).png().toBuffer()).toString('base64');
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${meta.width} ${meta.height}">
  <image width="${meta.width}" height="${meta.height}" href="data:image/png;base64,${b64}"/>
</svg>`;
  fs.writeFileSync(path.join(ROOT, 'favicon.svg'), svg, 'utf8');
  console.log('Wrote favicon.svg');
}

async function writeSocialPreview() {
  const W = 1200;
  const H = 630;
  const logo = await sharp(FULL_SRC)
    .resize(820, null, { fit: 'inside' })
    .png()
    .toBuffer();

  const bgSvg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${BRAND.bg}"/>
        <stop offset="45%" stop-color="${BRAND.surface}"/>
        <stop offset="100%" stop-color="#E2EEEB"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <rect x="0" y="${H - 6}" width="100%" height="6" fill="${BRAND.teal}" opacity="0.85"/>
    <rect x="0" y="0" width="100%" height="3" fill="${BRAND.gold}" opacity="0.55"/>
  </svg>`);

  await sharp(bgSvg)
    .resize(W, H)
    .composite([{ input: logo, gravity: 'centre' }])
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(path.join(ROOT, 'social-preview.jpg'));

  console.log('Wrote social-preview.jpg (1200x630)');
}

async function writeHeaderMark() {
  const mark = await markBuffer();
  fs.writeFileSync(path.join(ROOT, 'logos', 'cigarnexus-mark.png'), mark);
  console.log('Wrote logos/cigarnexus-mark.png (transparent monogram crop)');
}

async function main() {
  if (!fs.existsSync(SRC)) throw new Error(`Missing source: ${SRC}`);

  await writeHeaderMark();
  await writeSquare(96, 'favicon-96x96.png', { padding: 0.08 });
  await writeSquare(180, 'apple-touch-icon.png', {
    padding: 0.14,
    background: BRAND.bg,
  });
  await writeSquare(192, 'web-app-manifest-192x192.png', {
    padding: 0.18,
    background: BRAND.bg,
  });
  await writeSquare(512, 'web-app-manifest-512x512.png', {
    padding: 0.22,
    background: BRAND.bg,
  });
  await writeFaviconIco();
  await writeFaviconSvg();
  await writeSocialPreview();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});