/**
 * One-time helper: re-extract manual expanded overrides from script.js
 * (only needed if you temporarily inlined expanded copy again).
 *
 * Normal workflow: edit expanded-descriptions.js directly.
 * Run on a machine with Node: node extract-expanded-local.js
 */
const fs = require('fs');
const vm = require('vm');

let code = fs.readFileSync('script.js', 'utf8').replace(/^\uFEFF/, '');
const start = code.indexOf('const expandedDescriptions = {');
if (start === -1) {
  console.error('No expandedDescriptions block in script.js — edit expanded-descriptions.js directly.');
  process.exit(1);
}

let i = start + 'const expandedDescriptions = {'.length;
let depth = 1;
let inString = false;
let quote = '';
let inTemplate = false;

while (i < code.length && depth > 0) {
  const ch = code[i];
  const prev = i > 0 ? code[i - 1] : '';
  if (inTemplate) {
    if (ch === '`' && prev !== '\\') inTemplate = false;
  } else if (inString) {
    if (ch === quote && prev !== '\\') inString = false;
  } else {
    if (ch === '`') inTemplate = true;
    else if (ch === '"' || ch === "'") { inString = true; quote = ch; }
    else if (ch === '{') depth++;
    else if (ch === '}') depth--;
  }
  i++;
}

const obj = code.substring(start, i);
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(obj, sandbox);
const data = sandbox.expandedDescriptions || {};

const header = `/**
 * Manual long-form SEO overrides for /node/[id]/ pages.
 * Nodes without an entry here get rich auto-generated copy at build time.
 */
module.exports = `;

fs.writeFileSync('expanded-descriptions.js', header + JSON.stringify(data, null, 2) + ';\n', 'utf8');
console.log('Wrote expanded-descriptions.js with', Object.keys(data).length, 'entries');