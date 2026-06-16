/**
 * One-shot brand palette migration: burgundy/gold → logo teal/gold.
 * Logo SVG: #14817A (teal), #CEA661 (gold)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FILES = [
  'styles.css',
  'index.html',
  'about.html',
  'script.js',
  'site.webmanifest',
  'scripts/node-template.html',
  'scripts/generate-node-pages.js',
];

const REPLACEMENTS = [
  ['#6b3535', '#1A7570'],
  ['#521a1a', '#0B5651'],
  ['#4a2424', '#0D5A55'],
  ['#6b2d2d', '#117A72'],
  ['#7a3d3d', '#1A7570'],
  ['#7a2020', '#0F6A64'],
  ['#8b5e5e', '#5A9A92'],
  ['#5c2e2e', '#14817A'],
  ['#5c4638', '#3D5A55'],
  ['#c5a26f', '#CEA661'],
  ['#d4b17e', '#DBB978'],
  ['#b8a080', '#C4B896'],
  ['#c8b594', '#D9CDB0'],
  ['#d4c4a8', '#CFE0DC'],
  ['#d4b890', '#E0D0B0'],
  ['#d4b84a', '#CEA661'],
  ['#d4a8a8', '#A8D4CF'],
  ['#f8f5f0', '#F6F8F7'],
  ['#f4e9d8', '#ECF4F2'],
  ['#f5f0e8', '#EEF4F2'],
  ['#f0e9df', '#E8EFED'],
  ['#ede4d0', '#E5EBE9'],
  ['#e8d9c3', '#DCEBE8'],
  ['#3f2a2a', '#1A3330'],
  ['#8b6f5c', '#6B8A84'],
  ['#8b7a6f', '#7A9A94'],
  ['#8b5e3c', '#A67C3D'],
  ['#8b6a1a', '#8B7355'],
  ['#fdfaf3', '#F8FBFA'],
  ['#fdfaf6', '#F8FBFA'],
  ['#fdf8f0', '#F8FBFA'],
  ['#fdf8ec', '#F8FBFA'],
  ['#f0e4cd', '#E6EFEC'],
  ['#f8f0df', '#F2EBE0'],
  ['#faf0f0', '#F0F7F6'],
  ['#faf4f4', '#F0F7F6'],
  ['#faf4ec', '#F5F0E8'],
  ['rgba(92, 46, 46', 'rgba(20, 129, 122'],
  ['rgba(197, 162, 111', 'rgba(206, 166, 97'],
  ['rgba(139, 111, 92', 'rgba(107, 138, 132'],
  ['rgba(139, 122, 111', 'rgba(122, 154, 148'],
  ['rgb(92,46,46', 'rgb(20,129,122'],
];

for (const file of FILES) {
  const full = path.join(ROOT, file);
  let text = fs.readFileSync(full, 'utf8');
  for (const [from, to] of REPLACEMENTS) {
    text = text.split(from).join(to);
  }
  fs.writeFileSync(full, text, 'utf8');
  console.log('Updated', file);
}