/**
 * ============================================================================
 * ST4 Anaesthetics National Rotation & Commute Explorer - Application Engine
 * ============================================================================
 */

// 1. DEFENSIVE DATA INTEGRITY CHECK
if (typeof ROTATIONS_DATA === 'undefined' || typeof HOSPITALS === 'undefined') {
  alert("Error: data.js failed to load. Please verify that data.js is in the same directory as index.html.");
}

// 2. MATHEMATICAL & STRING UTILITIES
/**
 * Haversine formula to compute great-circle distance between two [lat, lng] points in miles.
 */
function calcDistanceMiles(c1, c2) {
  if (!c1 || !c2) return 0;
  const R = 3958.8; // Radius of Earth in miles
  const dLat = (c2[0] - c1[0]) * Math.PI / 180;
  const dLon = (c2[1] - c1[1]) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(c1[0] * Math.PI / 180) * Math.cos(c2[0] * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/**
 * HTML entity sanitizer to prevent XSS from imported user notes or titles.
 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// 3. LEAFLET MAP INITIALIZATION & LAYER GROUPS
const map = L.map('map', { 
  zoomControl: true,
  minZoom: 6,
  maxZoom: 18,
  maxBounds: [
    [49.5, -9.0],  // South-West England & Wales
    [56.5, 2.5]    // North-East England
  ],
  maxBoundsViscosity: 0.75
}).setView([52.8, -1.8], 6);

const osmStandard = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const osmHot = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, Tiles courtesy of <a href="https://www.hotosm.org/">HOT</a>'
});

const baseLayers = {
  "Standard OSM": osmStandard,
  "Soft Pastel (HOT)": osmHot
};
// Positioned at top-left underneath zoom controls to avoid collision with top-right action buttons
L.control.layers(baseLayers, null, { position: 'topleft' }).addTo(map);

// Distinct Leaflet Layer Groups for Modular Control
const overviewLinesGroup = L.layerGroup().addTo(map);
const backgroundHospitalsGroup = L.layerGroup().addTo(map);
const activeRouteGroup = L.layerGroup().addTo(map);
const customBaseLayerGroup = L.layerGroup().addTo(map);

// 4. THEME MANAGEMENT (Auto OS detection with manual override)
let currentThemeMode = localStorage.getItem('anaesth_theme_pref') || 'auto'; // 'auto', 'dark', 'light'

function getEffectiveTheme() {
  if (currentThemeMode === 'dark') return 'dark';
  if (currentThemeMode === 'light') return 'light';
  return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
}

function updateThemeButtonUI() {
  const btn = document.getElementById('btnThemeToggle');
  if (!btn) return;
  if (currentThemeMode === 'auto') {
    const isDark = getEffectiveTheme() === 'dark';
    btn.innerHTML = `🌓 Auto`;
    btn.title = `Theme: Auto (${isDark ? 'Dark' : 'Light'}) - Click to switch`;
  } else if (currentThemeMode === 'dark') {
    btn.innerHTML = `🌙 Dark`;
    btn.title = `Theme: Dark Mode - Click to switch`;
  } else {
    btn.innerHTML = `☀️ Light`;
    btn.title = `Theme: Light Mode - Click to switch`;
  }
}

function applyTheme() {
  const effective = getEffectiveTheme();
  document.documentElement.setAttribute('data-theme', effective);
  updateThemeButtonUI();

  const metaTheme = document.getElementById('metaThemeColor');
  if (metaTheme) {
    metaTheme.setAttribute('content', effective === 'dark' ? '#0f172a' : '#0284c7');
  }
}

function cycleTheme() {
  if (currentThemeMode === 'auto') {
    currentThemeMode = 'dark';
  } else if (currentThemeMode === 'dark') {
    currentThemeMode = 'light';
  } else {
    currentThemeMode = 'auto';
  }
  localStorage.setItem('anaesth_theme_pref', currentThemeMode);
  applyTheme();

  const label = currentThemeMode === 'auto'
    ? `Auto (${getEffectiveTheme() === 'dark' ? 'Dark' : 'Light'})`
    : (currentThemeMode === 'dark' ? 'Dark Mode' : 'Light Mode');
  showToast(`Theme: ${label}`);
}

// Real-time system theme preference change listener
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (currentThemeMode === 'auto') {
      applyTheme();
    }
  });
}

// 4. APPLICATION STATE
let currentSelectedId = null;
let currentCommuteMode = 'driver'; // 'driver', 'transit', or 'custom'
let currentViewMode = 'all';        // 'all', 'list', or 'details'
let activeQuickFilter = 'ALL';
let activeRegionFilter = 'ALL';
let activeSpreadFilter = 'ALL';
let currentSortMode = 'DEFAULT';
let currentSearchTerm = '';
let currentFilteredList = [...ROTATIONS_DATA];
let showOverviewLines = true;
let currentActiveRating = 0;
let searchDebounceTimer = null;

// Safe Local Storage Deserialization
function safeGetStorageJson(key, defaultVal) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

let compareList = safeGetStorageJson('anaesth_compare_list', []);
let shortlistOrder = safeGetStorageJson('anaesth_shortlist_order', []);
let customHomeBase = safeGetStorageJson('anaesth_custom_home', null);

// 5. TOAST NOTIFICATIONS
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2400);
}

// 6. ROTATION METRICS & DATA HELPERS
function getRotationMaxDistance(rot) {
  if (!rot || !rot.stages) return 0;
  const coords = rot.stages.map(s => HOSPITALS[s.hosp] ? HOSPITALS[s.hosp].coords : null).filter(Boolean);
  let maxDist = 0;
  for (let i = 0; i < coords.length; i++) {
    for (let j = i + 1; j < coords.length; j++) {
      const d = calcDistanceMiles(coords[i], coords[j]);
      if (d > maxDist) maxDist = d;
    }
  }
  return maxDist;
}

/**
 * Returns a deduplicated array of hospital base names visited by a rotation.
 */
function getRotationHospitalBases(rot) {
  if (!rot || !rot.stages) return [];
  const unique = [];
  rot.stages.forEach(s => {
    if (s.hosp && !unique.includes(s.hosp)) {
      unique.push(s.hosp);
    }
  });
  return unique;
}

function updateShortlistBadge() {
  const badge = document.getElementById('headerShortlistBadge');
  if (!badge) return;
  const count = ROTATIONS_DATA.filter(r => {
    const d = getUserData(r.id);
    return d.rating > 0 || (d.tier && d.tier !== 'UNSET') || (d.notes && d.notes.trim() !== "");
  }).length;
  badge.textContent = count;
}

function updateCompareBadge() {
  const badge = document.getElementById('headerCompareBadge');
  if (badge) badge.textContent = compareList.length;
}

function updateCustomBaseUI() {
  const pillText = document.getElementById('customBasePillText');
  const statusBox = document.getElementById('customBaseStatusBox');
  const btnCustom = document.getElementById('btnModeCustom');

  if (customHomeBase && customHomeBase.coords) {
    if (pillText) pillText.textContent = `📍 Base: ${customHomeBase.name}`;
    if (statusBox) statusBox.innerHTML = `Current Base: <b>${escapeHtml(customHomeBase.name)}</b> (${customHomeBase.coords[0].toFixed(3)}, ${customHomeBase.coords[1].toFixed(3)})`;
    if (btnCustom) btnCustom.textContent = `📍 ${customHomeBase.name}`;
  } else {
    if (pillText) pillText.textContent = `📍 Set My Postcode`;
    if (statusBox) statusBox.innerHTML = `Current Base: <b>None set</b> (using suggested programme hubs).`;
    if (btnCustom) btnCustom.textContent = `📍 My Base`;
  }
}

// 7. DROPDOWN POPULATION & VIEW RENDERING
function populateRegionDropdown() {
  const regSelect = document.getElementById('regionFilter');
  if (!regSelect) return;
  const regionCounts = {};
  ROTATIONS_DATA.forEach(r => {
    regionCounts[r.region] = (regionCounts[r.region] || 0) + 1;
  });

  let html = `<option value="ALL">All Regions (${ROTATIONS_DATA.length} Rotations)</option>`;
  Object.keys(regionCounts).sort().forEach(reg => {
    html += `<option value="${reg}">${reg} (${regionCounts[reg]})</option>`;
  });
  regSelect.innerHTML = html;
  if (activeRegionFilter) regSelect.value = activeRegionFilter;
}

const prefSelect = document.getElementById('prefSelect');
function populateDropdown(list) {
  if (!prefSelect) return;
  prefSelect.innerHTML = '<option value="">-- Choose Rotation to Inspect --</option>';
  
  const groups = {};
  list.forEach(r => {
    if (!groups[r.region]) groups[r.region] = [];
    groups[r.region].push(r);
  });

  Object.keys(groups).sort().forEach(reg => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = reg;
    groups[reg].forEach(r => {
      const saved = getUserData(r.id);
      const starStr = saved.rating > 0 ? ` [${saved.rating}★]` : "";
      const tierStr = (saved.tier && saved.tier !== 'UNSET') ? ` [${saved.tier}]` : "";
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = `${r.title} (${r.code})${tierStr}${starStr}`;
      optgroup.appendChild(opt);
    });
    prefSelect.appendChild(optgroup);
  });

  if (currentSelectedId && list.some(r => r.id === currentSelectedId)) {
    prefSelect.value = currentSelectedId;
  }
}

function renderRotationCardsFeed(list) {
  const container = document.getElementById('rotationCardsFeed');
  if (!container) return;
  container.innerHTML = "";

  if (!list.length) {
    container.innerHTML = `
      <div style="text-align:center; padding:40px 15px; color:var(--text-muted);">
        <p style="font-weight:700;">No matching rotations found</p>
        <p style="font-size:0.8rem; margin-top:4px; margin-bottom:12px;">Try adjusting your search query, region, or filters.</p>
        <button class="btn-step" onclick="resetAllFilters()" style="margin:0 auto; padding:6px 14px; color:var(--primary); font-weight:800;">
          ↺ Reset All Filters
        </button>
      </div>`;
    return;
  }

  list.forEach((r) => {
    const userData = getUserData(r.id);
    const maxDist = getRotationMaxDistance(r);
    const estMins = Math.round(maxDist * 1.35);
    const isSelected = r.id === currentSelectedId;
    const isComparing = compareList.includes(r.id);

    let activeHubName = r.hubs[currentCommuteMode === 'transit' ? 'transit' : 'driver'].name;
    let hubEmoji = currentCommuteMode === 'transit' ? '🚆' : '🚗';
    if (currentCommuteMode === 'custom' && customHomeBase) {
      activeHubName = customHomeBase.name;
      hubEmoji = '📍';
    }

    let spreadBadgeClass = 'badge-spread-low';
    if (maxDist > 45) spreadBadgeClass = 'badge-spread-high';
    else if (maxDist > 25) spreadBadgeClass = 'badge-spread-med';

    let tierBadgeHtml = '';
    if (userData.tier === 'TIER1') tierBadgeHtml = '<span class="badge badge-tier-1">🟢 T1</span>';
    else if (userData.tier === 'TIER2') tierBadgeHtml = '<span class="badge badge-tier-2">🟡 T2</span>';
    else if (userData.tier === 'TIER3') tierBadgeHtml = '<span class="badge badge-tier-3">🔴 T3</span>';
    else if (userData.tier === 'EXCLUDE') tierBadgeHtml = '<span class="badge badge-tier-exclude">⚪ Excl</span>';

    const card = document.createElement('div');
    card.className = `rotation-list-card ${isSelected ? 'active-card' : ''}`;
    card.id = `feed-card-${r.id}`;
    card.onclick = (e) => {
      if (e.target.closest('button')) return;
      selectRotation(r.id, false);
      renderRotationCardsFeed(currentFilteredList);
    };

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:6px;">
        <div style="display:flex; gap:5px; align-items:center; flex-wrap:wrap;">
          <span class="badge badge-code">${escapeHtml(r.code)}</span>
          <span class="badge badge-places">${escapeHtml(r.places)}</span>
          ${tierBadgeHtml}
        </div>
        <div style="display:flex; align-items:center; gap:5px;">
          <button class="btn-compare-action ${isComparing ? 'in-compare' : ''}" onclick="toggleCompareCard(event, '${r.id}')" title="Compare rotation">
            ${isComparing ? '✓ Comparing' : '+ Compare'}
          </button>
          <span class="badge ${spreadBadgeClass}">${maxDist} mi (~${estMins}m)</span>
        </div>
      </div>
      <div class="card-list-title">${escapeHtml(r.title)}</div>
      <div class="card-list-hub">
        <span>${hubEmoji} Base: <b>${escapeHtml(activeHubName)}</b></span>
        <span style="color:var(--amber); font-weight:800; font-size:0.85rem;">${'★'.repeat(userData.rating) || '☆☆☆☆☆'}</span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; padding-top:6px; border-top:1px solid var(--border-color);">
        <span style="font-size:0.72rem; color:var(--text-muted);">${escapeHtml(r.region)}</span>
        <button class="hospital-chip-btn" onclick="openDetailsForRotation('${r.id}')" style="font-size:0.72rem; padding:3px 9px;">Details &amp; Timeline &rarr;</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function openDetailsForRotation(id) {
  if (prefSelect) prefSelect.value = id;
  selectRotation(id, false);
  setViewMode('details');
}

// 8. PREFERENCES, TIERS & RATINGS
function getUserData(id) {
  try {
    const raw = localStorage.getItem(`anaesth_pref_${id}`);
    if (!raw) return { rating: 0, notes: "", tier: "UNSET" };
    const parsed = JSON.parse(raw);
    return {
      rating: typeof parsed.rating === 'number' ? parsed.rating : 0,
      notes: typeof parsed.notes === 'string' ? parsed.notes : "",
      tier: parsed.tier || "UNSET"
    };
  } catch (e) {
    return { rating: 0, notes: "", tier: "UNSET" };
  }
}

function setTier(tierVal) {
  if (!currentSelectedId) return;
  const current = getUserData(currentSelectedId);
  current.tier = (current.tier === tierVal) ? 'UNSET' : tierVal;
  localStorage.setItem(`anaesth_pref_${currentSelectedId}`, JSON.stringify(current));
  updateTierButtons(current.tier);
  updateShortlistBadge();
  applyFiltersAndSearch();
  showToast(`Tier updated: ${current.tier}`);
}

function updateTierButtons(activeTier) {
  document.getElementById('tierBtn1').classList.toggle('active', activeTier === 'TIER1');
  document.getElementById('tierBtn2').classList.toggle('active', activeTier === 'TIER2');
  document.getElementById('tierBtn3').classList.toggle('active', activeTier === 'TIER3');
  document.getElementById('tierBtnExclude').classList.toggle('active', activeTier === 'EXCLUDE');

  const tierBadge = document.getElementById('cardTierBadge');
  if (activeTier && activeTier !== 'UNSET') {
    tierBadge.style.display = 'inline-block';
    if (activeTier === 'TIER1') { tierBadge.className = 'badge badge-tier-1'; tierBadge.textContent = '🟢 Tier 1'; }
    else if (activeTier === 'TIER2') { tierBadge.className = 'badge badge-tier-2'; tierBadge.textContent = '🟡 Tier 2'; }
    else if (activeTier === 'TIER3') { tierBadge.className = 'badge badge-tier-3'; tierBadge.textContent = '🔴 Tier 3'; }
    else if (activeTier === 'EXCLUDE') { tierBadge.className = 'badge badge-tier-exclude'; tierBadge.textContent = '⚪ Excluded'; }
  } else {
    tierBadge.style.display = 'none';
  }
}

function saveUserPreferences() {
  if (!currentSelectedId) return;
  const notes = document.getElementById('partnerNotes').value;
  const current = getUserData(currentSelectedId);
  current.rating = currentActiveRating;
  current.notes = notes;
  localStorage.setItem(`anaesth_pref_${currentSelectedId}`, JSON.stringify(current));

  if ((current.rating > 0 || current.tier === 'TIER1' || current.tier === 'TIER2') && !shortlistOrder.includes(currentSelectedId)) {
    shortlistOrder.push(currentSelectedId);
    localStorage.setItem('anaesth_shortlist_order', JSON.stringify(shortlistOrder));
  }

  updateShortlistBadge();
  applyFiltersAndSearch();
  prefSelect.value = currentSelectedId;
  showToast("Saved to browser");
}

function setRating(val) {
  if (val === currentActiveRating) {
    val = 0;
  }
  currentActiveRating = val;
  const stars = document.querySelectorAll('#starContainer .star');
  stars.forEach((s, idx) => {
    s.classList.toggle('selected', idx < val);
  });
  document.getElementById('ratingText').textContent = val > 0 ? `(${val} / 5 Stars)` : `(Unrated)`;
}

// 9. VIEW MODE & COMMUTE MODE SWITCHING
function setViewMode(mode) {
  currentViewMode = mode;
  document.getElementById('btnModeList').classList.toggle('active', mode === 'list');
  document.getElementById('btnModeDetails').classList.toggle('active', mode === 'details');
  document.getElementById('btnModeAll').classList.toggle('active', mode === 'all');

  const listView = document.getElementById('listViewContainer');
  const inspectorCard = document.getElementById('inspectorCard');
  const welcomeMessage = document.getElementById('welcomeMessage');

  if (mode === 'list') {
    listView.style.display = 'block';
    inspectorCard.style.display = 'none';
    welcomeMessage.style.display = 'none';
    renderRotationCardsFeed(currentFilteredList);
    // Smooth scroll active card into view
    if (currentSelectedId) {
      setTimeout(() => {
        const card = document.getElementById(`feed-card-${currentSelectedId}`);
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  } else if (mode === 'details') {
    listView.style.display = 'none';
    inspectorCard.style.display = 'block';
    welcomeMessage.style.display = 'none';
    if (!currentSelectedId) {
      selectRotation(prefSelect.value || ROTATIONS_DATA[0].id, false);
    }
  } else if (mode === 'all') {
    listView.style.display = 'none';
    inspectorCard.style.display = 'none';
    welcomeMessage.style.display = 'block';
    renderAllPlacements();
  }

  // Ensure map tiles redraw smoothly
  setTimeout(() => { map.invalidateSize(); }, 120);
}

function setCommuteMode(mode) {
  if (mode === 'custom' && (!customHomeBase || !customHomeBase.coords)) {
    openCustomBaseModal();
    return;
  }
  currentCommuteMode = mode;
  document.getElementById('btnModeDriver').classList.toggle('active', mode === 'driver');
  document.getElementById('btnModeTransit').classList.toggle('active', mode === 'transit');
  document.getElementById('btnModeCustom').classList.toggle('active', mode === 'custom');

  renderRotationCardsFeed(currentFilteredList);

  if (currentSelectedId && currentViewMode === 'details') {
    selectRotation(currentSelectedId, false);
  }
}

function stepRotation(direction) {
  if (!currentFilteredList.length) return;
  let currentIndex = currentFilteredList.findIndex(r => r.id === currentSelectedId);
  if (currentIndex === -1) {
    currentIndex = 0;
  } else {
    currentIndex += direction;
    if (currentIndex < 0) currentIndex = currentFilteredList.length - 1;
    if (currentIndex >= currentFilteredList.length) currentIndex = 0;
  }
  const nextId = currentFilteredList[currentIndex].id;
  prefSelect.value = nextId;
  selectRotation(nextId, false);
  renderRotationCardsFeed(currentFilteredList);
}

function focusHospitalBaseFromBtn(btn) {
  const hospName = btn.dataset.hosp;
  const h = HOSPITALS[hospName];
  if (h) {
    map.flyTo(h.coords, 13, { duration: 1.2 });
    if (window.innerWidth <= 768) {
      toggleMobileSidebar(false);
    }
    showToast(`Focused: ${hospName}`);
  }
}

function copyDirectShareLink() {
  const base = window.location.href.split('#')[0];
  const url = base + '#' + currentSelectedId;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url)
      .then(() => showToast("Direct link copied!"))
      .catch(() => prompt("Copy link:", url));
  } else {
    prompt("Copy link:", url);
  }
}

// 10. ROTATION INSPECTOR & MAP ROUTE RENDERING
function selectRotation(id, shouldCloseMobile = false) {
  if (!id) return;

  currentSelectedId = id;
  currentViewMode = 'details';
  document.getElementById('btnModeDetails').classList.add('active');
  document.getElementById('btnModeList').classList.remove('active');
  document.getElementById('btnModeAll').classList.remove('active');
  
  if (window.location.hash !== '#' + id) {
    window.location.hash = id;
  }

  document.getElementById('welcomeMessage').style.display = 'none';
  document.getElementById('inspectorCard').style.display = 'block';

  const rot = ROTATIONS_DATA.find(r => r.id === id);
  if (!rot) return;

  activeRouteGroup.clearLayers();
  backgroundHospitalsGroup.clearLayers();
  overviewLinesGroup.clearLayers();

  document.getElementById('cardCode').textContent = rot.code;
  document.getElementById('cardPlaces').textContent = `Places: ${rot.places}`;
  document.getElementById('cardTitle').textContent = rot.title;

  // Comparison toggle button state on card
  const cardCompareBtn = document.getElementById('cardCompareBtn');
  if (cardCompareBtn) {
    const isComparing = compareList.includes(rot.id);
    cardCompareBtn.classList.toggle('in-compare', isComparing);
    cardCompareBtn.textContent = isComparing ? '✓ In Compare' : '⚖️ Compare';
  }

  // Determine Active Base Coordinates
  let activeHub = rot.hubs[currentCommuteMode === 'transit' ? 'transit' : 'driver'];
  let activeHubCoords = activeHub.coords;
  let activeHubName = activeHub.name;

  const hubBox = document.getElementById('hubBox');
  const alertBox = document.getElementById('hubAlertBox');

  if (currentCommuteMode === 'custom' && customHomeBase && customHomeBase.coords) {
    hubBox.className = "hub-box custom-theme";
    document.getElementById('hubTitlePrefix').textContent = "📍 Custom Home Base:";
    document.getElementById('hubTownName').textContent = customHomeBase.name;
    document.getElementById('hubDescription').textContent = "Personal commute matrix calculated from your prospective living location.";
    activeHubCoords = customHomeBase.coords;
    activeHubName = customHomeBase.name;
  } else if (currentCommuteMode === 'transit') {
    hubBox.className = "hub-box transit-theme";
    document.getElementById('hubTitlePrefix').textContent = "🏡 Suggested Base (🚆 Transit Only):";
    document.getElementById('hubTownName').textContent = activeHub.name;
    document.getElementById('hubDescription').textContent = activeHub.desc;
  } else {
    hubBox.className = "hub-box driver-theme";
    document.getElementById('hubTitlePrefix').textContent = "🏡 Suggested Base (🚗 Driver):";
    document.getElementById('hubTownName').textContent = activeHub.name;
    document.getElementById('hubDescription').textContent = activeHub.desc;
  }

  const gmapsLink = document.getElementById('hubDirectionsLink');
  if (gmapsLink) {
    gmapsLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeHubName + ', UK')}`;
  }
  
  if (activeHub.alert && currentCommuteMode !== 'custom') {
    alertBox.style.display = 'block';
    alertBox.textContent = activeHub.alert;
  } else {
    alertBox.style.display = 'none';
  }

  const userData = getUserData(id);
  setRating(userData.rating);
  updateTierButtons(userData.tier);
  document.getElementById('partnerNotes').value = userData.notes;

  // Populate Hospital Bases Chips (XSS safe)
  const uniqueHospBases = getRotationHospitalBases(rot);
  const hospitalsListContainer = document.getElementById('hospitalsListContainer');
  hospitalsListContainer.innerHTML = "";

  uniqueHospBases.forEach(hName => {
    const chip = document.createElement('div');
    chip.className = "hospital-chip-item";
    
    const nameSpan = document.createElement('div');
    nameSpan.className = "hospital-chip-name";
    nameSpan.textContent = "🏥 " + hName;
    chip.appendChild(nameSpan);

    const btnGroup = document.createElement('div');
    btnGroup.style.display = "flex";
    btnGroup.style.gap = "4px";

    const focusBtn = document.createElement('button');
    focusBtn.className = "hospital-chip-btn";
    focusBtn.textContent = "📍 Focus";
    focusBtn.dataset.hosp = hName;
    focusBtn.onclick = function() { focusHospitalBaseFromBtn(this); };
    btnGroup.appendChild(focusBtn);

    const mapLink = document.createElement('a');
    mapLink.className = "hospital-chip-btn";
    mapLink.textContent = "Maps ↗";
    mapLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hName + ', UK')}`;
    mapLink.target = "_blank";
    btnGroup.appendChild(mapLink);

    chip.appendChild(btnGroup);
    hospitalsListContainer.appendChild(chip);
  });

  // Render Commute Matrix Breakdown from Chosen Base
  document.getElementById('commuteMatrixHubName').textContent = activeHubName;
  const matrixContainer = document.getElementById('commuteMatrixList');
  matrixContainer.innerHTML = "";

  uniqueHospBases.forEach(hName => {
    const hData = HOSPITALS[hName];
    if (hData && activeHubCoords) {
      const dist = calcDistanceMiles(activeHubCoords, hData.coords);
      const mins = Math.round(dist * 1.35);
      let timeClass = 'time-green';
      if (dist > 40) timeClass = 'time-red';
      else if (dist > 25) timeClass = 'time-amber';

      const row = document.createElement('div');
      row.className = "commute-matrix-item";
      row.innerHTML = `
        <span class="commute-hosp-label">🏥 ${escapeHtml(hName)}</span>
        <div style="display:flex; align-items:center; gap:6px;">
          <span class="commute-time-pill ${timeClass}">${dist} mi (~${mins}m)</span>
          <a href="https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(activeHubName + ', UK')}&destination=${encodeURIComponent(hName + ', UK')}" target="_blank" style="font-size:0.68rem; color:var(--primary); text-decoration:none;" title="Get directions">Directions ↗</a>
        </div>
      `;
      matrixContainer.appendChild(row);
    }
  });

  // Render Placement Timeline
  const timeline = document.getElementById('timelineContainer');
  timeline.innerHTML = "";
  const hospitalCoords = [];

  rot.stages.forEach((stg, idx) => {
    const step = document.createElement('div');
    step.className = "timeline-step";
    step.innerHTML = `
      <div class="timeline-dot">${idx + 1}</div>
      <div class="timeline-content">
        <div class="timeline-stage">${escapeHtml(stg.stage)}</div>
        <div class="timeline-hosp">
          <span>${escapeHtml(stg.hosp)}</span>
          <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stg.hosp + ', UK')}" target="_blank" style="color:var(--primary); font-size:0.7rem; text-decoration:none;">Map ↗</a>
        </div>
        <div class="timeline-desc">${escapeHtml(stg.desc)}</div>
      </div>
    `;
    timeline.appendChild(step);

    const hData = HOSPITALS[stg.hosp];
    if (hData) hospitalCoords.push(hData.coords);
  });

  const maxDist = getRotationMaxDistance(rot);
  const estMins = Math.round(maxDist * 1.35);

  document.getElementById('metricSites').textContent = uniqueHospBases.length;
  document.getElementById('metricDistance').textContent = `${maxDist} mi`;

  const spreadBadge = document.getElementById('cardSpreadBadge');
  spreadBadge.textContent = `Max: ${maxDist} mi`;
  if (maxDist <= 25) {
    spreadBadge.className = 'badge badge-spread-low';
    spreadBadge.textContent = `🟢 Low Spread: ${maxDist} mi (~${Math.max(15, estMins)}m)`;
  } else if (maxDist <= 45) {
    spreadBadge.className = 'badge badge-spread-med';
    spreadBadge.textContent = `🟡 Moderate: ${maxDist} mi (~${estMins}m)`;
  } else {
    spreadBadge.className = 'badge badge-spread-high';
    spreadBadge.textContent = `🔴 High Spread: ${maxDist} mi (~${Math.round(estMins/60)}h+)`;
  }

  const modeEmoji = currentCommuteMode === 'transit' ? '🚆' : (currentCommuteMode === 'custom' ? '📍' : '🚗');
  document.getElementById('miniCardTitle').textContent = `${rot.title} (${rot.code})`;
  document.getElementById('miniCardSpread').textContent = `${maxDist} mi`;
  document.getElementById('miniCardSpread').className = maxDist <= 25 ? 'badge badge-spread-low' : (maxDist <= 45 ? 'badge badge-spread-med' : 'badge badge-spread-high');
  document.getElementById('miniCardHub').innerHTML = `<span>${modeEmoji} <b>${activeHubName}</b> (${uniqueHospBases.length} Bases)</span> <span style="font-weight:700; color:var(--primary);">Details &rarr;</span>`;

  // Background subtle markers for other hospitals
  Object.keys(HOSPITALS).forEach(hName => {
    if (!uniqueHospBases.includes(hName)) {
      const h = HOSPITALS[hName];
      const bgIcon = L.divIcon({
        className: 'bg-site-pin',
        iconSize: [10, 10],
        iconAnchor: [5, 5]
      });
      const bgMarker = L.marker(h.coords, { icon: bgIcon, zIndexOffset: 100 })
        .bindPopup(`<b>${hName}</b><br><span style="font-size:0.75rem; color:var(--text-muted);">${h.region}</span>`);
      backgroundHospitalsGroup.addLayer(bgMarker);
    }
  });

  const allMapPoints = [];

  // Plot Living Base with 25-Mile Buffer Circle
  if (activeHubCoords) {
    allMapPoints.push(activeHubCoords);
    let pinClass = 'home-pin-driver';
    let pinIconHtml = '🚗';
    let circleColor = '#16a34a';

    if (currentCommuteMode === 'transit') {
      pinClass = 'home-pin-transit';
      pinIconHtml = '🚆';
      circleColor = '#7c3aed';
    } else if (currentCommuteMode === 'custom') {
      pinClass = 'home-pin-custom';
      pinIconHtml = '🏡';
      circleColor = '#d97706';
    }

    const homeIcon = L.divIcon({
      className: pinClass,
      html: pinIconHtml,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });
    const homeMarker = L.marker(activeHubCoords, { icon: homeIcon, zIndexOffset: 2000 })
      .bindPopup(`<b>Base: ${activeHubName}</b><br><span style="font-size:0.8rem; color:var(--text-muted);">${activeHub.desc || 'Custom prospective living base'}</span>`);
    activeRouteGroup.addLayer(homeMarker);

    const commuteCircle = L.circle(activeHubCoords, {
      radius: 40233.6, // 25 miles
      color: circleColor,
      fillColor: circleColor,
      fillOpacity: 0.04,
      weight: 1.5,
      dashArray: '5, 5',
      interactive: false
    });
    activeRouteGroup.addLayer(commuteCircle);
  }

  // Plot Active Placement Base Pins
  const plottedHospitalPoints = [];
  rot.stages.forEach((stg, idx) => {
    const hData = HOSPITALS[stg.hosp];
    if (hData) {
      allMapPoints.push(hData.coords);
      plottedHospitalPoints.push(hData.coords);
      const icon = L.divIcon({
        className: 'numbered-pin',
        html: `${idx + 1}`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      const m = L.marker(hData.coords, { icon, zIndexOffset: 1500 })
        .bindPopup(`<b>Stage ${idx + 1}: ${stg.hosp}</b><br><span style="font-size:0.8rem; color:var(--text-muted);">${stg.stage} - ${stg.desc}</span>`);
      activeRouteGroup.addLayer(m);
    }
  });

  if (plottedHospitalPoints.length > 1) {
    const polyline = L.polyline(plottedHospitalPoints, {
      color: '#0284c7',
      weight: 3.5,
      dashArray: '6, 6',
      opacity: 0.85
    });
    activeRouteGroup.addLayer(polyline);
  }

  if (allMapPoints.length > 0) {
    map.fitBounds(L.latLngBounds(allMapPoints), { padding: [60, 60], maxZoom: 12 });
  }

  if (shouldCloseMobile && window.innerWidth <= 768) {
    toggleMobileSidebar(false);
  }
}

// 11. NATIONAL OVERVIEW MAP VIEW (With Checked Rotation Network Lines)
function renderAllPlacements() {
  activeRouteGroup.clearLayers();
  backgroundHospitalsGroup.clearLayers();
  overviewLinesGroup.clearLayers();

  document.getElementById('miniCardTitle').textContent = `All UK Placement Sites (${Object.keys(HOSPITALS).length} Bases)`;
  document.getElementById('miniCardSpread').textContent = `All Regions`;
  document.getElementById('miniCardHub').innerHTML = `<span>National Map View</span> <span style="font-weight:700; color:var(--primary);">Menu &rarr;</span>`;

  const allPoints = [];
  const linesByHospital = {};

  // 11a. Plot Checked / Dashed Lines for All Rotations
  if (showOverviewLines) {
    let rotListForLines = ROTATIONS_DATA;
    if (activeRegionFilter !== "ALL") {
      rotListForLines = rotListForLines.filter(r => r.region === activeRegionFilter);
    }

    rotListForLines.forEach(rot => {
      const coords = rot.stages.map(s => HOSPITALS[s.hosp] ? HOSPITALS[s.hosp].coords : null).filter(Boolean);
      if (coords.length > 1) {
        const regColor = REGION_COLORS[rot.region] || "#0284c7";
        const maxDist = getRotationMaxDistance(rot);

        const polyline = L.polyline(coords, {
          color: regColor,
          weight: 2,
          dashArray: '4, 5', // Small checked lines
          opacity: 0.55
        });

        const tooltipContent = `<b>${rot.title}</b><br><span style="font-size:0.75rem;">${rot.code} • ${rot.places} • Max Spread: ${maxDist} mi</span>`;
        polyline.bindTooltip(tooltipContent, { sticky: true });

        polyline.on('mouseover', function() {
          const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
          this.setStyle({ weight: 4.5, opacity: 1.0, color: isDark ? '#38bdf8' : '#0f172a' });
          this.bringToFront();
        });

        polyline.on('mouseout', function() {
          this.setStyle({ weight: 2, opacity: 0.55, color: regColor });
        });

        polyline.on('click', function() {
          diveInFromPopup(rot.id);
        });

        overviewLinesGroup.addLayer(polyline);

        rot.stages.forEach(s => {
          if (!linesByHospital[s.hosp]) linesByHospital[s.hosp] = [];
          linesByHospital[s.hosp].push({ line: polyline, color: regColor });
        });
      }
    });
  }

  // 11b. Plot Hospital Pins
  Object.keys(HOSPITALS).forEach(hName => {
    const h = HOSPITALS[hName];

    if (activeRegionFilter !== "ALL" && h.region !== activeRegionFilter) {
      const linkedInRegion = ROTATIONS_DATA.filter(r => r.region === activeRegionFilter && r.stages.some(s => s.hosp === hName));
      if (!linkedInRegion.length) return;
    }

    allPoints.push(h.coords);

    const linkedRotations = ROTATIONS_DATA.filter(r => r.stages.some(s => s.hosp === hName));
    const regColor = REGION_COLORS[h.region] || "#0284c7";

    const linkedHtml = linkedRotations.length ? 
      `<div class="overview-popup-rot-list">
        <span style="font-size:0.7rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Click a rotation to view route:</span>
        ${linkedRotations.map(r => `
          <button class="popup-rotation-btn" onclick="diveInFromPopup('${r.id}')">
            <span>${r.code}</span>
            <span style="font-size:0.7rem; color:var(--text-muted);">${r.places} pl &rarr;</span>
          </button>
        `).join('')}
       </div>` : '';

    const icon = L.divIcon({
      className: 'overview-hosp-pin',
      html: `<div style="background-color: ${regColor}; width: 100%; height: 100%; border-radius: 50%;"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });

    const m = L.marker(h.coords, { icon, zIndexOffset: 500 }).bindPopup(`
      <div class="overview-popup-title">🏥 ${hName}</div>
      <div class="overview-popup-reg" style="color:${regColor};">${h.region}</div>
      <div style="font-size:0.75rem; color:var(--text-muted);">Included in <b>${linkedRotations.length}</b> rotation scheme(s).</div>
      ${linkedHtml}
    `, { maxWidth: 280 });

    m.on('mouseover', function() {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const lines = linesByHospital[hName] || [];
      lines.forEach(item => {
        item.line.setStyle({ weight: 4.5, opacity: 1.0, color: isDark ? '#38bdf8' : '#0f172a' });
        item.line.bringToFront();
      });
    });

    m.on('mouseout', function() {
      const lines = linesByHospital[hName] || [];
      lines.forEach(item => {
        item.line.setStyle({ weight: 2, opacity: 0.55, color: item.color });
      });
    });

    backgroundHospitalsGroup.addLayer(m);
  });

  if (allPoints.length > 0) {
    if (activeRegionFilter === "ALL") {
      map.setView([52.8, -1.8], 6);
    } else {
      map.fitBounds(L.latLngBounds(allPoints), { padding: [50, 50], maxZoom: 10 });
    }
  }

  if (window.innerWidth <= 768) {
    toggleMobileSidebar(false);
  }
}

function toggleOverviewLines() {
  showOverviewLines = !showOverviewLines;
  const btnOverview = document.getElementById('btnToggleLinesOverview');
  const btnMap = document.getElementById('btnMapLinesToggle');

  const text = showOverviewLines ? '🔀 Lines: ON' : '🔀 Lines: OFF';
  if (btnOverview) btnOverview.textContent = text;
  if (btnMap) {
    btnMap.textContent = text;
    btnMap.classList.toggle('active-btn', showOverviewLines);
  }

  if (currentViewMode === 'all') {
    renderAllPlacements();
  }
  showToast(`Rotation network lines: ${showOverviewLines ? 'Visible' : 'Hidden'}`);
}

function diveInFromPopup(id) {
  map.closePopup();
  if (prefSelect) prefSelect.value = id;
  selectRotation(id, false);
  setViewMode('details');
  showToast("Loaded rotation details & route");
}

// 12. FILTER, SEARCH & SORT ENGINE
function setQuickFilter(filterType) {
  activeQuickFilter = filterType;
  document.getElementById('pillAll').classList.toggle('active', filterType === 'ALL');
  document.getElementById('pillStarred').classList.toggle('active', filterType === 'STARRED');
  document.getElementById('pillTier1').classList.toggle('active', filterType === 'TIER1');
  document.getElementById('pillTier2').classList.toggle('active', filterType === 'TIER2');
  document.getElementById('pillTier3').classList.toggle('active', filterType === 'TIER3');
  document.getElementById('pillLowSpread').classList.toggle('active', filterType === 'LOW_SPREAD');
  applyFiltersAndSearch();
}

function filterRegion(reg) {
  activeRegionFilter = reg;
  applyFiltersAndSearch();
  if (currentViewMode === 'all') {
    renderAllPlacements();
  }
}

function handleSearch(term) {
  clearTimeout(searchDebounceTimer);
  const clearBtn = document.getElementById('btnSearchClear');
  if (clearBtn) {
    clearBtn.style.display = term ? 'block' : 'none';
  }
  // 120ms debounce for butter-smooth typing
  searchDebounceTimer = setTimeout(() => {
    currentSearchTerm = term.toLowerCase().trim();
    applyFiltersAndSearch();
  }, 120);
}

function clearSearch() {
  const searchInput = document.getElementById('searchInput');
  const clearBtn = document.getElementById('btnSearchClear');
  if (searchInput) searchInput.value = '';
  if (clearBtn) clearBtn.style.display = 'none';
  currentSearchTerm = '';
  applyFiltersAndSearch();
  if (searchInput) searchInput.focus();
}

function handleSortChange(sortVal) {
  currentSortMode = sortVal;
  applyFiltersAndSearch();
}

function handleSpreadFilterChange(spreadVal) {
  activeSpreadFilter = spreadVal;
  applyFiltersAndSearch();
}

function resetAllFilters() {
  activeRegionFilter = 'ALL';
  activeQuickFilter = 'ALL';
  activeSpreadFilter = 'ALL';
  currentSortMode = 'DEFAULT';
  currentSearchTerm = '';

  const regSelect = document.getElementById('regionFilter');
  if (regSelect) regSelect.value = 'ALL';

  const spreadSelect = document.getElementById('spreadFilterSelect');
  if (spreadSelect) spreadSelect.value = 'ALL';

  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) sortSelect.value = 'DEFAULT';

  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';
  const clearBtn = document.getElementById('btnSearchClear');
  if (clearBtn) clearBtn.style.display = 'none';

  document.getElementById('pillAll').classList.add('active');
  document.getElementById('pillStarred').classList.remove('active');
  document.getElementById('pillTier1').classList.remove('active');
  document.getElementById('pillTier2').classList.remove('active');
  document.getElementById('pillTier3').classList.remove('active');
  document.getElementById('pillLowSpread').classList.remove('active');

  applyFiltersAndSearch();
  showToast("All filters reset");
}

function applyFiltersAndSearch() {
  let list = [...ROTATIONS_DATA];

  // Region Filter
  if (activeRegionFilter !== "ALL") {
    list = list.filter(r => r.region === activeRegionFilter);
  }

  // Quick Filters
  if (activeQuickFilter === 'STARRED') {
    list = list.filter(r => getUserData(r.id).rating > 0);
  } else if (activeQuickFilter === 'TIER1') {
    list = list.filter(r => getUserData(r.id).tier === 'TIER1');
  } else if (activeQuickFilter === 'TIER2') {
    list = list.filter(r => getUserData(r.id).tier === 'TIER2');
  } else if (activeQuickFilter === 'TIER3') {
    list = list.filter(r => getUserData(r.id).tier === 'TIER3');
  } else if (activeQuickFilter === 'LOW_SPREAD') {
    list = list.filter(r => getRotationMaxDistance(r) <= 30);
  }

  // Spread Radius Dropdown Filter
  if (activeSpreadFilter !== "ALL") {
    const maxLimit = parseInt(activeSpreadFilter, 10);
    list = list.filter(r => getRotationMaxDistance(r) <= maxLimit);
  }

  // Search Filter
  if (currentSearchTerm) {
    list = list.filter(r => 
      r.title.toLowerCase().includes(currentSearchTerm) ||
      r.code.toLowerCase().includes(currentSearchTerm) ||
      r.hubs.driver.name.toLowerCase().includes(currentSearchTerm) ||
      r.hubs.transit.name.toLowerCase().includes(currentSearchTerm) ||
      getUserData(r.id).notes.toLowerCase().includes(currentSearchTerm) ||
      r.stages.some(s => s.hosp.toLowerCase().includes(currentSearchTerm) || s.desc.toLowerCase().includes(currentSearchTerm))
    );
  }

  // Sort Engine
  if (currentSortMode === 'SPREAD_ASC') {
    list.sort((a, b) => getRotationMaxDistance(a) - getRotationMaxDistance(b));
  } else if (currentSortMode === 'PLACES_DESC') {
    list.sort((a, b) => (parseInt(b.places, 10) || 0) - (parseInt(a.places, 10) || 0));
  } else if (currentSortMode === 'RATING_DESC') {
    list.sort((a, b) => getUserData(b.id).rating - getUserData(a.id).rating);
  }

  currentFilteredList = list;
  document.getElementById('listCountBadge').textContent = list.length;

  populateDropdown(list);
  renderRotationCardsFeed(list);

  if (list.length > 0) {
    if (currentViewMode === 'details' && !list.some(r => r.id === currentSelectedId)) {
      selectRotation(list[0].id, false);
      prefSelect.value = list[0].id;
    }
  } else {
    activeRouteGroup.clearLayers();
    document.getElementById('inspectorCard').style.display = 'none';
  }
}

// 13. SHORTLIST & REORDERING
function openShortlistModal() {
  renderShortlistModal();
  document.getElementById('shortlistModal').style.display = 'flex';
}

function renderShortlistModal() {
  const body = document.getElementById('shortlistModalBody');
  body.innerHTML = "";

  let starred = ROTATIONS_DATA.filter(r => {
    const d = getUserData(r.id);
    return d.rating > 0 || (d.tier && d.tier !== 'UNSET') || d.notes.trim() !== "";
  });
  
  if (!starred.length) {
    body.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted);"><p style="font-weight:700;">No rotations shortlisted yet!</p><p style="font-size:0.8rem; margin-top:4px;">Give stars, assign a Tier, or add notes to build your shortlist.</p></div>`;
    return;
  }

  starred.sort((a, b) => {
    let idxA = shortlistOrder.indexOf(a.id);
    let idxB = shortlistOrder.indexOf(b.id);
    if (idxA === -1) idxA = 999;
    if (idxB === -1) idxB = 999;
    return idxA - idxB;
  });

  shortlistOrder = starred.map(r => r.id);
  localStorage.setItem('anaesth_shortlist_order', JSON.stringify(shortlistOrder));

  starred.forEach((r, idx) => {
    const data = getUserData(r.id);
    const maxDist = getRotationMaxDistance(r);

    let tierBadgeHtml = '';
    if (data.tier === 'TIER1') tierBadgeHtml = '<span class="badge badge-tier-1">🟢 Tier 1</span>';
    else if (data.tier === 'TIER2') tierBadgeHtml = '<span class="badge badge-tier-2">🟡 Tier 2</span>';
    else if (data.tier === 'TIER3') tierBadgeHtml = '<span class="badge badge-tier-3">🔴 Tier 3</span>';
    else if (data.tier === 'EXCLUDE') tierBadgeHtml = '<span class="badge badge-tier-exclude">⚪ Excluded</span>';

    const div = document.createElement('div');
    div.className = 'shortlist-item';
    div.draggable = true;
    div.dataset.index = idx;

    // Drag and Drop Listeners
    div.ondragstart = (e) => {
      e.dataTransfer.setData('text/plain', idx);
      div.classList.add('dragging');
    };
    div.ondragend = () => div.classList.remove('dragging');
    div.ondragover = (e) => e.preventDefault();
    div.ondrop = (e) => {
      e.preventDefault();
      const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
      const toIdx = idx;
      if (fromIdx !== toIdx) {
        const item = shortlistOrder.splice(fromIdx, 1)[0];
        shortlistOrder.splice(toIdx, 0, item);
        localStorage.setItem('anaesth_shortlist_order', JSON.stringify(shortlistOrder));
        renderShortlistModal();
      }
    };

    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
          <span style="cursor:grab;" title="Drag to reorder">☰</span>
          <span style="font-size:0.75rem; font-weight:800; color:var(--text-muted);">Rank:</span>
          <input type="number" class="rank-input" value="${idx + 1}" min="1" max="${starred.length}" onchange="changeRankInput(${idx}, this.value)">
          <strong style="color:var(--primary); font-size:0.85rem;">${escapeHtml(r.code)}</strong>
          ${tierBadgeHtml}
          <span class="badge ${maxDist <= 25 ? 'badge-spread-low' : (maxDist <= 45 ? 'badge-spread-med' : 'badge-spread-high')}" style="font-size:0.65rem;">${maxDist} mi</span>
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
          <span style="color:var(--amber); font-weight:800; font-size:0.85rem;">${'★'.repeat(data.rating)}</span>
          <div style="display:flex; gap:2px;">
            <button class="btn-step" style="padding:2px 6px; font-size:0.7rem;" onclick="moveShortlistItem(${idx}, -1)" aria-label="Move item up">▲</button>
            <button class="btn-step" style="padding:2px 6px; font-size:0.7rem;" onclick="moveShortlistItem(${idx}, 1)" aria-label="Move item down">▼</button>
          </div>
        </div>
      </div>
      <div style="font-weight:700; font-size:0.9rem; margin:4px 0;">${escapeHtml(r.title)}</div>
      <div style="font-size:0.75rem; color:var(--text-muted);">🏡 Driving: <b>${escapeHtml(r.hubs.driver.name)}</b> | Transit: <b>${escapeHtml(r.hubs.transit.name)}</b></div>
      ${data.notes ? `<div style="margin-top:5px; font-size:0.74rem; background:var(--bg-card-subtle); border:1px solid var(--border-color); color:var(--text-main); padding:5px 8px; border-radius:4px; font-style:italic;">"${escapeHtml(data.notes)}"</div>` : ''}
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
        <button class="btn-step" style="font-size:0.7rem; padding:3px 8px;" onclick="closeModal('shortlistModal'); openDetailsForRotation('${r.id}');">View Details &rarr;</button>
        <button style="border:none; background:none; color:#b91c1c; font-size:0.7rem; cursor:pointer;" onclick="removeShortlistItem('${r.id}')">✕ Remove</button>
      </div>
    `;
    body.appendChild(div);
  });
}

function changeRankInput(fromIdx, newRankVal) {
  const targetRank = parseInt(newRankVal, 10);
  if (isNaN(targetRank) || targetRank < 1 || targetRank > shortlistOrder.length) {
    renderShortlistModal();
    return;
  }
  const toIdx = targetRank - 1;
  const item = shortlistOrder.splice(fromIdx, 1)[0];
  shortlistOrder.splice(toIdx, 0, item);
  localStorage.setItem('anaesth_shortlist_order', JSON.stringify(shortlistOrder));
  renderShortlistModal();
}

function moveShortlistItem(index, dir) {
  const newIndex = index + dir;
  if (newIndex < 0 || newIndex >= shortlistOrder.length) return;
  const temp = shortlistOrder[index];
  shortlistOrder[index] = shortlistOrder[newIndex];
  shortlistOrder[newIndex] = temp;
  localStorage.setItem('anaesth_shortlist_order', JSON.stringify(shortlistOrder));
  renderShortlistModal();
}

function removeShortlistItem(id) {
  shortlistOrder = shortlistOrder.filter(x => x !== id);
  localStorage.setItem('anaesth_shortlist_order', JSON.stringify(shortlistOrder));
  const d = getUserData(id);
  d.rating = 0;
  d.tier = 'UNSET';
  localStorage.setItem(`anaesth_pref_${id}`, JSON.stringify(d));
  updateShortlistBadge();
  applyFiltersAndSearch();
  renderShortlistModal();
  showToast("Removed from shortlist");
}

// 14. SIDE-BY-SIDE ROTATION COMPARISON
function toggleCompareCard(event, id) {
  event.stopPropagation();
  toggleCompare(id);
}

function toggleCompareFromCard() {
  if (currentSelectedId) toggleCompare(currentSelectedId);
}

function toggleCompare(id) {
  const idx = compareList.indexOf(id);
  if (idx !== -1) {
    compareList.splice(idx, 1);
    showToast("Removed from compare");
  } else {
    if (compareList.length >= 3) {
      showToast("Maximum 3 rotations can be compared at once");
      return;
    }
    compareList.push(id);
    showToast("Added to compare tray");
  }
  localStorage.setItem('anaesth_compare_list', JSON.stringify(compareList));
  updateCompareBadge();
  renderRotationCardsFeed(currentFilteredList);
  if (currentSelectedId && currentViewMode === 'details') {
    const cardCompareBtn = document.getElementById('cardCompareBtn');
    if (cardCompareBtn) {
      const isComparing = compareList.includes(currentSelectedId);
      cardCompareBtn.classList.toggle('in-compare', isComparing);
      cardCompareBtn.textContent = isComparing ? '✓ In Compare' : '⚖️ Compare';
    }
  }
}

function openCompareModal() {
  renderCompareModal();
  document.getElementById('compareModal').style.display = 'flex';
}

function renderCompareModal() {
  const container = document.getElementById('compareModalContent');
  if (!compareList.length) {
    container.innerHTML = `
      <div style="text-align:center; padding:40px 15px; color:var(--text-muted);">
        <p style="font-weight:700; font-size:1rem;">Your Comparison Tray is Empty</p>
        <p style="font-size:0.8rem; margin-top:6px;">Click <b>'+ Compare'</b> on any rotation card in the list or inspector to compare up to 3 candidate rotations side-by-side.</p>
      </div>
    `;
    return;
  }

  let html = `<div class="compare-grid">`;
  compareList.forEach(id => {
    const r = ROTATIONS_DATA.find(x => x.id === id);
    if (!r) return;
    const data = getUserData(id);
    const maxDist = getRotationMaxDistance(r);
    const estMins = Math.round(maxDist * 1.35);
    const bases = getRotationHospitalBases(r);

    let tierLabel = 'None';
    if (data.tier === 'TIER1') tierLabel = '🟢 Tier 1';
    else if (data.tier === 'TIER2') tierLabel = '🟡 Tier 2';
    else if (data.tier === 'TIER3') tierLabel = '🔴 Tier 3';
    else if (data.tier === 'EXCLUDE') tierLabel = '⚪ Excluded';

    html += `
      <div class="compare-card">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <span class="badge badge-code">${escapeHtml(r.code)}</span>
          <button style="border:none; background:none; color:#b91c1c; font-size:0.75rem; font-weight:800; cursor:pointer;" onclick="toggleCompare('${r.id}'); renderCompareModal();">✕ Remove</button>
        </div>
        <div class="compare-card-title">${escapeHtml(r.title)}</div>
        <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(r.region)} • <b>${escapeHtml(r.places)} places</b></div>
        
        <div>
          <div class="compare-row-label">Max Commute Spread</div>
          <div class="compare-row-val"><b>${maxDist} mi</b> (~${estMins}m drive)</div>
        </div>

        <div>
          <div class="compare-row-label">Suggested Living Bases</div>
          <div class="compare-row-val">🚗 <b>Driver:</b> ${escapeHtml(r.hubs.driver.name)}</div>
          <div class="compare-row-val" style="margin-top:2px;">🚆 <b>Transit:</b> ${escapeHtml(r.hubs.transit.name)}</div>
        </div>

        <div>
          <div class="compare-row-label">Hospital Bases (${bases.length})</div>
          <div class="compare-row-val" style="font-size:0.74rem;">${bases.map(b => `• ${escapeHtml(b)}`).join('<br>')}</div>
        </div>

        <div>
          <div class="compare-row-label">Your Rating &amp; Tier</div>
          <div class="compare-row-val">
            <span style="color:var(--amber); font-weight:800;">${'★'.repeat(data.rating) || '☆☆☆☆☆'}</span>
            <span style="margin-left:6px; font-weight:700;">${tierLabel}</span>
          </div>
          ${data.notes ? `<div style="font-size:0.72rem; color:var(--text-muted); font-style:italic; margin-top:3px;">"${escapeHtml(data.notes)}"</div>` : ''}
        </div>

        <button class="btn-top btn-export" style="margin-top:auto; width:100%; justify-content:center; padding:7px;" onclick="closeModal('compareModal'); openDetailsForRotation('${r.id}');">
          View Route &amp; Timeline &rarr;
        </button>
      </div>
    `;
  });
  html += `</div>`;
  container.innerHTML = html;
}

// 15. CUSTOM HOME BASE CALCULATOR
function openCustomBaseModal() {
  updateCustomBaseUI();
  document.getElementById('customBaseModal').style.display = 'flex';
  setTimeout(() => {
    const input = document.getElementById('customPostcodeInput');
    if (input) input.focus();
  }, 100);
}

function lookupCustomPostcode() {
  const input = document.getElementById('customPostcodeInput');
  if (!input) return;
  const query = input.value.trim();
  if (!query) {
    showToast("Please enter a UK postcode or town.");
    return;
  }

  const cleanPC = query.replace(/\s+/g, '');
  showToast("Looking up UK location...");

  // Try free UK Postcodes.io API
  fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(cleanPC)}`)
    .then(r => r.json())
    .then(data => {
      if (data.status === 200 && data.result) {
        saveCustomHomeBase(data.result.postcode, [data.result.latitude, data.result.longitude]);
      } else {
        fallbackNominatim(query);
      }
    })
    .catch(() => {
      fallbackNominatim(query);
    });
}

function fallbackNominatim(query) {
  fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=gb&q=${encodeURIComponent(query)}`)
    .then(r => r.json())
    .then(data => {
      if (data && data.length > 0) {
        const place = data[0];
        saveCustomHomeBase(query.toUpperCase(), [parseFloat(place.lat), parseFloat(place.lon)]);
      } else {
        showToast("Location not found. Please try a valid UK postcode or town.");
      }
    })
    .catch(() => {
      showToast("Error connecting to geocoding service.");
    });
}

function useGpsForCustomBase() {
  if (!navigator.geolocation) {
    showToast("Geolocation not supported by this browser.");
    return;
  }
  showToast("Acquiring GPS location...");
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      saveCustomHomeBase("My GPS Location", [pos.coords.latitude, pos.coords.longitude]);
    },
    () => showToast("Could not retrieve GPS location.")
  );
}

function startMapPickBase() {
  closeModal('customBaseModal');
  showToast("Click anywhere on the map to set your home base");
  map.once('click', (e) => {
    saveCustomHomeBase("Custom Map Pin", [e.latlng.lat, e.latlng.lng]);
  });
}

function saveCustomHomeBase(name, coords) {
  customHomeBase = { name, coords };
  localStorage.setItem('anaesth_custom_home', JSON.stringify(customHomeBase));
  updateCustomBaseUI();
  setCommuteMode('custom');
  closeModal('customBaseModal');
  showToast(`Custom Base saved: ${name}`);
}

function clearCustomHomeBase() {
  customHomeBase = null;
  localStorage.removeItem('anaesth_custom_home');
  updateCustomBaseUI();
  setCommuteMode('driver');
  closeModal('customBaseModal');
  showToast("Custom Base cleared");
}

// 16. FULLSCREEN & GPS CONTROLS
function toggleMapFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

function locateUserOnMap() {
  if (!navigator.geolocation) {
    showToast("Geolocation is not supported by your browser");
    return;
  }
  showToast("Locating you...");
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const latlng = [pos.coords.latitude, pos.coords.longitude];
      map.flyTo(latlng, 12);
      const userMarker = L.circleMarker(latlng, {
        radius: 8,
        fillColor: '#0284c7',
        color: '#ffffff',
        weight: 2.5,
        opacity: 1,
        fillOpacity: 0.9
      }).bindPopup("<b>📍 Your Current Location</b>").addTo(map);
      userMarker.openPopup();
      if (window.innerWidth <= 768) toggleMobileSidebar(false);
    },
    () => showToast("Unable to access GPS location.")
  );
}

// 17. BACKUP, RESTORE & CSV EXPORT
function openSyncModal() {
  const modal = document.getElementById('syncModal');
  const area = document.getElementById('syncJsonArea');
  
  const syncObj = {
    ratings: {},
    shortlistOrder: shortlistOrder,
    customHomeBase: customHomeBase
  };
  ROTATIONS_DATA.forEach(r => {
    const d = getUserData(r.id);
    if (d.rating > 0 || (d.tier && d.tier !== 'UNSET') || (d.notes && d.notes.trim() !== "")) {
      syncObj.ratings[r.id] = d;
    }
  });
  area.value = JSON.stringify(syncObj, null, 2);
  modal.style.display = 'flex';
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'none';
}

function copySyncData() {
  const area = document.getElementById('syncJsonArea');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(area.value)
      .then(() => showToast("Code copied to clipboard!"))
      .catch(() => {
        area.select();
        document.execCommand('copy');
        showToast("Code copied to clipboard!");
      });
  } else {
    area.select();
    document.execCommand('copy');
    showToast("Code copied to clipboard!");
  }
}

function importSyncData() {
  try {
    const area = document.getElementById('syncJsonArea');
    const parsed = JSON.parse(area.value);
    applyParsedBackup(parsed);
    closeModal('syncModal');
  } catch(e) {
    showToast("Invalid code format");
  }
}

function downloadJsonBackup() {
  const syncObj = {
    ratings: {},
    shortlistOrder: shortlistOrder,
    customHomeBase: customHomeBase,
    exportDate: new Date().toISOString()
  };
  ROTATIONS_DATA.forEach(r => {
    const d = getUserData(r.id);
    if (d.rating > 0 || (d.tier && d.tier !== 'UNSET') || (d.notes && d.notes.trim() !== "")) {
      syncObj.ratings[r.id] = d;
    }
  });
  const jsonStr = JSON.stringify(syncObj, null, 2);
  downloadBlob(jsonStr, "ST4_Anaesthetics_Preferences_Backup.json", "application/json");
  showToast("Backup JSON file downloaded!");
}

function handleBackupFileUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      applyParsedBackup(parsed);
      closeModal('syncModal');
      showToast("Backup file imported successfully!");
    } catch(err) {
      showToast("Error parsing backup file.");
    }
  };
  reader.readAsText(file);
  event.target.value = ''; // Reset input to allow re-uploading same file if desired
}

function applyParsedBackup(parsed) {
  if (parsed.ratings) {
    Object.keys(parsed.ratings).forEach(k => {
      localStorage.setItem(`anaesth_pref_${k}`, JSON.stringify(parsed.ratings[k]));
    });
  }
  if (parsed.shortlistOrder) {
    shortlistOrder = parsed.shortlistOrder;
    localStorage.setItem('anaesth_shortlist_order', JSON.stringify(shortlistOrder));
  }
  if (parsed.customHomeBase) {
    customHomeBase = parsed.customHomeBase;
    localStorage.setItem('anaesth_custom_home', JSON.stringify(customHomeBase));
    updateCustomBaseUI();
  }
  updateShortlistBadge();
  applyFiltersAndSearch();
  if (currentSelectedId && currentViewMode === 'details') {
    selectRotation(currentSelectedId, false);
  }
  showToast("Preferences restored!");
}

function exportPreferencesCSV() {
  let csv = "OrielCode,TrackTitle,Region,PlacesAvailable,TierPreference,DriverLivingHub,TransitLivingHub,HospitalBases,RatingStars,PersonalNotes\n";
  ROTATIONS_DATA.forEach(r => {
    const data = getUserData(r.id);
    const cleanNotes = `"${(data.notes || "").replace(/"/g, '""')}"`;
    const basesStr = `"${getRotationHospitalBases(r).join('; ')}"`;
    const tierStr = data.tier || "UNSET";
    csv += `"${r.code}","${r.title}","${r.region}","${r.places}","${tierStr}","${r.hubs.driver.name}","${r.hubs.transit.name}",${basesStr},${data.rating},${cleanNotes}\n`;
  });
  downloadBlob(csv, "ST4_Anaesthetics_All_Rotations.csv", "text/csv;charset=utf-8;");
}

function exportShortlistCSV() {
  const activeStarred = ROTATIONS_DATA.filter(r => {
    const d = getUserData(r.id);
    return d.rating > 0 || (d.tier && d.tier !== 'UNSET') || (d.notes && d.notes.trim() !== "");
  }).map(r => r.id);

  // Sync shortlist order cleanly
  shortlistOrder = shortlistOrder.filter(id => activeStarred.includes(id));
  activeStarred.forEach(id => {
    if (!shortlistOrder.includes(id)) shortlistOrder.push(id);
  });
  localStorage.setItem('anaesth_shortlist_order', JSON.stringify(shortlistOrder));

  let csv = "AssignedRank,OrielCode,TrackTitle,Region,PlacesAvailable,TierPreference,DriverLivingHub,TransitLivingHub,HospitalBases,RatingStars,PersonalNotes\n";
  shortlistOrder.forEach((id, idx) => {
    const r = ROTATIONS_DATA.find(x => x.id === id);
    if (r) {
      const data = getUserData(r.id);
      const cleanNotes = `"${(data.notes || "").replace(/"/g, '""')}"`;
      const basesStr = `"${getRotationHospitalBases(r).join('; ')}"`;
      const tierStr = data.tier || "UNSET";
      csv += `${idx + 1},"${r.code}","${r.title}","${r.region}","${r.places}","${tierStr}","${r.hubs.driver.name}","${r.hubs.transit.name}",${basesStr},${data.rating},${cleanNotes}\n`;
    }
  });
  downloadBlob(csv, "ST4_Anaesthetics_MyShortlist_Ranked.csv", "text/csv;charset=utf-8;");
}

function downloadBlob(content, filename, mimeType) {
  // UTF-8 BOM for Microsoft Excel compatibility
  const blob = new Blob(['\uFEFF' + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// 18. MOBILE DRAWER NAVIGATION
function toggleMobileSidebar(open) {
  const sidebar = document.getElementById('sidebar');
  if (open) sidebar.classList.remove('mobile-closed');
  else sidebar.classList.add('mobile-closed');
  setTimeout(() => { map.invalidateSize(); }, 320);
}

// 19. ACCESSIBILITY, KEYBOARD SHORTCUTS & MODAL BACKDROPS
document.addEventListener('keydown', (e) => {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
  if (e.key === 'ArrowRight') {
    e.preventDefault();
    stepRotation(1);
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    stepRotation(-1);
  } else if (e.key === 'Escape') {
    closeModal('shortlistModal');
    closeModal('compareModal');
    closeModal('customBaseModal');
    closeModal('syncModal');
    if (window.innerWidth <= 768) toggleMobileSidebar(false);
  }
});

// Setup click-outside-to-close for all modals
function setupModalBackdrops() {
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });
}

// 20. BROWSER HISTORY & DIRECT LINK ROUTING
window.addEventListener('hashchange', () => {
  const hashId = window.location.hash.replace('#', '');
  if (hashId && hashId !== currentSelectedId && ROTATIONS_DATA.some(r => r.id === hashId)) {
    prefSelect.value = hashId;
    selectRotation(hashId, false);
    setViewMode('details');
  } else if (!hashId) {
    setViewMode('all');
  }
});

// Window resize auto-invalidation for Leaflet
window.addEventListener('resize', () => {
  map.invalidateSize();
});

// Dynamic zoom class to scale pins when zooming into regional/city level
map.on('zoomend', () => {
  const container = map.getContainer();
  if (container) {
    if (map.getZoom() >= 8) {
      container.classList.add('zoom-detailed');
    } else {
      container.classList.remove('zoom-detailed');
    }
  }
});

// Tap map on mobile to dismiss open drawer
map.on('click', () => {
  if (window.innerWidth <= 768) {
    toggleMobileSidebar(false);
  }
});

// 21. APPLICATION ENTRY POINT
window.onload = () => {
  applyTheme();
  populateRegionDropdown();
  populateDropdown(ROTATIONS_DATA);
  renderRotationCardsFeed(ROTATIONS_DATA);
  updateShortlistBadge();
  updateCompareBadge();
  updateCustomBaseUI();
  setupModalBackdrops();

  const hashId = window.location.hash.replace('#', '');
  if (hashId && ROTATIONS_DATA.some(r => r.id === hashId)) {
    prefSelect.value = hashId;
    selectRotation(hashId, false);
    setViewMode('details');
  } else {
    setViewMode('all');
  }

  if (window.innerWidth <= 768) {
    toggleMobileSidebar(false);
  }
};
