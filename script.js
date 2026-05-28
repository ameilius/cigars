// ============================================
// Cigar Nexus - Main Application Script
// Fully extracted and implemented for Option 1 split
// D3.js v7 force-directed graph + warm cigar lounge UI
// ============================================

// -----------------------------
// Data (loaded from data.js + localStorage)
// -----------------------------
let graphData = { nodes: [], links: [] };
let userAddedNodes = [];
let userAddedLinks = [];

// Node descriptions for the drawer (expand as needed)
const descriptions = {
  "myfather": "My Father is one of the most respected Nicaraguan brands, founded by Pepín García. Known for bold, full-bodied cigars with exceptional construction and complex flavors.",
  "pepin": "Pepín García is the legendary founder of My Father Cigars and a master blender with deep roots in the Cuban cigar tradition. He brought his family expertise to Nicaragua.",
  "tatuaje": "Tatuaje is a highly acclaimed boutique brand founded by Pete Johnson in collaboration with Pepín García. Famous for the Tatuaje Serie P and the Reserva line.",
  "espinosa": "Espinosa Premium Cigars, led by Erik Espinosa, produces bold, innovative cigars. The La Zona factory in Estelí is a hub for many boutique projects.",
  "padron": "Padrón is a family-owned icon founded by José Orlando Padrón. World-renowned for consistency, quality, and the legendary 1964 Anniversary and 1926 Serie lines.",
  "plasencia": "Plasencia Cigars is a powerhouse grower and manufacturer controlled by the Plasencia family. They supply tobacco to many top brands and produce their own acclaimed lines.",
  "rockypatel": "Rocky Patel Premium Cigars is a vertically integrated operation led by Nish Patel. Owns Tavicusa factory and maintains deep partnerships with Plasencia.",
  "drewestate": "Drew Estate (owned by Swisher International since 2014) is famous for innovative fermentation and bold cigars like Acid and Liga Privada. La Gran Fábrica in Estelí is their flagship.",
  "cle": "CLE Cigar Company, founded by Christian Eiroa, is a vertically integrated Honduran powerhouse. The Eiroa family also produces the highly regarded Aladino brand.",
  "aganorsa": "AGANORSA Leaf, led by Max Fernández Pujals, is one of Nicaragua's most important independent tobacco growers. Their TABSA factory in Estelí produces many top boutique brands.",
  "foundation": "Foundation Cigar Company (Nick Melillo) produces critically acclaimed lines like The Tabernacle and Olmec. They use contract production at top factories including My Father and A.J. Fernandez.",
  "oliva": "Oliva Cigar Co. is a major vertically integrated producer owned by the Vandermarliere family (Belgium). Famous for Serie V, Melanio, and Nub. Tabolisa is their primary Estelí factory.",
  "perdomo": "Perdomo Cigars is a large family-owned operation led by Nick Perdomo Jr. Known for ambitious vertical integration and the massive El Monstro factory in Estelí.",
  "joya": "Joya de Nicaragua is the oldest premium cigar factory in Nicaragua (founded 1965). A key contract manufacturer for many boutique brands including Dunbarton and Warped.",
  "dunbarton": "Dunbarton Tobacco & Trust, founded by Steve Saka, produces the acclaimed Sobremesa, Mi Querida, and Muestra de Saka lines. Strong partnership with Joya de Nicaragua.",
  "illusione": "Illusione, founded by Dion Giolito, is a cult favorite known for powerful, refined Nicaraguan cigars. Long-time user of AGANORSA / TABSA tobacco and production.",
  "viaje": "Viaje (Andre Farkas) is a highly sought-after boutique brand famous for limited releases and creative blends. Frequent production partner of TABSA and Joya.",
  "hvc": "HVC Cigars, founded by Reinier Lorenzo, built its own factory in Estelí. Known for the Hot Cake, Black Friday, and Edición Limitada series.",
  "warped": "Warped Cigars (Kyle Gellis) is a modern boutique standout. Major production partner with NACSA and historical ties to Aganorsa/TABSA."
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

// -----------------------------
// Persistence (localStorage)
// -----------------------------
function loadUserData() {
  try {
    const savedNodes = localStorage.getItem('cigarNexus_userNodes');
    const savedLinks = localStorage.getItem('cigarNexus_userLinks');
    userAddedNodes = savedNodes ? JSON.parse(savedNodes) : [];
    userAddedLinks = savedLinks ? JSON.parse(savedLinks) : [];
  } catch (e) {
    userAddedNodes = [];
    userAddedLinks = [];
  }
}

function saveUserData() {
  try {
    localStorage.setItem('cigarNexus_userNodes', JSON.stringify(userAddedNodes));
    localStorage.setItem('cigarNexus_userLinks', JSON.stringify(userAddedLinks));
  } catch (e) {}
}

function mergeData() {
  const baseNodes = (baseGraphData && baseGraphData.nodes) ? baseGraphData.nodes : [];
  const baseLinks = (baseGraphData && baseGraphData.links) ? baseGraphData.links : [];

  const nodeMap = new Map();
  [...baseNodes, ...userAddedNodes].forEach(n => {
    if (n && n.id) nodeMap.set(n.id, { ...n });
  });
  const mergedNodes = Array.from(nodeMap.values());

  const linkSet = new Set();
  const mergedLinks = [];
  [...baseLinks, ...userAddedLinks].forEach(l => {
    const s = (l.source && l.source.id) ? l.source.id : l.source;
    const t = (l.target && l.target.id) ? l.target.id : l.target;
    const key = `${s}__${t}__${l.type || ''}`;
    if (!linkSet.has(key)) {
      linkSet.add(key);
      mergedLinks.push({ source: s, target: t, type: l.type || 'related' });
    }
  });

  graphData = { nodes: mergedNodes, links: mergedLinks };
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
  loadUserData();
  mergeData();

  // Initial filter state
  activeFilters = new Set(['all']);

  // Setup filter chips
  setupFilterChips();

  // Setup search
  const searchInput = document.getElementById('search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value.trim().toLowerCase();
      applyFiltersAndSearch();
    });
  }

  // Setup submit modal
  setupSubmitModal();

  // Initialize the graph
  initializeGraph();

  // Zoom buttons
  const fitBtn = document.querySelector('button[onclick="zoomToFit()"]');
  const resetBtn = document.querySelector('button[onclick="resetZoom()"]');
  // (onclick attributes already in HTML)

  // Keyboard escape for drawers/modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('submit-modal');
      if (modal && !modal.classList.contains('hidden')) {
        closeSubmitModal();
      } else {
        closeDrawer();
      }
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
function setupFilterChips() {
  const chips = document.querySelectorAll('.filter-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const text = chip.textContent.trim().toLowerCase();
      let key = 'all';
      if (text.includes('family')) key = 'family';
      else if (text.includes('corporate')) key = 'corporate';
      else if (text.includes('nicaragua')) key = 'nicaragua';
      else if (text.includes('dominican')) key = 'dominican';
      else if (text.includes('honduras')) key = 'honduras';
      else if (text.includes('boutique')) key = 'boutique';
      else if (text.includes('factory')) key = 'factory';

      toggleFilter(key, chip);
    });
  });
}

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

  const desc = descriptions[node.id] || `No detailed description yet for ${name}. This node was added via research or manual entry.`;

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
// Submit Connection Modal + Logic
// -----------------------------
function setupSubmitModal() {
  const openBtn = document.getElementById('open-submit');
  const modal = document.getElementById('submit-modal');
  const form = document.getElementById('submit-form');
  const modeSel = document.getElementById('submit-mode');
  const newFields = document.getElementById('new-node-fields');

  if (openBtn && modal) {
    openBtn.onclick = () => {
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
      populateNodeSelects();
    };
  }

  if (modeSel && newFields) {
    modeSel.onchange = () => {
      newFields.style.display = (modeSel.value === 'new-to-existing') ? 'grid' : 'none';
    };
  }

  if (form) {
    form.onsubmit = handleSubmitConnection;
  }

  // Close when clicking outside content on mobile
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeSubmitModal();
    });
  }
}

function closeSubmitModal() {
  const modal = document.getElementById('submit-modal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.add('hidden');
  }
}

function populateNodeSelects() {
  const fromSel = document.getElementById('from-node');
  const toSel = document.getElementById('to-node');
  if (!fromSel || !toSel) return;

  const options = graphData.nodes
    .slice()
    .sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id))
    .map(n => `<option value="${n.id}">${n.name || n.id}</option>`)
    .join('');

  fromSel.innerHTML = '<option value="">Select node...</option>' + options;
  toSel.innerHTML = '<option value="">Select node...</option>' + options;
}

function handleSubmitConnection(e) {
  e.preventDefault();

  const errorBox = document.getElementById('submit-error');
  errorBox.classList.add('hidden');
  errorBox.textContent = '';

  const mode = document.getElementById('submit-mode').value;
  const fromId = document.getElementById('from-node').value;
  const toId = document.getElementById('to-node').value;
  const connType = document.getElementById('conn-type').value.trim() || 'related';

  if (!fromId || !toId) {
    errorBox.textContent = 'Please select both From and To nodes.';
    errorBox.classList.remove('hidden');
    return;
  }
  if (fromId === toId) {
    errorBox.textContent = 'From and To cannot be the same node.';
    errorBox.classList.remove('hidden');
    return;
  }

  let success = false;

  if (mode === 'new-to-existing') {
    const newName = document.getElementById('new-name').value.trim();
    const newType = document.getElementById('new-type').value;
    const newGroup = document.getElementById('new-group').value.trim() || 'family';
    const newCountry = document.getElementById('new-country').value.trim();

    if (!newName) {
      errorBox.textContent = 'New node name is required.';
      errorBox.classList.remove('hidden');
      return;
    }

    const newId = newName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 24) + '_' + Date.now().toString(36).slice(-4);

    // Avoid duplicate IDs
    if (graphData.nodes.some(n => n.id === newId)) {
      errorBox.textContent = 'A node with a similar ID already exists.';
      errorBox.classList.remove('hidden');
      return;
    }

    const newNode = {
      id: newId,
      name: newName,
      type: newType,
      group: newGroup,
      country: newCountry
    };

    userAddedNodes.push(newNode);
    userAddedLinks.push({ source: fromId, target: newId, type: connType });

    success = true;
  } else {
    // existing-to-existing
    userAddedLinks.push({ source: fromId, target: toId, type: connType });
    success = true;
  }

  if (success) {
    saveUserData();
    mergeData();
    updateGraph();
    populateNodeSelects();
    closeSubmitModal();

    // Reset form
    e.target.reset();
    document.getElementById('new-node-fields').style.display = 'grid';

    // Show the new connection
    const newNodeId = (mode === 'new-to-existing') ? userAddedNodes[userAddedNodes.length - 1].id : toId;
    setTimeout(() => {
      const n = graphData.nodes.find(x => x.id === newNodeId);
      if (n) showDrawer(n);
    }, 220);
  }
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
