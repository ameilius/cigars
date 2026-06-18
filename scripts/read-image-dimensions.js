/**
 * Read raster/SVG image dimensions from file headers (no native deps).
 * Used by generate-node-pages.js on deploy where sharp may be unavailable.
 */
const fs = require('fs');

const SOF_MARKERS = new Set([
  0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF
]);

function readPngDimensions(buf) {
  if (buf.length < 24) return null;
  if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4E || buf[3] !== 0x47) return null;
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return width > 0 && height > 0 ? { width, height } : null;
}

function readGifDimensions(buf) {
  if (buf.length < 10) return null;
  if (buf.toString('ascii', 0, 3) !== 'GIF') return null;
  const width = buf.readUInt16LE(6);
  const height = buf.readUInt16LE(8);
  return width > 0 && height > 0 ? { width, height } : null;
}

function readJpegDimensions(buf) {
  if (buf.length < 4 || buf[0] !== 0xFF || buf[1] !== 0xD8) return null;

  let offset = 2;
  while (offset + 9 < buf.length) {
    if (buf[offset] !== 0xFF) {
      offset++;
      continue;
    }

    const marker = buf[offset + 1];
    if (marker === 0xD9 || marker === 0xDA) break;

    const segmentLength = buf.readUInt16BE(offset + 2);
    if (segmentLength < 2 || offset + 2 + segmentLength > buf.length) break;

    if (SOF_MARKERS.has(marker)) {
      const height = buf.readUInt16BE(offset + 5);
      const width = buf.readUInt16BE(offset + 7);
      return width > 0 && height > 0 ? { width, height } : null;
    }

    offset += 2 + segmentLength;
  }

  return null;
}

function readWebpDimensions(buf) {
  if (buf.length < 30) return null;
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null;

  const chunk = buf.toString('ascii', 12, 16);
  if (chunk === 'VP8 ' && buf.length >= 30) {
    const width = buf.readUInt16LE(26) & 0x3fff;
    const height = buf.readUInt16LE(28) & 0x3fff;
    return width > 0 && height > 0 ? { width, height } : null;
  }

  if (chunk === 'VP8L' && buf.length >= 25) {
    const bits = buf.readUInt32LE(21);
    const width = (bits & 0x3fff) + 1;
    const height = ((bits >> 14) & 0x3fff) + 1;
    return width > 0 && height > 0 ? { width, height } : null;
  }

  if (chunk === 'VP8X' && buf.length >= 30) {
    const width = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
    const height = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
    return width > 0 && height > 0 ? { width, height } : null;
  }

  return null;
}

function readSvgDimensions(buf) {
  const text = buf.toString('utf8', 0, Math.min(buf.length, 16384));
  if (!/<svg[\s>]/i.test(text)) return null;

  const viewBoxMatch = text.match(/viewBox=["']([^"']+)["']/i);
  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      return { width: Math.round(parts[2]), height: Math.round(parts[3]) };
    }
  }

  const widthMatch = text.match(/\bwidth=["']([\d.]+)/i);
  const heightMatch = text.match(/\bheight=["']([\d.]+)/i);
  if (widthMatch && heightMatch) {
    const width = Math.round(parseFloat(widthMatch[1]));
    const height = Math.round(parseFloat(heightMatch[1]));
    if (width > 0 && height > 0) return { width, height };
  }

  return null;
}

function readImageDimensions(filePath) {
  let buf;
  try {
    buf = fs.readFileSync(filePath);
  } catch (err) {
    return null;
  }

  if (!buf || buf.length < 4) return null;

  return readPngDimensions(buf)
    || readGifDimensions(buf)
    || readJpegDimensions(buf)
    || readWebpDimensions(buf)
    || readSvgDimensions(buf);
}

module.exports = { readImageDimensions };