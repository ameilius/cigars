/**
 * Merged long-form SEO overrides for /node/[id]/ pages.
 *
 * Add new copy to the file matching the node type in data.js:
 *   brand    → brands.js
 *   factory  → factories.js
 *   person   → people.js
 *   company  → corporate.js
 */
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const FILES = ['brands.js', 'factories.js', 'people.js', 'corporate.js'];

function loadExpandedDescriptions() {
  const merged = {};
  for (const file of FILES) {
    const full = path.join(DIR, file);
    if (!fs.existsSync(full)) continue;
    delete require.cache[require.resolve(full)];
    Object.assign(merged, require(full));
  }
  if (fs.existsSync(path.join(DIR, 'default.js'))) {
    delete require.cache[require.resolve('./default')];
    merged.default = require('./default');
  }
  return merged;
}

module.exports = loadExpandedDescriptions();