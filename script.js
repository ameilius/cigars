// ============================================
// Cigar Nexus - Main Application Script
// Fully extracted and implemented for Option 1 split
// D3.js v7 force-directed graph + warm cigar lounge UI
// ============================================

// -----------------------------
// Data (loaded from data.js)
// -----------------------------
let graphData = { nodes: [], links: [] };

// Node descriptions for the drawer — researched for complete coverage
const descriptions = {
  // === Core / Early brands & people ===
  "myfather": "My Father is one of the most respected Nicaraguan brands, founded by Pepín García. Known for bold, full-bodied cigars with exceptional construction and complex flavors.",
  "pepin": "Pepín García is the legendary founder of My Father Cigars and a master blender with deep roots in the Cuban cigar tradition. He brought his family expertise to Nicaragua.",
  "tatuaje": "Tatuaje is a highly acclaimed boutique brand founded by Pete Johnson in collaboration with Pepín García. Famous for the Tatuaje Serie P and the Reserva line.",
  "espinosa": "Espinosa Premium Cigars, led by Erik Espinosa, produces bold, innovative cigars. The La Zona factory in Estelí is a hub for many boutique projects.",
  "erikespinosa": "Founder of Espinosa Premium Cigars and owner of La Zona factory in Estelí. Previously partnered in EO Brands before launching his own operation in 2012; known for the 601 and Murciélago lines.",
  "guyfieri": "Celebrity chef and TV personality (Diners, Drive-Ins and Dives). Co-creator of the Knuckle Sandwich cigar line with Erik Espinosa; actively involved in blending, marketing, and promotion.",
  "knucklesandwich": "Knuckle Sandwich is a popular collaboration between Guy Fieri and Erik Espinosa. Full-bodied Nicaraguan cigars primarily manufactured at A.J. Fernandez’s San Lotano factory, with blending roots at Espinosa’s La Zona.",
  "padron": "Padrón is a family-owned icon founded by José Orlando Padrón. World-renowned for consistency, quality, and the legendary 1964 Anniversary and 1926 Serie lines.",
  "joseopadron": "José Orlando Padrón founded the Padrón brand in 1964 after arriving from Cuba. His vision of uncompromising quality established one of the most respected names in cigars.",
  "jorgepadron": "Jorge Padrón is part of the family leadership at Padrón, helping guide the company’s continued focus on excellence and consistency.",
  "orlandopadron": "Orlando Padrón is a key member of the Padrón family leadership team, contributing to the brand’s operations and legacy.",
  "tabacoscubanica": "Tabacos Cubanica is the Padrón family’s historic factory in Estelí, Nicaragua. It produces the majority of Padrón cigars using traditional Cuban-inspired methods.",

  "davidoff": "Davidoff is a legendary luxury cigar brand now owned by Oettinger Davidoff in Switzerland. Famous for the Grand Cru, Millennium, and high-end lines made primarily in the Dominican Republic.",
  "avo": "AVO is a premium Dominican brand under the Davidoff umbrella, known for its classic Cameroon wrapper and elegant, balanced blends.",
  "griffins": "The Griffin’s is a historic Dominican brand under Oettinger Davidoff, originally created in the 1960s and known for its elegant, mild-to-medium profiles.",
  "oettinger": "Oettinger Davidoff is the Swiss-based corporate parent of Davidoff, AVO, and The Griffin’s. It oversees high-end production and global distribution of these luxury brands.",

  "arturo": "Arturo Fuente is one of the most respected family-owned Dominican cigar companies. Founded in 1912, it is famous for the Hemingway series and OpusX.",
  "tabafuente": "Tabacalera A. Fuente is the family’s historic factory in Santiago, Dominican Republic. It produces Arturo Fuente and the legendary OpusX line.",
  "opusx": "Fuente Fuente OpusX is the flagship line of Arturo Fuente, grown and rolled at the family’s Chateau de la Fuente estate. Widely regarded as one of the greatest cigars ever made.",

  "stg": "Scandinavian Tobacco Group (STG) is a major global cigar corporation headquartered in Denmark. It owns General Cigar, Forged, and has stakes in other operations including Plasencia.",
  "generalcigar": "General Cigar Co. is a major U.S. manufacturer owned by STG. It produces Macanudo, Punch, Cohiba (non-Cuban), and many other well-known brands.",
  "forged": "Forged Cigar Co. is an STG company that handles production and distribution for several of its portfolio brands in the U.S. market.",
  "macanudo": "Macanudo is one of the best-selling premium cigar brands in the United States. Produced by General Cigar under STG ownership, it is known for its consistent, elegant Connecticut-shade profile.",
  "cao": "CAO is a bold, innovative brand originally founded in the 1990s and now owned by General Cigar/STG. Famous for its colorful packaging and full-flavored lines.",
  "cohiba_nc": "Cohiba (Non-Cuban) is produced by General Cigar under license. It is completely separate from the Cuban Cohiba and is known for its Dominican and Nicaraguan blends.",
  "partagas_nc": "Partagas (Non-Cuban) is a General Cigar brand with roots in the historic Cuban name. It offers a range of medium-to-full cigars made in the Dominican Republic.",
  "punch_nc": "Punch is a historic brand now under General Cigar/STG. The non-Cuban version offers traditional, full-flavored cigars with Nicaraguan and Dominican tobacco.",

  "jcnewman": "J.C. Newman is America’s oldest family-owned cigar company, founded in 1895. It produces the Diamond Crown and Brick House lines in the Dominican Republic.",
  "diamondcrown": "Diamond Crown is the ultra-premium flagship line of J.C. Newman. Made at Tabacalera A. Fuente, it is known for its exceptional quality and elegant presentation.",

  "belladama": "Bella Dama is a Nicaraguan brand produced at the My Father factory. It offers approachable, well-made cigars that highlight the factory’s expertise.",

  // === Espinosa family & La Zona ===
  "lazona": "La Zona (Estelí) is Erik Espinosa’s factory in Nicaragua, opened in 2012. It produces the 601, Murciélago, Laranja, and many boutique and contract lines.",
  "laranja": "Laranja Reserva is one of Espinosa’s most popular lines, known for its Brazilian wrapper and rich, complex Nicaraguan blend. Produced at La Zona.",
  "espinosahabano": "Espinosa Habano is a core line from Espinosa Premium Cigars featuring a Habano wrapper and bold Nicaraguan tobacco. Made at La Zona.",
  "crema": "Crema is a popular Espinosa line known for its creamier, more approachable profile while still delivering flavor. Rolled at La Zona factory.",

  "eobrands": "EO Brands (legacy) was the partnership between Erik Espinosa and Eddie Ortega that created the original 601 and Murciélago lines before the 2012 split.",
  "eddieortega": "Eddie Ortega was Erik Espinosa’s business partner in EO Brands/United Tobacco. He later left to pursue his own projects.",

  "sixzeroone": "601 is the flagship brand line originally created under EO Brands and now continued by Espinosa Premium Cigars. Known for bold, full-flavored Nicaraguan cigars.",
  "murcielago": "Murciélago is a popular bold line from Espinosa, originally developed under EO Brands. It features a dark, powerful Nicaraguan profile.",

  "ajfernandez": "A.J. Fernandez is a highly regarded Nicaraguan cigar maker and blender. He operates the San Lotano factory and produces many acclaimed boutique and contract lines.",
  "sanlotano": "San Lotano Factory (Estelí) is A.J. Fernandez’s facility in Nicaragua. It produces the AJ Fernandez brand along with many contract and private-label cigars.",

  // === Padrón family factories & lines ===
  "tabacoscubanica": "Tabacos Cubanica is the Padrón family’s historic factory in Estelí, Nicaragua. It produces the majority of Padrón cigars using traditional Cuban-inspired methods.",
  "padron1964": "Padrón 1964 Anniversary is one of the most celebrated lines in the industry. It offers exceptional complexity and consistency in multiple vitolas and wrappers.",
  "padron1926": "Padrón Serie 1926 is the pinnacle of the Padrón range. These cigars are known for their extraordinary depth, balance, and long aging process.",

  // === Plasencia family ===
  "nestorplasencia": "Nestor Plasencia Sr. is a legendary fifth-generation tobacco grower and manufacturer. After multiple exiles from Cuba and Nicaragua, he built one of the largest and most respected operations in the industry.",
  "nestorandres": "Nestor Andrés Plasencia is the next-generation leader of the Plasencia family operation, heavily involved in farming, production, and the company’s modern direction.",
  "plasenciaesteli": "Plasencia Estelí (often called The Cathedral) is the family’s premium-oriented factory in Nicaragua. It produces many of their own high-end lines and select contract work.",

  // === Rocky Patel ===
  "rockypatel": "Rocky Patel Premium Cigars is a vertically integrated operation led by Nish Patel. Owns Tavicusa factory and maintains deep partnerships with Plasencia.",
  "nishpatel": "Nish Patel leads Rocky Patel Premium Cigars. He has guided the company’s vertical integration, including ownership of the Tavicusa factory in Estelí.",
  "tavicusa": "Tabacalera Villa Cuba (TaviCusa) is Rocky Patel’s factory in Estelí. It produces many Rocky Patel lines and supports their long-term manufacturing partnerships.",

  // === Drew Estate / Swisher ===
  "drewestate": "Drew Estate (owned by Swisher International since 2014) is famous for innovative fermentation and bold cigars like Acid and Liga Privada. La Gran Fábrica in Estelí is their flagship.",
  "jonathandrew": "Jonathan Drew (Sann) is the founder of Drew Estate. He built the company from a small operation into a major player known for fermentation innovation and cult brands.",
  "swisher": "Swisher International is the large corporate owner of Drew Estate (acquired in 2014). It is one of the biggest cigar companies in the world by volume.",
  "lagranfabrica": "La Gran Fábrica Drew Estate is the company’s large, modern factory in Estelí. It produces Liga Privada, Undercrown, and many other Drew Estate lines.",

  // === CLE / Eiroa family (Honduras) ===
  "cle": "CLE Cigar Company, founded by Christian Eiroa, is a vertically integrated Honduran powerhouse. The Eiroa family also produces the highly regarded Aladino brand.",
  "christianeiroa": "Christian Eiroa founded CLE Cigar Co. and the Aladino factory in Danlí, Honduras. He previously led the Camacho brand before launching his own family-focused operation.",
  "eiroafamily": "Eiroa Family (Aladino) represents the broader family tobacco and manufacturing business in Honduras, closely tied to Christian Eiroa’s CLE operation.",
  "eiroadanli": "CLE Factory (Danlí, Honduras) is the state-of-the-art Aladino factory opened by Christian Eiroa in 2013 on the site of his grandfather’s historic theater.",

  // === Aganorsa / TABSA ===
  "aganorsa": "AGANORSA Leaf, led by Max Fernández Pujals, is one of Nicaragua's most important independent tobacco growers. Their TABSA factory in Estelí produces many top boutique brands.",
  "maxfernandez": "Max Fernández Pujals leads AGANORSA Leaf, a major grower and manufacturer known for high-quality Nicaraguan tobacco used by many premium brands.",
  "tabsa": "TABSA (Aganorsa Factory, Estelí) is the highly regarded production facility of AGANORSA Leaf. It has been praised as one of the best factories in Nicaragua and rolls for Illusione, Foundation, Viaje, and others.",

  // === Foundation ===
  "foundation": "Foundation Cigar Company (Nick Melillo) produces critically acclaimed lines like The Tabernacle and Olmec. They use contract production at top factories including My Father and A.J. Fernandez.",
  "nickmelillo": "Nick Melillo is the founder of Foundation Cigar Company. A former Drew Estate executive, he is known for bold, terroir-driven blends and strong relationships with top Nicaraguan factories.",

  // === Warped / Kyle Gellis ===
  "warped": "Warped Cigars (Kyle Gellis) is a modern boutique standout. Major production partner with NACSA and historical ties to Aganorsa/TABSA.",
  "kylegellis": "Kyle Gellis founded Warped Cigars. He is known for creative, limited-production releases and close oversight of production at partner factories like NACSA.",
  "nacsa": "NACSA (Estelí) is a respected factory that has become a primary production partner for Warped and other boutique brands. Known for high-quality, attentive manufacturing.",

  // === Oliva ===
  "oliva": "Oliva Cigar Co. is a major vertically integrated producer owned by the Vandermarliere family (Belgium). Famous for Serie V, Melanio, and Nub. Tabolisa is their primary Estelí factory.",
  "fredvandermarliere": "Fred Vandermarliere is part of the Belgian family that owns Oliva Cigar Co. The family has driven significant investment and growth in Nicaraguan production.",
  "tabolisa": "Tabolisa (Oliva Estelí) is the primary factory for Oliva Cigar Co. It produces the majority of the brand’s well-known lines including Serie V and Melanio.",

  // === Perdomo ===
  "perdomo": "Perdomo Cigars is a large family-owned operation led by Nick Perdomo Jr. Known for ambitious vertical integration and the massive El Monstro factory in Estelí.",
  "nickperdomo": "Nick Perdomo Jr. founded Perdomo Cigars in 1992. He built the company from a small Miami operation into a fully vertically integrated Nicaraguan powerhouse.",
  "perdomofactory": "Tabacalera Perdomo (El Monstro, Estelí) is the large, self-contained factory and farm operation of Perdomo Cigars. It handles growing, fermentation, rolling, and packaging in-house.",

  // === Joya de Nicaragua ===
  "joya": "Joya de Nicaragua is the oldest premium cigar factory in Nicaragua (founded 1965). A key contract manufacturer for many boutique brands including Dunbarton and Warped.",
  "joyafactory": "Joya de Nicaragua Factory (Estelí) is the historic facility that helped establish Nicaragua as a premium cigar origin. It continues to produce its own lines and important contract work.",
  "alejandromartinez": "Alejandro Martínez Cuenca acquired Joya de Nicaragua in 1994 and led its revival. The Martínez family still owns the company today.",

  // === Dunbarton / Steve Saka ===
  "dunbarton": "Dunbarton Tobacco & Trust, founded by Steve Saka, produces the acclaimed Sobremesa, Mi Querida, and Muestra de Saka lines. Strong partnership with Joya de Nicaragua.",
  "stevesaka": "Steve Saka is the founder of Dunbarton Tobacco & Trust. Former CEO of Drew Estate, he is respected for uncompromising blending and deep tobacco knowledge. Sobremesa is his signature brand.",
  "sobremesa": "Sobremesa is the flagship brand of Dunbarton Tobacco & Trust. Created by Steve Saka, it is celebrated for its complexity, balance, and the convivial spirit the name evokes.",

  // === Illusione ===
  "illusione": "Illusione, founded by Dion Giolito, is a cult favorite known for powerful, refined Nicaraguan cigars. Long-time user of AGANORSA / TABSA tobacco and production.",
  "diongiolito": "Dion Giolito is the founder of Illusione Cigars. He is known for his exacting standards and preference for powerful, terroir-driven Nicaraguan blends.",

  // === Viaje ===
  "viaje": "Viaje (Andre Farkas) is a highly sought-after boutique brand famous for limited releases and creative blends. Frequent production partner of TABSA and Joya.",
  "andrefarkas": "Andre Farkas founded Viaje Cigars. He is known for highly allocated, creative limited editions and close relationships with top Nicaraguan factories.",

  // === HVC ===
  "hvc": "HVC Cigars, founded by Reinier Lorenzo, built its own factory in Estelí. Known for the Hot Cake, Black Friday, and Edición Limitada series.",
  "reinierlorenzo": "Reinier Lorenzo founded HVC Cigars. After years of contract production, he established his own factory in Estelí to gain greater control over quality and blends.",
  "hvcfactory": "HVC Factory (Estelí) is the company’s own production facility. It allows Reinier Lorenzo full oversight of the cigars that bear his initials.",

  // === Additional corporate / other ===
  "alecbradley": "Alec Bradley is a well-known brand acquired by STG in 2023. It offers a wide range of cigars with a reputation for value and consistent quality.",
  "room101": "Room101 is a bold, irreverent brand with a strong cult following. It has been associated with both independent and larger corporate ownership over the years.",

  // Fallback for anything added later
  "default": "A key player in the modern cigar industry with connections across brands, factories, and families."
};

// -----------------------------
// Helpers
// -----------------------------
function isFactoryNode(node) {
  if (!node) return false;
  if (node.type === 'factory') return true;
  const name = (node.name || '').toLowerCase();
  return name.includes('factory') || name.includes('estelí') || name.includes('esteli') || name.includes('tabolisa') || name.includes('tavicusa') || name.includes('nacsa') || name.includes('la gran');
}

function getNodeColor(node) {
  if (!node) return '#6b5b4f';
  if (node.type === 'factory' || isFactoryNode(node)) return '#b45309'; // amber for factories/growers
  if (node.type === 'brand' && node.group === 'family') return '#1d4ed8'; // blue for boutique/independent brands
  if (node.group === 'corporate') return '#5c2e2e';
  return '#166534'; // green default for family/independent
}

function getNodeRadius(node) {
  if (!node) return 6;
  let base = 7;
  if (node.type === 'company') base = 9;
  if (node.type === 'factory' || isFactoryNode(node)) base = 8;
  if (node.type === 'person') base = 5.5;

  // Scale by connection count (landmark nodes bigger)
  const degree = (graphData.links || []).filter(l =>
    (l.source.id || l.source) === node.id || (l.target.id || l.target) === node.id
  ).length;
  const bonus = Math.min(5, Math.floor(degree / 3));
  return base + bonus;
}

function getLinkColor(link) {
  const t = (link.type || '').toLowerCase();
  if (t.includes('owned') || t.includes('subsidiary')) return '#5c2e2e';
  if (t.includes('contract') || t.includes('manufactur') || t.includes('produced')) return '#8b5e3c';
  if (t.includes('partnership') || t.includes('blended')) return '#c5a26f';
  return '#8b7a6f';
}

function mergeData() {
  const baseNodes = (baseGraphData && baseGraphData.nodes) ? baseGraphData.nodes : [];
  const baseLinks = (baseGraphData && baseGraphData.links) ? baseGraphData.links : [];

  // Simple passthrough — full control lives in data.js
  graphData = {
    nodes: baseNodes.map(n => ({ ...n })),
    links: baseLinks.map(l => ({ ...l }))
  };
}

// -----------------------------
// Filters & Search State
// -----------------------------
let activeFilters = new Set(['all']);
let searchTerm = '';

// -----------------------------
// D3 Graph Variables
// -----------------------------
let svg, viewport, simulation, nodes, links, labels;
let zoomBehavior;
let currentTransform = d3.zoomIdentity;
let graphWidth = 800, graphHeight = 620;

// -----------------------------
// Initialize Everything
// -----------------------------
function initializeApp() {
  mergeData();

  // Initial filter state
  activeFilters = new Set(['all']);

  // Give the "All" chip its initial active visual state
  const allChip = document.querySelector('.filter-chip');
  if (allChip) allChip.classList.add('filter-active');

  // Setup search
  const searchInput = document.getElementById('search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value.trim().toLowerCase();
      applyFiltersAndSearch();
    });
  }

  // Initialize the graph
  initializeGraph();

  // Keyboard escape closes drawer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDrawer();
    }
  });

  // Make floating filters button scroll to filters on mobile
  const fab = document.getElementById('floating-filters-btn');
  if (fab) {
    fab.addEventListener('click', () => {
      const chips = document.getElementById('filter-chips');
      if (chips) chips.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  // Initial render of any saved state
  console.log('Cigar Nexus initialized. Nodes:', graphData.nodes.length, 'Links:', graphData.links.length);
}

// -----------------------------
// Filter Chips
// -----------------------------

function toggleFilter(key, element) {
  if (key === 'all') {
    activeFilters.clear();
    activeFilters.add('all');
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('filter-active'));
    if (element) element.classList.add('filter-active');
  } else {
    activeFilters.delete('all');
    const allChip = Array.from(document.querySelectorAll('.filter-chip')).find(c => c.textContent.trim().toLowerCase() === 'all');
    if (allChip) allChip.classList.remove('filter-active');

    if (activeFilters.has(key)) {
      activeFilters.delete(key);
      if (element) element.classList.remove('filter-active');
    } else {
      activeFilters.add(key);
      if (element) element.classList.add('filter-active');
    }
    if (activeFilters.size === 0) {
      activeFilters.add('all');
      if (allChip) allChip.classList.add('filter-active');
    }
  }
  applyFiltersAndSearch();
}

// -----------------------------
// Core D3 Graph
// -----------------------------
function initializeGraph() {
  const container = document.getElementById('graph');
  if (!container) return;

  // Clear any previous
  container.innerHTML = '';

  const rect = container.getBoundingClientRect();
  graphWidth = rect.width || 800;
  graphHeight = rect.height || 620;

  svg = d3.select('#graph')
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', `0 0 ${graphWidth} ${graphHeight}`)
    .style('background', 'transparent');

  // Zoom layer
  viewport = svg.append('g').attr('class', 'viewport');

  // Layers for links and nodes
  const linkLayer = viewport.append('g').attr('class', 'links');
  const nodeLayer = viewport.append('g').attr('class', 'nodes');
  const labelLayer = viewport.append('g').attr('class', 'labels');

  links = linkLayer.selectAll('line');
  nodes = nodeLayer.selectAll('g');
  labels = labelLayer.selectAll('text');

  // Zoom behavior
  zoomBehavior = d3.zoom()
    .scaleExtent([0.25, 4])
    .on('zoom', (event) => {
      currentTransform = event.transform;
      viewport.attr('transform', currentTransform);
      updateLabelVisibility();
    });

  svg.call(zoomBehavior);

  // Build simulation
  simulation = d3.forceSimulation()
    .force('link', d3.forceLink().id(d => d.id).distance(85).strength(0.65))
    .force('charge', d3.forceManyBody().strength(-420))
    .force('collide', d3.forceCollide().radius(d => getNodeRadius(d) + 6).strength(0.85))
    .force('x', d3.forceX(graphWidth / 2).strength(0.06))
    .force('y', d3.forceY(graphHeight / 2).strength(0.06))
    .force('center', d3.forceCenter(graphWidth / 2, graphHeight / 2));

  // Initial render
  updateGraph();

  // Handle resize
  window.addEventListener('resize', () => {
    const newRect = container.getBoundingClientRect();
    if (newRect.width > 50) {
      graphWidth = newRect.width;
      graphHeight = newRect.height || 620;
      svg.attr('viewBox', `0 0 ${graphWidth} ${graphHeight}`);
      simulation.force('center', d3.forceCenter(graphWidth / 2, graphHeight / 2));
      simulation.alpha(0.3).restart();
    }
  });

  // Initial zoom to fit after first layout
  setTimeout(() => {
    zoomToFit(true);
  }, 650);
}

function updateGraph() {
  if (!viewport || !simulation) return;

  const filteredData = getFilteredData();

  // Links
  const linkSel = viewport.select('.links').selectAll('line')
    .data(filteredData.links, d => d.source.id + '-' + d.target.id);

  linkSel.exit().remove();

  const linkEnter = linkSel.enter().append('line')
    .attr('class', 'link')
    .attr('stroke-width', 1.6)
    .attr('stroke', d => getLinkColor(d));

  links = linkEnter.merge(linkSel);

  // Nodes
  const nodeSel = viewport.select('.nodes').selectAll('g.node-group')
    .data(filteredData.nodes, d => d.id);

  nodeSel.exit().remove();

  const nodeEnter = nodeSel.enter().append('g')
    .attr('class', 'node-group')
    .attr('cursor', 'pointer')
    .call(d3.drag()
      .on('start', dragStarted)
      .on('drag', dragged)
      .on('end', dragEnded))
    .on('click', (event, d) => {
      event.stopPropagation();
      showDrawer(d);
    });

  nodeEnter.append('circle')
    .attr('class', 'node')
    .attr('r', d => getNodeRadius(d))
    .attr('fill', d => getNodeColor(d))
    .attr('stroke', '#f4e9d8')
    .attr('stroke-width', 2.5)
    .attr('stroke-opacity', 0.9);

  // Labels (created separately for zoom control)
  const labelSel = viewport.select('.labels').selectAll('text.node-label')
    .data(filteredData.nodes, d => d.id);

  labelSel.exit().remove();

  const labelEnter = labelSel.enter().append('text')
    .attr('class', 'node-label')
    .attr('text-anchor', 'middle')
    .attr('dy', d => getNodeRadius(d) + 13)
    .attr('font-size', '10px')
    .attr('fill', '#3f2a2a')
    .attr('paint-order', 'stroke')
    .attr('stroke', '#f8f5f0')
    .attr('stroke-width', 3)
    .attr('stroke-linejoin', 'round')
    .text(d => d.name.length > 18 ? d.name.slice(0, 17) + '…' : d.name)
    .style('pointer-events', 'none')
    .style('opacity', 0);

  labels = labelEnter.merge(labelSel);

  // Update simulation
  simulation.nodes(filteredData.nodes);
  simulation.force('link').links(filteredData.links);
  simulation.alpha(0.6).restart();

  simulation.on('tick', () => {
    links
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    viewport.selectAll('.node-group')
      .attr('transform', d => `translate(${d.x},${d.y})`);

    labels
      .attr('x', d => d.x)
      .attr('y', d => d.y);
  });

  updateLabelVisibility();
}

function updateLabelVisibility() {
  if (!labels || !currentTransform) return;
  const scale = currentTransform.k || 1;

  // Show labels when reasonably zoomed in, or for high-degree nodes when zoomed out (landmarks)
  labels.each(function(d) {
    const el = d3.select(this);
    const degree = (graphData.links || []).filter(l =>
      (l.source.id || l.source) === d.id || (l.target.id || l.target) === d.id
    ).length;
    const isLandmark = degree >= 5;

    let show = false;
    if (scale > 0.72) {
      show = true;
    } else if (scale > 0.38 && isLandmark) {
      show = true;
      el.attr('font-size', '8.5px').attr('dy', getNodeRadius(d) + 11);
    }

    el.style('opacity', show ? (scale > 0.9 ? 0.95 : 0.75) : 0);
  });
}

function getFilteredData() {
  let filteredNodes = [...graphData.nodes];
  let filteredLinks = [...graphData.links];

  const hasAll = activeFilters.has('all') || activeFilters.size === 0;

  if (!hasAll) {
    filteredNodes = filteredNodes.filter(n => {
      let pass = true;
      if (activeFilters.has('family')) pass = pass && n.group === 'family';
      if (activeFilters.has('corporate')) pass = pass && n.group === 'corporate';
      if (activeFilters.has('nicaragua')) pass = pass && (n.country || '').toLowerCase().includes('nicaragua');
      if (activeFilters.has('dominican')) pass = pass && (n.country || '').toLowerCase().includes('dominican');
      if (activeFilters.has('honduras')) pass = pass && (n.country || '').toLowerCase().includes('honduras');
      if (activeFilters.has('boutique')) pass = pass && n.type === 'brand' && n.group === 'family';
      if (activeFilters.has('factory')) pass = pass && (n.type === 'factory' || isFactoryNode(n));
      return pass;
    });
  }

  if (searchTerm) {
    const term = searchTerm;
    filteredNodes = filteredNodes.filter(n =>
      (n.name || '').toLowerCase().includes(term) ||
      (n.type || '').toLowerCase().includes(term) ||
      (n.country || '').toLowerCase().includes(term)
    );
  }

  const visibleIds = new Set(filteredNodes.map(n => n.id));
  filteredLinks = filteredLinks.filter(l => {
    const s = (l.source.id || l.source);
    const t = (l.target.id || l.target);
    return visibleIds.has(s) && visibleIds.has(t);
  });

  return { nodes: filteredNodes, links: filteredLinks };
}

function applyFiltersAndSearch() {
  if (!simulation) return;
  updateGraph();
}

// -----------------------------
// Drag handlers
// -----------------------------
function dragStarted(event, d) {
  if (!event.active) simulation.alphaTarget(0.2).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(event, d) {
  d.fx = event.x;
  d.fy = event.y;
}

function dragEnded(event, d) {
  if (!event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

// -----------------------------
// Zoom Controls
// -----------------------------
function zoomToFit(silent = false) {
  if (!svg || !viewport) return;
  const bounds = viewport.node().getBBox();
  if (!bounds.width || !bounds.height) return;

  const fullWidth = graphWidth;
  const fullHeight = graphHeight;
  const midX = bounds.x + bounds.width / 2;
  const midY = bounds.y + bounds.height / 2;

  const scale = Math.min(1.6, 0.92 / Math.max(bounds.width / fullWidth, bounds.height / fullHeight));
  const tx = fullWidth / 2 - scale * midX;
  const ty = fullHeight / 2 - scale * midY;

  svg.transition().duration(silent ? 0 : 650).call(
    zoomBehavior.transform,
    d3.zoomIdentity.translate(tx, ty).scale(scale)
  );
}

function resetZoom() {
  if (!svg) return;
  svg.transition().duration(550).call(zoomBehavior.transform, d3.zoomIdentity);
}

// -----------------------------
// Drawer (Desktop + Mobile)
// -----------------------------
let currentDrawerNode = null;

function showDrawer(node) {
  currentDrawerNode = node;

  const isMobile = window.innerWidth < 1024;

  // Desktop drawer
  const drawer = document.getElementById('drawer');
  const titleEl = document.getElementById('drawer-title');
  const metaEl = document.getElementById('drawer-meta');
  const descEl = document.getElementById('drawer-description');
  const connEl = document.getElementById('drawer-connections');
  const buyWrap = document.getElementById('drawer-buy-wrap');
  const buyEl = document.getElementById('drawer-buy');

  // Mobile drawer
  const mDrawer = document.getElementById('drawer-mobile');
  const mTitle = document.getElementById('drawer-title-mobile');
  const mMeta = document.getElementById('drawer-meta-mobile');
  const mDesc = document.getElementById('drawer-description-mobile');
  const mConn = document.getElementById('drawer-connections-mobile');
  const mBuyWrap = document.getElementById('drawer-buy-wrap-mobile');
  const mBuy = document.getElementById('drawer-buy-mobile');

  const name = node.name || node.id;
  const metaHTML = `
    <span class="inline-block px-2.5 py-0.5 text-[10px] font-semibold rounded-full border" style="border-color:#c5a26f;color:#5c2e2e;background:#f4e9d8">${node.type || 'node'}</span>
    <span class="inline-block px-2.5 py-0.5 text-[10px] font-semibold rounded-full border" style="border-color:#c5a26f;color:#5c2e2e;background:#f4e9d8">${node.group || ''}</span>
    ${node.country ? `<span class="inline-block px-2.5 py-0.5 text-[10px] font-semibold rounded-full border" style="border-color:#c5a26f;color:#5c2e2e;background:#f4e9d8">${node.country}</span>` : ''}
  `;

  const desc = descriptions[node.id] || "A notable node in the cigar industry with connections to the brands and factories shown in the graph.";

  // Connections
  const connections = graphData.links.filter(l => {
    const s = (l.source.id || l.source);
    const t = (l.target.id || l.target);
    return s === node.id || t === node.id;
  });

  let connHTML = '';
  if (connections.length === 0) {
    connHTML = '<div class="text-xs text-[#8b6f5c]">No direct connections shown with current filters.</div>';
  } else {
    connections.slice(0, 12).forEach(l => {
      const otherId = (l.source.id || l.source) === node.id ? (l.target.id || l.target) : (l.source.id || l.source);
      const other = graphData.nodes.find(n => n.id === otherId);
      const otherName = other ? other.name : otherId;
      connHTML += `<div class="text-xs px-2.5 py-1 rounded-xl bg-white/70 border border-[#d4c4a8] flex items-center gap-2">
        <span class="font-medium">${l.type || 'related'}</span> 
        <span class="text-[#8b6f5c]">→</span> 
        <span class="cursor-pointer hover:underline" onclick="showDrawerFromId('${otherId}')">${otherName}</span>
      </div>`;
    });
  }

  // Buy links (placeholder - extend with real affiliate data if available)
  const buyHTML = (node.buyLinks && node.buyLinks.length)
    ? node.buyLinks.map(b => `<a href="${b.url}" target="_blank" class="block text-xs px-3 py-1.5 rounded-xl bg-[#5c2e2e] text-[#f4e9d8] hover:bg-[#4a2424]">${b.label || 'Shop now'}</a>`).join('')
    : '<div class="text-xs text-[#8b6f5c]">No purchase links added yet for this node.</div>';

  if (!isMobile && drawer) {
    titleEl.textContent = name;
    metaEl.innerHTML = metaHTML;
    descEl.textContent = desc;
    connEl.innerHTML = connHTML;
    buyEl.innerHTML = buyHTML;
    buyWrap.style.display = (node.buyLinks && node.buyLinks.length) ? 'block' : 'block';
    drawer.classList.remove('hidden');
    drawer.style.display = 'flex';
  }

  if (isMobile && mDrawer) {
    mTitle.textContent = name;
    mMeta.innerHTML = metaHTML;
    mDesc.textContent = desc;
    mConn.innerHTML = connHTML;
    mBuy.innerHTML = buyHTML;
    mBuyWrap.style.display = 'block';
    mDrawer.classList.remove('hidden');
    mDrawer.style.display = 'flex';

    // Backdrop
    createOrShowBackdrop();
  }

  // Mobile auto scroll to top of sheet
  if (isMobile && mDrawer) {
    mDrawer.scrollTop = 0;
  }
}

function showDrawerFromId(id) {
  const node = graphData.nodes.find(n => n.id === id);
  if (node) {
    closeDrawer();
    setTimeout(() => showDrawer(node), 60);
  }
}

function closeDrawer() {
  const drawer = document.getElementById('drawer');
  const mDrawer = document.getElementById('drawer-mobile');

  if (drawer) {
    drawer.style.display = 'none';
  }
  if (mDrawer) {
    mDrawer.style.display = 'none';
    mDrawer.classList.add('hidden');
  }
  removeBackdrop();
}

function createOrShowBackdrop() {
  let backdrop = document.getElementById('drawer-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'drawer-backdrop';
    backdrop.className = 'fixed inset-0 bg-black/40 z-40 lg:hidden';
    backdrop.onclick = closeDrawer;
    document.body.appendChild(backdrop);
  }
  backdrop.style.display = 'block';
}

function removeBackdrop() {
  const backdrop = document.getElementById('drawer-backdrop');
  if (backdrop) backdrop.style.display = 'none';
}

// -----------------------------
// Public helpers for HTML onclick
// -----------------------------
window.zoomToFit = zoomToFit;
window.resetZoom = resetZoom;
window.toggleFilter = toggleFilter;
window.closeDrawer = closeDrawer;
window.showDrawerFromId = showDrawerFromId;

// -----------------------------
// Boot
// -----------------------------
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

// Also expose a manual refresh if needed
window.CigarNexus = {
  reinitialize: initializeApp,
  getData: () => graphData
};
