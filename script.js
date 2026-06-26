// ============================================
// Cigar Nexus - Main Application Script
// Fully extracted and implemented for Option 1 split
// D3.js v7 force-directed graph + warm cigar lounge UI
// ============================================

// -----------------------------
// Data (loaded from data.js)
// -----------------------------
let graphData = { nodes: [], links: [] };


// Drawer descriptions loaded from descriptions.js (shared with SEO generator)
const descriptions = typeof drawerDescriptions !== 'undefined' ? drawerDescriptions : {};


// -----------------------------
// Helpers
// -----------------------------
function isFactoryNode(node) {
  if (!node) return false;
  if (node.type === 'factory') return true;
  const name = (node.name || '').toLowerCase();
  return name.includes('factory') || name.includes('estelí') || name.includes('esteli') || name.includes('tabolisa') || name.includes('tavicusa') || name.includes('nacsa') || name.includes('la gran');
}

const NODE_COLORS = {
  family: '#13817b',    // teal — family / independent
  corporate: '#CEA661', // gold — corporate / group
  factory: '#b45309',   // amber — factories / growers
};

function getNodeColor(node) {
  if (!node) return '#6b5b4f';
  if (node.type === 'factory' || isFactoryNode(node)) return NODE_COLORS.factory;
  if (node.group === 'corporate') return NODE_COLORS.corporate;
  if (node.group === 'family') return NODE_COLORS.family;
  return '#6b5b4f';
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

const LINK_CATEGORIES = [
  { key: 'ownership', label: 'Ownership', color: '#14817A', strokeWidth: 2.2, dash: null },
  { key: 'production', label: 'Production', color: '#A67C3D', strokeWidth: 1.4, dash: '5 3' },
  { key: 'partnership', label: 'Partnership', color: '#CEA661', strokeWidth: 1.4, dash: '2 4' },
];

function getLinkCategory(link) {
  const t = (link.type || '').toLowerCase();
  if (t.includes('owned') || t.includes('subsidiary') || t.includes('owns')) return 'ownership';
  if (t.includes('contract') || t.includes('manufactur') || t.includes('produced')) return 'production';
  if (t.includes('partnership') || t.includes('blended') || t.includes('partner') || t.includes('collaborat')) {
    return 'partnership';
  }
  return 'other';
}

function getLinkColor(link) {
  const cat = LINK_CATEGORIES.find(c => c.key === getLinkCategory(link));
  return cat ? cat.color : '#7A9A94';
}

const LEGEND_LINK_STROKE = '#7A9A94';

function buildLinkLegendSwatch(category) {
  const dashAttr = category.dash ? ` stroke-dasharray="${category.dash}"` : '';
  return `<svg class="legend-link-swatch" width="22" height="8" aria-hidden="true"><line x1="1" y1="4" x2="21" y2="4" stroke="${LEGEND_LINK_STROKE}" stroke-width="${category.strokeWidth}"${dashAttr} stroke-linecap="round"/></svg>`;
}

function setupGraphLegend() {
  const rowHTML = LINK_CATEGORIES.map(cat => `
    <div class="graph-legend__item">
      ${buildLinkLegendSwatch(cat)}
      <span>${cat.label}</span>
    </div>
  `).join('');

  document.querySelectorAll('[data-legend-rows]').forEach((rows) => {
    rows.innerHTML = rowHTML;
  });

  document.querySelectorAll('[data-legend-toggle]').forEach((toggle) => {
    const root = toggle.closest('.graph-legend');
    const panel = root?.querySelector('[data-legend-panel]');
    if (!panel) return;

    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const open = panel.classList.toggle('graph-legend__links-panel--open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      const chevron = toggle.querySelector('.graph-legend__chevron');
      if (chevron) chevron.textContent = open ? '▾' : '▸';
    });
  });

  document.querySelectorAll('[data-legend-expand]').forEach((toggle) => {
    const root = toggle.closest('.graph-legend--overlay');
    if (!root) return;

    const setExpanded = (expanded) => {
      root.classList.toggle('graph-legend--expanded', expanded);
      toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      const chevron = toggle.querySelector('.graph-legend__chevron');
      if (chevron) chevron.textContent = expanded ? '▾' : '▸';
      try {
        sessionStorage.setItem('cigarNexus_legendExpanded', expanded ? 'true' : 'false');
      } catch (_) {}
    };

    try {
      if (sessionStorage.getItem('cigarNexus_legendExpanded') === 'true') {
        setExpanded(true);
      }
    } catch (_) {}

    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      setExpanded(!root.classList.contains('graph-legend--expanded'));
    });
  });
}

function escapeMetaLabel(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Brand/company logo or person portrait (people use `photo`, not `logo`). */
function getNodeVisual(node) {
  if (!node) return null;
  if (node.type === 'person' && node.photo && String(node.photo).trim()) {
    return { src: node.photo.trim(), kind: 'photo', altSuffix: 'portrait' };
  }
  if (node.logo && String(node.logo).trim()) {
    return { src: node.logo.trim(), kind: 'logo', altSuffix: 'logo' };
  }
  return null;
}

/** Legend-aligned meta pills for the drawer (visual only). */
function buildMetaPills(node) {
  const pills = [];
  const push = (label, variant) => {
    if (label) pills.push(`<span class="meta-pill meta-pill--${variant}">${escapeMetaLabel(label)}</span>`);
  };

  if (node.type) {
    let typeVariant = 'neutral';
    if (node.type === 'factory' || isFactoryNode(node)) typeVariant = 'factory';
    else if (node.type === 'brand') typeVariant = 'boutique';
    push(node.type, typeVariant);
  }
  if (node.group) {
    push(node.group, node.group === 'corporate' ? 'corporate' : 'family');
  }
  if (node.country) {
    const c = node.country.toLowerCase();
    if (c.includes('nicaragua')) push(node.country, 'nicaragua');
    else if (c.includes('dominican')) push(node.country, 'dominican');
    else if (c.includes('honduras')) push(node.country, 'honduras');
    else push(node.country, 'neutral');
  }
  return pills.join('');
}

let selectedNodeId = null;

function setSelectedNode(nodeId) {
  selectedNodeId = nodeId || null;
  if (!viewport) return;
  viewport.selectAll('.node-group').classed('node-selected', d => d.id === nodeId);
  updateLinkHighlight(nodeId);
}

function clearSelectedNode() {
  selectedNodeId = null;
  if (!viewport) return;
  viewport.selectAll('.node-group').classed('node-selected', false);
  updateLinkHighlight(null);
}

function updateLinkHighlight(nodeId) {
  if (!viewport) return;
  const lines = viewport.selectAll('.links line');
  if (!nodeId) {
    lines.attr('stroke-opacity', null).attr('stroke-width', null);
    return;
  }
  lines
    .attr('stroke-opacity', d => {
      const s = d.source.id || d.source;
      const t = d.target.id || d.target;
      return (s === nodeId || t === nodeId) ? 1 : 0.1;
    })
    .attr('stroke-width', d => {
      const s = d.source.id || d.source;
      const t = d.target.id || d.target;
      return (s === nodeId || t === nodeId) ? 2.5 : 1.2;
    });
}

function pulseDrawerOpen(el) {
  if (!el) return;
  el.classList.remove('drawer-open');
  void el.offsetWidth;
  requestAnimationFrame(() => el.classList.add('drawer-open'));
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
let searchOverlayOpen = false;

// Desktop search auto-zoom (debounced; does not affect mobile search overlay)
const DESKTOP_SEARCH_ZOOM_MIN = 1024;
const SEARCH_ZOOM_DEBOUNCE_MS = 350;
const SEARCH_ZOOM_MAX_MATCHES = 12;
const SEARCH_ZOOM_SETTLE_MS = 900;
let searchZoomTimer = null;
let searchZoomGeneration = 0;

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

  // Populate filter chip counts (defensive)
  try {
    updateFilterChipCounts();
  } catch (e) {
    console.warn('Filter counts failed (non-fatal):', e);
  }

  // Initial filter state
  activeFilters = new Set(['all']);

  // Give the "All" chip its initial active visual state (use data-key for robustness)
  const allChip = document.querySelector('.filter-chip[data-key="all"]') || document.querySelector('.filter-chip');
  if (allChip) allChip.classList.add('filter-active');

  setupSearch();
  setupFilterStatus();
  setupUrlHistory();
  setupGraphLegend();

  // Initialize the graph (wrapped so one error doesn't kill filters or drawer)
  try {
    initializeGraph();
  } catch (e) {
    console.error('initializeGraph threw:', e);
  }

  // Keyboard escape closes search overlay first, then drawer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (searchOverlayOpen) closeSearchOverlay();
      else closeDrawer();
    }
  });

  // Initial render of any saved state
  console.log('Cigar Nexus initialized. Nodes:', graphData.nodes.length, 'Links:', graphData.links.length);

  // First-visit guide (after age gate if shown)
  setTimeout(() => maybeShowFirstVisitGuide(), 500);
}

let introGuideShown = false;

function maybeShowFirstVisitGuide() {
  if (introGuideShown) return;

  // Shared ?node= links take priority over the first-visit intro
  if (getNodeIdFromUrl()) {
    introGuideShown = true;
    return;
  }

  const seen = localStorage.getItem('cigarNexus_seenIntro') === 'true' ||
               sessionStorage.getItem('cigarNexus_seenIntro') === 'true';
  if (seen) {
    introGuideShown = true;
    // Returning desktop users: show the guide in the sidebar instead of a blank panel
    if (window.innerWidth >= 1024 && !new URLSearchParams(window.location.search).get('node')) {
      showDesktopHowTo();
    }
    return;
  }

  const ageGate = document.getElementById('age-gate');
  if (ageGate && getComputedStyle(ageGate).display !== 'none') {
    return;
  }

  introGuideShown = true;

  if (window.innerWidth >= 1024) {
    showDesktopHowTo();
  } else {
    showMobileWelcome();
  }
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

    // Robust lookup using data-key instead of fragile textContent (which now includes counts)
    const allChip = Array.from(document.querySelectorAll('.filter-chip'))
      .find(c => c.getAttribute('data-key') === 'all');
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

  try {
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
      .force('link', d3.forceLink().id(d => d.id).distance(70).strength(0.85))
      .force('charge', d3.forceManyBody().strength(-310))
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

    // Deep linking support: ?node=ID opens the drawer (deferred if age gate is still visible)
    setTimeout(() => tryApplyPendingNodeDeepLink(), 800);

  } catch (err) {
    console.error('Failed to initialize graph (nodes may not appear):', err);
    // Try a minimal fallback render so the page isn't completely dead
    try {
      const fallback = document.getElementById('graph');
      if (fallback) fallback.innerHTML = '<div style="padding:20px;color:#6B8A84;font-size:13px;">Graph failed to load. Try refreshing the page (Ctrl+Shift+R).</div>';
    } catch (_) {}
  }
}

function updateGraph() {
  if (!viewport || !simulation) {
    console.warn('updateGraph called before graph was initialized');
    return;
  }

  let filteredData;
  try {
    filteredData = getFilteredData();
  } catch (e) {
    console.error('getFilteredData failed:', e);
    filteredData = { nodes: graphData.nodes || [], links: graphData.links || [] };
  }

  // Links
  const linkSel = viewport.select('.links').selectAll('line')
    .data(filteredData.links, d => d.source.id + '-' + d.target.id);

  linkSel.exit().remove();

  const linkEnter = linkSel.enter().append('line')
    .attr('class', 'link')
    .attr('stroke', d => getLinkColor(d))
    .attr('data-type', d => (d.type || '').toLowerCase());

  links = linkEnter.merge(linkSel)
    .attr('stroke', d => getLinkColor(d))
    .attr('data-type', d => (d.type || '').toLowerCase())
    .attr('data-category', d => getLinkCategory(d));

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
    .attr('stroke', '#ECF4F2')
    .attr('stroke-width', 2.5)
    .attr('stroke-opacity', 0.9);

  nodes = nodeEnter.merge(nodeSel);

  // Labels (created separately for zoom control)
  const labelSel = viewport.select('.labels').selectAll('text.node-label')
    .data(filteredData.nodes, d => d.id);

  labelSel.exit().remove();

  const labelEnter = labelSel.enter().append('text')
    .attr('class', 'node-label')
    .attr('text-anchor', 'middle')
    .attr('dy', d => getNodeRadius(d) + 12)
    .attr('font-size', '9.5px')
    .attr('fill', '#1A3330')
    .attr('paint-order', 'stroke')
    .attr('stroke', '#F6F8F7')
    .attr('stroke-width', 3)
    .attr('stroke-linejoin', 'round')
    .text(d => d.name)
    .attr('title', d => d.name)
    .style('pointer-events', 'none')
    .style('opacity', 0);

  labels = labelEnter.merge(labelSel)
    .attr('title', d => d.name);

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

  if (selectedNodeId) setSelectedNode(selectedNodeId);
  else updateLinkHighlight(null);

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
    const ownershipActive = ['family', 'corporate'].filter(k => activeFilters.has(k));
    const countryActive = ['nicaragua', 'dominican', 'honduras'].filter(k => activeFilters.has(k));
    const typeActive = ['boutique', 'factory'].filter(k => activeFilters.has(k));

    filteredNodes = filteredNodes.filter(n => {
      const country = (n.country || '').toLowerCase();

      if (ownershipActive.length > 0) {
        const matchesOwnership = ownershipActive.some(k =>
          (k === 'family' && n.group === 'family') ||
          (k === 'corporate' && n.group === 'corporate')
        );
        if (!matchesOwnership) return false;
      }

      if (countryActive.length > 0) {
        const matchesCountry = countryActive.some(k =>
          (k === 'nicaragua' && country.includes('nicaragua')) ||
          (k === 'dominican' && country.includes('dominican')) ||
          (k === 'honduras' && country.includes('honduras'))
        );
        if (!matchesCountry) return false;
      }

      if (typeActive.length > 0) {
        const matchesType = typeActive.some(k =>
          (k === 'boutique' && n.type === 'brand' && n.group === 'family') ||
          (k === 'factory' && (n.type === 'factory' || isFactoryNode(n)))
        );
        if (!matchesType) return false;
      }

      return true;
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
  if (simulation) updateGraph();
  if (searchOverlayOpen) renderSearchResults();
  updateSearchMobileBadge();
  updateFilterStatus();
}

function isMapFiltered() {
  const hasAll = activeFilters.has('all') || activeFilters.size === 0;
  return !hasAll || !!searchTerm;
}

function resetMapViewFilters() {
  activeFilters.clear();
  activeFilters.add('all');
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('filter-active'));
  const allChip = document.querySelector('.filter-chip[data-key="all"]');
  if (allChip) allChip.classList.add('filter-active');
  clearSearch();
}

function setupFilterStatus() {
  const el = document.getElementById('filter-status');
  if (!el) return;
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-filter-reset]')) {
      e.preventDefault();
      resetMapViewFilters();
    }
  });
  updateFilterStatus();
}

function updateFilterStatus() {
  const el = document.getElementById('filter-status');
  if (!el) return;

  const total = (graphData.nodes || []).length;
  if (!total || !isMapFiltered()) {
    el.hidden = true;
    el.textContent = '';
    return;
  }

  const visible = getFilteredData().nodes.length;
  el.hidden = false;

  if (visible === 0) {
    el.innerHTML = 'No nodes match — <button type="button" class="filter-status__clear" data-filter-reset>clear filters</button>';
    return;
  }

  const noun = visible === 1 ? 'node' : 'nodes';
  el.textContent = `Showing ${visible} of ${total} ${noun}`;
}

// -----------------------------
// Search (desktop inline + mobile overlay)
// -----------------------------
function updateSearchClearButton(input, clearBtn) {
  if (!clearBtn || !input) return;
  if (input.value.length > 0) clearBtn.classList.remove('hidden');
  else clearBtn.classList.add('hidden');
}

function syncSearchInputs(sourceInput) {
  const desktop = document.getElementById('search');
  const mobile = document.getElementById('search-mobile');
  [desktop, mobile].forEach(el => {
    if (el && el !== sourceInput) el.value = searchTerm;
  });
  updateSearchClearButton(desktop, document.getElementById('search-clear'));
  updateSearchClearButton(mobile, document.getElementById('search-mobile-clear'));
}

function updateSearchMobileBadge() {
  const badge = document.getElementById('search-mobile-badge');
  if (!badge) return;
  if (searchTerm && !searchOverlayOpen) badge.classList.remove('hidden');
  else badge.classList.add('hidden');
}

function onSearchInput(value, sourceInput) {
  searchTerm = value.trim().toLowerCase();
  syncSearchInputs(sourceInput);
  applyFiltersAndSearch();
  scheduleDesktopSearchZoom();
}

function bindSearchInput(input, clearBtn) {
  if (!input) return;
  input.addEventListener('input', (e) => onSearchInput(e.target.value, input));
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      onSearchInput('', input);
      input.focus();
    });
  }
}

function clearSearch() {
  searchTerm = '';
  const desktop = document.getElementById('search');
  const mobile = document.getElementById('search-mobile');
  if (desktop) desktop.value = '';
  if (mobile) mobile.value = '';
  updateSearchClearButton(desktop, document.getElementById('search-clear'));
  updateSearchClearButton(mobile, document.getElementById('search-mobile-clear'));
  applyFiltersAndSearch();
  if (searchOverlayOpen) renderSearchResults();
  scheduleDesktopSearchZoom();
}

function isDesktopSearchZoomEligible() {
  return window.innerWidth >= DESKTOP_SEARCH_ZOOM_MIN && !searchOverlayOpen;
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getFilteredNodeBounds(extraPadding = 48) {
  const { nodes } = getFilteredData();
  const positioned = nodes.filter(hasNodeCoords);
  if (!positioned.length) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const n of positioned) {
    const pad = getNodeRadius(n) + extraPadding;
    minX = Math.min(minX, n.x - pad);
    minY = Math.min(minY, n.y - pad);
    maxX = Math.max(maxX, n.x + pad);
    maxY = Math.max(maxY, n.y + pad);
  }

  if (!isFinite(minX) || !isFinite(maxX)) return null;
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function waitForSearchLayoutSettle(callback, generation) {
  if (!simulation) {
    callback();
    return;
  }

  let settled = false;
  const finish = () => {
    if (settled || generation !== searchZoomGeneration) return;
    settled = true;
    simulation.on('end.searchZoom', null);
    callback();
  };

  simulation.on('end.searchZoom', finish);
  setTimeout(finish, SEARCH_ZOOM_SETTLE_MS);
}

function scheduleDesktopSearchZoom() {
  if (!isDesktopSearchZoomEligible()) return;
  if (searchZoomTimer) clearTimeout(searchZoomTimer);
  searchZoomTimer = setTimeout(runDesktopSearchZoom, SEARCH_ZOOM_DEBOUNCE_MS);
}

function runDesktopSearchZoom() {
  searchZoomTimer = null;
  if (!isDesktopSearchZoomEligible() || !svg || !viewport) return;

  const generation = ++searchZoomGeneration;
  const matchCount = getFilteredData().nodes.length;

  const executeZoom = () => {
    if (generation !== searchZoomGeneration) return;

    const silent = prefersReducedMotion();
    if (!searchTerm) {
      zoomToFit(silent);
      return;
    }
    if (matchCount === 0 || matchCount > SEARCH_ZOOM_MAX_MATCHES) return;
    zoomToFit(silent, { searchMode: true });
  };

  waitForSearchLayoutSettle(executeZoom, generation);
}

function getSearchMatches() {
  if (!searchTerm) return [];
  const { nodes } = getFilteredData();
  return [...nodes].sort((a, b) => {
    const aName = (a.name || '').toLowerCase();
    const bName = (b.name || '').toLowerCase();
    const aStarts = aName.startsWith(searchTerm);
    const bStarts = bName.startsWith(searchTerm);
    if (aStarts !== bStarts) return aStarts ? -1 : 1;
    return aName.localeCompare(bName);
  });
}

function renderSearchResults() {
  const list = document.getElementById('search-results');
  const empty = document.getElementById('search-empty');
  const hint = document.getElementById('search-hint');
  if (!list) return;

  if (!searchTerm) {
    list.innerHTML = '';
    if (empty) empty.classList.add('hidden');
    if (hint) hint.classList.remove('hidden');
    return;
  }

  const matches = getSearchMatches();
  if (hint) hint.classList.add('hidden');

  if (matches.length === 0) {
    list.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
    return;
  }

  if (empty) empty.classList.add('hidden');
  list.innerHTML = matches.map(node => `
    <button type="button"
            class="search-result-item"
            data-node-id="${escapeMetaLabel(node.id)}"
            role="option"
            aria-label="Open ${escapeMetaLabel(node.name)}">
      <span class="search-result-item__name">${escapeMetaLabel(node.name)}</span>
      <span class="search-result-item__meta">${buildMetaPills(node)}</span>
    </button>
  `).join('');

  list.querySelectorAll('.search-result-item').forEach(btn => {
    btn.addEventListener('click', () => selectSearchResult(btn.getAttribute('data-node-id')));
  });
}

function openSearchOverlay() {
  const overlay = document.getElementById('search-overlay');
  if (!overlay || window.innerWidth >= 1024) return;

  closeDrawer();
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  searchOverlayOpen = true;
  document.body.style.overflow = 'hidden';

  const mobileInput = document.getElementById('search-mobile');
  if (mobileInput) {
    mobileInput.value = searchTerm;
    updateSearchClearButton(mobileInput, document.getElementById('search-mobile-clear'));
    requestAnimationFrame(() => mobileInput.focus());
  }
  renderSearchResults();
  updateSearchMobileBadge();
}

function closeSearchOverlay() {
  const overlay = document.getElementById('search-overlay');
  if (!overlay || overlay.classList.contains('hidden')) return;

  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden', 'true');
  searchOverlayOpen = false;

  const ageGate = document.getElementById('age-gate');
  const gateVisible = ageGate && getComputedStyle(ageGate).display !== 'none';
  if (!gateVisible) document.body.style.overflow = '';

  updateSearchMobileBadge();

  // Overlay close restores body scroll — graph size may change on mobile
  requestAnimationFrame(refreshGraphDimensions);
}

function selectSearchResult(nodeId) {
  const node = graphData.nodes.find(n => n.id === nodeId);
  if (!node) return;

  closeSearchOverlay();
  closeDrawer({ keepMapFocus: false, suppressDefault: true, skipUrlUpdate: true });

  const zoomOpts = { raiseForDrawer: window.innerWidth < 1024 };

  // Keep search filter active so the graph layout still matches the tapped result
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      refreshGraphDimensions();
      if (simulation) simulation.alpha(0.25).restart();
      waitForLiveNode(node.id, (live) => {
        currentDrawerNode = node;
        setSelectedNode(node.id);
        zoomToNode(live, zoomOpts);
        showDrawer(node);
      });
    });
  });
}

function setupSearch() {
  bindSearchInput(document.getElementById('search'), document.getElementById('search-clear'));
  bindSearchInput(document.getElementById('search-mobile'), document.getElementById('search-mobile-clear'));

  const openBtn = document.getElementById('search-mobile-open');
  if (openBtn) openBtn.addEventListener('click', openSearchOverlay);

  const cancelBtn = document.getElementById('search-overlay-cancel');
  if (cancelBtn) cancelBtn.addEventListener('click', closeSearchOverlay);
}

// Update the counts shown inside each filter chip (full dataset totals)
function updateFilterChipCounts() {
  const chips = document.querySelectorAll('#filter-chips [data-key]');
  const nodes = graphData.nodes || [];
  if (!chips.length || !nodes.length) return;

  chips.forEach(chip => {
    const key = chip.getAttribute('data-key');
    const countSpan = chip.querySelector('.chip-count');
    if (!countSpan) return;

    let count = nodes.length;
    if (key === 'family') {
      count = nodes.filter(n => n.group === 'family').length;
    } else if (key === 'corporate') {
      count = nodes.filter(n => n.group === 'corporate').length;
    } else if (key === 'nicaragua') {
      count = nodes.filter(n => (n.country || '').toLowerCase().includes('nicaragua')).length;
    } else if (key === 'dominican') {
      count = nodes.filter(n => (n.country || '').toLowerCase().includes('dominican')).length;
    } else if (key === 'honduras') {
      count = nodes.filter(n => (n.country || '').toLowerCase().includes('honduras')).length;
    } else if (key === 'boutique') {
      count = nodes.filter(n => n.type === 'brand' && n.group === 'family').length;
    } else if (key === 'factory') {
      count = nodes.filter(n => n.type === 'factory' || isFactoryNode(n)).length;
    }
    // 'all' keeps total
    countSpan.textContent = `(${count})`;
  });
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
function zoomToFit(silent = false, options = {}) {
  if (!svg || !viewport) return;

  const searchMode = !!options.searchMode;
  const paddingFactor = searchMode ? 0.65 : 0.92;
  const maxScale = searchMode ? 2.4 : 1.6;

  let bounds = searchMode ? getFilteredNodeBounds(48) : null;
  if (!bounds || !bounds.width || !bounds.height) {
    bounds = viewport.node().getBBox();
  }
  if (!bounds.width || !bounds.height) return;

  const fullWidth = graphWidth;
  const fullHeight = graphHeight;
  const midX = bounds.x + bounds.width / 2;
  const midY = bounds.y + bounds.height / 2;

  const scale = Math.min(
    maxScale,
    paddingFactor / Math.max(bounds.width / fullWidth, bounds.height / fullHeight)
  );
  const tx = fullWidth / 2 - scale * midX;
  const ty = fullHeight / 2 - scale * midY;

  svg.transition().duration(silent ? 0 : 650).call(
    zoomBehavior.transform,
    d3.zoomIdentity.translate(tx, ty).scale(scale)
  );
}

function resetZoom() {
  if (!svg) return;
  clearSelectedNode();
  currentDrawerNode = null;
  svg.transition().duration(550).call(zoomBehavior.transform, d3.zoomIdentity);
}

function refreshGraphDimensions() {
  const container = document.getElementById('graph');
  if (!container || !svg) return;
  const rect = container.getBoundingClientRect();
  if (rect.width < 50 || rect.height < 50) return;

  graphWidth = rect.width;
  graphHeight = rect.height;
  svg.attr('viewBox', `0 0 ${graphWidth} ${graphHeight}`);

  if (simulation) {
    simulation.force('x', d3.forceX(graphWidth / 2).strength(0.06));
    simulation.force('y', d3.forceY(graphHeight / 2).strength(0.06));
    simulation.force('center', d3.forceCenter(graphWidth / 2, graphHeight / 2));
  }
}

function getLiveNode(nodeId) {
  if (!viewport) return null;
  let live = null;
  viewport.selectAll('.node-group').each(function(d) {
    if (d.id === nodeId) live = d;
  });
  return live;
}

function hasNodeCoords(node) {
  return node && typeof node.x === 'number' && typeof node.y === 'number' && !isNaN(node.x) && !isNaN(node.y);
}

// Smoothly zoom + center on a specific node (used by search, examples, deep links)
function zoomToNode(targetNode, options = {}) {
  if (!svg || !viewport || !targetNode || !simulation) return false;

  refreshGraphDimensions();

  const nodeId = targetNode.id || targetNode;
  const live = getLiveNode(nodeId);
  const d = live || targetNode;

  if (!hasNodeCoords(d)) return false;

  const scale = options.scale ?? 1.9;
  const focusY = options.raiseForDrawer ? graphHeight * 0.3 : graphHeight / 2;
  const tx = graphWidth / 2 - scale * d.x;
  const ty = focusY - scale * d.y;
  const duration = options.duration ?? 620;

  const transform = d3.zoomIdentity.translate(tx, ty).scale(scale);
  if (duration <= 0) {
    svg.call(zoomBehavior.transform, transform);
  } else {
    svg.transition().duration(duration).call(zoomBehavior.transform, transform);
  }
  return true;
}

function waitForLiveNode(nodeId, callback, attempt = 0) {
  const live = getLiveNode(nodeId);
  if (hasNodeCoords(live)) {
    callback(live);
    return;
  }
  if (attempt < 60) {
    requestAnimationFrame(() => waitForLiveNode(nodeId, callback, attempt + 1));
  }
}

function focusNodeOnMap(node, options = {}) {
  if (!node) return;
  waitForLiveNode(node.id, (live) => {
    currentDrawerNode = node;
    setSelectedNode(node.id);
    refreshGraphDimensions();
    zoomToNode(live, options);
  });
}

function expandGraphWithFocus(node) {
  if (!node) return;

  const zoomOpts = { raiseForDrawer: window.innerWidth < 1024 };
  const live = getLiveNode(node.id);
  const pinX = live?.x;
  const pinY = live?.y;

  if (live && hasNodeCoords(live)) {
    live.fx = pinX;
    live.fy = pinY;
  }

  searchTerm = '';
  const desktop = document.getElementById('search');
  const mobile = document.getElementById('search-mobile');
  if (desktop) desktop.value = '';
  if (mobile) mobile.value = '';
  updateSearchClearButton(desktop, document.getElementById('search-clear'));
  updateSearchClearButton(mobile, document.getElementById('search-mobile-clear'));
  applyFiltersAndSearch();
  updateSearchMobileBadge();

  const refocus = () => {
    refreshGraphDimensions();
    const target = getLiveNode(node.id);
    if (!target || !hasNodeCoords(target)) return;
    currentDrawerNode = node;
    setSelectedNode(node.id);
    zoomToNode(target, zoomOpts);
  };

  requestAnimationFrame(refocus);

  const releasePin = () => {
    if (simulation) simulation.on('end.expandFocus', null);
    const target = getLiveNode(node.id);
    if (target) {
      target.fx = null;
      target.fy = null;
    }
    setTimeout(refocus, 120);
  };

  if (simulation) {
    simulation.on('end.expandFocus', releasePin);
    setTimeout(releasePin, 1600);
  }
}

// -----------------------------
// Drawer (Desktop + Mobile)
// -----------------------------
let currentDrawerNode = null;
let mobileDrawerHideTimer = null;
let suppressUrlSync = false;

function getNodeIdFromUrl() {
  return new URLSearchParams(window.location.search).get('node');
}

function isAgeGateVisible() {
  const gate = document.getElementById('age-gate');
  return !!(gate && getComputedStyle(gate).display !== 'none');
}

function applyNodeDeepLink({ syncUrl = 'replace' } = {}) {
  const nodeId = getNodeIdFromUrl();
  if (!nodeId) return false;
  const node = graphData.nodes.find(n => n.id === nodeId);
  if (!node) {
    clearNodeUrl({ replace: true });
    return false;
  }
  focusNodeOnMap(node, { raiseForDrawer: window.innerWidth < 1024 });
  showDrawer(node, { syncUrl });
  return true;
}

function tryApplyPendingNodeDeepLink() {
  if (!getNodeIdFromUrl() || isAgeGateVisible()) return false;
  return applyNodeDeepLink({ syncUrl: 'replace' });
}

function pushNodeUrl(nodeId) {
  const url = new URL(window.location.href);
  if (url.searchParams.get('node') === nodeId) return;
  url.searchParams.set('node', nodeId);
  window.history.pushState({ nodeId }, '', url);
}

function clearNodeUrl({ replace = false } = {}) {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('node')) return;
  url.searchParams.delete('node');
  const next = url.pathname + url.search + url.hash;
  if (replace) {
    window.history.replaceState({}, '', next);
  } else {
    window.history.pushState({}, '', next);
  }
}

function syncUrlForDrawer(node, mode) {
  if (suppressUrlSync || mode === 'skip' || !node) return;
  if (mode === 'replace') {
    const url = new URL(window.location.href);
    url.searchParams.set('node', node.id);
    window.history.replaceState({ nodeId: node.id }, '', url);
    return;
  }
  pushNodeUrl(node.id);
}

function openDrawerFromUrl(nodeId) {
  const node = graphData.nodes.find(n => n.id === nodeId);
  if (!node) {
    clearNodeUrl({ replace: true });
    return;
  }
  if (currentDrawerNode?.id !== nodeId) {
    closeDrawer({ keepMapFocus: false, suppressDefault: true, skipUrlUpdate: true });
  }
  focusNodeOnMap(node, { raiseForDrawer: window.innerWidth < 1024 });
  showDrawer(node, { syncUrl: 'skip' });
}

function setupUrlHistory() {
  window.addEventListener('popstate', () => {
    suppressUrlSync = true;
    const nodeId = getNodeIdFromUrl();
    if (nodeId) {
      openDrawerFromUrl(nodeId);
    } else {
      closeDrawer({
        keepMapFocus: false,
        suppressDefault: window.innerWidth >= 1024,
        skipUrlUpdate: true
      });
    }
    suppressUrlSync = false;
  });
}

function showDrawer(node, options = {}) {
  currentDrawerNode = node;

  const isMobile = window.innerWidth < 1024;

  // Restore normal section labels + visibility if we were previously showing the intro
  const connSection = document.querySelector('#drawer-connections')?.parentElement;
  let connLabel = connSection ? connSection.querySelector('.text-xs.font-semibold') : null;
  if (!connLabel && connSection) {
    connLabel = Array.from(connSection.querySelectorAll('div')).find(d => /start here|connections/i.test(d.textContent || ''));
  }
  if (connLabel && /start here/i.test(connLabel.textContent)) connLabel.textContent = 'Connections';

  const mConnSection = document.querySelector('#drawer-connections-mobile')?.parentElement;
  let mConnLabel = mConnSection ? mConnSection.querySelector('.text-xs.font-semibold') : null;
  if (!mConnLabel && mConnSection) {
    mConnLabel = Array.from(mConnSection.querySelectorAll('div')).find(d => /start here|connections/i.test(d.textContent || ''));
  }
  if (mConnLabel && /start here/i.test(mConnLabel.textContent)) mConnLabel.textContent = 'Connections';

  // Reset intro sections without redeclaring variables that exist later in the function
  const _pw = document.getElementById('drawer-product-lines-wrap');
  if (_pw) _pw.style.display = '';
  const _bw = document.getElementById('drawer-buy-wrap');
  if (_bw) _bw.style.display = '';

  const _mpw = document.getElementById('drawer-product-lines-wrap-mobile');
  if (_mpw) _mpw.style.display = '';
  const _mbw = document.getElementById('drawer-buy-wrap-mobile');
  if (_mbw) _mbw.style.display = '';

  // Desktop drawer
  const drawer = document.getElementById('drawer');
  const titleEl = document.getElementById('drawer-title');
  const metaEl = document.getElementById('drawer-meta');
  const descEl = document.getElementById('drawer-description');
  const connEl = document.getElementById('drawer-connections');
  const productLinesWrap = document.getElementById('drawer-product-lines-wrap');
  const productLinesEl = document.getElementById('drawer-product-lines');
  const buyWrap = document.getElementById('drawer-buy-wrap');
  const buyEl = document.getElementById('drawer-buy');

  // Mobile drawer
  const mDrawer = document.getElementById('drawer-mobile');
  const mTitle = document.getElementById('drawer-title-mobile');
  const mMeta = document.getElementById('drawer-meta-mobile');
  const mDesc = document.getElementById('drawer-description-mobile');
  const mConn = document.getElementById('drawer-connections-mobile');
  const mProductLinesWrap = document.getElementById('drawer-product-lines-wrap-mobile');
  const mProductLinesEl = document.getElementById('drawer-product-lines-mobile');
  const mBuyWrap = document.getElementById('drawer-buy-wrap-mobile');
  const mBuy = document.getElementById('drawer-buy-mobile');

  const name = node.name || node.id;

  // Logo or person portrait in drawer (desktop + mobile)
  const logoContainerDesktop = document.getElementById('drawer-logo-container');
  const logoImgDesktop = document.getElementById('drawer-logo');
  const logoContainerMobile = document.getElementById('drawer-logo-container-mobile');
  const logoImgMobile = document.getElementById('drawer-logo-mobile');
  const visual = getNodeVisual(node);

  const applyDrawerVisual = (container, img) => {
    if (!container || !img) return;
    container.classList.remove('drawer-image-container--person');
    if (visual) {
      img.src = visual.src;
      img.alt = `${name} ${visual.altSuffix}`;
      if (visual.kind === 'photo') container.classList.add('drawer-image-container--person');
      container.classList.remove('hidden');
    } else {
      container.classList.add('hidden');
    }
  };

  applyDrawerVisual(logoContainerDesktop, logoImgDesktop);
  applyDrawerVisual(logoContainerMobile, logoImgMobile);

  const metaHTML = buildMetaPills(node);
  setSelectedNode(node.id);

  const desc = descriptions[node.id] || "A notable node in the cigar industry with connections to the brands and factories shown in the graph.";

  // Connections
  const connections = graphData.links.filter(l => {
    const s = (l.source.id || l.source);
    const t = (l.target.id || l.target);
    return s === node.id || t === node.id;
  });

  let connHTML = '';
  if (connections.length === 0) {
    connHTML = '<div class="text-xs text-[#6B8A84] italic">No direct connections shown with current filters.</div>';
  } else {
    connections.slice(0, 12).forEach(l => {
      const otherId = (l.source.id || l.source) === node.id ? (l.target.id || l.target) : (l.source.id || l.source);
      const other = graphData.nodes.find(n => n.id === otherId);
      const otherName = other ? other.name : otherId;
      const relType = l.type || 'related';

      connHTML += `
        <div class="connection-item flex flex-col gap-1 px-2.5 py-2 rounded-xl bg-white border border-[#CFE0DC] text-xs">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="connection-type font-medium text-[10px] px-1.5 py-0.5 rounded bg-[#ECF4F2] text-[#6B8A84]" data-rel="${relType}">${relType}</span>
            <span class="text-[#CEA661] text-xs">→</span>
          </div>
          <span class="connection-name font-medium text-[#1A3330] hover:text-[#14817A] cursor-pointer leading-snug" 
                title="${otherName}" onclick="showDrawerFromId('${otherId}')">${otherName}</span>
        </div>`;
    });
  }

  // Product Lines / Notable Cigars
  let productLinesHTML = '';
  const hasProductLines = node.productLines && node.productLines.length > 0;

  if (hasProductLines) {
    productLinesHTML = node.productLines.map(line => 
      `<span class="inline-block px-2.5 py-0.5 text-xs rounded-full bg-white border border-[#CFE0DC] text-[#14817A]">${line}</span>`
    ).join('');
  }

  // Buy links — Famous Smoke Shop affiliate (plus any per-node overrides)
  const famousSmokeHtml = typeof buildFamousSmokeBuyHtml === 'function' ? buildFamousSmokeBuyHtml() : '';
  const extraBuyHtml = (node.buyLinks && node.buyLinks.length)
    ? node.buyLinks.map(b => `<a href="${b.url}" target="_blank" rel="sponsored noopener" class="block text-xs px-3 py-1.5 rounded-xl bg-[#14817A] text-[#ECF4F2] hover:bg-[#0D5A55]">${b.label || 'Shop now'}</a>`).join('')
    : '';
  const buyHTML = famousSmokeHtml + extraBuyHtml;

  if (!isMobile && drawer) {
    titleEl.textContent = name;
    metaEl.innerHTML = metaHTML;
    descEl.textContent = desc;
    connEl.innerHTML = connHTML;

    // Dedicated node page CTA - attractive pill, always in fixed slot (prevents duplicates & bad placement)
    const deskLinkSlot = document.getElementById('drawer-dedicated-link');
    if (deskLinkSlot) {
      deskLinkSlot.innerHTML = `<a href="/node/${node.id}/" class="inline-flex items-center gap-1.5 px-3 py-1 text-sm rounded-2xl border border-[#CEA661]/50 text-[#CEA661] hover:bg-[#CEA661]/10 hover:border-[#CEA661] active:scale-[0.985] font-medium transition-all">View full dedicated page →</a>`;
    }

    if (productLinesEl) productLinesEl.innerHTML = productLinesHTML;
    if (productLinesWrap) productLinesWrap.style.display = hasProductLines ? 'block' : 'none';

    buyEl.innerHTML = buyHTML;
    buyWrap.style.display = (node.buyLinks && node.buyLinks.length) ? 'block' : 'block';
    drawer.classList.remove('hidden');
    drawer.style.display = 'flex';
    pulseDrawerOpen(drawer);
  }

  if (isMobile && mDrawer) {
    mDrawer.classList.remove('drawer-panel--howto');
    if (mobileDrawerHideTimer) {
      clearTimeout(mobileDrawerHideTimer);
      mobileDrawerHideTimer = null;
    }
    mTitle.textContent = name;
    mMeta.innerHTML = metaHTML;
    mDesc.textContent = desc;
    mConn.innerHTML = connHTML;

    // Dedicated node page CTA - attractive pill, always in fixed slot (prevents duplicates & bad placement)
    const mobLinkSlot = document.getElementById('drawer-dedicated-link-mobile');
    if (mobLinkSlot) {
      mobLinkSlot.innerHTML = `<a href="/node/${node.id}/" class="inline-flex items-center gap-1.5 px-3 py-1 text-sm rounded-2xl border border-[#CEA661]/50 text-[#CEA661] hover:bg-[#CEA661]/10 hover:border-[#CEA661] active:scale-[0.985] font-medium transition-all">View full dedicated page →</a>`;
    }

    if (mProductLinesEl) mProductLinesEl.innerHTML = productLinesHTML;
    if (mProductLinesWrap) mProductLinesWrap.style.display = hasProductLines ? 'block' : 'none';

    mBuy.innerHTML = buyHTML;
    mBuyWrap.style.display = 'block';
    mDrawer.classList.remove('hidden');
    mDrawer.style.display = 'flex';
    pulseDrawerOpen(mDrawer);

    // Backdrop
    createOrShowBackdrop();
  }

  // Mobile auto scroll to top of sheet
  if (isMobile && mDrawer) {
    mDrawer.scrollTop = 0;
  }

  syncUrlForDrawer(node, options.syncUrl ?? 'push');
}

function showDrawerFromId(id) {
  const node = graphData.nodes.find(n => n.id === id);
  if (node) {
    closeDrawer({ keepMapFocus: false, suppressDefault: true, skipUrlUpdate: true });
    const zoomOpts = { raiseForDrawer: window.innerWidth < 1024 };
    focusNodeOnMap(node, zoomOpts);
    setTimeout(() => showDrawer(node), 420);
  }
}

function closeDrawer({ keepMapFocus = true, suppressDefault = false, skipUrlUpdate = false } = {}) {
  const drawer = document.getElementById('drawer');
  const mDrawer = document.getElementById('drawer-mobile');
  const node = currentDrawerNode;
  const shouldExpandGraph = keepMapFocus && searchTerm && node;

  if (shouldExpandGraph) {
    // Restore full graph but keep the selected node pinned and in view
    expandGraphWithFocus(node);
  } else if (keepMapFocus && node) {
    setSelectedNode(node.id);
    refreshGraphDimensions();
    focusNodeOnMap(node, { raiseForDrawer: window.innerWidth < 1024, duration: 0 });
  } else {
    clearSelectedNode();
    currentDrawerNode = null;
  }

  // Clear dedicated page CTAs (prevents stale links on next open)
  const dLink = document.getElementById('drawer-dedicated-link');
  if (dLink) dLink.innerHTML = '';
  const mLink = document.getElementById('drawer-dedicated-link-mobile');
  if (mLink) mLink.innerHTML = '';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (drawer) {
    drawer.classList.remove('drawer-open');
    if (window.innerWidth >= 1024 && !suppressDefault) {
      showDesktopHowTo();
    } else {
      drawer.style.display = 'none';
    }
  }
  if (mDrawer) {
    mDrawer.classList.remove('drawer-open', 'drawer-panel--howto');
    if (mobileDrawerHideTimer) {
      clearTimeout(mobileDrawerHideTimer);
      mobileDrawerHideTimer = null;
    }
    const hideMobile = () => {
      mDrawer.style.display = 'none';
      mDrawer.classList.add('hidden');
      mobileDrawerHideTimer = null;
    };
    if (!reducedMotion) {
      mobileDrawerHideTimer = setTimeout(hideMobile, 280);
    } else {
      hideMobile();
    }
  }
  removeBackdrop();

  if (!skipUrlUpdate && !suppressUrlSync) {
    clearNodeUrl();
  }
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

// ============================================
// Onboarding "How to" intro (replaces blank initial drawer state)
// 4 clickable examples that zoom the map + open real drawer
// Fully mobile-aware (larger touch targets in bottom sheet)
// ============================================

function selectExample(nodeId) {
  const node = graphData.nodes.find(n => n.id === nodeId);
  if (!node) return;

  closeDrawer({ keepMapFocus: false, suppressDefault: true, skipUrlUpdate: true });

  const zoomOpts = { raiseForDrawer: window.innerWidth < 1024 };
  focusNodeOnMap(node, zoomOpts);

  setTimeout(() => {
    showDrawer(node);
    try { sessionStorage.setItem('cigarNexus_seenIntro', 'true'); } catch (e) {}
  }, 420);
}

function showDesktopHowTo() {
  if (window.innerWidth < 1024) {
    showMobileHowTo();
    return;
  }

  const drawer = document.getElementById('drawer');
  if (!drawer) return;

  const parent = drawer.parentElement;
  if (parent && parent.classList.contains('hidden')) {
    parent.classList.remove('hidden');
    parent.style.display = 'block';
  }

  const titleEl = document.getElementById('drawer-title');
  const metaEl = document.getElementById('drawer-meta');
  const descEl = document.getElementById('drawer-description');
  const connEl = document.getElementById('drawer-connections');
  const connSection = connEl ? connEl.parentElement : null;

  // More robust label finding (matches the actual "Connections" text)
  let connLabel = connSection ? connSection.querySelector('.text-xs.font-semibold') : null;
  if (!connLabel && connSection) {
    connLabel = Array.from(connSection.querySelectorAll('div')).find(d => /connections/i.test(d.textContent || ''));
  }

  const productWrap = document.getElementById('drawer-product-lines-wrap');
  const buyWrap = document.getElementById('drawer-buy-wrap');

  if (!titleEl || !descEl) return;

  titleEl.textContent = 'How to Explore';
  if (metaEl) metaEl.innerHTML = `<span class="meta-pill meta-pill--guide">Interactive Map</span>`;
  clearSelectedNode();

  descEl.innerHTML = `Explore the cigar world. Click any node to see who makes it, who owns it and where it's rolled.<br><br>Use the filters above the graph to focus on Family vs Corporate, countries, or Boutique brands.`;

  if (connLabel) connLabel.textContent = 'START HERE — Tap an example';
  if (connEl) {
    connEl.innerHTML = `
      <div class="grid grid-cols-2 gap-2">
        <button onclick="selectExample('padron')" class="example-pill text-left px-3 py-2 rounded-2xl bg-white border border-[#CFE0DC] hover:border-[#CEA661] active:scale-[0.985] transition-all text-sm font-medium text-[#1A3330]">Padrón<br><span class="text-[10px] text-[#6B8A84] font-normal">Nicaragua family icon</span></button>
        <button onclick="selectExample('warped')" class="example-pill text-left px-3 py-2 rounded-2xl bg-white border border-[#CFE0DC] hover:border-[#CEA661] active:scale-[0.985] transition-all text-sm font-medium text-[#1A3330]">Warped<br><span class="text-[10px] text-[#6B8A84] font-normal">Modern boutique</span></button>
        <button onclick="selectExample('davidoff')" class="example-pill text-left px-3 py-2 rounded-2xl bg-white border border-[#CFE0DC] hover:border-[#CEA661] active:scale-[0.985] transition-all text-sm font-medium text-[#1A3330]">Davidoff<br><span class="text-[10px] text-[#6B8A84] font-normal">Luxury corporate</span></button>
        <button onclick="selectExample('myfather')" class="example-pill text-left px-3 py-2 rounded-2xl bg-white border border-[#CFE0DC] hover:border-[#CEA661] active:scale-[0.985] transition-all text-sm font-medium text-[#1A3330]">My Father<br><span class="text-[10px] text-[#6B8A84] font-normal">Nicaragua powerhouse</span></button>
      </div>
      <div class="mt-3 text-[11px] text-[#6B8A84]">Drag nodes • Scroll/pinch to zoom • Tap anything for details</div>
    `;
  }

  if (productWrap) productWrap.style.display = 'none';
  if (buyWrap) buyWrap.style.display = 'none';

  drawer.style.display = 'flex';
  drawer.classList.remove('hidden');
  pulseDrawerOpen(drawer);
}

function showMobileWelcome() {
  const el = document.getElementById('mobile-welcome');
  if (!el) return;
  el.classList.remove('hidden');
  el.setAttribute('aria-hidden', 'false');
}

function dismissMobileWelcome(openGuide = false) {
  const el = document.getElementById('mobile-welcome');
  if (el) {
    el.classList.add('hidden');
    el.setAttribute('aria-hidden', 'true');
  }
  try { localStorage.setItem('cigarNexus_seenIntro', 'true'); } catch (e) {}
  if (openGuide) showMobileHowTo();
}

function showMobileHowTo() {
  const mDrawer = document.getElementById('drawer-mobile');
  if (!mDrawer) return;

  dismissMobileWelcome(false);

  const mTitle = document.getElementById('drawer-title-mobile');
  const mMeta = document.getElementById('drawer-meta-mobile');
  const mDesc = document.getElementById('drawer-description-mobile');
  const mConn = document.getElementById('drawer-connections-mobile');
  const connSection = mConn ? mConn.parentElement : null;
  const connLabel = connSection ? connSection.querySelector('.text-xs.font-semibold') : null;
  const mProductWrap = document.getElementById('drawer-product-lines-wrap-mobile');
  const mBuyWrap = document.getElementById('drawer-buy-wrap-mobile');

  if (!mTitle || !mDesc) return;

  mTitle.textContent = 'How to Explore';
  if (mMeta) mMeta.innerHTML = `<span class="meta-pill meta-pill--guide">Interactive Map</span>`;

  mDesc.innerHTML = `Explore the cigar world. Tap any bubble to see who makes it, who owns it and where it's rolled.<br><br>Filters above the map let you narrow by ownership, country, or boutique.`;

  if (connLabel) connLabel.textContent = 'START HERE';
  if (mConn) {
    mConn.innerHTML = `
      <div class="grid grid-cols-2 gap-2.5">
        <button onclick="selectExample('padron')" class="example-pill text-left px-3.5 py-3 rounded-2xl bg-white border-2 border-[#CFE0DC] active:bg-[#ECF4F2] active:scale-[0.985] transition-all text-[15px] font-semibold text-[#1A3330]">Padrón <span class="block text-xs font-normal text-[#6B8A84] mt-0.5">Nicaragua legend</span></button>
        <button onclick="selectExample('warped')" class="example-pill text-left px-3.5 py-3 rounded-2xl bg-white border-2 border-[#CFE0DC] active:bg-[#ECF4F2] active:scale-[0.985] transition-all text-[15px] font-semibold text-[#1A3330]">Warped <span class="block text-xs font-normal text-[#6B8A84] mt-0.5">Boutique favorite</span></button>
        <button onclick="selectExample('davidoff')" class="example-pill text-left px-3.5 py-3 rounded-2xl bg-white border-2 border-[#CFE0DC] active:bg-[#ECF4F2] active:scale-[0.985] transition-all text-[15px] font-semibold text-[#1A3330]">Davidoff <span class="block text-xs font-normal text-[#6B8A84] mt-0.5">Premium classic</span></button>
        <button onclick="selectExample('myfather')" class="example-pill text-left px-3.5 py-3 rounded-2xl bg-white border-2 border-[#CFE0DC] active:bg-[#ECF4F2] active:scale-[0.985] transition-all text-[15px] font-semibold text-[#1A3330]">My Father <span class="block text-xs font-normal text-[#6B8A84] mt-0.5">Nicaragua star</span></button>
      </div>
      <div class="mt-3 text-xs text-[#6B8A84]">Pinch to zoom • Drag to pan • Tap nodes for full info</div>
    `;
  }

  if (mProductWrap) mProductWrap.style.display = 'none';
  if (mBuyWrap) mBuyWrap.style.display = 'none';

  mDrawer.classList.add('drawer-panel--howto');
  mDrawer.style.display = 'flex';
  mDrawer.classList.remove('hidden');
  pulseDrawerOpen(mDrawer);
  createOrShowBackdrop();
}

// Public/manual trigger for the How To guide (used by the new "How to explore" button + reliable fallback)
function showHowTo() {
  const isMobile = window.innerWidth < 1024;
  const drawerEl = document.getElementById('drawer');
  const drawerVisible = drawerEl && (drawerEl.offsetParent !== null || getComputedStyle(drawerEl).display !== 'none');

  if (!isMobile && drawerVisible) {
    showDesktopHowTo();
  } else {
    // Mobile (or desktop sidebar not visible) → open the bottom sheet version
    // Always allow manual trigger even if previously seen
    showMobileHowTo();
  }
}

// Early exposure so buttons work even if later code has issues
window.zoomToFit = zoomToFit;
window.resetZoom = resetZoom;
window.toggleFilter = toggleFilter;
window.closeDrawer = closeDrawer;
window.showDrawerFromId = showDrawerFromId;
window.zoomToNode = zoomToNode;
window.showHowTo = showHowTo;
window.showMobileWelcome = showMobileWelcome;
window.dismissMobileWelcome = dismissMobileWelcome;
window.maybeShowFirstVisitGuide = maybeShowFirstVisitGuide;
window.selectExample = selectExample;
window.openSearchOverlay = openSearchOverlay;
window.closeSearchOverlay = closeSearchOverlay;
window.selectSearchResult = selectSearchResult;

// -----------------------------
// Age Verification Gate
// -----------------------------
function initAgeGate() {
  const gate = document.getElementById('age-gate');
  if (!gate) return;

  // Check if user has already verified
  if (localStorage.getItem('cigarNexus_ageVerified') === 'true') {
    gate.style.display = 'none';
    return;
  }

  // Show the gate
  gate.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  const yesBtn = document.getElementById('age-yes');
  const noBtn = document.getElementById('age-no');

  if (yesBtn) {
    yesBtn.addEventListener('click', () => {
      localStorage.setItem('cigarNexus_ageVerified', 'true');
      gate.style.display = 'none';
      document.body.style.overflow = '';
      setTimeout(() => {
        if (tryApplyPendingNodeDeepLink()) {
          introGuideShown = true;
        } else {
          maybeShowFirstVisitGuide();
        }
      }, 350);
    });
  }

  if (noBtn) {
    noBtn.addEventListener('click', () => {
      // Redirect away from age-restricted content
      window.location.href = 'https://www.google.com';
    });
  }
}

// -----------------------------
// Boot
// -----------------------------
document.addEventListener('DOMContentLoaded', () => {
  initAgeGate();      // Age verification first
  initializeApp();
});

// Also expose a manual refresh if needed
window.CigarNexus = {
  reinitialize: initializeApp,
  getData: () => graphData
};