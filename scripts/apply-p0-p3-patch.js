/**
 * Apply P0–P3 graph updates from Privada factory map cross-check.
 * Run: node scripts/apply-p0-p3-patch.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'data.js');

function loadGraph() {
  const code = fs.readFileSync(DATA_PATH, 'utf8').replace(/^\uFEFF/, '');
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.baseGraphData;
}

const NEW_NODES = [
  // P1 — factory nodes
  { id: 'williamventura', name: 'Tabacalera William Ventura', type: 'factory', group: 'family', country: 'dominican' },
  { id: 'lucianopichardo', name: 'Tabacalera Pichardo (Luciano)', type: 'factory', group: 'family', country: 'nicaragua' },
  { id: 'nicasueno', name: 'Fábrica de Tabacos Nica Sueño', type: 'factory', group: 'family', country: 'nicaragua' },
  { id: 'plasenciahonduras', name: 'El Paraíso (Plasencia Honduras)', type: 'factory', group: 'family', country: 'honduras' },
  { id: 'stgesteli', name: 'STG Estelí', type: 'factory', group: 'corporate', country: 'nicaragua' },
  { id: 'stgdanli', name: 'STG Danlí (HATSA)', type: 'factory', group: 'corporate', country: 'honduras' },
  { id: 'lacorona', name: 'La Corona Factory', type: 'factory', group: 'family', country: 'nicaragua' },
  { id: 'rojasfactory', name: 'Tabacalera New Order (Rojas)', type: 'factory', group: 'family', country: 'nicaragua' },
  { id: 'raicescubanas', name: 'Raíces Cubanas', type: 'factory', group: 'family', country: 'nicaragua' },
  { id: 'laaurorafactory', name: 'La Aurora Cigar Factory', type: 'factory', group: 'family', country: 'dominican' },
  { id: 'elreyhabanos', name: 'El Rey de los Habanos (Miami)', type: 'factory', group: 'family', country: 'usa' },
  { id: 'lacarrillo', name: 'Tabacalera La Alianza (Carrillo)', type: 'factory', group: 'family', country: 'dominican' },
  { id: 'laisla', name: 'Tabacalera La Isla', type: 'factory', group: 'family', country: 'dominican' },
  { id: 'caoamerican', name: 'CAO American Caribbean', type: 'factory', group: 'corporate', country: 'nicaragua' },
  { id: 'costaricatabacos', name: 'Tabacos de Costa Rica', type: 'factory', group: 'family', country: 'costa rica' },
  { id: 'ovejanegra', name: 'Oveja Negra (Lanuza)', type: 'factory', group: 'family', country: 'nicaragua' },
  { id: 'lanuzafactory', name: 'Lanuza Cigar Factory', type: 'factory', group: 'family', country: 'nicaragua' },
  { id: 'laflordecopan', name: 'La Flor de Copán', type: 'factory', group: 'family', country: 'honduras' },

  // P2 — brand nodes
  { id: 'gurkha', name: 'Gurkha', type: 'brand', group: 'corporate', country: 'dominican', productLines: ['Classic', 'Ghost', 'Royal Courtesan', 'Heritage'] },
  { id: 'caldwell', name: 'Caldwell Cigars', type: 'brand', group: 'family', country: 'dominican', productLines: ['Blind Man\'s Bluff', 'Long Live the King', 'Lost & Found', 'Eastern Standard'] },
  { id: 'crownedheads', name: 'Crowned Heads', type: 'brand', group: 'family', country: 'dominican', productLines: ['Jericho Hill', 'Four Kicks', 'La Imperiosa', 'Mule Kick'] },
  { id: 'southerndraw', name: 'Southern Draw', type: 'brand', group: 'family', country: 'dominican', productLines: ['Rose of Sharon', 'Kudzu', 'Jacob\'s Ladder', 'Firethorn'] },
  { id: 'kristoff', name: 'Kristoff', type: 'brand', group: 'family', country: 'dominican', productLines: ['Original Maduro', 'GC Signature', 'Shiro', 'Kristania'] },
  { id: 'montecristonc', name: 'Montecristo (NC)', type: 'brand', group: 'corporate', country: 'nicaragua' },
  { id: 'ryjnc', name: 'Romeo y Julieta (NC)', type: 'brand', group: 'corporate', country: 'nicaragua' },
  { id: 'fratello', name: 'Fratello', type: 'brand', group: 'family', country: 'nicaragua', productLines: ['Classico', 'Navetta', 'Bianco', 'Arlequin'] },
  { id: 'padilla', name: 'Padilla Cigars', type: 'brand', group: 'family', country: 'nicaragua', productLines: ['La Perla Habana', 'Miami', 'Golden Age', 'Cazadores'] },
  { id: 'ozgener', name: 'Ozgener Family Cigars', type: 'brand', group: 'family', country: 'nicaragua', productLines: ['Bosphorus', 'Aramas', 'Cypher', 'Pi'] },
  { id: 'jassumkral', name: 'Jas Sum Kral', type: 'brand', group: 'family', country: 'nicaragua', productLines: ['Red Knight', 'La Bomba', 'Fenix', 'Kral'] },
  { id: 'stolenthrone', name: 'Stolen Throne', type: 'brand', group: 'family', country: 'nicaragua' },
  { id: 'deadwood', name: 'Deadwood', type: 'brand', group: 'family', country: 'nicaragua', productLines: ['Fat Bottom Betty', 'Sweet Jane', 'Yummy Bitches'] },
  { id: 'leafbyoscar', name: 'Leaf by Oscar', type: 'brand', group: 'family', country: 'honduras', productLines: ['Corojo', 'Maduro', 'Connecticut', 'Sumatra'] },
  { id: 'oscarvalladares', name: 'Oscar Valladares', type: 'brand', group: 'family', country: 'honduras', productLines: ['Super Fly', '2012', 'Island Jim', 'The Oscar'] },
];

const LINKS_TO_REMOVE = [
  ['lure', 'esteli'],
  ['definition', 'esteli'],
  ['domain', 'esteli'],
  ['elseptimo', 'esteli'],
  ['laaurora', 'dominican'],
  ['viaje', 'hvc'],
  ['drewestate', 'stg'],
  ['oliva', 'perdomo'],
];

const NEW_LINKS = [
  // P0 fixes
  { source: 'definition', target: 'lucianopichardo', type: 'manufactured at' },
  { source: 'elseptimo', target: 'costaricatabacos', type: 'manufactured at' },
  { source: 'laaurora', target: 'laaurorafactory', type: 'manufactured at' },
  { source: 'lure', target: 'ovejanegra', type: 'manufactured at' },

  // P1 — factory operations & high-impact links
  { source: 'dunbarton', target: 'lazona', type: 'contract production' },
  { source: 'dunbarton', target: 'ajfernandez', type: 'contract production' },
  { source: 'guayacan', target: 'myfather', type: 'Reserve line produced at' },
  { source: 'foundation', target: 'joyafactory', type: 'production at' },
  { source: 'murcielago', target: 'plasencia', type: 'contract production' },
  { source: 'espinosa', target: 'plasencia', type: 'contract production' },
  { source: 'lagranfabrica', target: 'macanudo', type: 'manufactures' },
  { source: 'lagranfabrica', target: 'cohiba_nc', type: 'manufactures' },
  { source: 'lagranfabrica', target: 'punch_nc', type: 'manufactures' },
  { source: 'lagranfabrica', target: 'lagloriacubana', type: 'manufactures' },
  { source: 'room101', target: 'eiroadanli', type: 'Honduras production at' },
  { source: 'room101', target: 'stgdanli', type: 'Honduras production at' },
  { source: 'tatuaje', target: 'elreyhabanos', type: 'originated at' },
  { source: 'tatuaje', target: 'plasenciahonduras', type: 'contract production' },
  { source: 'lapalina', target: 'tabsa', type: 'production at' },
  { source: 'lapalina', target: 'williamventura', type: 'production at' },
  { source: 'lapalina', target: 'caoamerican', type: 'production at' },
  { source: 'lapalina', target: 'plasenciahonduras', type: 'production at' },

  // Factory ↔ corporate
  { source: 'stgesteli', target: 'stg', type: 'operated by' },
  { source: 'stgdanli', target: 'stg', type: 'operated by' },
  { source: 'plasenciahonduras', target: 'plasencia', type: 'operated by' },
  { source: 'laaurorafactory', target: 'laaurora', type: 'primary factory for' },
  { source: 'elreyhabanos', target: 'pepin', type: 'historic García factory' },
  { source: 'rojasfactory', target: 'noelrojas', type: 'associated with' },
  { source: 'lazona', target: 'murcielago', type: 'manufactures' },

  // P2 — new brand ownership & factory ties
  { source: 'gurkha', target: 'williamventura', type: 'manufactured at' },
  { source: 'gurkha', target: 'lacarrillo', type: 'manufactured at' },
  { source: 'caldwell', target: 'pdr', type: 'manufactured at' },
  { source: 'caldwell', target: 'nicasueno', type: 'manufactured at' },
  { source: 'caldwell', target: 'williamventura', type: 'manufactured at' },
  { source: 'crownedheads', target: 'myfather', type: 'manufactured at' },
  { source: 'crownedheads', target: 'nacsa', type: 'historical production at' },
  { source: 'southerndraw', target: 'plasenciahonduras', type: 'manufactured at' },
  { source: 'kristoff', target: 'williamventura', type: 'manufactured at' },
  { source: 'montecristonc', target: 'stgesteli', type: 'manufactured at' },
  { source: 'montecristonc', target: 'stg', type: 'owned by' },
  { source: 'montecristonc', target: 'generalcigar', type: 'sold by' },
  { source: 'ryjnc', target: 'stgesteli', type: 'manufactured at' },
  { source: 'ryjnc', target: 'plasencia', type: 'contract production' },
  { source: 'ryjnc', target: 'stg', type: 'owned by' },
  { source: 'ryjnc', target: 'generalcigar', type: 'sold by' },
  { source: 'fratello', target: 'lazona', type: 'manufactured at' },
  { source: 'fratello', target: 'laisla', type: 'manufactured at' },
  { source: 'padilla', target: 'tabsa', type: 'manufactured at' },
  { source: 'padilla', target: 'plasenciahonduras', type: 'manufactured at' },
  { source: 'padilla', target: 'stgesteli', type: 'manufactured at' },
  { source: 'ozgener', target: 'lacorona', type: 'manufactured at' },
  { source: 'jassumkral', target: 'myfather', type: 'manufactured at' },
  { source: 'stolenthrone', target: 'rojasfactory', type: 'manufactured at' },
  { source: 'deadwood', target: 'raicescubanas', type: 'manufactured at' },
  { source: 'deadwood', target: 'drewestate', type: 'brand of' },
  { source: 'leafbyoscar', target: 'laflordecopan', type: 'manufactured at' },
  { source: 'oscarvalladares', target: 'laflordecopan', type: 'related production' },

  // P3 — contract manufacturing depth (existing nodes)
  // Plasencia S.A.
  { source: 'plasenciaesteli', target: 'murcielago', type: 'manufactures' },
  { source: 'knucklesandwich', target: 'plasencia', type: 'contract production' },

  // AJ Fernandez / San Lotano
  { source: 'dunbarton', target: 'sanlotano', type: 'production at' },
  { source: 'guayacan', target: 'sanlotano', type: 'rolled at' },
  { source: 'neworder', target: 'rojasfactory', type: 'originated at' },
  { source: 'rojas', target: 'rojasfactory', type: 'associated factory' },

  // Joya factory
  { source: 'hvc', target: 'joyafactory', type: 'contract production' },
  { source: 'illusione', target: 'joyafactory', type: 'production at' },
  { source: 'viaje', target: 'lazona', type: 'contract production' },

  // La Zona
  { source: 'fratello', target: 'lazona', type: 'contract production' },

  // TABSA
  { source: 'hvc', target: 'tabsa', type: 'early production at' },
  { source: 'padilla', target: 'tabsa', type: 'contract production' },

  // My Father / ANT
  { source: 'jassumkral', target: 'myfather', type: 'contract production' },

  // STG Estelí portfolio
  { source: 'stgesteli', target: 'montecristonc', type: 'manufactures' },
  { source: 'stgesteli', target: 'ryjnc', type: 'manufactures' },
  { source: 'stgesteli', target: 'padilla', type: 'manufactures' },
  { source: 'stgesteli', target: 'room101', type: 'manufactures' },
  { source: 'stgesteli', target: 'southerndraw', type: 'manufactures' },
  { source: 'stgesteli', target: 'foundation', type: 'manufactures' },
  { source: 'stgesteli', target: 'hvc', type: 'manufactures' },
  { source: 'stgesteli', target: 'cohiba_nc', type: 'manufactures' },
  { source: 'stgesteli', target: 'macanudo', type: 'manufactures' },
  { source: 'stgesteli', target: 'punch_nc', type: 'manufactures' },
  { source: 'stgesteli', target: 'lagloriacubana', type: 'manufactures' },

  // CAO American Caribbean
  { source: 'caoamerican', target: 'cao', type: 'related facility' },
  { source: 'caoamerican', target: 'lapalina', type: 'manufactures' },

  // Raíces Cubanas / Drew
  { source: 'raicescubanas', target: 'deadwood', type: 'manufactures' },
  { source: 'drewestate', target: 'deadwood', type: 'owns line' },

  // William Ventura contract depth
  { source: 'williamventura', target: 'viaje', type: 'manufactures' },
  { source: 'williamventura', target: 'kristoff', type: 'manufactures' },
  { source: 'williamventura', target: 'caldwell', type: 'manufactures' },
  { source: 'williamventura', target: 'lapalina', type: 'manufactures' },

  // La Isla
  { source: 'laisla', target: 'fratello', type: 'manufactures' },

  // Nica Sueño
  { source: 'nicasueno', target: 'caldwell', type: 'manufactures' },

  // La Corona
  { source: 'lacorona', target: 'ozgener', type: 'manufactures' },

  // Luciano / Pichardo
  { source: 'lucianopichardo', target: 'definition', type: 'manufactures' },

  // Costa Rica
  { source: 'costaricatabacos', target: 'elseptimo', type: 'manufactures' },

  // Oveja Negra / Lanuza
  { source: 'ovejanegra', target: 'lure', type: 'manufactures' },
  { source: 'lanuzafactory', target: 'ovejanegra', type: 'related facility' },

  // El Paraíso Honduras depth
  { source: 'plasenciahonduras', target: 'southerndraw', type: 'manufactures' },
  { source: 'plasenciahonduras', target: 'padilla', type: 'manufactures' },
  { source: 'plasenciahonduras', target: 'tatuaje', type: 'manufactures' },
  { source: 'plasenciahonduras', target: 'lapalina', type: 'manufactures' },

  // STG Danlí
  { source: 'stgdanli', target: 'room101', type: 'manufactures' },
  { source: 'stgdanli', target: 'leafbyoscar', type: 'manufactures' },
  { source: 'stgdanli', target: 'zino', type: 'manufactures' },

  // La Flor de Copán
  { source: 'laflordecopan', target: 'leafbyoscar', type: 'manufactures' },
];

function linkKey(l) {
  return `${l.source}\0${l.target}\0${l.type}`;
}

function applyPatch() {
  const graph = loadGraph();
  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
  const nodeIds = new Set(nodeById.keys());

  let addedNodes = 0;
  for (const node of NEW_NODES) {
    if (!nodeIds.has(node.id)) {
      graph.nodes.push(node);
      nodeById.set(node.id, node);
      nodeIds.add(node.id);
      addedNodes++;
    }
  }

  const beforeLinks = graph.links.length;
  graph.links = graph.links.filter((l) => {
    return !LINKS_TO_REMOVE.some(([s, t]) => l.source === s && l.target === t);
  });

  const existing = new Set(graph.links.map(linkKey));
  let addedLinks = 0;
  for (const link of NEW_LINKS) {
    const key = linkKey(link);
    if (!existing.has(key)) {
      if (!nodeIds.has(link.source)) {
        throw new Error(`Missing source node: ${link.source}`);
      }
      if (!nodeIds.has(link.target)) {
        throw new Error(`Missing target node: ${link.target}`);
      }
      graph.links.push(link);
      existing.add(key);
      addedLinks++;
    }
  }

  const removedLinks = beforeLinks - graph.links.length + addedLinks - (graph.links.length - beforeLinks + addedLinks);
  console.log(`Nodes: ${graph.nodes.length} (+${addedNodes} new)`);
  console.log(`Links: ${graph.links.length} (+${addedLinks} new, removed bad links)`);

  // Validate all link endpoints
  const orphans = [];
  for (const l of graph.links) {
    if (!nodeIds.has(l.source)) orphans.push(`source:${l.source}`);
    if (!nodeIds.has(l.target)) orphans.push(`target:${l.target}`);
  }
  if (orphans.length) {
    throw new Error(`Broken links remain: ${orphans.join(', ')}`);
  }

  writeDataJs(graph);
  return { nodes: graph.nodes.length, links: graph.links.length, addedNodes, addedLinks };
}

function quote(s) {
  return JSON.stringify(s);
}

const NODE_KEY_ORDER = ['id', 'name', 'type', 'group', 'country', 'productLines', 'logo', 'photo', 'website'];

function formatNode(node) {
  const keys = [
    ...NODE_KEY_ORDER.filter((k) => node[k] !== undefined),
    ...Object.keys(node).filter((k) => !NODE_KEY_ORDER.includes(k)),
  ];
  const parts = keys.map((k) => {
    const v = node[k];
    if (Array.isArray(v)) return `${k}: [${v.map(quote).join(', ')}]`;
    return `${k}: ${quote(v)}`;
  });
  return `{ ${parts.join(', ')} }`;
}

function writeDataJs(graph) {
  const header = `/**
 * Cigar Nexus graph data — ${graph.nodes.length} nodes, ${graph.links.length} links
 * Updated: P0–P3 Privada factory map cross-check (May 2026)
 */
var baseGraphData = {
            nodes: [
`;
  const nodeLines = graph.nodes.map((n) => `                ${formatNode(n)},`);
  const linkHeader = `
            ],
            links: [
`;
  const linkLines = graph.links.map(
    (l) => `                { source: ${quote(l.source)}, target: ${quote(l.target)}, type: ${quote(l.type)} },`
  );
  const footer = `
            ]
        };
`;
  const content = header + nodeLines.join('\n') + linkHeader + linkLines.join('\n') + footer;
  fs.writeFileSync(DATA_PATH, '\uFEFF' + content, 'utf8');
}

if (require.main === module) {
  applyPatch();
}

module.exports = { applyPatch, NEW_NODES, NEW_LINKS };