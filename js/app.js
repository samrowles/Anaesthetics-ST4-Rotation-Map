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
 * Calibrated UK Commute Driving Time Model.
 * Estimates realistic UK driving commute duration based on road circuity factor (1.25x - 1.35x),
 * regional rush-hour congestion speeds (London vs Provincial vs Rural), and a 5-minute hospital
 * site access, parking barrier queue, and hospital walk buffer.
 *
 * @param {number} straightDistMiles - Haversine straight-line distance in miles.
 * @param {string} region - NHS training region (determines traffic & road congestion profile).
 * @param {string} timing - '0730' (Arrive 07:30 handover), '1800' (Leave 18:00 evening rush), or 'offpeak'.
 * @returns {number} Estimated one-way driving commute in minutes.
 */
function calcDrivingTimeMinutes(straightDistMiles, region = '', timing = '0730') {
  if (straightDistMiles === undefined || straightDistMiles === null || straightDistMiles < 0) return 0;
  if (straightDistMiles === 0) return 5;

  const regStr = String(region || '');
  const isLondon = regStr.startsWith('London');
  const isRural = regStr === 'South West - Peninsula' || regStr === 'Wales';

  // Road network circuity multiplier: driven road miles vs straight-line miles
  const circuityFactor = isRural ? 1.35 : (isLondon ? 1.28 : 1.25);
  const roadMiles = straightDistMiles * circuityFactor;

  // Minutes-per-mile pace & hospital perimeter/parking barrier queue buffer
  let minPerMile;
  const siteBufferMins = 5;

  if (isLondon) {
    if (timing === '1800') {
      minPerMile = 4.25; // ~14 mph (heavy London evening rush)
    } else if (timing === '0730') {
      minPerMile = 3.00; // ~20 mph (morning shoulder build-up)
    } else {
      minPerMile = 2.20; // ~27 mph (off-peak)
    }
  } else if (isRural) {
    if (timing === '1800') {
      minPerMile = 2.40; // ~25 mph (winding single-carriageway A-roads, evening freight)
    } else if (timing === '0730') {
      minPerMile = 2.00; // ~30 mph (early morning rural routes)
    } else {
      minPerMile = 1.60; // ~37 mph (off-peak)
    }
  } else {
    // Standard Provincial UK (Motorways, dual carriageways, bypasses)
    if (timing === '1800') {
      minPerMile = 2.15; // ~28 mph (prime evening UK rush hour)
    } else if (timing === '0730') {
      minPerMile = 1.75; // ~34 mph (morning pre-peak shift start)
    } else {
      minPerMile = 1.35; // ~44 mph (uncongested off-peak baseline)
    }
  }

  return Math.max(5, Math.round(roadMiles * minPerMile + siteBufferMins));
}

/**
 * HTML entity sanitizer to prevent XSS from imported user notes or titles.
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
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
let activeHospitalMarkers = {};

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
let currentShiftTiming = localStorage.getItem('anaesth_shift_timing') || '0730'; // '0730' (Arrive 07:30), '1800' (Leave 18:00), or 'offpeak'
let currentViewMode = 'list';       // 'list' (feed + national map) or 'details' (inspector)
let activeQuickFilter = 'ALL';
let activeRegionFilter = 'ALL';
let currentSortMode = 'DEFAULT';
let currentSearchTerm = '';
let currentFilteredList = [...ROTATIONS_DATA];
let showOverviewLines = true;
let currentActiveRating = 0;
let searchDebounceTimer = null;
let currentUserLocationMarker = null;

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
let orielCheckedSet = new Set(safeGetStorageJson('anaesth_oriel_checked', []));

// 5. TOAST NOTIFICATIONS
let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

// Shortlist membership: a rotation is shortlisted once it has a rating, any preference tier (excluding EXCLUDE), or notes.
function isShortlisted(d) {
  return !!d && d.tier !== 'EXCLUDE' && (d.rating > 0 || (d.tier && d.tier !== 'UNSET') || (d.notes && d.notes.trim() !== ''));
}

/**
 * Reconciles the saved rank order with the current shortlist: drops rotations that
 * are no longer shortlisted and appends newly shortlisted ones at the end.
 */
function syncShortlistOrder() {
  const active = ROTATIONS_DATA.filter(r => isShortlisted(getUserData(r.id))).map(r => r.id);
  const activeSet = new Set(active);
  const ordered = (Array.isArray(shortlistOrder) ? shortlistOrder : []).filter((id, i, arr) => activeSet.has(id) && arr.indexOf(id) === i);
  active.forEach(id => { if (!ordered.includes(id)) ordered.push(id); });
  shortlistOrder = ordered;
  localStorage.setItem('anaesth_shortlist_order', JSON.stringify(shortlistOrder));
  return shortlistOrder;
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
  // Single-site scheme fallback: calculate commute distance to living base
  if (maxDist === 0 && coords.length > 0) {
    let hubCoords = null;
    if (currentCommuteMode === 'custom' && customHomeBase && customHomeBase.coords) {
      hubCoords = customHomeBase.coords;
    } else if (currentCommuteMode === 'transit' && rot.hubs && rot.hubs.transit && rot.hubs.transit.coords) {
      hubCoords = rot.hubs.transit.coords;
    } else if (rot.hubs && rot.hubs.driver && rot.hubs.driver.coords) {
      hubCoords = rot.hubs.driver.coords;
    }
    if (hubCoords) {
      maxDist = Math.max(1, calcDistanceMiles(hubCoords, coords[0]));
    } else {
      maxDist = 1;
    }
  }
  return maxDist;
}

/**
 * Consolidated commute summary for any rotation.
 * Computes max distance spread, morning rush commute (07:30), evening commute (18:00),
 * active shift time based on selected timing, badge styling class, and short timing label.
 */
function getRotationCommuteSummary(rot, timing = currentShiftTiming) {
  if (!rot) return { maxDist: 0, mornMins: 0, eveMins: 0, activeMins: 0, badgeClass: 'badge-spread-low', timingShort: '07:30' };
  const maxDist = getRotationMaxDistance(rot);
  const mornMins = calcDrivingTimeMinutes(maxDist, rot.region, '0730');
  const eveMins = calcDrivingTimeMinutes(maxDist, rot.region, '1800');
  const activeMins = timing === '1800' ? eveMins : (timing === 'offpeak' ? calcDrivingTimeMinutes(maxDist, rot.region, 'offpeak') : mornMins);
  const timingShort = timing === '1800' ? '18:00' : (timing === '0730' ? '07:30' : 'off-peak');
  let badgeClass = 'badge-spread-low';
  if (activeMins > 50) badgeClass = 'badge-spread-high';
  else if (activeMins > 35) badgeClass = 'badge-spread-med';
  return { maxDist, mornMins, eveMins, activeMins, badgeClass, timingShort };
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

/**
 * Calculates Tertiary Teaching vs DGH balance percentage for a rotation.
 * Factors in duration months if specified in stage text (e.g. 6m, 3m, 12m).
 */
function getRotationTrainingSplit(rot) {
  if (!rot || !rot.stages || !rot.stages.length) {
    return { tertiary: 50, dgh: 50, tertiaryCount: 0, dghCount: 0 };
  }
  let tertiaryWeight = 0;
  let dghWeight = 0;
  let tertiaryCount = 0;
  let dghCount = 0;

  rot.stages.forEach(stg => {
    const h = HOSPITALS[stg.hosp];
    const isTertiary = h && h.type === 'Tertiary';
    
    // Extract months if present like "Stage 1 (6m)" or "(3m)"
    let months = 6;
    const fullText = `${stg.stage || ''} ${stg.desc || ''}`;
    const match = fullText.match(/\b(\d+)\s*m\b/i);
    if (match) {
      const parsed = parseInt(match[1], 10);
      if (parsed > 0 && parsed <= 24) months = parsed;
    }

    if (isTertiary) {
      tertiaryWeight += months;
      tertiaryCount++;
    } else {
      dghWeight += months;
      dghCount++;
    }
  });

  const total = tertiaryWeight + dghWeight;
  if (total === 0) return { tertiary: 50, dgh: 50, tertiaryCount: 0, dghCount: 0 };

  const tertiaryPct = Math.round((tertiaryWeight / total) * 100);
  const dghPct = 100 - tertiaryPct;
  return {
    tertiary: tertiaryPct,
    dgh: dghPct,
    tertiaryCount,
    dghCount
  };
}

function updateShortlistBadge() {
  const badge = document.getElementById('headerShortlistBadge');
  if (!badge) return;
  const count = ROTATIONS_DATA.filter(r => isShortlisted(getUserData(r.id))).length;
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
  prefSelect.innerHTML = '<option value="">Jump to rotation...</option>';
  
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
    const commute = getRotationCommuteSummary(r);
    const split = getRotationTrainingSplit(r);
    const isSelected = r.id === currentSelectedId;
    const isComparing = compareList.includes(r.id);

    let activeHubName = r.hubs[currentCommuteMode === 'transit' ? 'transit' : 'driver'].name;
    let hubEmoji = currentCommuteMode === 'transit' ? '🚆' : '🚗';
    if (currentCommuteMode === 'custom' && customHomeBase) {
      activeHubName = customHomeBase.name;
      hubEmoji = '📍';
    }

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
      openDetailsForRotation(r.id);
    };

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:6px;">
        <div style="display:flex; gap:5px; align-items:center; flex-wrap:wrap;">
          <span class="badge badge-code">${escapeHtml(r.code)}</span>
          <span class="badge badge-places">${escapeHtml(r.places)}</span>
          <span class="badge badge-split" title="Training Balance: ${split.tertiary}% Tertiary, ${split.dgh}% DGH">${split.tertiary}% Tert • ${split.dgh}% DGH</span>
          ${tierBadgeHtml}
        </div>
        <div style="display:flex; align-items:center; gap:5px;">
          <button class="btn-compare-action ${isComparing ? 'in-compare' : ''}" onclick="toggleCompareCard(event, '${r.id}')" title="Compare rotation">
            ${isComparing ? '✓ Comparing' : '+ Compare'}
          </button>
          <span class="badge ${commute.badgeClass}" title="Estimated drive time at ${commute.timingShort}">${commute.maxDist} mi (~${commute.activeMins}m @ ${commute.timingShort})</span>
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
  if (window.innerWidth <= 768) {
    toggleMobileSidebar(true);
  }
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
  syncShortlistOrder();

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
  syncShortlistOrder();

  updateShortlistBadge();
  applyFiltersAndSearch();
  if (prefSelect) prefSelect.value = currentSelectedId;
  showToast("Saved to browser");
}

function setRating(val, isClick = false) {
  if (isClick && val === currentActiveRating) {
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
function showListView() {
  currentViewMode = 'list';
  const listView = document.getElementById('listViewContainer');
  const inspectorCard = document.getElementById('inspectorCard');
  if (listView) listView.style.display = 'block';
  if (inspectorCard) inspectorCard.style.display = 'none';

  // Drop the #rotation-id from the URL so a reload returns to the list (Back still returns to the rotation)
  if (window.location.hash) {
    history.pushState(null, '', window.location.pathname + window.location.search);
  }

  renderRotationCardsFeed(currentFilteredList);
  if (currentSelectedId) {
    setTimeout(() => {
      const card = document.getElementById(`feed-card-${currentSelectedId}`);
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  }
  renderAllPlacements({ fitView: true });
  setTimeout(() => { map.invalidateSize(); }, 120);
}

function dismissTipBanner() {
  const banner = document.getElementById('appTipBanner');
  if (banner) banner.style.display = 'none';
  try {
    localStorage.setItem('anaesth_tip_dismissed', 'true');
  } catch (e) {}
}

function checkTipBannerStatus() {
  try {
    if (localStorage.getItem('anaesth_tip_dismissed') === 'true') {
      const banner = document.getElementById('appTipBanner');
      if (banner) banner.style.display = 'none';
    }
  } catch (e) {}
}

function setViewMode(mode) {
  if (mode === 'details') {
    currentViewMode = 'details';
    const listView = document.getElementById('listViewContainer');
    const inspectorCard = document.getElementById('inspectorCard');
    if (listView) listView.style.display = 'none';
    if (inspectorCard) inspectorCard.style.display = 'block';
    if (!currentSelectedId) {
      const prefSelect = document.getElementById('prefSelect');
      const firstId = (prefSelect && prefSelect.value) || (ROTATIONS_DATA[0] && ROTATIONS_DATA[0].id);
      if (firstId) selectRotation(firstId, false);
    }
  } else {
    showListView();
  }
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

function setShiftTiming(timing, showFeedback = true) {
  currentShiftTiming = timing || '0730';
  localStorage.setItem('anaesth_shift_timing', currentShiftTiming);

  const btnMorn = document.getElementById('btnTimingMorning');
  const btnEve = document.getElementById('btnTimingEvening');
  const btnOff = document.getElementById('btnTimingOffPeak');
  const lbl = document.getElementById('shiftTimingLabel');

  if (btnMorn) btnMorn.classList.toggle('active', currentShiftTiming === '0730');
  if (btnEve) btnEve.classList.toggle('active', currentShiftTiming === '1800');
  if (btnOff) btnOff.classList.toggle('active', currentShiftTiming === 'offpeak');

  let labelText = '🌅 Arrive 07:30 (Handover)';
  let toastText = 'Commute model: Arrive by 07:30 (Morning Handover)';
  if (currentShiftTiming === '1800') {
    labelText = '🌆 Leave 18:00 (Evening Rush)';
    toastText = 'Commute model: Depart at 18:00 (Evening Rush Hour)';
  } else if (currentShiftTiming === 'offpeak') {
    labelText = '⚡ Off-Peak Baseline';
    toastText = 'Commute model: Off-Peak Baseline Drive';
  }
  if (lbl) lbl.textContent = labelText;

  renderRotationCardsFeed(currentFilteredList);

  if (currentSelectedId && currentViewMode === 'details') {
    selectRotation(currentSelectedId, false);
  }

  if (showFeedback) {
    showToast(toastText);
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
  const prefSel = document.getElementById('prefSelect');
  if (prefSel) prefSel.value = nextId;
  selectRotation(nextId, false);
  renderRotationCardsFeed(currentFilteredList);
}

function focusHospitalBaseFromBtn(btn) {
  const hospName = btn.dataset.hosp;
  const h = HOSPITALS[hospName];
  if (h) {
    map.flyTo(h.coords, 13, { duration: 1.0 });
    if (activeHospitalMarkers[hospName]) {
      setTimeout(() => {
        activeHospitalMarkers[hospName].openPopup();
      }, 500);
    }
    if (window.innerWidth <= 768) {
      toggleMobileSidebar(false);
    }
    showToast(`Focused: ${hospName}`);
  }
}

/**
 * Opens Ground Truth Intel Profile Modal for a specific hospital.
 */
function openHospitalProfile(hospName) {
  const h = HOSPITALS[hospName];
  if (!h) return;

  const modal = document.getElementById('hospitalProfileModal');
  const nameEl = document.getElementById('modalHospName');
  const regBadge = document.getElementById('modalHospRegionBadge');
  const typeIcon = document.getElementById('modalHospTypeIcon');
  const body = document.getElementById('modalHospBody');
  if (!modal || !body) return;

  const isTertiary = h.type === 'Tertiary';
  nameEl.textContent = hospName;
  regBadge.textContent = `${h.region} • ${isTertiary ? '🏛️ Tertiary Teaching' : '🏥 DGH'}`;
  typeIcon.textContent = isTertiary ? '🏛️' : '🏥';

  // Identify all rotations in database that include this hospital
  const linked = ROTATIONS_DATA.filter(r => r.stages.some(s => s.hosp === hospName));

  body.innerHTML = `
    <div class="hosp-profile-summary">
      <b>${isTertiary ? '🏛️ Tertiary / Specialist Teaching Hospital' : '🏥 District General Hospital (DGH)'}</b>
      <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
        Key clinical training base in ${escapeHtml(h.region)}. Included in <b>${linked.length}</b> ST4 rotation schemes.
      </div>
    </div>

    <div class="hosp-intel-grid">
      <div class="hosp-intel-card">
        <div class="hosp-intel-card-header">📋 Electronic Records (EPR)</div>
        <div class="hosp-intel-card-body">${escapeHtml(h.epr || 'Electronic / Hybrid system')}</div>
      </div>
      <div class="hosp-intel-card">
        <div class="hosp-intel-card-header">🚗 Doctor Parking Policy</div>
        <div class="hosp-intel-card-body">${escapeHtml(h.parking || 'Staff parking permit scheme')}</div>
      </div>
      <div class="hosp-intel-card">
        <div class="hosp-intel-card-header">🚆 Rail &amp; Transit</div>
        <div class="hosp-intel-card-body">${escapeHtml(h.station || 'Local rail & bus connections')}</div>
      </div>
      <div class="hosp-intel-card">
        <div class="hosp-intel-card-header">🩺 Specialist Services</div>
        <div class="hosp-intel-card-body">${escapeHtml(h.highlights || 'General & emergency surgical services')}</div>
      </div>
    </div>

    <div class="hosp-rotations-box">
      <div class="hosp-rotations-title">Rotations that include this hospital (${linked.length}):</div>
      <div class="hosp-rot-pills">
        ${linked.map(r => `
          <button class="hosp-rot-btn" onclick="diveInFromPopup('${r.id}'); closeModal('hospitalProfileModal');">
            <b>${escapeHtml(r.code)}</b>: ${escapeHtml(r.title)} &rarr;
          </button>
        `).join('')}
      </div>
    </div>
  `;

  modal.style.display = 'flex';
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

  const prefSel = document.getElementById('prefSelect');
  if (prefSel && prefSel.value !== id) {
    prefSel.value = id;
  }
  
  if (window.location.hash !== '#' + id) {
    window.location.hash = id;
  }

  const welcomeMessage = document.getElementById('welcomeMessage');
  if (welcomeMessage) welcomeMessage.style.display = 'none';
  const listView = document.getElementById('listViewContainer');
  if (listView) listView.style.display = 'none';
  const inspectorCard = document.getElementById('inspectorCard');
  if (inspectorCard) inspectorCard.style.display = 'block';

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
    const hubQuery = (activeHubCoords && Array.isArray(activeHubCoords))
      ? `${activeHubCoords[0]},${activeHubCoords[1]}`
      : encodeURIComponent(activeHubName + ', UK');
    gmapsLink.href = `https://www.google.com/maps/search/?api=1&query=${hubQuery}`;
  }
  
  if (activeHub.alert && currentCommuteMode !== 'custom') {
    alertBox.style.display = 'block';
    alertBox.textContent = activeHub.alert;
  } else {
    alertBox.style.display = 'none';
  }

  const userData = getUserData(id);
  setRating(userData.rating, false);
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

    const intelBtn = document.createElement('button');
    intelBtn.className = "hospital-chip-btn";
    intelBtn.textContent = "ℹ️ Intel";
    intelBtn.title = "View Ground Truth Trust intel, parking, EPR, and transit";
    intelBtn.onclick = function() { openHospitalProfile(hName); };
    btnGroup.appendChild(intelBtn);

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
      const reg = rot.region || (hData ? hData.region : '');
      const mornMins = calcDrivingTimeMinutes(dist, reg, '0730');
      const eveMins = calcDrivingTimeMinutes(dist, reg, '1800');
      const activeMins = currentShiftTiming === '1800' ? eveMins : (currentShiftTiming === 'offpeak' ? calcDrivingTimeMinutes(dist, reg, 'offpeak') : mornMins);
      
      let timeClass = 'time-green';
      if (activeMins > 50) timeClass = 'time-red';
      else if (activeMins > 35) timeClass = 'time-amber';

      const originParam = (activeHubCoords && Array.isArray(activeHubCoords))
        ? `${activeHubCoords[0]},${activeHubCoords[1]}`
        : encodeURIComponent(activeHubName + ', UK');
      const destParam = (hData.coords && Array.isArray(hData.coords))
        ? `${hData.coords[0]},${hData.coords[1]}`
        : encodeURIComponent(hName + ', UK');

      const row = document.createElement('div');
      row.className = "commute-matrix-item";
      row.innerHTML = `
        <span class="commute-hosp-label">🏥 ${escapeHtml(hName)}</span>
        <div style="display:flex; align-items:center; gap:6px;">
          <span class="commute-time-pill ${timeClass}" title="07:30 handover arrival: ~${mornMins}m | 18:00 evening rush departure: ~${eveMins}m">
            ${dist} mi (🌅 ~${mornMins}m · 🌆 ~${eveMins}m)
          </span>
          <a href="https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}&travelmode=driving" target="_blank" style="font-size:0.68rem; color:var(--primary); text-decoration:none;" title="Verify route and live traffic in Google Maps">Directions ↗</a>
        </div>
      `;
      matrixContainer.appendChild(row);
    }
  });

  // Render Placement Timeline
  const timeline = document.getElementById('timelineContainer');
  timeline.innerHTML = "";

  rot.stages.forEach((stg, idx) => {
    const step = document.createElement('div');
    step.className = "timeline-step";
    step.style.cursor = 'pointer';
    step.title = `Click to locate ${stg.hosp} on map`;
    step.onclick = (e) => {
      if (e.target.tagName === 'A') return;
      const h = HOSPITALS[stg.hosp];
      if (h) {
        map.flyTo(h.coords, 13, { duration: 1.0 });
        if (activeHospitalMarkers[stg.hosp]) {
          setTimeout(() => {
            activeHospitalMarkers[stg.hosp].openPopup();
          }, 450);
        }
        if (window.innerWidth <= 768) {
          toggleMobileSidebar(false);
        }
      }
    };

    const h = HOSPITALS[stg.hosp];
    const hospMapQuery = (h && h.coords && Array.isArray(h.coords))
      ? `${h.coords[0]},${h.coords[1]}`
      : encodeURIComponent(stg.hosp + ', UK');

    step.innerHTML = `
      <div class="timeline-dot">${idx + 1}</div>
      <div class="timeline-content">
        <div class="timeline-stage">${escapeHtml(stg.stage)}</div>
        <div class="timeline-hosp">
          <span>${escapeHtml(stg.hosp)}</span>
          <a href="https://www.google.com/maps/search/?api=1&query=${hospMapQuery}" target="_blank" style="color:var(--primary); font-size:0.7rem; text-decoration:none;">Map ↗</a>
        </div>
        <div class="timeline-desc">${escapeHtml(stg.desc)}</div>
      </div>
    `;
    timeline.appendChild(step);
  });

  const commute = getRotationCommuteSummary(rot);

  document.getElementById('metricSites').textContent = uniqueHospBases.length;
  document.getElementById('metricDistance').textContent = `${commute.maxDist} mi`;

  // Training Balance Split (Tertiary vs DGH)
  const split = getRotationTrainingSplit(rot);
  const splitTertiaryText = document.getElementById('splitTertiaryText');
  const splitDghText = document.getElementById('splitDghText');
  const splitTertiaryFill = document.getElementById('splitTertiaryFill');
  const splitDghFill = document.getElementById('splitDghFill');
  if (splitTertiaryText && splitDghText && splitTertiaryFill && splitDghFill) {
    splitTertiaryText.textContent = `${split.tertiary}%`;
    splitDghText.textContent = `${split.dgh}%`;
    splitTertiaryFill.style.width = `${split.tertiary}%`;
    splitDghFill.style.width = `${split.dgh}%`;
  }

  const spreadBadge = document.getElementById('cardSpreadBadge');
  spreadBadge.textContent = `Max: ${commute.maxDist} mi`;
  if (commute.activeMins <= 35) {
    spreadBadge.className = 'badge badge-spread-low';
    spreadBadge.textContent = `🟢 Low Spread: ${commute.maxDist} mi (🌅 ~${commute.mornMins}m · 🌆 ~${commute.eveMins}m)`;
  } else if (commute.activeMins <= 50) {
    spreadBadge.className = 'badge badge-spread-med';
    spreadBadge.textContent = `🟡 Moderate: ${commute.maxDist} mi (🌅 ~${commute.mornMins}m · 🌆 ~${commute.eveMins}m)`;
  } else {
    spreadBadge.className = 'badge badge-spread-high';
    spreadBadge.textContent = `🔴 High Spread: ${commute.maxDist} mi (🌅 ~${commute.mornMins}m · 🌆 ~${commute.eveMins}m)`;
  }

  const modeEmoji = currentCommuteMode === 'transit' ? '🚆' : (currentCommuteMode === 'custom' ? '📍' : '🚗');
  document.getElementById('miniCardTitle').textContent = `${rot.title} (${rot.code})`;
  document.getElementById('miniCardSpread').textContent = `${commute.maxDist} mi (~${commute.activeMins}m)`;
  document.getElementById('miniCardSpread').className = `badge ${commute.badgeClass}`;
  document.getElementById('miniCardHub').innerHTML = `<span>${modeEmoji} <b>${escapeHtml(activeHubName)}</b> (${uniqueHospBases.length} Bases)</span> <span style="font-weight:700; color:var(--primary);">Details &rarr;</span>`;

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
    const hubDescText = currentCommuteMode === 'custom' ? 'Custom prospective living base' : (activeHub.desc || '');
    const homeMarker = L.marker(activeHubCoords, { icon: homeIcon, zIndexOffset: 2000 })
      .bindPopup(`<b>Base: ${escapeHtml(activeHubName)}</b><br><span style="font-size:0.8rem; color:var(--text-muted);">${escapeHtml(hubDescText)}</span>`);
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

  // Plot Active Placement Base Pins (Grouped by hospital so repeated placements show all stage numbers)
  const plottedHospitalPoints = [];
  const hospitalPlacements = new Map();
  activeHospitalMarkers = {};

  rot.stages.forEach((stg, idx) => {
    const hData = HOSPITALS[stg.hosp];
    if (hData) {
      allMapPoints.push(hData.coords);
      plottedHospitalPoints.push(hData.coords);

      if (!hospitalPlacements.has(stg.hosp)) {
        hospitalPlacements.set(stg.hosp, {
          hosp: stg.hosp,
          coords: hData.coords,
          region: hData.region || rot.region || '',
          stages: []
        });
      }
      hospitalPlacements.get(stg.hosp).stages.push({
        num: idx + 1,
        stage: stg.stage,
        desc: stg.desc
      });
    }
  });

  hospitalPlacements.forEach((data) => {
    const stageNumbers = data.stages.map(s => s.num);
    const isMulti = stageNumbers.length > 1;
    const labelText = stageNumbers.join(', ');

    let iconWidth = 28;
    if (stageNumbers.length === 2) {
      iconWidth = 38;
    } else if (stageNumbers.length >= 3) {
      iconWidth = 54;
    }

    const icon = L.divIcon({
      className: 'numbered-pin' + (isMulti ? ' multi-stage-pin' : ''),
      html: labelText,
      iconSize: [iconWidth, 28],
      iconAnchor: [Math.round(iconWidth / 2), 14]
    });

    let popupStagesHtml = '';
    if (isMulti) {
      popupStagesHtml = `
        <div style="font-size:0.75rem; color:var(--primary); font-weight:700; margin:4px 0 6px 0;">
          🔄 Rotated in ${stageNumbers.length} placements:
        </div>
        <div style="display:flex; flex-direction:column; gap:6px; border-top:1px solid var(--border-color); padding-top:6px;">
          ${data.stages.map(s => `
            <div style="font-size:0.78rem;">
              <span class="badge badge-code" style="padding:1px 5px; font-size:0.7rem;">Stage ${s.num}</span>
              <b>${escapeHtml(s.stage)}</b>
              <div style="color:var(--text-muted); font-size:0.73rem; margin-top:1px;">${escapeHtml(s.desc)}</div>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      const s = data.stages[0];
      popupStagesHtml = `
        <div style="border-top:1px solid var(--border-color); padding-top:6px; font-size:0.78rem;">
          <span class="badge badge-code" style="padding:1px 5px; font-size:0.7rem;">Stage ${s.num}</span>
          <b>${escapeHtml(s.stage)}</b>
          <div style="color:var(--text-muted); font-size:0.73rem; margin-top:1px;">${escapeHtml(s.desc)}</div>
        </div>
      `;
    }

    const hospObj = HOSPITALS[data.hosp];
    const isTertiary = hospObj && hospObj.type === 'Tertiary';
    const popupContent = `
      <div style="min-width:220px; max-width:290px;">
        <div style="font-weight:800; font-size:0.9rem; color:var(--text-main); margin-bottom:2px;">
          ${isTertiary ? '🏛️' : '🏥'} ${escapeHtml(data.hosp)}
        </div>
        <div style="font-size:0.72rem; color:var(--text-muted); margin-bottom:6px;">
          ${escapeHtml(data.region)} • ${isTertiary ? 'Tertiary Teaching' : 'DGH'}
        </div>
        ${popupStagesHtml}
        <div style="margin-top:8px; padding-top:6px; border-top:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; gap:6px;">
          <button class="hospital-chip-btn" style="font-size:0.72rem; padding:3px 7px;" onclick="openHospitalProfile('${escapeHtml(data.hosp)}');">ℹ️ Trust Intel</button>
          <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.hosp + ', UK')}" target="_blank" style="color:var(--primary); font-size:0.72rem; text-decoration:none;">Maps ↗</a>
        </div>
      </div>
    `;

    const m = L.marker(data.coords, { icon, zIndexOffset: 1500 + (isMulti ? 50 : 0) })
      .bindPopup(popupContent);
    activeRouteGroup.addLayer(m);
    activeHospitalMarkers[data.hosp] = m;
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

// 11. NATIONAL OVERVIEW MAP VIEW (Route lines mirror the currently filtered feed)
function renderAllPlacements({ fitView = true } = {}) {
  activeRouteGroup.clearLayers();
  backgroundHospitalsGroup.clearLayers();
  overviewLinesGroup.clearLayers();
  activeHospitalMarkers = {};

  const titleEl = document.getElementById('miniCardTitle');
  if (titleEl) titleEl.textContent = `All UK Placement Sites (${Object.keys(HOSPITALS).length} Bases)`;
  const spreadEl = document.getElementById('miniCardSpread');
  if (spreadEl) spreadEl.textContent = `${currentFilteredList.length} Rotations`;
  const hubEl = document.getElementById('miniCardHub');
  if (hubEl) hubEl.innerHTML = `<span>National Map View</span> <span style="font-weight:700; color:var(--primary);">Menu &rarr;</span>`;

  const allPoints = [];
  const linesByHospital = {};
  const regionColorsMap = (typeof REGION_COLORS !== 'undefined' ? REGION_COLORS : (window.REGION_COLORS || {}));

  // 11a. Dashed route lines for every rotation in the filtered feed (region, pills, search)
  if (showOverviewLines) {
    currentFilteredList.forEach(rot => {
      const coords = rot.stages.map(s => HOSPITALS[s.hosp] ? HOSPITALS[s.hosp].coords : null).filter(Boolean);
      if (coords.length > 1) {
        const regColor = regionColorsMap[rot.region] || "#0284c7";
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
    const regColor = regionColorsMap[h.region] || "#0284c7";

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

    const isTertiary = h.type === 'Tertiary';
    const m = L.marker(h.coords, { icon, zIndexOffset: 500 }).bindPopup(`
      <div class="overview-popup-title">${isTertiary ? '🏛️' : '🏥'} ${escapeHtml(hName)}</div>
      <div class="overview-popup-reg" style="color:${regColor};">${escapeHtml(h.region)} • ${isTertiary ? 'Tertiary Teaching' : 'DGH'}</div>
      <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:6px;">Included in <b>${linkedRotations.length}</b> rotation scheme(s).</div>
      <button class="hospital-chip-btn" style="width:100%; margin-bottom:8px; font-size:0.73rem; padding:4px 8px;" onclick="openHospitalProfile('${escapeHtml(hName)}');">ℹ️ Hospital Intel Profile</button>
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

  if (fitView && allPoints.length > 0) {
    if (activeRegionFilter === "ALL") {
      map.setView([52.8, -1.8], 6);
    } else {
      map.fitBounds(L.latLngBounds(allPoints), { padding: [50, 50], maxZoom: 10 });
    }
  }
}

function toggleOverviewLines() {
  showOverviewLines = !showOverviewLines;
  const btnMap = document.getElementById('btnMapLinesToggle');
  if (btnMap) {
    btnMap.textContent = showOverviewLines ? '🔀 Lines: ON' : '🔀 Lines: OFF';
    btnMap.classList.toggle('active-btn', showOverviewLines);
  }

  if (currentViewMode === 'list') {
    renderAllPlacements({ fitView: false });
  }
  showToast(`Rotation network lines: ${showOverviewLines ? 'Visible' : 'Hidden'}`);
}

function diveInFromPopup(id) {
  map.closePopup();
  openDetailsForRotation(id);
}

// 12. FILTER, SEARCH & SORT ENGINE
/**
 * Called after any user-driven filter/search/sort change. Re-filters the feed and,
 * if a rotation was being inspected, returns to the feed so the new results are visible.
 */
function refreshAfterFilterChange(fitView = false) {
  if (currentViewMode === 'details') {
    applyFiltersAndSearch();
    showListView();
  } else {
    applyFiltersAndSearch({ fitView });
  }
}

const QUICK_FILTER_PILLS = {
  ALL: 'pillAll', STARRED: 'pillStarred', TIER1: 'pillTier1',
  TIER2: 'pillTier2', TIER3: 'pillTier3', LOW_SPREAD: 'pillLowSpread'
};

function updateQuickFilterPills() {
  Object.entries(QUICK_FILTER_PILLS).forEach(([key, elId]) => {
    const el = document.getElementById(elId);
    if (el) el.classList.toggle('active', activeQuickFilter === key);
  });
}

function setQuickFilter(filterType) {
  activeQuickFilter = filterType;
  updateQuickFilterPills();
  refreshAfterFilterChange();
}

function filterRegion(reg) {
  activeRegionFilter = reg;
  refreshAfterFilterChange(true);
}

function handleSearch(term) {
  clearTimeout(searchDebounceTimer);
  const clearBtn = document.getElementById('btnSearchClear');
  if (clearBtn) {
    clearBtn.style.display = term ? 'block' : 'none';
  }
  searchDebounceTimer = setTimeout(() => {
    currentSearchTerm = term.toLowerCase().trim();
    refreshAfterFilterChange();
  }, 120);
}

function clearSearch() {
  const searchInput = document.getElementById('searchInput');
  const clearBtn = document.getElementById('btnSearchClear');
  if (searchInput) searchInput.value = '';
  if (clearBtn) clearBtn.style.display = 'none';
  currentSearchTerm = '';
  refreshAfterFilterChange();
  if (searchInput) searchInput.focus();
}

function handleSortChange(sortVal) {
  currentSortMode = sortVal;
  refreshAfterFilterChange();
}

function resetAllFilters() {
  activeRegionFilter = 'ALL';
  activeQuickFilter = 'ALL';
  currentSortMode = 'DEFAULT';
  currentSearchTerm = '';
  clearTimeout(searchDebounceTimer);

  const regSelect = document.getElementById('regionFilter');
  if (regSelect) regSelect.value = 'ALL';

  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) sortSelect.value = 'DEFAULT';

  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';
  const clearBtn = document.getElementById('btnSearchClear');
  if (clearBtn) clearBtn.style.display = 'none';

  updateQuickFilterPills();
  refreshAfterFilterChange(true);
  showToast("All filters reset");
}

function applyFiltersAndSearch({ fitView = false } = {}) {
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
    list = list.filter(r => getRotationMaxDistance(r) <= 25);
  }

  // Search Filter
  if (currentSearchTerm) {
    const q = currentSearchTerm;
    list = list.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.code.toLowerCase().includes(q) ||
      r.hubs.driver.name.toLowerCase().includes(q) ||
      r.hubs.transit.name.toLowerCase().includes(q) ||
      getUserData(r.id).notes.toLowerCase().includes(q) ||
      r.stages.some(s => (s.hosp || '').toLowerCase().includes(q) || (s.desc || '').toLowerCase().includes(q))
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
  const countBadge = document.getElementById('listCountBadge');
  if (countBadge) countBadge.textContent = list.length;

  populateDropdown(list);
  renderRotationCardsFeed(list);

  // Keep the national map's route lines in step with the feed
  if (currentViewMode === 'list') {
    renderAllPlacements({ fitView });
  }
}

// 13. SHORTLIST, REORDERING & ORIEL SUBMISSION COMPANION
function openShortlistModal() {
  renderShortlistModal();
  document.getElementById('shortlistModal').style.display = 'flex';
}

function updateOrielProgressBar() {
  const container = document.getElementById('orielProgressContainer');
  if (!container) return;
  const total = shortlistOrder.length;
  if (!total) {
    container.style.display = 'none';
    return;
  }
  container.style.display = 'block';
  let enteredCount = 0;
  shortlistOrder.forEach(id => {
    if (orielCheckedSet.has(id)) enteredCount++;
  });
  const pct = Math.round((enteredCount / total) * 100);
  const textEl = document.getElementById('orielProgressText');
  const barEl = document.getElementById('orielProgressBar');
  if (textEl) {
    textEl.innerHTML = `<b>🎯 Entered in Oriel:</b> ${enteredCount} of ${total} (${pct}%)`;
    if (enteredCount === total && total > 0) {
      textEl.innerHTML += ` <span style="color:var(--emerald); font-weight:800; margin-left:6px;">🎉 All Preferences Entered!</span>`;
    }
  }
  if (barEl) {
    barEl.style.width = `${pct}%`;
    barEl.style.backgroundColor = enteredCount === total ? 'var(--emerald)' : 'var(--primary)';
  }
}

function toggleOrielEntered(id) {
  if (orielCheckedSet.has(id)) {
    orielCheckedSet.delete(id);
  } else {
    orielCheckedSet.add(id);
  }
  localStorage.setItem('anaesth_oriel_checked', JSON.stringify([...orielCheckedSet]));
  updateOrielProgressBar();

  const card = document.getElementById(`shortlist-card-${id}`);
  if (card) {
    const isChecked = orielCheckedSet.has(id);
    card.classList.toggle('oriel-entered', isChecked);
    const labelSpan = card.querySelector('.oriel-check-label span');
    if (labelSpan) {
      labelSpan.textContent = isChecked ? '✓ Entered on Oriel' : 'Mark Entered';
    }
  }
}

function resetOrielChecks() {
  if (!orielCheckedSet.size) {
    showToast("No checkmarks to reset.");
    return;
  }
  if (confirm("Reset all 'Entered in Oriel' checkboxes?")) {
    orielCheckedSet.clear();
    localStorage.removeItem('anaesth_oriel_checked');
    renderShortlistModal();
    showToast("Oriel checkmarks reset");
  }
}

function copyOrielCode(code) {
  if (!code) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code)
      .then(() => showToast(`Copied code: "${code}"`))
      .catch(() => fallbackCopyText(code, `Copied code: "${code}"`));
  } else {
    fallbackCopyText(code, `Copied code: "${code}"`);
  }
}

function fallbackCopyText(text, successMsg) {
  const el = document.createElement('textarea');
  el.value = text;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
  showToast(successMsg);
}

function copyShortlistPlainText() {
  syncShortlistOrder();
  if (!shortlistOrder.length) {
    showToast("No rotations in shortlist to copy.");
    return;
  }
  let lines = ["ST4 Anaesthetics — Ranked Preferencing List for Oriel:"];
  lines.push("=".repeat(50));
  shortlistOrder.forEach((id, idx) => {
    const r = ROTATIONS_DATA.find(x => x.id === id);
    if (r) {
      const d = getUserData(id);
      const tierStr = d.tier && d.tier !== 'UNSET' ? ` [${d.tier}]` : '';
      const notesStr = d.notes ? ` (Notes: ${d.notes})` : '';
      lines.push(`${idx + 1}. [${r.code}] ${r.title} — ${r.region} (${r.places})${tierStr}${notesStr}`);
    }
  });
  lines.push("=".repeat(50));
  lines.push("Generated via ST4 Rotation Explorer (for personal records / Oriel entry)");

  const fullText = lines.join("\n");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(fullText)
      .then(() => showToast(`Copied ${shortlistOrder.length} ranked preferences to clipboard!`))
      .catch(() => fallbackCopyText(fullText, `Copied ${shortlistOrder.length} preferences!`));
  } else {
    fallbackCopyText(fullText, `Copied ${shortlistOrder.length} preferences!`);
  }
}

function printShortlistReport() {
  syncShortlistOrder();
  if (!shortlistOrder.length) {
    showToast("No rotations in shortlist to print.");
    return;
  }
  let printContainer = document.getElementById('printableShortlist');
  if (!printContainer) {
    printContainer = document.createElement('div');
    printContainer.id = 'printableShortlist';
    printContainer.className = 'print-only';
    document.body.appendChild(printContainer);
  }

  const nowStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  let totalPlaces = 0;
  let rowsHtml = '';

  shortlistOrder.forEach((id, idx) => {
    const r = ROTATIONS_DATA.find(x => x.id === id);
    if (!r) return;
    const d = getUserData(id);
    const commute = getRotationCommuteSummary(r);
    const bases = getRotationHospitalBases(r).join(', ');
    const isChecked = orielCheckedSet.has(id);

    const plMatch = r.places.match(/\d+/);
    if (plMatch) totalPlaces += parseInt(plMatch[0], 10);

    let tierLabel = '—';
    if (d.tier === 'TIER1') tierLabel = 'Tier 1';
    else if (d.tier === 'TIER2') tierLabel = 'Tier 2';
    else if (d.tier === 'TIER3') tierLabel = 'Tier 3';
    else if (d.tier === 'EXCLUDE') tierLabel = 'Excl';

    rowsHtml += `
      <tr>
        <td style="text-align:center; font-weight:bold; font-size:1.05rem; width:45px;">#${idx + 1}</td>
        <td style="text-align:center; width:50px;">
          <div style="width:16px; height:16px; border:2px solid #333; margin:0 auto; font-size:12px; line-height:16px; font-weight:bold;">
            ${isChecked ? '✓' : ''}
          </div>
        </td>
        <td style="font-weight:bold; font-family:monospace; font-size:0.9rem; width:150px;">${escapeHtml(r.code)}</td>
        <td>
          <div style="font-weight:bold;">${escapeHtml(r.title)}</div>
          <div style="font-size:0.75rem; color:#444;">${escapeHtml(r.region)} • <b>${escapeHtml(r.places)}</b></div>
        </td>
        <td style="font-size:0.75rem;">
          <div><b>Base:</b> ${escapeHtml(r.hubs.driver.name)}</div>
          <div style="color:#555;">${escapeHtml(bases)}</div>
        </td>
        <td style="font-size:0.75rem; text-align:center; white-space:nowrap; width:95px;">
          <b>${commute.maxDist} mi</b><br>
          🌅 ~${commute.mornMins}m<br>
          🌆 ~${commute.eveMins}m
        </td>
        <td style="font-size:0.75rem; width:130px;">
          <div><b>${tierLabel}</b> ${'★'.repeat(d.rating)}</div>
          ${d.notes ? `<div style="font-style:italic; font-size:0.72rem; color:#333; margin-top:2px;">"${escapeHtml(d.notes)}"</div>` : ''}
        </td>
      </tr>
    `;
  });

  printContainer.innerHTML = `
    <div style="padding:10px 0 8px 0; border-bottom:2px solid #000; margin-bottom:10px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-end;">
        <div>
          <h1 style="margin:0; font-size:1.4rem; color:#000;">ST4 Anaesthetics — Oriel Preferencing Checklist</h1>
          <div style="font-size:0.8rem; color:#444; margin-top:2px;">Personal Ranking &amp; Manual Entry Cheat Sheet • Printed ${nowStr}</div>
        </div>
        <div style="text-align:right; font-size:0.8rem; font-weight:bold;">
          <div>Shortlisted: ${shortlistOrder.length} Posts</div>
          <div>Total Places: ~${totalPlaces}</div>
        </div>
      </div>
      <div style="margin-top:6px; font-size:0.72rem; color:#666; font-style:italic;">
        Note: Oriel requires manual entry (no CSV import). Mark [✓] in the check column as you enter each post into Oriel.
      </div>
    </div>

    <table class="print-table">
      <thead>
        <tr style="background:#f2f2f2; border-bottom:2px solid #000; text-align:left;">
          <th style="padding:6px; text-align:center;">Rank</th>
          <th style="padding:6px; text-align:center;">Oriel ✓</th>
          <th style="padding:6px;">Oriel Code</th>
          <th style="padding:6px;">Programme &amp; Region</th>
          <th style="padding:6px;">Living Base &amp; Hospitals</th>
          <th style="padding:6px; text-align:center;">Commute</th>
          <th style="padding:6px;">Your Notes</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div style="margin-top:14px; padding-top:6px; border-top:1px solid #ccc; font-size:0.72rem; color:#666; display:flex; justify-content:space-between;">
      <span>Generated by ST4 Anaesthetics National Rotation &amp; Commute Explorer</span>
      <span>Double check all codes and click Save in Oriel before the deadline!</span>
    </div>
  `;

  window.print();
}

function renderShortlistModal() {
  const body = document.getElementById('shortlistModalBody');
  body.innerHTML = "";

  const starred = syncShortlistOrder()
    .map(id => ROTATIONS_DATA.find(r => r.id === id))
    .filter(Boolean);

  if (!starred.length) {
    body.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted);"><p style="font-weight:700;">No rotations shortlisted yet!</p><p style="font-size:0.8rem; margin-top:4px;">Give stars, assign a Tier, or add notes to build your shortlist.</p></div>`;
    updateOrielProgressBar();
    return;
  }

  starred.forEach((r, idx) => {
    const data = getUserData(r.id);
    const commute = getRotationCommuteSummary(r);
    const isEntered = orielCheckedSet.has(r.id);

    let tierBadgeHtml = '';
    if (data.tier === 'TIER1') tierBadgeHtml = '<span class="badge badge-tier-1">🟢 Tier 1</span>';
    else if (data.tier === 'TIER2') tierBadgeHtml = '<span class="badge badge-tier-2">🟡 Tier 2</span>';
    else if (data.tier === 'TIER3') tierBadgeHtml = '<span class="badge badge-tier-3">🔴 Tier 3</span>';
    else if (data.tier === 'EXCLUDE') tierBadgeHtml = '<span class="badge badge-tier-exclude">⚪ Excluded</span>';

    const div = document.createElement('div');
    div.className = `shortlist-item ${isEntered ? 'oriel-entered' : ''}`;
    div.id = `shortlist-card-${r.id}`;
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
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
          <span style="cursor:grab; font-size:1.05rem;" title="Drag card to reorder rank">☰</span>
          <span style="font-size:0.75rem; font-weight:800; color:var(--text-muted);">Rank:</span>
          <input type="number" class="rank-input" value="${idx + 1}" min="1" max="${starred.length}" onchange="changeRankInput(${idx}, this.value)" title="Change rank number">
          <strong class="oriel-code-badge" title="Oriel Track Code">${escapeHtml(r.code)}</strong>
          <button class="btn-copy-code" onclick="copyOrielCode('${escapeHtml(r.code)}')" title="Copy exact Oriel code to clipboard">📋 Copy</button>
          ${tierBadgeHtml}
          <span class="badge ${commute.badgeClass}" style="font-size:0.68rem;" title="Peak commute estimates">
            ${commute.maxDist} mi (🌅 ~${commute.mornMins}m · 🌆 ~${commute.eveMins}m)
          </span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <label class="oriel-check-label" title="Mark as entered into Oriel portal">
            <input type="checkbox" ${isEntered ? 'checked' : ''} onchange="toggleOrielEntered('${r.id}')">
            <span>${isEntered ? '✓ Entered on Oriel' : 'Mark Entered'}</span>
          </label>
          <span style="color:var(--amber); font-weight:800; font-size:0.85rem;">${'★'.repeat(data.rating)}</span>
          <div style="display:flex; gap:2px;">
            <button class="btn-step" style="padding:2px 6px; font-size:0.7rem;" onclick="moveShortlistItem(${idx}, -1)" aria-label="Move item up">▲</button>
            <button class="btn-step" style="padding:2px 6px; font-size:0.7rem;" onclick="moveShortlistItem(${idx}, 1)" aria-label="Move item down">▼</button>
          </div>
        </div>
      </div>
      <div style="font-weight:700; font-size:0.9rem; margin:6px 0 3px 0;">${escapeHtml(r.title)}</div>
      <div style="font-size:0.75rem; color:var(--text-muted);">
        <span>🏡 Driving Base: <b>${escapeHtml(r.hubs.driver.name)}</b></span> • 
        <span>Region: <b>${escapeHtml(r.region)}</b></span> • 
        <span>Places: <b>${escapeHtml(r.places)}</b></span>
      </div>
      ${data.notes ? `<div style="margin-top:6px; font-size:0.74rem; background:var(--bg-card-subtle); border:1px solid var(--border-color); color:var(--text-main); padding:6px 9px; border-radius:4px; font-style:italic;">"${escapeHtml(data.notes)}"</div>` : ''}
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; padding-top:6px; border-top:1px solid var(--border-color);">
        <button class="btn-step" style="font-size:0.7rem; padding:3px 8px;" onclick="closeModal('shortlistModal'); openDetailsForRotation('${r.id}');">View Details &amp; Hospitals &rarr;</button>
        <button style="border:none; background:none; color:#b91c1c; font-size:0.72rem; font-weight:700; cursor:pointer;" onclick="removeShortlistItem('${r.id}')">✕ Remove from Shortlist</button>
      </div>
    `;
    body.appendChild(div);
  });

  updateOrielProgressBar();
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
  const r = ROTATIONS_DATA.find(x => x.id === id);
  const label = r ? r.code : 'this rotation';
  if (!confirm(`Remove ${label} from your shortlist?\n\nThis clears its star rating, tier and notes.`)) return;

  shortlistOrder = shortlistOrder.filter(x => x !== id);
  localStorage.setItem('anaesth_shortlist_order', JSON.stringify(shortlistOrder));
  orielCheckedSet.delete(id);
  localStorage.setItem('anaesth_oriel_checked', JSON.stringify([...orielCheckedSet]));
  const d = getUserData(id);
  d.rating = 0;
  d.tier = 'UNSET';
  d.notes = "";
  localStorage.setItem(`anaesth_pref_${id}`, JSON.stringify(d));
  updateShortlistBadge();
  applyFiltersAndSearch();
  if (currentViewMode === 'details' && currentSelectedId === id) {
    selectRotation(id, false);
  }
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

  const rotations = compareList.map(id => ROTATIONS_DATA.find(x => x.id === id)).filter(Boolean);
  if (!rotations.length) return;

  const minDist = Math.min(...rotations.map(r => getRotationCommuteSummary(r).maxDist));

  let html = `
    <div class="compare-matrix-wrapper">
      <table class="compare-table">
        <thead>
          <tr>
            <th class="compare-label-th">Rotation Scheme</th>
            ${rotations.map(r => `
              <th class="compare-col-header">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
                  <span class="badge badge-code">${escapeHtml(r.code)}</span>
                  <button style="border:none; background:none; color:#b91c1c; font-size:0.75rem; font-weight:800; cursor:pointer;" onclick="toggleCompare('${r.id}'); renderCompareModal();">✕ Remove</button>
                </div>
                <div style="font-weight:800; font-size:0.88rem; margin-bottom:2px;">${escapeHtml(r.title)}</div>
                <div style="font-size:0.72rem; color:var(--text-muted); font-weight:normal;">${escapeHtml(r.region)} • <b>${escapeHtml(r.places)} places</b></div>
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="compare-label-th">Training Balance</td>
            ${rotations.map(r => {
              const split = getRotationTrainingSplit(r);
              return `
                <td>
                  <div style="font-weight:700; font-size:0.78rem; margin-bottom:4px;">
                    🏛️ ${split.tertiary}% Tertiary • 🏥 ${split.dgh}% DGH
                  </div>
                  <div class="split-bar-track" style="height:6px; margin:0;" title="${split.tertiary}% Tertiary / ${split.dgh}% DGH">
                    <div class="split-fill-tertiary" style="width:${split.tertiary}%;"></div>
                    <div class="split-fill-dgh" style="width:${split.dgh}%;"></div>
                  </div>
                </td>
              `;
            }).join('')}
          </tr>
          <tr>
            <td class="compare-label-th">Peak Commute Spread</td>
            ${rotations.map(r => {
              const commute = getRotationCommuteSummary(r);
              const isBest = commute.maxDist === minDist && rotations.length > 1;
              return `
                <td>
                  <div style="font-weight:800; font-size:0.85rem;">
                    ${commute.maxDist} mi ${isBest ? '<span class="compare-best-badge">⭐ Lowest Spread</span>' : ''}
                  </div>
                  <div style="font-size:0.74rem; color:var(--text-muted); margin-top:3px;">
                    🌅 ~${commute.mornMins}m @ 07:30<br>
                    🌆 ~${commute.eveMins}m @ 18:00
                  </div>
                </td>
              `;
            }).join('')}
          </tr>
          <tr>
            <td class="compare-label-th">Living Hub Base</td>
            ${rotations.map(r => `
              <td>
                <div style="font-size:0.76rem;">🚗 <b>Driver:</b> ${escapeHtml(r.hubs.driver.name)}</div>
                <div style="font-size:0.76rem; margin-top:3px; color:var(--text-muted);">🚆 <b>Transit:</b> ${escapeHtml(r.hubs.transit.name)}</div>
              </td>
            `).join('')}
          </tr>
          <tr>
            <td class="compare-label-th">Hospital Bases</td>
            ${rotations.map(r => {
              const bases = getRotationHospitalBases(r);
              return `
                <td>
                  <div style="display:flex; flex-direction:column; gap:3px;">
                    ${bases.map(b => {
                      const h = HOSPITALS[b];
                      const icon = (h && h.type === 'Tertiary') ? '🏛️' : '🏥';
                      return `<span style="font-size:0.74rem;">${icon} ${escapeHtml(b)}</span>`;
                    }).join('')}
                  </div>
                </td>
              `;
            }).join('')}
          </tr>
          <tr>
            <td class="compare-label-th">Rating &amp; Tier</td>
            ${rotations.map(r => {
              const data = getUserData(r.id);
              let tierBadge = '<span style="color:var(--text-muted); font-size:0.72rem;">Unset</span>';
              if (data.tier === 'TIER1') tierBadge = '<span class="badge badge-tier-1">🟢 Tier 1</span>';
              else if (data.tier === 'TIER2') tierBadge = '<span class="badge badge-tier-2">🟡 Tier 2</span>';
              else if (data.tier === 'TIER3') tierBadge = '<span class="badge badge-tier-3">🔴 Tier 3</span>';
              else if (data.tier === 'EXCLUDE') tierBadge = '<span class="badge badge-tier-exclude">⚪ Excluded</span>';
              return `
                <td>
                  <div style="display:flex; align-items:center; gap:6px;">
                    <span style="color:var(--amber); font-weight:800; font-size:0.85rem;">${'★'.repeat(data.rating) || '☆☆☆☆☆'}</span>
                    ${tierBadge}
                  </div>
                  ${data.notes ? `<div style="font-size:0.72rem; color:var(--text-muted); font-style:italic; margin-top:4px;">"${escapeHtml(data.notes)}"</div>` : ''}
                </td>
              `;
            }).join('')}
          </tr>
          <tr>
            <td class="compare-label-th">Action</td>
            ${rotations.map(r => `
              <td>
                <button class="btn-top btn-export" style="width:100%; justify-content:center; padding:5px 8px; font-size:0.73rem;" onclick="closeModal('compareModal'); openDetailsForRotation('${r.id}');">
                  Inspect Route &rarr;
                </button>
              </td>
            `).join('')}
          </tr>
        </tbody>
      </table>
    </div>
  `;
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
  if (window.innerWidth <= 768) toggleMobileSidebar(false);
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
      if (currentUserLocationMarker) {
        map.removeLayer(currentUserLocationMarker);
      }
      currentUserLocationMarker = L.circleMarker(latlng, {
        radius: 8,
        fillColor: '#0284c7',
        color: '#ffffff',
        weight: 2.5,
        opacity: 1,
        fillOpacity: 0.9
      }).bindPopup("<b>📍 Your Current Location</b>").addTo(map);
      currentUserLocationMarker.openPopup();
      if (window.innerWidth <= 768) toggleMobileSidebar(false);
    },
    () => showToast("Unable to access GPS location.")
  );
}

// 17. BACKUP, RESTORE & CSV EXPORT
function buildBackupObject() {
  const ratings = {};
  ROTATIONS_DATA.forEach(r => {
    const d = getUserData(r.id);
    if (isShortlisted(d)) ratings[r.id] = d;
  });
  return {
    version: 1,
    exportDate: new Date().toISOString(),
    ratings,
    shortlistOrder: syncShortlistOrder(),
    orielChecked: [...orielCheckedSet],
    customHomeBase
  };
}

function openSyncModal() {
  const modal = document.getElementById('syncModal');
  const area = document.getElementById('syncJsonArea');
  area.value = JSON.stringify(buildBackupObject(), null, 2);
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
    if (!confirm("Importing this backup will overwrite your current ratings, notes, and shortlist ranking. Do you want to proceed?")) {
      return;
    }
    applyParsedBackup(parsed);
    closeModal('syncModal');
  } catch(e) {
    showToast("Invalid code format");
  }
}

function downloadJsonBackup() {
  const jsonStr = JSON.stringify(buildBackupObject(), null, 2);
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
      if (!confirm(`Importing backup "${file.name}" will overwrite your current ratings, notes, and shortlist ranking. Do you want to proceed?`)) {
        return;
      }
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
  if (!parsed || typeof parsed !== 'object') {
    showToast("Invalid backup format");
    return;
  }
  if (parsed.ratings && typeof parsed.ratings === 'object') {
    Object.keys(parsed.ratings).forEach(k => {
      localStorage.setItem(`anaesth_pref_${k}`, JSON.stringify(parsed.ratings[k]));
    });
  }
  if (Array.isArray(parsed.shortlistOrder)) {
    shortlistOrder = parsed.shortlistOrder;
  }
  syncShortlistOrder();

  if (parsed.orielChecked && Array.isArray(parsed.orielChecked)) {
    orielCheckedSet = new Set(parsed.orielChecked);
    localStorage.setItem('anaesth_oriel_checked', JSON.stringify([...orielCheckedSet]));
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

function encodeBase64Utf8(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
    return String.fromCharCode(parseInt(p1, 16));
  }));
}

function decodeBase64Utf8(str) {
  return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}

function generatePartnerShareLink() {
  const backup = buildBackupObject();
  const count = Object.keys(backup.ratings || {}).length;
  if (count === 0 && !backup.customHomeBase) {
    showToast("No preferences or custom base to share yet.");
    return;
  }
  const jsonStr = JSON.stringify(backup);
  try {
    const encoded = encodeBase64Utf8(jsonStr);
    const base = window.location.href.split('#')[0];
    const shareUrl = `${base}#share=${encoded}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl)
        .then(() => showToast("🔗 Partner share link copied to clipboard!"))
        .catch(() => {
          prompt("Copy this partner share link:", shareUrl);
        });
    } else {
      prompt("Copy this partner share link:", shareUrl);
    }
  } catch(e) {
    showToast("Error creating share link");
  }
}

function checkForSharedLink() {
  const hash = window.location.hash;
  if (!hash || !hash.startsWith('#share=')) return;
  const rawEncoded = hash.substring(7);
  if (!rawEncoded) return;

  try {
    const jsonStr = decodeBase64Utf8(rawEncoded);
    const parsed = JSON.parse(jsonStr);
    
    if (parsed && (parsed.ratings || parsed.shortlistOrder)) {
      setTimeout(() => {
        const count = Object.keys(parsed.ratings || {}).length;
        if (confirm(`A partner has shared their Anaesthetics rotation preferences (${count} rotations shortlisted).\n\nWould you like to import their ratings, tiers, and notes? (This will update your current local preferences)`)) {
          applyParsedBackup(parsed);
          if (history.replaceState) {
            history.replaceState(null, '', window.location.pathname + window.location.search);
          } else {
            window.location.hash = '';
          }
          showToast("Partner preferences successfully loaded!");
        }
      }, 500);
    }
  } catch(e) {
    console.error("Failed to parse shared partner link", e);
  }
}

function formatCsvCell(val) {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  // Mitigate CSV Formula Injection: prefix formula-triggering characters with a single quote
  if (/^[=\+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

function exportPreferencesCSV() {
  let csv = "OrielCode,TrackTitle,Region,PlacesAvailable,TierPreference,DriverLivingHub,TransitLivingHub,HospitalBases,RatingStars,MorningDriveMins_0730,EveningDriveMins_1800,PersonalNotes\n";
  ROTATIONS_DATA.forEach(r => {
    const data = getUserData(r.id);
    const tierStr = data.tier || "UNSET";
    const commute = getRotationCommuteSummary(r);
    const basesStr = getRotationHospitalBases(r).join('; ');
    const row = [
      formatCsvCell(r.code),
      formatCsvCell(r.title),
      formatCsvCell(r.region),
      formatCsvCell(r.places),
      formatCsvCell(tierStr),
      formatCsvCell(r.hubs.driver.name),
      formatCsvCell(r.hubs.transit.name),
      formatCsvCell(basesStr),
      data.rating ?? 0,
      commute.mornMins ?? 0,
      commute.eveMins ?? 0,
      formatCsvCell(data.notes || "")
    ];
    csv += row.join(",") + "\n";
  });
  downloadBlob(csv, "ST4_Anaesthetics_All_Rotations.csv", "text/csv;charset=utf-8;");
  showToast("All rotations reference CSV downloaded!");
}

function exportShortlistCSV() {
  const orderedIds = syncShortlistOrder();
  if (!orderedIds.length) {
    showToast("No rotations in shortlist to export.");
    return;
  }
  let csv = "AssignedRank,EnteredInOriel,OrielCode,TrackTitle,Region,PlacesAvailable,TierPreference,DriverLivingHub,TransitLivingHub,HospitalBases,RatingStars,MorningDriveMins_0730,EveningDriveMins_1800,PersonalNotes\n";
  orderedIds.forEach((id, idx) => {
    const r = ROTATIONS_DATA.find(x => x.id === id);
    if (r) {
      const data = getUserData(r.id);
      const tierStr = data.tier || "UNSET";
      const commute = getRotationCommuteSummary(r);
      const basesStr = getRotationHospitalBases(r).join('; ');
      const isEntered = orielCheckedSet.has(id) ? "YES" : "NO";
      const row = [
        idx + 1,
        formatCsvCell(isEntered),
        formatCsvCell(r.code),
        formatCsvCell(r.title),
        formatCsvCell(r.region),
        formatCsvCell(r.places),
        formatCsvCell(tierStr),
        formatCsvCell(r.hubs.driver.name),
        formatCsvCell(r.hubs.transit.name),
        formatCsvCell(basesStr),
        data.rating ?? 0,
        commute.mornMins ?? 0,
        commute.eveMins ?? 0,
        formatCsvCell(data.notes || "")
      ];
      csv += row.join(",") + "\n";
    }
  });
  downloadBlob(csv, "ST4_Anaesthetics_MyShortlist_Ranked.csv", "text/csv;charset=utf-8;");
  showToast("Shortlist reference CSV downloaded!");
}

function downloadBlob(content, filename, mimeType) {
  // UTF-8 BOM for Microsoft Excel compatibility
  const blob = new Blob(['\uFEFF' + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
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
    closeModal('hospitalProfileModal');
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
  if (window.location.hash.startsWith('#share=')) {
    checkForSharedLink();
    return;
  }
  const hashId = window.location.hash.replace('#', '');
  if (hashId && hashId !== currentSelectedId && ROTATIONS_DATA.some(r => r.id === hashId)) {
    const prefSel = document.getElementById('prefSelect');
    if (prefSel) prefSel.value = hashId;
    selectRotation(hashId, false);
    setViewMode('details');
  } else if (!hashId) {
    showListView();
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
  setShiftTiming(currentShiftTiming, false);
  updateShortlistBadge();
  updateCompareBadge();
  updateCustomBaseUI();
  setupModalBackdrops();
  checkTipBannerStatus();

  // Check for 1-Click partner share link in URL hash
  if (window.location.hash.startsWith('#share=')) {
    checkForSharedLink();
    showListView();
  } else {
    const hashId = window.location.hash.replace('#', '');
    if (hashId && ROTATIONS_DATA.some(r => r.id === hashId)) {
      const prefSel = document.getElementById('prefSelect');
      if (prefSel) prefSel.value = hashId;
      selectRotation(hashId, false);
      setViewMode('details');
    } else {
      showListView();
    }
  }

  if (window.innerWidth <= 768) {
    toggleMobileSidebar(false);
  }
};
