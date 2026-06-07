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

function escapeMetaLabel(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
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

function setSelectedNode(nodeId) {
  if (!viewport) return;
  viewport.selectAll('.node-group').classed('node-selected', d => d.id === nodeId);
}

function clearSelectedNode() {
  if (!viewport) return;
  viewport.selectAll('.node-group').classed('node-selected', false);
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

  // Setup search + clear button
  const searchInput = document.getElementById('search');
  const clearBtn = document.getElementById('search-clear');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value.trim().toLowerCase();
      applyFiltersAndSearch();

      // Show/hide clear button
      if (clearBtn) {
        if (searchInput.value.length > 0) {
          clearBtn.classList.remove('hidden');
        } else {
          clearBtn.classList.add('hidden');
        }
      }
    });

    // Clear button functionality
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchTerm = '';
        clearBtn.classList.add('hidden');
        applyFiltersAndSearch();
        searchInput.focus();
      });
    }
  }

  // Initialize the graph (wrapped so one error doesn't kill filters or drawer)
  try {
    initializeGraph();
  } catch (e) {
    console.error('initializeGraph threw:', e);
  }

  // Keyboard escape closes drawer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDrawer();
    }
  });

  // Initial render of any saved state
  console.log('Cigar Nexus initialized. Nodes:', graphData.nodes.length, 'Links:', graphData.links.length);

  // Show the "How to" guide reliably (independent of graph render success)
  // Desktop: fills the sidebar
  // Mobile: only on very first visit
  setTimeout(() => {
    try {
      const drawerEl = document.getElementById('drawer');
      const drawerInLayout = drawerEl && (drawerEl.offsetParent !== null || getComputedStyle(drawerEl).display !== 'none');

      if (drawerInLayout) {
        showDesktopHowTo();
        console.log('[Cigar Nexus] Desktop how-to intro shown');
      } else {
        const seen = localStorage.getItem('cigarNexus_seenIntro') === 'true' ||
                     sessionStorage.getItem('cigarNexus_seenIntro') === 'true';
        if (!seen) {
          setTimeout(() => {
            if (window.innerWidth < 1024) showMobileHowTo();
          }, 600);
        }
      }
    } catch (e) {
      console.warn('How-to intro scheduling error:', e);
    }
  }, 800);
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

    // Deep linking support: ?node=ID opens the drawer for that node (for SEO and shareable links)
    // Keeps all existing graph/drag/filter functionality intact
    setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const nodeId = params.get('node');
      if (nodeId) {
        const node = graphData.nodes.find(n => n.id === nodeId);
        if (node) {
          showDrawer(node);
          zoomToNode(node);
        }
      }
    }, 800);

  } catch (err) {
    console.error('Failed to initialize graph (nodes may not appear):', err);
    // Try a minimal fallback render so the page isn't completely dead
    try {
      const fallback = document.getElementById('graph');
      if (fallback) fallback.innerHTML = '<div style="padding:20px;color:#8b6f5c;font-size:13px;">Graph failed to load. Try refreshing the page (Ctrl+Shift+R).</div>';
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
    .attr('dy', d => getNodeRadius(d) + 12)
    .attr('font-size', '9.5px')
    .attr('fill', '#3f2a2a')
    .attr('paint-order', 'stroke')
    .attr('stroke', '#f8f5f0')
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

// Smoothly zoom + center on a specific node (used by the "Start Here" examples)
function zoomToNode(targetNode) {
  if (!svg || !viewport || !targetNode || !simulation) {
    zoomToFit();
    return;
  }

  // Find the live datum (has current x/y after forces)
  let live = null;
  viewport.selectAll('.node-group').each(function(d) {
    if (d.id === targetNode.id) live = d;
  });

  // Fallback to the node object itself if simulation hasn't attached coords yet
  const d = live || targetNode;

  if (typeof d.x !== 'number' || typeof d.y !== 'number') {
    // Not positioned yet — just zoom to fit and open
    zoomToFit();
    return;
  }

  const scale = 1.9;
  const tx = graphWidth / 2 - scale * d.x;
  const ty = graphHeight / 2 - scale * d.y;

  svg.transition()
    .duration(620)
    .call(zoomBehavior.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
}

// -----------------------------
// Drawer (Desktop + Mobile)
// -----------------------------
let currentDrawerNode = null;
let mobileDrawerHideTimer = null;

function showDrawer(node) {
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

  // Logo handling for drawer (desktop + mobile) - mimic example layout
  const logoContainerDesktop = document.getElementById('drawer-logo-container');
  const logoImgDesktop = document.getElementById('drawer-logo');
  const logoContainerMobile = document.getElementById('drawer-logo-container-mobile');
  const logoImgMobile = document.getElementById('drawer-logo-mobile');
  const hasLogo = node.logo && node.logo.trim() !== '';

  if (logoContainerDesktop && logoImgDesktop) {
    if (hasLogo) {
      logoImgDesktop.src = node.logo;
      logoImgDesktop.alt = name + ' logo';
      logoContainerDesktop.classList.remove('hidden');
    } else {
      logoContainerDesktop.classList.add('hidden');
    }
  }

  if (logoContainerMobile && logoImgMobile) {
    if (hasLogo) {
      logoImgMobile.src = node.logo;
      logoImgMobile.alt = name + ' logo';
      logoContainerMobile.classList.remove('hidden');
    } else {
      logoContainerMobile.classList.add('hidden');
    }
  }

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
    connHTML = '<div class="text-xs text-[#8b6f5c] italic">No direct connections shown with current filters.</div>';
  } else {
    connections.slice(0, 12).forEach(l => {
      const otherId = (l.source.id || l.source) === node.id ? (l.target.id || l.target) : (l.source.id || l.source);
      const other = graphData.nodes.find(n => n.id === otherId);
      const otherName = other ? other.name : otherId;
      const relType = l.type || 'related';

      connHTML += `
        <div class="connection-item flex flex-col gap-1 px-2.5 py-2 rounded-xl bg-white border border-[#d4c4a8] text-xs">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="connection-type font-medium text-[10px] px-1.5 py-0.5 rounded bg-[#f4e9d8] text-[#8b6f5c]">${relType}</span>
            <span class="text-[#c5a26f] text-xs">→</span>
          </div>
          <span class="connection-name font-medium text-[#3f2a2a] hover:text-[#5c2e2e] cursor-pointer leading-snug" 
                title="${otherName}" onclick="showDrawerFromId('${otherId}')">${otherName}</span>
        </div>`;
    });
  }

  // Product Lines / Notable Cigars
  let productLinesHTML = '';
  const hasProductLines = node.productLines && node.productLines.length > 0;

  if (hasProductLines) {
    productLinesHTML = node.productLines.map(line => 
      `<span class="inline-block px-2.5 py-0.5 text-xs rounded-full bg-white border border-[#d4c4a8] text-[#5c2e2e]">${line}</span>`
    ).join('');
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

    // Dedicated node page CTA - attractive pill, always in fixed slot (prevents duplicates & bad placement)
    const deskLinkSlot = document.getElementById('drawer-dedicated-link');
    if (deskLinkSlot) {
      deskLinkSlot.innerHTML = `<a href="/node/${node.id}/" class="inline-flex items-center gap-1.5 px-3 py-1 text-sm rounded-2xl border border-[#c5a26f]/50 text-[#c5a26f] hover:bg-[#c5a26f]/10 hover:border-[#c5a26f] active:scale-[0.985] font-medium transition-all">View full dedicated page →</a>`;
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
      mobLinkSlot.innerHTML = `<a href="/node/${node.id}/" class="inline-flex items-center gap-1.5 px-3 py-1 text-sm rounded-2xl border border-[#c5a26f]/50 text-[#c5a26f] hover:bg-[#c5a26f]/10 hover:border-[#c5a26f] active:scale-[0.985] font-medium transition-all">View full dedicated page →</a>`;
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
  clearSelectedNode();

  // Clear dedicated page CTAs (prevents stale links on next open)
  const dLink = document.getElementById('drawer-dedicated-link');
  if (dLink) dLink.innerHTML = '';
  const mLink = document.getElementById('drawer-dedicated-link-mobile');
  if (mLink) mLink.innerHTML = '';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (drawer) {
    drawer.classList.remove('drawer-open');
    drawer.style.display = 'none';
  }
  if (mDrawer) {
    mDrawer.classList.remove('drawer-open');
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

  closeDrawer();

  setTimeout(() => {
    zoomToNode(node);
    setTimeout(() => {
      showDrawer(node);
      try { sessionStorage.setItem('cigarNexus_seenIntro', 'true'); } catch (e) {}
    }, 580);
  }, 90);
}

function showDesktopHowTo() {
  const drawer = document.getElementById('drawer');
  if (!drawer) return;

  // Make sure the sidebar container is visible even on borderline widths
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
        <button onclick="selectExample('padron')" class="example-pill text-left px-3 py-2 rounded-2xl bg-white border border-[#d4c4a8] hover:border-[#c5a26f] active:scale-[0.985] transition-all text-sm font-medium text-[#3f2a2a]">Padrón<br><span class="text-[10px] text-[#8b6f5c] font-normal">Nicaragua family icon</span></button>
        <button onclick="selectExample('warped')" class="example-pill text-left px-3 py-2 rounded-2xl bg-white border border-[#d4c4a8] hover:border-[#c5a26f] active:scale-[0.985] transition-all text-sm font-medium text-[#3f2a2a]">Warped<br><span class="text-[10px] text-[#8b6f5c] font-normal">Modern boutique</span></button>
        <button onclick="selectExample('davidoff')" class="example-pill text-left px-3 py-2 rounded-2xl bg-white border border-[#d4c4a8] hover:border-[#c5a26f] active:scale-[0.985] transition-all text-sm font-medium text-[#3f2a2a]">Davidoff<br><span class="text-[10px] text-[#8b6f5c] font-normal">Luxury corporate</span></button>
        <button onclick="selectExample('myfather')" class="example-pill text-left px-3 py-2 rounded-2xl bg-white border border-[#d4c4a8] hover:border-[#c5a26f] active:scale-[0.985] transition-all text-sm font-medium text-[#3f2a2a]">My Father<br><span class="text-[10px] text-[#8b6f5c] font-normal">Nicaragua powerhouse</span></button>
      </div>
      <div class="mt-3 text-[11px] text-[#8b6f5c]">Drag nodes • Scroll/pinch to zoom • Tap anything for details</div>
    `;
  }

  if (productWrap) productWrap.style.display = 'none';
  if (buyWrap) buyWrap.style.display = 'none';

  drawer.style.display = 'flex';
  drawer.classList.remove('hidden');
  pulseDrawerOpen(drawer);
}

function showMobileHowTo() {
  const mDrawer = document.getElementById('drawer-mobile');
  if (!mDrawer) return;

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
        <button onclick="selectExample('padron')" class="example-pill text-left px-3.5 py-3 rounded-2xl bg-white border-2 border-[#d4c4a8] active:bg-[#f4e9d8] active:scale-[0.985] transition-all text-[15px] font-semibold text-[#3f2a2a]">Padrón <span class="block text-xs font-normal text-[#8b6f5c] mt-0.5">Nicaragua legend</span></button>
        <button onclick="selectExample('warped')" class="example-pill text-left px-3.5 py-3 rounded-2xl bg-white border-2 border-[#d4c4a8] active:bg-[#f4e9d8] active:scale-[0.985] transition-all text-[15px] font-semibold text-[#3f2a2a]">Warped <span class="block text-xs font-normal text-[#8b6f5c] mt-0.5">Boutique favorite</span></button>
        <button onclick="selectExample('davidoff')" class="example-pill text-left px-3.5 py-3 rounded-2xl bg-white border-2 border-[#d4c4a8] active:bg-[#f4e9d8] active:scale-[0.985] transition-all text-[15px] font-semibold text-[#3f2a2a]">Davidoff <span class="block text-xs font-normal text-[#8b6f5c] mt-0.5">Premium classic</span></button>
        <button onclick="selectExample('myfather')" class="example-pill text-left px-3.5 py-3 rounded-2xl bg-white border-2 border-[#d4c4a8] active:bg-[#f4e9d8] active:scale-[0.985] transition-all text-[15px] font-semibold text-[#3f2a2a]">My Father <span class="block text-xs font-normal text-[#8b6f5c] mt-0.5">Nicaragua star</span></button>
      </div>
      <div class="mt-3 text-xs text-[#8b6f5c]">Pinch to zoom • Drag to pan • Tap nodes for full info</div>
    `;
  }

  if (mProductWrap) mProductWrap.style.display = 'none';
  if (mBuyWrap) mBuyWrap.style.display = 'none';

  mDrawer.style.display = 'flex';
  mDrawer.classList.remove('hidden');
  pulseDrawerOpen(mDrawer);
  createOrShowBackdrop();

  // Remember so we don't auto-show the intro sheet on every mobile visit (but manual "How to" button can still trigger it)
  try { localStorage.setItem('cigarNexus_seenIntro', 'true'); } catch (e) {}
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
window.selectExample = selectExample;

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