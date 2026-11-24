/**
 * ============================================================================
 * UK Anaesthetics National Rotation & Commute Explorer - Application Engine
 * ============================================================================
 */

// 1. CONFIGURATION, MULTI-PROGRAMME REGISTRY & DEFENSIVE DATA INTEGRITY CHECK
const THEME_KEY = 'anaesth_theme_pref';
const REMEMBER_PROG_KEY = 'anaesth_remember_prog';
const LAST_PROG_KEY = 'anaesth_last_prog';

function getAvailableDatasets() {
  const datasets = (typeof window !== 'undefined' && window.PROGRAMME_DATASETS && typeof window.PROGRAMME_DATASETS === 'object')
    ? { ...window.PROGRAMME_DATASETS }
    : {};

  if (!datasets.st4) {
    const fallbackCfg = (typeof window !== 'undefined' && window.APP_CONFIG) || (typeof APP_CONFIG !== 'undefined' ? APP_CONFIG : {
      storagePrefix: 'st4_',
      appTitle: 'ST4 Anaesthetics National Rotation & Commute Explorer',
      cycleName: 'Aug 2026 / Feb 2027',
      defaultCenter: [52.8, -1.8],
      defaultZoom: 6
    });
    const fallbackHosps = (typeof window !== 'undefined' && window.HOSPITALS) || (typeof HOSPITALS !== 'undefined' ? HOSPITALS : undefined);
    const fallbackRots = (typeof window !== 'undefined' && window.ROTATIONS_DATA) || (typeof ROTATIONS_DATA !== 'undefined' ? ROTATIONS_DATA : undefined);
    const fallbackRegColors = (typeof window !== 'undefined' && window.REGION_COLORS) || (typeof REGION_COLORS !== 'undefined' ? REGION_COLORS : {});
    if (fallbackRots && fallbackHosps) {
      datasets.st4 = {
        id: 'st4',
        shortLabel: 'ST4',
        badgeLabel: 'ST4 – ST7',
        levelTitle: 'Higher Specialty Training',
        appTitle: fallbackCfg.appTitle || 'ST4 Anaesthetics National Rotation & Commute Explorer',
        headerTitle: 'ST4 Higher',
        headerSubtitle: 'National Oriel ST4–ST7 Rotations & Commute Analysis',
        referenceNote: 'Regional Anaesthesia Training Hospital (ST5–ST7 / reference site — no ST4 starting posts in this round).',
        storagePrefix: fallbackCfg.storagePrefix || 'st4_',
        cycleName: fallbackCfg.cycleName || 'Aug 2026 / Feb 2027',
        defaultCenter: fallbackCfg.defaultCenter || [52.8, -1.8],
        defaultZoom: fallbackCfg.defaultZoom || 6,
        hospitals: fallbackHosps,
        rotations: fallbackRots,
        regionColors: fallbackRegColors
      };
    }
  }
  return datasets;
}

function resolveDataset(progId) {
  const datasets = getAvailableDatasets();
  if (progId && datasets[progId]) return datasets[progId];
  return datasets.st4 || datasets.ct1 || Object.values(datasets)[0] || null;
}

let activeProgramme = 'st4';
let activeDataset = resolveDataset('st4');

if (!activeDataset || !Array.isArray(activeDataset.rotations) || !activeDataset.hospitals) {
  if (typeof alert === 'function') {
    alert("Error: data.js failed to load. Please verify that data.js is in the same directory as index.html.");
  }
  throw new Error("data.js failed to load");
}

activeProgramme = activeDataset.id || 'st4';
let activeHospitals = activeDataset.hospitals;
let activeRotations = activeDataset.rotations;
let activeRegionColors = activeDataset.regionColors || {};
let STORAGE_PREFIX = activeDataset.storagePrefix || `${activeProgramme}_`;
let KNOWN_IDS = new Set(activeRotations.map(r => r.id));
let DEFAULT_MAP_CENTER = activeDataset.defaultCenter || [52.8, -1.8];
let DEFAULT_MAP_ZOOM = activeDataset.defaultZoom || 6;

function prefersReducedMotion() {
  return Boolean(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
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
  const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return dist < 1 ? Math.round(dist * 10) / 10 : Math.round(dist);
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
if (typeof L === 'undefined') {
  document.body.insertAdjacentHTML(
    'afterbegin',
    '<div style="padding:20px;background:#fef2f2;color:#991b1b;font-weight:700;">Map library (Leaflet) failed to load. Please check your internet connection and reload.</div>'
  );
  throw new Error('Leaflet failed to load');
}

const map = L.map('map', { 
  zoomControl: true,
  minZoom: 5,
  maxZoom: 18,
  maxBounds: [
    [44.0, -19.0],  // Balanced UK & Irish perimeter allowing natural panning without excessive empty space
    [65.0, 15.0]
  ],
  maxBoundsViscosity: 0.2
}).setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM);

const osmCleanMuted = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  crossOrigin: true,
  className: 'map-tiles-muted',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const osmStandard = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  crossOrigin: true,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

const osmHot = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
  maxZoom: 19,
  crossOrigin: true,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, Tiles courtesy of <a href="https://www.hotosm.org/">HOT</a>'
});

const baseLayers = {
  "Clean Muted (Best for Routes)": osmCleanMuted,
  "Standard OSM (Road Colours)": osmStandard,
  "Soft Pastel (HOT)": osmHot
};
// Positioned at top-left underneath zoom controls to avoid collision with top-right action buttons
L.control.layers(baseLayers, null, { position: 'topleft' }).addTo(map);

// Distinct Leaflet Layer Groups for Modular Control
const overviewLinesGroup = L.layerGroup().addTo(map);
const hoverHighlightGroup = L.layerGroup().addTo(map);
const backgroundHospitalsGroup = L.layerGroup().addTo(map);
const activeRouteGroup = L.layerGroup().addTo(map);
let activeHospitalMarkers = {};

// Fast Lookup Maps
const hospitalRotationsMap = new Map();

// Safe LocalStorage Wrapper (Protects against Private Browsing / SecurityError / QuotaExceededError)
const safeStorage = {
  get(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  },
  set(key, val) {
    try { localStorage.setItem(key, val); return true; } catch (e) { return false; }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch (e) {}
  }
};

function safeGetStorageJson(key, defaultVal) {
  try {
    const raw = safeStorage.get(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

// KNOWN_IDS is dynamically maintained per active programme in applyDatasetBindings().
const VALID_TIERS = ['TIER1', 'TIER2', 'TIER3', 'EXCLUDE', 'UNSET'];

function normalizePref(p) {
  const obj = (p && typeof p === 'object' && !Array.isArray(p)) ? p : {};
  const r = Number.isInteger(obj.rating) ? Math.min(5, Math.max(0, obj.rating)) : 0;
  const t = VALID_TIERS.includes(obj.tier) ? obj.tier : 'UNSET';
  const n = typeof obj.notes === 'string' ? obj.notes.slice(0, 4000) : '';
  return { rating: r, notes: n, tier: t };
}

function normalizeCustomBase(b) {
  if (!b || typeof b !== 'object' || Array.isArray(b)) return null;
  if (!Array.isArray(b.coords) || b.coords.length !== 2) return null;
  const lat = Number(b.coords[0]);
  const lng = Number(b.coords[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  const name = (typeof b.name === 'string' && b.name.trim()) ? b.name.trim().slice(0, 80) : 'Custom Base';
  return { name, coords: [lat, lng] };
}

function migrateLegacyStorage() {
  try {
    if (STORAGE_PREFIX === 'anaesth_' || safeStorage.get(`${STORAGE_PREFIX}migrated_v1`)) return;
    activeRotations.forEach(r => {
      const oldPref = safeStorage.get(`anaesth_pref_${r.id}`);
      if (oldPref && !safeStorage.get(`${STORAGE_PREFIX}pref_${r.id}`)) {
        safeStorage.set(`${STORAGE_PREFIX}pref_${r.id}`, oldPref);
      }
    });
    ['shortlist_order', 'compare_list', 'oriel_checked'].forEach(k => {
      const raw = safeStorage.get(`anaesth_${k}`);
      if (raw && !safeStorage.get(`${STORAGE_PREFIX}${k}`)) {
        try {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) {
            const filtered = arr.filter(id => typeof id === 'string' && KNOWN_IDS.has(id));
            safeStorage.set(`${STORAGE_PREFIX}${k}`, JSON.stringify(filtered));
          }
        } catch (e) {}
      }
    });
    ['custom_home', 'partner_work', 'shift_timing', 'tip_dismissed'].forEach(k => {
      const val = safeStorage.get(`anaesth_${k}`);
      if (val && !safeStorage.get(`${STORAGE_PREFIX}${k}`)) {
        safeStorage.set(`${STORAGE_PREFIX}${k}`, val);
      }
    });
    safeStorage.set(`${STORAGE_PREFIX}migrated_v1`, '1');
  } catch (e) {}
}

// 4. THEME MANAGEMENT (Auto OS detection with manual override)
let currentThemeMode = safeStorage.get(THEME_KEY) || safeStorage.get(`${STORAGE_PREFIX}theme_pref`) || 'auto'; // 'auto', 'dark', 'light'

function getEffectiveTheme() {
  if (currentThemeMode === 'dark') return 'dark';
  if (currentThemeMode === 'light') return 'light';
  return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
}

function updateThemeButtonUI() {
  const buttons = [
    document.getElementById('btnThemeToggle'),
    document.getElementById('btnLandingThemeToggle')
  ].filter(Boolean);
  if (!buttons.length) return;

  const isDark = getEffectiveTheme() === 'dark';
  let label = 'Light';
  let title = 'Theme: Light Mode - Click to switch';
  if (currentThemeMode === 'auto') {
    label = 'Auto';
    title = `Theme: Auto (${isDark ? 'Dark' : 'Light'}) - Click to switch`;
  } else if (currentThemeMode === 'dark') {
    label = 'Dark';
    title = 'Theme: Dark Mode - Click to switch';
  }

  buttons.forEach(btn => {
    btn.textContent = label;
    btn.title = title;
  });
}

function applyTheme() {
  const effective = getEffectiveTheme();
  document.documentElement.setAttribute('data-theme', effective);
  updateThemeButtonUI();

  const metaTheme = document.getElementById('metaThemeColor');
  if (metaTheme) {
    metaTheme.setAttribute('content', effective === 'dark' ? '#191918' : '#FAF9F5');
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
  safeStorage.set(THEME_KEY, currentThemeMode);
  applyTheme();

  const label = currentThemeMode === 'auto'
    ? `Auto (${getEffectiveTheme() === 'dark' ? 'Dark' : 'Light'})`
    : (currentThemeMode === 'dark' ? 'Dark Mode' : 'Light Mode');
  showToast(`Theme: ${label}`);
}

// Real-time system theme preference change listener
if (window.matchMedia) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const onThemeChange = () => {
    if (currentThemeMode === 'auto') {
      applyTheme();
    }
  };
  if (mq.addEventListener) {
    mq.addEventListener('change', onThemeChange);
  } else if (mq.addListener) {
    mq.addListener(onThemeChange);
  }
}

// 4b. APPLICATION STATE
let currentSelectedId = null;
let currentCommuteMode = 'driver'; // 'driver', 'transit', or 'custom'
let currentShiftTiming = '0730'; // '0730' (Arrive 07:30), '1800' (Leave 18:00), or 'offpeak'
let currentViewMode = 'list';       // 'list' (feed + national map) or 'details' (inspector)
let showCommuteOverlay = false;    // Progressive disclosure: false = rotations-first, true = commute & bases
let currentInspectorTab = 'placements'; // 'placements', 'commute', 'intel', 'notes'
let activeQuickFilter = 'ALL';
let activeRegionFilter = 'ALL';
let currentSortMode = 'ALPHA_ASC';  // Default natural alphabetical order
let currentSearchTerm = '';
let currentFilteredList = [...activeRotations];
let overviewLinesMode = 'all'; // 'all', 'core', 'off'
let currentActiveRating = 0;
let searchDebounceTimer = null;
let currentUserLocationMarker = null;

// Inspector map layer separation
let currentBaseMarker = null;
let currentCommuteCircle = null;
let currentPartnerMarker = null;
let currentPartnerLine = null;
let currentPlottedHospitalPoints = [];
let currentActiveHubCoords = null;
let isMapLegendOpen = false;

let compareList = [];
let shortlistOrder = [];
let customHomeBase = null;
let partnerWorkBase = null;
let orielCheckedSet = new Set();

function loadPersistedState() {
  const rawTiming = safeStorage.get(`${STORAGE_PREFIX}shift_timing`);
  currentShiftTiming = ['0730', '1800', 'offpeak'].includes(rawTiming) ? rawTiming : '0730';

  const rawCompare = safeGetStorageJson(`${STORAGE_PREFIX}compare_list`, []);
  compareList = (Array.isArray(rawCompare) ? rawCompare : [])
    .filter((id, i, a) => typeof id === 'string' && KNOWN_IDS.has(id) && a.indexOf(id) === i)
    .slice(0, 3);

  const rawShortlist = safeGetStorageJson(`${STORAGE_PREFIX}shortlist_order`, []);
  shortlistOrder = (Array.isArray(rawShortlist) ? rawShortlist : [])
    .filter((id, i, a) => typeof id === 'string' && KNOWN_IDS.has(id) && a.indexOf(id) === i);

  customHomeBase = normalizeCustomBase(safeGetStorageJson(`${STORAGE_PREFIX}custom_home`, null));
  partnerWorkBase = normalizeCustomBase(safeGetStorageJson(`${STORAGE_PREFIX}partner_work`, null));

  const rawOriel = safeGetStorageJson(`${STORAGE_PREFIX}oriel_checked`, []);
  orielCheckedSet = new Set(
    (Array.isArray(rawOriel) ? rawOriel : []).filter(id => typeof id === 'string' && KNOWN_IDS.has(id))
  );

  const rawMode = safeStorage.get(`${STORAGE_PREFIX}commute_mode`);
  if (rawMode === 'custom' && customHomeBase && customHomeBase.coords) {
    currentCommuteMode = 'custom';
  } else if (rawMode === 'transit') {
    currentCommuteMode = 'transit';
  } else if (customHomeBase && customHomeBase.coords && !rawMode) {
    currentCommuteMode = 'custom';
  } else {
    currentCommuteMode = 'driver';
  }
}

migrateLegacyStorage();
loadPersistedState();

// 5. TOAST NOTIFICATIONS
let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  try {
    if (typeof t.showPopover === 'function' && (!t.matches || !t.matches(':popover-open'))) {
      t.showPopover();
    }
  } catch (e) {}
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.classList.remove('show');
    try {
      if (typeof t.hidePopover === 'function' && (!t.matches || t.matches(':popover-open'))) {
        t.hidePopover();
      }
    } catch (e) {}
  }, 2400);
}

// 5b. IN-MEMORY STATE CACHE FOR PREFERENCES (Eliminates localStorage thrashing)
const userPrefsCache = new Map();

function initUserPrefsCache() {
  userPrefsCache.clear();
  if (Array.isArray(activeRotations)) {
    activeRotations.forEach(r => {
      let pref = null;
      try {
        const raw = safeStorage.get(`${STORAGE_PREFIX}pref_${r.id}`);
        if (raw) pref = JSON.parse(raw);
      } catch (e) {}
      userPrefsCache.set(r.id, normalizePref(pref));
    });
  }
}

function getUserData(id) {
  if (!id || !KNOWN_IDS.has(id)) return { rating: 0, notes: "", tier: "UNSET" };
  let data = userPrefsCache.get(id);
  if (!data) {
    let parsed = null;
    try {
      const raw = safeStorage.get(`${STORAGE_PREFIX}pref_${id}`);
      if (raw) parsed = JSON.parse(raw);
    } catch (e) {}
    data = normalizePref(parsed);
    userPrefsCache.set(id, data);
  }
  return data;
}

function setUserData(id, partialUpdate) {
  if (!id || !KNOWN_IDS.has(id)) return;
  const current = getUserData(id);
  const updated = normalizePref({ ...current, ...partialUpdate });
  userPrefsCache.set(id, updated);
  safeStorage.set(`${STORAGE_PREFIX}pref_${id}`, JSON.stringify(updated));
  return updated;
}

// User preference check: returns true if the rotation has any rating, notes, or non-default tier (including EXCLUDE)
function hasUserPreference(d) {
  return !!d && (d.rating > 0 || (d.tier && d.tier !== 'UNSET') || (d.notes && d.notes.trim() !== ''));
}

// Shortlist membership: a rotation is shortlisted once it has a rating, any preference tier (excluding EXCLUDE), or notes.
function isShortlisted(d) {
  return !!d && d.tier !== 'EXCLUDE' && (d.rating > 0 || (d.tier && d.tier !== 'UNSET') || (d.notes && d.notes.trim() !== ''));
}

const TIER_PRIORITY = { TIER1: 1, TIER2: 2, TIER3: 3, UNSET: 4 };
function getTierPriority(tier) {
  return TIER_PRIORITY[tier] || 4;
}

function insertIntoShortlistByTier(list, id) {
  const targetPriority = getTierPriority(getUserData(id).tier);
  let insertAt = -1;
  for (let i = list.length - 1; i >= 0; i--) {
    if (getTierPriority(getUserData(list[i]).tier) === targetPriority) {
      insertAt = i + 1;
      break;
    }
  }
  if (insertAt === -1) {
    for (let i = list.length - 1; i >= 0; i--) {
      if (getTierPriority(getUserData(list[i]).tier) < targetPriority) {
        insertAt = i + 1;
        break;
      }
    }
  }
  if (insertAt === -1) {
    insertAt = 0;
  }
  list.splice(insertAt, 0, id);
}

/**
 * Reconciles the saved rank order with the current shortlist: drops rotations that
 * are no longer shortlisted and inserts newly shortlisted ones at the end of their tier group.
 */
function syncShortlistOrder() {
  const active = activeRotations.filter(r => isShortlisted(getUserData(r.id))).map(r => r.id);
  const activeSet = new Set(active);
  const ordered = (Array.isArray(shortlistOrder) ? shortlistOrder : []).filter((id, i, arr) => activeSet.has(id) && arr.indexOf(id) === i);
  active.forEach(id => {
    if (!ordered.includes(id)) {
      insertIntoShortlistByTier(ordered, id);
    }
  });
  shortlistOrder = ordered;
  safeStorage.set(`${STORAGE_PREFIX}shortlist_order`, JSON.stringify(shortlistOrder));
  return shortlistOrder;
}

// 6. ROTATION METRICS & DATA HELPERS
function isPoolRotation(rot) {
  return Boolean(rot && rot.isPool && Array.isArray(rot.stages) && rot.stages.length > 1) ||
    Boolean(rot && Array.isArray(rot.stages) && rot.stages.length > 2 && rot.stages.every(s => s.stage === 'CT1 - CT3'));
}

function formatPlacesLabel(places, compact = false) {
  if (places === null || places === undefined) return '';
  const str = String(places).trim();
  if (/^\d+$/.test(str)) {
    const n = parseInt(str, 10);
    if (compact) {
      return `${n} pl`;
    }
    return n === 1 ? '1 post' : `${n} posts`;
  }
  return str;
}


// 6a. Overview Line Styling & Categorical Palette
const TRACK_PALETTE = [
  '#0284c7', // Cobalt Blue
  '#e11d48', // Crimson Rose
  '#0d9488', // Deep Teal
  '#7c3aed', // Royal Purple
  '#ea580c', // Burnt Orange
  '#16a34a', // Emerald Green
  '#d97706', // Amber Gold
  '#db2777', // Magenta
  '#4f46e5', // Indigo
  '#0891b2'  // Cyan
];

const ROTATION_DASH_PATTERNS = [
  'none',             // Solid
  '7, 5',             // Crisp medium dash
  '2, 5',             // Distinct dotted line
  '12, 6',            // Long dash
  '9, 4, 2, 4',       // Dash-dot
  '14, 4, 3, 4, 3, 4' // Dash-double-dot
];

function hexToHsl(hex) {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return [200, 80, 50];
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return [200, 80, 50];
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h = h * 60;
  }
  return [h, s * 100, l * 100];
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const sNorm = Math.max(0, Math.min(100, s)) / 100;
  const lNorm = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;
  let r = 0, g = 0, b = 0;
  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
  const ri = Math.round((r + m) * 255);
  const gi = Math.round((g + m) * 255);
  const bi = Math.round((b + m) * 255);
  return `#${((1 << 24) + (ri << 16) + (gi << 8) + bi).toString(16).slice(1)}`;
}

function getGeographicPoolGroupsForRegion(region) {
  const naturalCompare = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare;
  const regionPools = (Array.isArray(activeRotations) ? activeRotations : [])
    .filter(r => r.region === region && isPoolRotation(r))
    .slice()
    .sort((a, b) => naturalCompare(a.code || a.title, b.code || b.title));

  const groups = [];
  regionPools.forEach(pool => {
    const bases = computeRotationHospitalBases(pool);
    const baseSet = new Set(bases);
    let matchedGroup = null;
    for (const grp of groups) {
      let intersection = 0;
      baseSet.forEach(h => { if (grp.hospSet.has(h)) intersection++; });
      const union = grp.hospSet.size + baseSet.size - intersection;
      const jaccard = union > 0 ? intersection / union : 1;
      if (jaccard >= 0.75) {
        matchedGroup = grp;
        break;
      }
    }
    if (matchedGroup) {
      matchedGroup.rotations.push(pool);
      baseSet.forEach(h => matchedGroup.hospSet.add(h));
    } else {
      groups.push({
        rotations: [pool],
        hospSet: new Set(bases)
      });
    }
  });
  return groups;
}

function computeRotationLineStyle(rot) {
  const regColor = (activeRegionColors && activeRegionColors[rot.region]) || (typeof window !== 'undefined' && window.REGION_COLORS && window.REGION_COLORS[rot.region]) || "#0284c7";
  if (isPoolRotation(rot)) {
    const poolGroups = getGeographicPoolGroupsForRegion(rot.region);
    const numGroups = poolGroups.length;
    let color = regColor;
    if (numGroups >= 2) {
      const groupIdx = Math.max(0, poolGroups.findIndex(g => g.rotations.some(r => r.id === rot.id)));
      const t = (groupIdx / (numGroups - 1)) - 0.5;
      const hueShift = -t * 24;
      const lightShift = t * 22;
      const [h, s, l] = hexToHsl(regColor);
      color = hslToHex(h + hueShift, s, Math.max(26, Math.min(72, l + lightShift)));
    }
    return {
      color,
      baseColor: color,
      dashPattern: '3, 6',
      regColor,
      isDashed: true
    };
  }
  const regionRots = (Array.isArray(activeRotations) ? activeRotations : []).filter(r => r.region === rot.region && !isPoolRotation(r));

  // Determine starting hospital in this region to shift color temperature
  const startHosp = (rot.stages && rot.stages[0] && rot.stages[0].hosp) || '';
  const hospSet = [];
  regionRots.forEach(r => {
    const h = (r.stages && r.stages[0] && r.stages[0].hosp) || '';
    if (h && !hospSet.includes(h)) hospSet.push(h);
  });
  hospSet.sort();

  const hospIdx = Math.max(0, hospSet.indexOf(startHosp));
  const sameHospRots = regionRots.filter(r => ((r.stages && r.stages[0] && r.stages[0].hosp) || '') === startHosp);
  const rotInHospIdx = Math.max(0, sameHospRots.findIndex(r => r.id === rot.id));

  // Shift hue across [-28deg, +28deg] based on starting hospital anchor
  const numHosps = Math.max(1, hospSet.length);
  const hueShift = numHosps > 1 ? ((hospIdx / (numHosps - 1)) - 0.5) * 56 : 0;

  // Slight lightness variation for tracks originating from the same starting hospital
  const lightShift = sameHospRots.length > 1 ? ((rotInHospIdx / (sameHospRots.length - 1)) - 0.5) * 16 : 0;

  const [h, s, l] = hexToHsl(regColor);
  const color = hslToHex(h + hueShift, s, l + lightShift);

  const dashPattern = ROTATION_DASH_PATTERNS[rotInHospIdx % ROTATION_DASH_PATTERNS.length];

  return {
    color,
    baseColor: color,
    dashPattern,
    regColor,
    isDashed: dashPattern !== 'none'
  };
}

function computeRotationHospitalBases(rot) {
  if (!rot || !rot.stages) return [];
  const unique = [];
  rot.stages.forEach(s => {
    if (s.hosp && !unique.includes(s.hosp)) {
      unique.push(s.hosp);
    }
  });
  return unique;
}

function computeRotationTrainingSplit(rot) {
  if (!rot || !rot.stages || !rot.stages.length) {
    return { tertiary: 50, dgh: 50, tertiaryCount: 0, dghCount: 0 };
  }
  let tertiaryWeight = 0;
  let dghWeight = 0;
  let tertiaryCount = 0;
  let dghCount = 0;

  if (isPoolRotation(rot)) {
    const bases = computeRotationHospitalBases(rot);
    bases.forEach(hName => {
      const h = activeHospitals[hName];
      if (h && h.type === 'Tertiary') {
        tertiaryWeight += 1;
        tertiaryCount++;
      } else {
        dghWeight += 1;
        dghCount++;
      }
    });
  } else {
    const monthNames = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
    const stageLabelCounts = new Map();
    rot.stages.forEach(s => {
      const label = String(s.stage || '').trim();
      stageLabelCounts.set(label, (stageLabelCounts.get(label) || 0) + 1);
    });

    rot.stages.forEach(stg => {
      const h = activeHospitals[stg.hosp];
      const isTertiary = h && h.type === 'Tertiary';
      let months = 6;
      const stageText = String(stg.stage || '').trim();
      const descText = String(stg.desc || '');

      const stgMonthMatch = stageText.match(/\b(\d+)\s*(?:m|mo|mths?|months?)\b/i);
      const stgYearMatch = stageText.match(/\b(\d+)\s*(?:yr|yrs|years?)\b/i);
      const spanMatch = stageText.match(/\b(?:ST|CT)\s*([1-7])\s*(?:[-–]|to)\s*(?:ST|CT)?\s*([1-7])\b/i);
      const slashMatch = stageText.match(/\b(ST|CT)\s*([1-7])\s*\/\s*(?:ST|CT)?\s*([1-7])\b/i);
      const calMatch = stageText.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*[-–]?\s*(\d{2})\s*[-–]\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*[-–]?\s*(\d{2})\b/i);
      const singleGradeMatch = stageText.match(/^(?:ST([4-7])|CT([1-3]))\b/i);

      if (stgMonthMatch) {
        const parsed = parseInt(stgMonthMatch[1], 10);
        if (parsed > 0 && parsed <= 48) months = parsed;
      } else if (stgYearMatch) {
        const parsed = parseInt(stgYearMatch[1], 10) * 12;
        if (parsed > 0 && parsed <= 48) months = parsed;
      } else if (spanMatch) {
        const start = parseInt(spanMatch[1], 10);
        const end = parseInt(spanMatch[2], 10);
        if (end >= start) months = (end - start + 1) * 12;
      } else if (slashMatch) {
        const prefix = slashMatch[1].toUpperCase();
        const g1 = slashMatch[2];
        const g2 = slashMatch[3];
        const gradeRegex = new RegExp(`\\b${prefix}\\s*(?:${g1}|${g2})\\b`, 'i');
        const hasOtherStage = rot.stages.some(other => other !== stg && gradeRegex.test(String(other.stage || '')));
        months = hasOtherStage ? 6 : 12;
      } else if (calMatch) {
        const m1 = monthNames[calMatch[1].toLowerCase()];
        const y1 = parseInt(calMatch[2], 10);
        const m2 = monthNames[calMatch[3].toLowerCase()];
        const y2 = parseInt(calMatch[4], 10);
        const diff = (y2 - y1) * 12 + (m2 - m1);
        if (diff > 0 && diff <= 48) months = diff;
      } else if (singleGradeMatch) {
        const gradeToken = singleGradeMatch[0].toUpperCase();
        const gradeRegex = new RegExp(`\\b${gradeToken}\\b`, 'i');
        const occurrences = rot.stages.filter(other => gradeRegex.test(String(other.stage || ''))).length;
        months = occurrences === 1 ? 12 : 6;
      } else {
        const descMonthMatches = Array.from(descText.matchAll(/\b(\d+)\s*(?:m|mo|mths?|months?)\b/gi));
        if (descMonthMatches.length > 0) {
          const sum = descMonthMatches.reduce((acc, m) => acc + (parseInt(m[1], 10) || 0), 0);
          if (sum > 0 && sum <= 48) months = sum;
        } else {
          const descYearMatch = descText.match(/\b(\d+)\s*(?:yr|yrs|years?)\b/i);
          if (descYearMatch) {
            const parsed = parseInt(descYearMatch[1], 10) * 12;
            if (parsed > 0 && parsed <= 48) months = parsed;
          }
        }
      }

      // Prevent trust-alternative rows with identical year/multi-year labels from double-counting
      const dupCount = stageLabelCounts.get(stageText) || 1;
      if (dupCount > 1 && months >= 12) {
        months = months / dupCount;
      }

      if (isTertiary) {
        tertiaryWeight += months;
        tertiaryCount++;
      } else {
        dghWeight += months;
        dghCount++;
      }
    });
  }

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

/**
 * Calculate maximum pairwise distance between hospital stages in a rotation.
 * Returns 0 if rotation has fewer than 2 distinct stages or coordinates.
 */
function computeIntrinsicSpread(rot) {
  if (!rot || !rot.stages || !Array.isArray(rot.stages) || rot.stages.length < 2) return 0;
  if (!activeHospitals) return 0;
  const coords = rot.stages.map(s => activeHospitals[s.hosp] ? activeHospitals[s.hosp].coords : null).filter(Boolean);
  if (coords.length < 2) return 0;

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
 * Startup Data Normalization & Pre-Computation.
 * Runs once over ROTATIONS_DATA and attaches immutable metadata to rot._meta.
 */
function initRotationMetadata() {
  if (!Array.isArray(activeRotations)) return;

  const naturalCompare = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare;
  activeRotations.sort((a, b) => naturalCompare(a.code || a.title, b.code || b.title));

  hospitalRotationsMap.clear();
  if (activeHospitals) {
    Object.keys(activeHospitals).forEach(hName => {
      hospitalRotationsMap.set(hName, []);
    });
  }
  if (typeof regionCategoricalStyleCache !== 'undefined') {
    regionCategoricalStyleCache.clear();
  }
  if (typeof filteredListCategoricalCache !== 'undefined') {
    filteredListCategoricalCache = { ref: null, map: null };
  }

  activeRotations.forEach(rot => {
    (rot.stages || []).forEach(stg => {
      if (stg.hosp) {
        if (!hospitalRotationsMap.has(stg.hosp)) {
          hospitalRotationsMap.set(stg.hosp, []);
        }
        const arr = hospitalRotationsMap.get(stg.hosp);
        if (!arr.includes(rot)) {
          arr.push(rot);
        }
      }
    });

    const bases = computeRotationHospitalBases(rot);
    const split = computeRotationTrainingSplit(rot);
    const lineStyle = computeRotationLineStyle(rot);
    const placesNum = parseInt(rot.places, 10) || 0;
    const intrinsicSpread = computeIntrinsicSpread(rot);

    const driverHub = (rot.hubs && rot.hubs.driver && rot.hubs.driver.name) || '';
    const transitHub = (rot.hubs && rot.hubs.transit && rot.hubs.transit.name) || '';
    const stagesText = (rot.stages || []).map(s => `${s.hosp || ''} ${s.stage || ''} ${s.desc || ''}`).join(' ');

    const searchParts = [
      rot.title || '',
      rot.code || '',
      rot.region || '',
      driverHub,
      transitHub,
      stagesText
    ];
    const searchText = searchParts.join(' ').toLowerCase();

    rot._meta = {
      bases,
      split,
      lineStyle,
      placesNum,
      intrinsicSpread,
      searchText
    };
  });

  currentFilteredList = [...activeRotations];
  const countBadge = document.getElementById('listCountBadge');
  if (countBadge) countBadge.textContent = activeRotations.length;
}

function getRotationHospitalBases(rot) {
  if (!rot) return [];
  if (rot._meta && rot._meta.bases) return rot._meta.bases;
  return computeRotationHospitalBases(rot);
}

function getRotationTrainingSplit(rot) {
  if (!rot) return { tertiary: 50, dgh: 50, tertiaryCount: 0, dghCount: 0 };
  if (rot._meta && rot._meta.split) return rot._meta.split;
  return computeRotationTrainingSplit(rot);
}

// Categorical line styling cache: region maps are static; filtered lists are memoized by reference
const regionCategoricalStyleCache = new Map();
let filteredListCategoricalCache = { ref: null, map: null };

function buildCategoricalStylesMap(targetList) {
  const hospitalGroups = new Map();
  targetList.forEach(r => {
    const h = (r.stages && r.stages[0] && r.stages[0].hosp) || 'Unknown';
    if (!hospitalGroups.has(h)) hospitalGroups.set(h, []);
    hospitalGroups.get(h).push(r);
  });

  const sortedHospNames = Array.from(hospitalGroups.keys()).sort();
  let assignedIndex = 0;
  const styleMap = new Map();

  for (const hName of sortedHospNames) {
    const rotsInHosp = hospitalGroups.get(hName).slice();
    rotsInHosp.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    for (let i = 0; i < rotsInHosp.length; i++) {
      const color = TRACK_PALETTE[assignedIndex % TRACK_PALETTE.length];
      const dashPattern = ROTATION_DASH_PATTERNS[i % ROTATION_DASH_PATTERNS.length];
      styleMap.set(rotsInHosp[i].id, {
        color,
        baseColor: color,
        dashPattern,
        regColor: color,
        isDashed: dashPattern !== 'none'
      });
      assignedIndex++;
    }
  }
  return styleMap;
}

function getRotationLineStyle(rot) {
  if (!rot) return { color: '#0284c7', baseColor: '#0284c7', dashPattern: 'none', regColor: '#0284c7', isDashed: false };
  if (isPoolRotation(rot)) {
    return (rot._meta && rot._meta.lineStyle) ? rot._meta.lineStyle : computeRotationLineStyle(rot);
  }

  // Use distinct high-contrast categorical palette when filtering to a single region or when filtered results <= 20
  const useCategorical = (activeRegionFilter !== 'ALL') || (Array.isArray(currentFilteredList) && currentFilteredList.length <= 20);

  if (useCategorical) {
    let styleMap;
    if (activeRegionFilter !== 'ALL') {
      const region = rot.region || activeRegionFilter;
      styleMap = regionCategoricalStyleCache.get(region);
      if (!styleMap) {
        const targetList = (Array.isArray(activeRotations) ? activeRotations : []).filter(r => r.region === region && !isPoolRotation(r));
        styleMap = buildCategoricalStylesMap(targetList);
        regionCategoricalStyleCache.set(region, styleMap);
      }
    } else {
      if (filteredListCategoricalCache.ref !== currentFilteredList || !filteredListCategoricalCache.map) {
        const targetList = Array.isArray(currentFilteredList) ? currentFilteredList.filter(r => !isPoolRotation(r)) : [];
        filteredListCategoricalCache = {
          ref: currentFilteredList,
          map: buildCategoricalStylesMap(targetList)
        };
      }
      styleMap = filteredListCategoricalCache.map;
    }

    if (styleMap && styleMap.has(rot.id)) {
      return styleMap.get(rot.id);
    }
  }

  // National view with activeRegionFilter === 'ALL' and > 20 rotations: anchor hue-shifted regional colors
  return (rot._meta && rot._meta.lineStyle) ? rot._meta.lineStyle : computeRotationLineStyle(rot);
}

/**
 * Filter rotation stages for the National Overview map according to overviewLinesMode.
 * - 'all': all chronological stage transitions
 * - 'core': ignores short 3m subspecialty module hops (/\b3\s*m\b/i) and tertiary neuro/cardiac spokes
 *           when rotation has >= 3 stages, connecting only the primary 6-12m anchor hospitals!
 * - 'off': empty list (lines hidden)
 */
function getOverviewStages(rot, mode = overviewLinesMode) {
  if (!rot || !rot.stages) return [];
  if (mode === 'off') return [];
  if (mode === 'all') return rot.stages;

  if (rot.stages.length >= 3) {
    const startHosp = rot.stages[0].hosp;
    const isSpecialtyHop = (s, idx) => {
      if (idx === 0 || s.hosp === startHosp) return false; // Never filter the rotation's primary anchor hospital
      const fullText = `${s.stage || ''} ${s.desc || ''}`;
      const is3m = /\b3\s*m(?:onths?)?\b/i.test(fullText);
      const hosp = activeHospitals[s.hosp];
      const isTertiary = hosp && hosp.type === 'Tertiary';
      const isSubspecialtyBlock = /\b(neuro\w*|cardiac|cardiothorac\w*|paed\w*|ophthalm\w*|burns|plastics|trauma\s+module|module)\b/i.test(fullText) ||
                                  /\b(papworth|barts|queen square|brompton|walton|moorfields|stanmore)\b/i.test(s.hosp || '');
      return is3m || (isTertiary && isSubspecialtyBlock);
    };

    const core = rot.stages.filter((s, idx) => !isSpecialtyHop(s, idx));
    if (core.length >= 2) return core;
    if (core.length === 1) return [core[0], core[0]];
  }
  return rot.stages;
}

function buildCorridorUsageRegistry(rotationsList) {
  const registry = new Map();
  rotationsList.forEach(rot => {
    if (isPoolRotation(rot)) return;
    const stages = getOverviewStages(rot);
    const seenPairs = new Set();
    for (let i = 0; i < stages.length - 1; i++) {
      const h1 = stages[i].hosp;
      const h2 = stages[i + 1].hosp;
      if (h1 && h2 && h1 !== h2 && activeHospitals[h1] && activeHospitals[h2]) {
        // Skip tiny intra-campus micro-segments (< 0.6 miles) on the National Overview map
        const d = calcDistanceMiles(activeHospitals[h1].coords, activeHospitals[h2].coords);
        if (d < 0.6) continue;

        // Deduplicate undirected stage transitions within each rotation
        const key = h1 < h2 ? `${h1}:::${h2}` : `${h2}:::${h1}`;
        if (seenPairs.has(key)) continue;
        seenPairs.add(key);

        if (!registry.has(key)) registry.set(key, []);
        const list = registry.get(key);
        if (!list.includes(rot.id)) {
          list.push(rot.id);
        }
      }
    }
  });
  return registry;
}

function generateCurvedSegmentPoints(coordA, coordB, offsetMultiplier, numPoints = 8) {
  const [lat1, lng1] = coordA;
  const [lat2, lng2] = coordB;

  if (Math.abs(lat1 - lat2) < 0.0001 && Math.abs(lng1 - lng2) < 0.0001) {
    return [[lat1, lng1]];
  }

  const midLat = (lat1 + lat2) / 2.0;
  const midLng = (lng1 + lng2) / 2.0;

  const cosLat = 0.61; // Average UK latitude correction
  const dLat = lat2 - lat1;
  const dLng = (lng2 - lng1) * cosLat;
  const segDist = Math.sqrt(dLat * dLat + dLng * dLng);

  if (segDist < 0.001) {
    return [[lat1, lng1], [lat2, lng2]];
  }

  const normLat = -dLng / segDist;
  const normLng = dLat / segDist;

  const baseSpacing = Math.min(0.035, Math.max(0.007, segDist * 0.16));
  const offsetDist = offsetMultiplier * baseSpacing;

  const ctrlLat = midLat + normLat * offsetDist;
  const ctrlLng = midLng + (normLng / cosLat) * offsetDist;

  const points = [];
  for (let step = 0; step <= numPoints; step++) {
    const t = step / numPoints;
    const invT = 1.0 - t;
    const bLat = invT * invT * lat1 + 2.0 * invT * t * ctrlLat + t * t * lat2;
    const bLng = invT * invT * lng1 + 2.0 * invT * t * ctrlLng + t * t * lng2;
    points.push([bLat, bLng]);
  }
  return points;
}

function generatePoolSpokeSegments(rot) {
  if (!rot || !rot.stages) return [];
  const bases = getRotationHospitalBases(rot);
  if (bases.length < 2) return [];
  const anchorHosp = bases.find(h => activeHospitals[h] && activeHospitals[h].type === 'Tertiary') || bases[0];
  const anchorCoords = activeHospitals[anchorHosp] && activeHospitals[anchorHosp].coords;
  if (!anchorCoords) return [];
  const segments = [];
  bases.forEach(hName => {
    if (hName === anchorHosp) return;
    const hCoords = activeHospitals[hName] && activeHospitals[hName].coords;
    if (!hCoords) return;
    const dist = calcDistanceMiles(anchorCoords, hCoords);
    if (dist < 0.3) return;
    segments.push(generateCurvedSegmentPoints(anchorCoords, hCoords, 0.14, 8));
  });
  return segments;
}

function generateRotationCurvedPath(rot, corridorRegistry) {
  const stages = getOverviewStages(rot);
  const segments = [];
  const seenPairs = new Set();

  for (let i = 0; i < stages.length - 1; i++) {
    const h1 = stages[i].hosp;
    const h2 = stages[i + 1].hosp;
    if (!h1 || !h2 || h1 === h2 || !activeHospitals[h1] || !activeHospitals[h2]) continue;

    const coord1 = activeHospitals[h1].coords;
    const coord2 = activeHospitals[h2].coords;
    if (!coord1 || !coord2) continue;

    // Skip tiny intra-campus micro-segments (< 0.6 miles, e.g. Addenbrooke's <-> Royal Papworth)
    const dist = calcDistanceMiles(coord1, coord2);
    if (dist < 0.6) continue;

    // Deduplicate undirected stage transitions within each rotation (seenPairs)
    const key = h1 < h2 ? `${h1}:::${h2}` : `${h2}:::${h1}`;
    if (seenPairs.has(key)) continue;
    seenPairs.add(key);

    const corridorUsers = corridorRegistry.get(key) || [rot.id];
    const totalUsers = corridorUsers.length;
    const userSlot = corridorUsers.indexOf(rot.id);

    let multiplier = 0;
    if (totalUsers > 1) {
      multiplier = userSlot - (totalUsers - 1) / 2.0;
      if (h1 > h2) multiplier = -multiplier;
    } else {
      multiplier = 0.25;
      if (h1 > h2) multiplier = -multiplier;
    }

    const segPoints = generateCurvedSegmentPoints(coord1, coord2, multiplier, 8);
    segments.push(segPoints);
  }

  return segments;
}

let overviewPolylinesMap = {};
let overviewHospitalMarkersMap = {};

function highlightOverviewTrack(rotId) {
  if (overviewLinesMode === 'off' || currentViewMode !== 'list') return;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  hoverHighlightGroup.clearLayers();

  const rot = (Array.isArray(activeRotations) ? activeRotations : []).find(r => r.id === rotId);
  const entry = overviewPolylinesMap[rotId];

  if (rot && rot.stages) {
    const activeBases = new Set(getRotationHospitalBases(rot));
    Object.keys(overviewHospitalMarkersMap).forEach(hName => {
      const marker = overviewHospitalMarkersMap[hName];
      const el = marker && marker.getElement && marker.getElement();
      if (el) {
        el.classList.toggle('dimmed-overview-pin', !activeBases.has(hName));
      }
    });
  }

  // 1. Highlight target track; dim all other overview lines
  Object.keys(overviewPolylinesMap).forEach(id => {
    const item = overviewPolylinesMap[id];
    if (id === rotId) {
      item.polyline.setStyle({
        weight: 4.5,
        opacity: 1.0,
        color: isDark ? '#38bdf8' : item.highlightColor
      });
      item.polyline.bringToFront();
    } else {
      item.polyline.setStyle({
        opacity: 0.08
      });
    }
  });

  // 2. Add outer casing polyline on hoverHighlightGroup underneath the track
  if (entry && entry.polyline) {
    const casingColor = isDark ? '#0f172a' : '#ffffff';
    const casingPolyline = L.polyline(entry.polyline.getLatLngs(), {
      color: casingColor,
      weight: 8,
      opacity: 0.85,
      lineCap: 'round',
      lineJoin: 'round',
      interactive: false
    });
    hoverHighlightGroup.addLayer(casingPolyline);

    // High-contrast highlighted line sits cleanly above casing on hoverHighlightGroup
    const highlightClone = L.polyline(entry.polyline.getLatLngs(), {
      color: isDark ? '#38bdf8' : entry.highlightColor,
      weight: 4.5,
      opacity: 1.0,
      dashArray: (rot && isPoolRotation(rot)) ? '4, 7' : null,
      lineCap: 'round',
      lineJoin: 'round',
      interactive: false
    });
    hoverHighlightGroup.addLayer(highlightClone);
  }

  // 3. Temporarily place numbered stage markers (1, 2, 3...) or pool badges on hoverHighlightGroup
  if (rot && rot.stages && rot.stages.length) {
    if (isPoolRotation(rot)) {
      const bases = getRotationHospitalBases(rot);
      const poolColor = getRotationLineStyle(rot).color;
      bases.forEach(hName => {
        const hosp = activeHospitals[hName];
        if (!hosp || !hosp.coords) return;
        const isTertiary = hosp.type === 'Tertiary';
        const badgeText = isTertiary ? 'T' : 'H';
        const shortName = hName.split(',')[0].replace(/\b(Hospital|Infirmary|University|District|General|Royal|County)\b/gi, '').replace(/\s+/g, ' ').trim() || hName.split(',')[0];
        const badgeIcon = L.divIcon({
          className: 'hover-stage-badge-icon',
          html: `<div class="pool-hover-wrap"><div class="pool-site-pin pool-spotlight-halo ${isTertiary ? 'tertiary-pool-pin' : ''}" style="background-color:${poolColor}; --pool-pin-color:${poolColor}; pointer-events:none;" title="Candidate Base: ${escapeHtml(hName)}">${badgeText}</div><span class="pool-hover-label">${escapeHtml(shortName)}</span></div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });
        const badgeMarker = L.marker(hosp.coords, {
          icon: badgeIcon,
          zIndexOffset: 3000,
          interactive: false
        });
        hoverHighlightGroup.addLayer(badgeMarker);
      });
    } else {
      const hospStagesMap = new Map();
      rot.stages.forEach((stg, idx) => {
        if (!stg.hosp || !activeHospitals[stg.hosp]) return;
        if (!hospStagesMap.has(stg.hosp)) hospStagesMap.set(stg.hosp, []);
        hospStagesMap.get(stg.hosp).push(idx + 1);
      });

      hospStagesMap.forEach((nums, hName) => {
        const hosp = activeHospitals[hName];
        if (!hosp || !hosp.coords) return;

        const numStr = nums.join(',');
        const badgeIcon = L.divIcon({
          className: 'hover-stage-badge-icon',
          html: `<div class="hover-stage-badge" title="Stage ${numStr}: ${escapeHtml(hName)}">${numStr}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const badgeMarker = L.marker(hosp.coords, {
          icon: badgeIcon,
          zIndexOffset: 3000,
          interactive: false
        });
        hoverHighlightGroup.addLayer(badgeMarker);
      });
    }
  }

  // 4. Highlight sidebar card
  const card = document.getElementById(`feed-card-${rotId}`);
  if (card) {
    card.classList.add('map-highlighted-card');
    if (currentViewMode === 'list') {
      card.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'nearest' });
    }
  }
}

function resetOverviewTrackHighlights() {
  hoverHighlightGroup.clearLayers();
  Object.keys(overviewHospitalMarkersMap).forEach(hName => {
    const marker = overviewHospitalMarkersMap[hName];
    const el = marker && marker.getElement && marker.getElement();
    if (el) el.classList.remove('dimmed-overview-pin');
  });
  if (overviewLinesMode === 'off' || currentViewMode !== 'list') return;

  Object.keys(overviewPolylinesMap).forEach(id => {
    const entry = overviewPolylinesMap[id];
    entry.polyline.setStyle({
      weight: entry.baseWeight,
      opacity: entry.baseOpacity,
      color: entry.baseColor,
      dashArray: entry.baseDash === 'none' ? null : entry.baseDash
    });
  });

  document.querySelectorAll('.rotation-list-card.map-highlighted-card').forEach(el => {
    el.classList.remove('map-highlighted-card');
  });
}

function getRotationMaxDistance(rot) {
  if (!rot || !rot.stages) return 0;
  if (getRotationHospitalBases(rot).length <= 1) return 0;
  if (rot._meta && typeof rot._meta.intrinsicSpread === 'number') {
    return rot._meta.intrinsicSpread;
  }
  return computeIntrinsicSpread(rot);
}

function getRotationMaxCommuteFromBase(rot) {
  if (!rot || !rot.stages) return 0;
  const coords = rot.stages.map(s => activeHospitals[s.hosp] ? activeHospitals[s.hosp].coords : null).filter(Boolean);
  if (!coords.length) return 0;

  let baseCoords = null;
  if (currentCommuteMode === 'custom' && customHomeBase && customHomeBase.coords) {
    baseCoords = customHomeBase.coords;
  } else if (currentCommuteMode === 'transit' && rot.hubs && rot.hubs.transit && rot.hubs.transit.coords) {
    baseCoords = rot.hubs.transit.coords;
  } else if (rot.hubs && rot.hubs.driver && rot.hubs.driver.coords) {
    baseCoords = rot.hubs.driver.coords;
  }

  if (!baseCoords) {
    return getRotationMaxDistance(rot);
  }

  let maxCommute = 0;
  coords.forEach(c => {
    const d = calcDistanceMiles(baseCoords, c);
    if (d > maxCommute) maxCommute = d;
  });
  return maxCommute;
}

/**
 * Consolidated commute summary for any rotation.
 * Computes max distance spread, morning rush commute (07:30), evening commute (18:00),
 * active shift time based on selected timing, badge styling class, and short timing label.
 */
function getRotationCommuteSummary(rot, timing = currentShiftTiming) {
  if (!rot) return { maxDist: 0, commuteDist: 0, mornMins: 0, eveMins: 0, activeMins: 0, badgeClass: 'badge-spread-low', timingShort: '07:30' };
  const maxDist = getRotationMaxDistance(rot);
  const commuteDist = getRotationMaxCommuteFromBase(rot);
  const mornMins = calcDrivingTimeMinutes(commuteDist, rot.region, '0730');
  const eveMins = calcDrivingTimeMinutes(commuteDist, rot.region, '1800');
  const activeMins = timing === '1800' ? eveMins : (timing === 'offpeak' ? calcDrivingTimeMinutes(commuteDist, rot.region, 'offpeak') : mornMins);
  const timingShort = timing === '1800' ? '18:00' : (timing === '0730' ? '07:30' : 'off-peak');
  let badgeClass = 'badge-spread-low';
  if (activeMins > 50) badgeClass = 'badge-spread-high';
  else if (activeMins > 35) badgeClass = 'badge-spread-med';
  return { maxDist, commuteDist, mornMins, eveMins, activeMins, badgeClass, timingShort };
}


function getPartnerCommuteSummary(rot, timing = currentShiftTiming) {
  if (!partnerWorkBase || !partnerWorkBase.coords || !rot) return null;
  let baseCoords = null;
  let baseName = '';
  if (currentCommuteMode === 'custom' && customHomeBase && customHomeBase.coords) {
    baseCoords = customHomeBase.coords;
    baseName = customHomeBase.name;
  } else if (currentCommuteMode === 'transit' && rot.hubs && rot.hubs.transit && rot.hubs.transit.coords) {
    baseCoords = rot.hubs.transit.coords;
    baseName = rot.hubs.transit.name;
  } else if (rot.hubs && rot.hubs.driver && rot.hubs.driver.coords) {
    baseCoords = rot.hubs.driver.coords;
    baseName = rot.hubs.driver.name;
  }
  if (!baseCoords) return null;
  const dist = calcDistanceMiles(baseCoords, partnerWorkBase.coords);
  const mornMins = calcDrivingTimeMinutes(dist, rot.region, '0730');
  const eveMins = calcDrivingTimeMinutes(dist, rot.region, '1800');
  const activeMins = timing === '1800' ? eveMins : (timing === 'offpeak' ? calcDrivingTimeMinutes(dist, rot.region, 'offpeak') : mornMins);
  return { dist, mornMins, eveMins, activeMins, partnerName: partnerWorkBase.name, baseName, baseCoords, partnerCoords: partnerWorkBase.coords };
}


function updateShortlistBadge() {
  const badge = document.getElementById('headerShortlistBadge');
  if (!badge) return;
  const count = activeRotations.filter(r => isShortlisted(getUserData(r.id))).length;
  badge.textContent = count;
}

function updateCompareBadge() {
  const badge = document.getElementById('headerCompareBadge');
  if (badge) badge.textContent = compareList.length;
}

function updateCustomBaseUI() {
  const pillTexts = [document.getElementById('customBasePillText'), document.getElementById('cardCustomBasePillText')];
  const statusBox = document.getElementById('customBaseStatusBox');
  const partnerStatusBox = document.getElementById('partnerBaseStatusBox');
  const customBtns = [document.getElementById('btnModeCustom'), document.getElementById('btnCardModeCustom')];

  if (customHomeBase && customHomeBase.coords) {
    pillTexts.forEach(p => { if (p) p.textContent = `Base: ${customHomeBase.name}`; });
    if (statusBox) statusBox.innerHTML = `Current Base: <b>${escapeHtml(customHomeBase.name)}</b> (${customHomeBase.coords[0].toFixed(3)}, ${customHomeBase.coords[1].toFixed(3)})`;
    customBtns.forEach(b => { if (b) b.textContent = customHomeBase.name; });
  } else {
    pillTexts.forEach(p => { if (p) p.textContent = `Set Postcode`; });
    if (statusBox) statusBox.innerHTML = `Current Base: <b>None set</b> (using suggested programme hubs).`;
    customBtns.forEach(b => { if (b) b.textContent = `My Base`; });
  }

  if (partnerStatusBox) {
    if (partnerWorkBase && partnerWorkBase.coords) {
      partnerStatusBox.innerHTML = `Partner Workplace: <b>${escapeHtml(partnerWorkBase.name)}</b> (${partnerWorkBase.coords[0].toFixed(3)}, ${partnerWorkBase.coords[1].toFixed(3)})`;
    } else {
      partnerStatusBox.innerHTML = `Partner Workplace: <b>None set</b>`;
    }
  }
}

// 7. DROPDOWN POPULATION & VIEW RENDERING
function populateRegionDropdown() {
  const regSelect = document.getElementById('regionFilter');
  if (!regSelect) return;
  const regionCounts = {};
  activeRotations.forEach(r => {
    regionCounts[r.region] = (regionCounts[r.region] || 0) + 1;
  });

  let html = `<option value="ALL">All Regions (${activeRotations.length} Rotations)</option>`;
  Object.keys(regionCounts).sort().forEach(reg => {
    html += `<option value="${escapeHtml(reg)}">${escapeHtml(reg)} (${regionCounts[reg]})</option>`;
  });
  regSelect.innerHTML = html;
  if (activeRegionFilter) regSelect.value = activeRegionFilter;
}

const prefSelect = document.getElementById('prefSelect');
function populateDropdown(list) {
  if (!prefSelect) return;
  const frag = document.createDocumentFragment();
  const defaultOpt = document.createElement('option');
  defaultOpt.value = "";
  defaultOpt.textContent = "Jump to rotation...";
  frag.appendChild(defaultOpt);
  
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
    frag.appendChild(optgroup);
  });

  prefSelect.replaceChildren(frag);

  if (currentSelectedId && list.some(r => r.id === currentSelectedId)) {
    prefSelect.value = currentSelectedId;
  }
}

function toggleCommuteOverlay(forceState = null) {
  showCommuteOverlay = (typeof forceState === 'boolean') ? forceState : !showCommuteOverlay;
  const drawer = document.getElementById('commuteControlsDrawer');
  const btn = document.getElementById('btnToggleCommuteOverlay');
  if (drawer) {
    drawer.style.display = showCommuteOverlay ? 'block' : 'none';
  }
  if (btn) {
    btn.classList.toggle('active', showCommuteOverlay);
    btn.innerHTML = `<span id="commuteToggleLabel">Commute &amp; Bases: ${showCommuteOverlay ? 'ON' : 'OFF'}</span> ${showCommuteOverlay ? '▴' : '▾'}`;
  }

  // Update inspector header cardHubSummary visibility
  const cardHubSummaryEl = document.getElementById('cardHubSummary');
  if (cardHubSummaryEl) {
    cardHubSummaryEl.style.display = (showCommuteOverlay || currentInspectorTab === 'commute') ? 'inline-block' : 'none';
  }

  if (currentViewMode === 'list') {
    renderRotationCardsFeed(currentFilteredList);
  } else if (currentSelectedId) {
    selectRotation(currentSelectedId, false);
  }
}

function fitMapToPoints(points, maxZoom = 12) {
  if (!Array.isArray(points) || points.length === 0) return;
  try { map.stop(); } catch (e) {}
  const animate = !(typeof prefersReducedMotion === 'function' && prefersReducedMotion());
  const bounds = L.latLngBounds(points);
  if (!bounds.isValid()) return;
  if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
    map.setView(bounds.getCenter(), maxZoom, { animate });
  } else {
    map.fitBounds(bounds, { padding: [60, 60], maxZoom, animate });
  }
}

function switchInspectorTab(tabKey, { fitMap = true } = {}) {
  currentInspectorTab = tabKey;
  const tabMap = {
    'placements': { btn: 'tabBtnPlacements', pane: 'tabPanePlacements' },
    'commute': { btn: 'tabBtnCommute', pane: 'tabPaneCommute' },
    'intel': { btn: 'tabBtnIntel', pane: 'tabPaneIntel' },
    'notes': { btn: 'tabBtnNotes', pane: 'tabPaneNotes' }
  };
  Object.keys(tabMap).forEach(key => {
    const btn = document.getElementById(tabMap[key].btn);
    const pane = document.getElementById(tabMap[key].pane);
    const isActive = (key === tabKey);
    if (btn) {
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      btn.setAttribute('tabindex', isActive ? '0' : '-1');
    }
    if (pane) pane.classList.toggle('active', isActive);
  });

  const cardHubSummaryEl = document.getElementById('cardHubSummary');
  if (cardHubSummaryEl) {
    cardHubSummaryEl.style.display = (showCommuteOverlay || tabKey === 'commute') ? 'inline-block' : 'none';
  }

  // Map Base Pin Separation: toggle base marker and commute circle when switching tabs
  if (currentViewMode === 'details' && currentSelectedId && currentPlottedHospitalPoints.length > 0) {
    const shouldShowBase = (showCommuteOverlay || tabKey === 'commute');
    if (currentBaseMarker && currentCommuteCircle) {
      if (shouldShowBase) {
        if (!activeRouteGroup.hasLayer(currentBaseMarker)) {
          activeRouteGroup.addLayer(currentBaseMarker);
        }
        if (!activeRouteGroup.hasLayer(currentCommuteCircle)) {
          activeRouteGroup.addLayer(currentCommuteCircle);
        }
      } else {
        if (activeRouteGroup.hasLayer(currentBaseMarker)) {
          activeRouteGroup.removeLayer(currentBaseMarker);
        }
        if (activeRouteGroup.hasLayer(currentCommuteCircle)) {
          activeRouteGroup.removeLayer(currentCommuteCircle);
        }
      }
    }
    if (currentPartnerMarker && currentPartnerLine) {
      if (shouldShowBase) {
        if (!activeRouteGroup.hasLayer(currentPartnerMarker)) {
          activeRouteGroup.addLayer(currentPartnerMarker);
        }
        if (!activeRouteGroup.hasLayer(currentPartnerLine)) {
          activeRouteGroup.addLayer(currentPartnerLine);
        }
      } else {
        if (activeRouteGroup.hasLayer(currentPartnerMarker)) {
          activeRouteGroup.removeLayer(currentPartnerMarker);
        }
        if (activeRouteGroup.hasLayer(currentPartnerLine)) {
          activeRouteGroup.removeLayer(currentPartnerLine);
        }
      }
    }
    if (fitMap) {
      const boundsPoints = (shouldShowBase && currentActiveHubCoords)
        ? [...currentPlottedHospitalPoints, currentActiveHubCoords, ...(partnerWorkBase && partnerWorkBase.coords ? [partnerWorkBase.coords] : [])]
        : [...currentPlottedHospitalPoints];
      fitMapToPoints(boundsPoints, 12);
    }
  }
}

function renderRotationCardsFeed(list) {
  const container = document.getElementById('rotationCardsFeed');
  if (!container) return;

  if (!list.length) {
    container.innerHTML = `
      <div style="text-align:center; padding:40px 15px; color:var(--text-muted);">
        <p style="font-weight:700;">No matching rotations found</p>
        <p style="font-size:0.8rem; margin-top:4px; margin-bottom:12px;">Try adjusting your search query, region, or filters.</p>
        <button class="btn-step" data-action="reset-all-filters" style="margin:0 auto; padding:6px 14px; color:var(--primary); font-weight:800;">
          Reset All Filters
        </button>
      </div>`;
    return;
  }

  const frag = document.createDocumentFragment();

  list.forEach((r) => {
    const userData = getUserData(r.id);
    const commute = getRotationCommuteSummary(r);
    const split = getRotationTrainingSplit(r);
    const isSelected = r.id === currentSelectedId;
    const isComparing = compareList.includes(r.id);
    const isPool = isPoolRotation(r);

    let activeHubName = r.hubs[currentCommuteMode === 'transit' ? 'transit' : 'driver'].name;
    if (currentCommuteMode === 'custom' && customHomeBase) {
      activeHubName = customHomeBase.name;
    }

    let tierBadgeHtml = '';
    if (userData.tier === 'TIER1') tierBadgeHtml = '<span class="badge badge-tier-1">Tier 1</span>';
    else if (userData.tier === 'TIER2') tierBadgeHtml = '<span class="badge badge-tier-2">Tier 2</span>';
    else if (userData.tier === 'TIER3') tierBadgeHtml = '<span class="badge badge-tier-3">Tier 3</span>';
    else if (userData.tier === 'EXCLUDE') tierBadgeHtml = '<span class="badge badge-tier-exclude">Excl</span>';

    // Hospital Placement Sequence Flow for Feed Card
    let flowHtml = '';
    if (isPool) {
      const bases = getRotationHospitalBases(r);
      const itemsHtml = bases.map(b => `<span class="card-stage-chip"><span class="card-stage-name">${escapeHtml(b)}</span></span>`).join('<span class="card-pool-bullet">•</span>');
      flowHtml = `
        <div class="card-hospitals-flow">
          <span class="card-pool-tag">Hospital Pool:</span>
          ${itemsHtml}
        </div>
      `;
    } else if (Array.isArray(r.stages) && r.stages.length > 0) {
      const chips = r.stages.map((stg, idx) => {
        let dur = '';
        const durMatch = (stg.stage + ' ' + (stg.desc || '')).match(/(\d+\s*m(?:onths?)?)/i);
        if (durMatch) {
          dur = ` <span class="card-stage-dur">(${durMatch[1].replace(/\s+/g, '')})</span>`;
        }
        return `<span class="card-stage-chip"><span class="card-stage-num">${idx + 1}</span> <span class="card-stage-name">${escapeHtml(stg.hosp)}</span>${dur}</span>`;
      });
      flowHtml = `
        <div class="card-hospitals-flow">
          ${chips.join('<span class="card-stage-arrow">&rarr;</span>')}
        </div>
      `;
    }

    const card = document.createElement('article');
    const isExcluded = userData.tier === 'EXCLUDE';
    card.className = `rotation-list-card ${isSelected ? 'active-card' : ''} ${isExcluded ? 'excluded-card' : ''}`.trim();
    card.id = `feed-card-${r.id}`;
    card.onclick = (e) => {
      if (e.target.closest('button, a')) return;
      openDetailsForRotation(r.id);
    };

    const lineStyle = getRotationLineStyle(r);
    const swatchHtml = isPool ? `
      <span class="card-line-swatch" title="Pool pin colour on map">
        <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${lineStyle.color}; border:1.5px solid #ffffff; box-shadow:0 1px 3px rgba(0,0,0,0.3);"></span>
      </span>
    ` : `
      <span class="card-line-swatch" title="Line signature on overview map (${lineStyle.isDashed ? 'dashed' : 'solid'})">
        <svg width="22" height="6" viewBox="0 0 22 6" style="display:block;">
          <line x1="1" y1="3" x2="21" y2="3" stroke="${lineStyle.color}" ${lineStyle.dashPattern === 'none' ? '' : `stroke-dasharray="${lineStyle.dashPattern}"`} stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      </span>
    `;

    card.addEventListener('mouseenter', () => {
      highlightOverviewTrack(r.id);
    });
    card.addEventListener('mouseleave', () => {
      resetOverviewTrackHighlights();
    });
    card.addEventListener('focusin', () => {
      highlightOverviewTrack(r.id);
    });
    card.addEventListener('focusout', (e) => {
      if (!card.contains(e.relatedTarget)) {
        resetOverviewTrackHighlights();
      }
    });

    const quickStarsHtml = `<div class="card-quick-stars" role="group" aria-label="Quick star rating">${[1, 2, 3, 4, 5].map(n => `<button type="button" class="card-quick-star ${n <= userData.rating ? 'active' : ''}" data-action="quick-card-rate" data-id="${r.id}" data-rating="${n}" title="Rate ${n} star${n > 1 ? 's' : ''}">${n <= userData.rating ? '★' : '☆'}</button>`).join('')}</div>`;
    const quickTiersHtml = `<div class="card-quick-tiers" role="group" aria-label="Quick tier assignment">
      <button type="button" class="card-quick-tier-btn t1 ${userData.tier === 'TIER1' ? 'active' : ''}" data-action="quick-card-tier" data-id="${r.id}" data-tier="TIER1" title="Assign Tier 1">T1</button>
      <button type="button" class="card-quick-tier-btn t2 ${userData.tier === 'TIER2' ? 'active' : ''}" data-action="quick-card-tier" data-id="${r.id}" data-tier="TIER2" title="Assign Tier 2">T2</button>
      <button type="button" class="card-quick-tier-btn t3 ${userData.tier === 'TIER3' ? 'active' : ''}" data-action="quick-card-tier" data-id="${r.id}" data-tier="TIER3" title="Assign Tier 3">T3</button>
      <button type="button" class="card-quick-tier-btn tx ${userData.tier === 'EXCLUDE' ? 'active' : ''}" data-action="quick-card-tier" data-id="${r.id}" data-tier="EXCLUDE" title="Exclude rotation">✕</button>
    </div>`;

    const pCommute = partnerWorkBase ? getPartnerCommuteSummary(r) : null;
    const partnerBadgeHtml = pCommute
      ? `<span class="badge badge-partner-commute" title="Partner commute from ${escapeHtml(pCommute.baseName)} to ${escapeHtml(pCommute.partnerName)}">Partner: ${pCommute.dist} mi (~${pCommute.activeMins}m)</span>`
      : '';

    const showCommuteDetails = showCommuteOverlay || (currentCommuteMode === 'custom' && customHomeBase);

    const modeTravelLabel = currentCommuteMode === 'transit' ? 'travel' : 'drive';
    const spreadLabelText = commute.maxDist === 0 ? 'Single site' : `${commute.maxDist} mi span`;
    const commuteBadgeHtml = showCommuteDetails
      ? `<span class="badge ${commute.badgeClass}" title="Estimated ${modeTravelLabel} time at ${commute.timingShort}">${commute.commuteDist} mi (~${commute.activeMins}m @ ${commute.timingShort})</span>`
      : `<span class="badge ${commute.badgeClass}" title="Hospital footprint spread">${spreadLabelText}</span>`;

    const bottomRowHtml = showCommuteDetails ? `
      <div class="card-list-hub">
        <span>Base: <b>${escapeHtml(activeHubName)}</b> • <span style="font-size:0.72rem; color:var(--text-muted);">${escapeHtml(r.region)}</span></span>
        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
          ${quickStarsHtml}
          ${quickTiersHtml}
        </div>
      </div>
    ` : `
      <div class="card-list-hub">
        <span style="font-size:0.72rem; color:var(--text-muted); font-weight:600;">${escapeHtml(r.region)}</span>
        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
          ${quickStarsHtml}
          ${quickTiersHtml}
        </div>
      </div>
    `;

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:6px;">
        <div style="display:flex; gap:5px; align-items:center; flex-wrap:wrap; min-width:0; flex:1;">
          <span class="badge badge-code">${escapeHtml(r.code)}</span>
          <span class="badge badge-places">${escapeHtml(formatPlacesLabel(r.places, false))}</span>
          ${swatchHtml}
          ${isPool ? '<span class="badge badge-pool">Pool</span>' : ''}
          <span class="badge badge-split" title="Training Balance: ${split.tertiary}% Tertiary, ${split.dgh}% DGH">${split.tertiary}% Tert • ${split.dgh}% DGH</span>
          ${tierBadgeHtml}
          ${partnerBadgeHtml}
        </div>
        <div style="display:flex; align-items:center; gap:5px; flex-shrink:0;">
          <button class="btn-compare-action ${isComparing ? 'in-compare' : ''}" data-action="toggle-compare-card" data-id="${r.id}" title="Compare rotation">
            ${isComparing ? 'In Compare' : 'Compare'}
          </button>
          ${commuteBadgeHtml}
        </div>
      </div>
      <h3 class="card-list-heading"><button type="button" class="card-title-btn" data-action="open-rotation-details" data-id="${escapeHtml(r.id)}">${escapeHtml(r.title)}</button></h3>
      ${flowHtml}
      ${bottomRowHtml}
    `;
    frag.appendChild(card);
  });

  container.replaceChildren(frag);
}

function openDetailsForRotation(id) {
  flushPendingNotes();
  if (typeof hoverHighlightGroup !== 'undefined') hoverHighlightGroup.clearLayers();
  if (prefSelect) prefSelect.value = id;
  selectRotation(id, false);
  setViewMode('details');
  if (window.innerWidth <= 768) {
    toggleMobileSidebar(true);
  }
}

// 8. PREFERENCES, TIERS & RATINGS
function setTier(tierVal) {
  if (!currentSelectedId) return;
  const current = getUserData(currentSelectedId);
  const nextTier = (current.tier === tierVal) ? 'UNSET' : tierVal;
  setUserData(currentSelectedId, { tier: nextTier });
  if (current.tier !== nextTier) {
    shortlistOrder = (Array.isArray(shortlistOrder) ? shortlistOrder : []).filter(id => id !== currentSelectedId);
  }
  syncShortlistOrder();

  updateTierButtons(nextTier);
  updateShortlistBadge();
  updateLandingStatsAndBadges();
  applyFiltersAndSearch();
  showToast(`Tier updated: ${nextTier}`);
}

function updateTierButtons(activeTier) {
  const syncBtnGroup = (prefix) => {
    const b1 = document.getElementById(prefix + '1');
    const b2 = document.getElementById(prefix + '2');
    const b3 = document.getElementById(prefix + '3');
    const bx = document.getElementById(prefix + 'Exclude');
    if (b1) b1.classList.toggle('active', activeTier === 'TIER1');
    if (b2) b2.classList.toggle('active', activeTier === 'TIER2');
    if (b3) b3.classList.toggle('active', activeTier === 'TIER3');
    if (bx) bx.classList.toggle('active', activeTier === 'EXCLUDE');
  };
  syncBtnGroup('tierBtn');
  syncBtnGroup('quickTierBtn');

  const tierBadge = document.getElementById('cardTierBadge');
  if (tierBadge) {
    if (activeTier && activeTier !== 'UNSET') {
      tierBadge.style.display = 'inline-block';
      if (activeTier === 'TIER1') { tierBadge.className = 'badge badge-tier-1'; tierBadge.textContent = 'Tier 1'; }
      else if (activeTier === 'TIER2') { tierBadge.className = 'badge badge-tier-2'; tierBadge.textContent = 'Tier 2'; }
      else if (activeTier === 'TIER3') { tierBadge.className = 'badge badge-tier-3'; tierBadge.textContent = 'Tier 3'; }
      else if (activeTier === 'EXCLUDE') { tierBadge.className = 'badge badge-tier-exclude'; tierBadge.textContent = 'Excluded'; }
    } else {
      tierBadge.style.display = 'none';
    }
  }
}

function saveUserPreferences() {
  if (!currentSelectedId) return;
  const notes = document.getElementById('partnerNotes').value;
  setUserData(currentSelectedId, { rating: currentActiveRating, notes });
  syncShortlistOrder();

  updateShortlistBadge();
  updateLandingStatsAndBadges();
  applyFiltersAndSearch();
  if (prefSelect) prefSelect.value = currentSelectedId;
  showToast("Saved to browser");
}

let debounceNotesTimer = null;
let pendingNotesSave = null;

function flushPendingNotes() {
  if (debounceNotesTimer) {
    clearTimeout(debounceNotesTimer);
    debounceNotesTimer = null;
  }
  if (pendingNotesSave) {
    const { targetId, notes } = pendingNotesSave;
    pendingNotesSave = null;
    if (targetId) {
      setUserData(targetId, { notes });
      syncShortlistOrder();
      updateShortlistBadge();
    }
  }
}

function debounceSaveNotes() {
  const notesEl = document.getElementById('partnerNotes');
  if (!notesEl || !currentSelectedId) return;
  const targetId = currentSelectedId;
  const notes = notesEl.value;
  pendingNotesSave = { targetId, notes };

  if (debounceNotesTimer) clearTimeout(debounceNotesTimer);
  debounceNotesTimer = setTimeout(() => {
    flushPendingNotes();
  }, 500);
}

function setRating(val, isClick = false) {
  if (isClick && val === currentActiveRating) {
    val = 0;
  }
  currentActiveRating = val;
  const stars = document.querySelectorAll('#starContainer .star');
  stars.forEach((s, idx) => {
    const isSelected = idx < val;
    s.classList.toggle('selected', isSelected);
    s.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
  });
  document.getElementById('ratingText').textContent = val > 0 ? `(${val} / 5 Stars)` : `(Unrated)`;

  if (isClick && currentSelectedId) {
    setUserData(currentSelectedId, { rating: val });
    syncShortlistOrder();
    updateShortlistBadge();
    updateLandingStatsAndBadges();
    applyFiltersAndSearch({ redrawMap: activeQuickFilter === 'STARRED' });
    showToast(val > 0 ? `Rated ${val}★` : "Rating cleared");
  }
}

// 9. VIEW MODE & COMMUTE MODE SWITCHING
function showListView({ fitView = false } = {}) {
  flushPendingNotes();
  cancelMapPick();
  if (typeof hoverHighlightGroup !== 'undefined') hoverHighlightGroup.clearLayers();
  currentViewMode = 'list';
  const listView = document.getElementById('listViewContainer');
  const inspectorCard = document.getElementById('inspectorCard');
  if (listView) listView.style.display = 'block';
  if (inspectorCard) inspectorCard.style.display = 'none';

  // Drop the #rotation-id from the URL so a reload returns to the list (Back still returns to the rotation)
  if (/^#[^=]+$/.test(window.location.hash)) {
    history.pushState(null, '', window.location.pathname + window.location.search);
  }

  renderRotationCardsFeed(currentFilteredList);
  if (currentSelectedId) {
    setTimeout(() => {
      const card = document.getElementById(`feed-card-${currentSelectedId}`);
      if (card) card.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'nearest' });
    }, 50);
  }
  renderAllPlacements({ fitView });
  setTimeout(() => { map.invalidateSize(); }, 120);
}

function dismissTipBanner() {
  const banner = document.getElementById('appTipBanner');
  if (banner) banner.style.display = 'none';
  safeStorage.set(`${STORAGE_PREFIX}tip_dismissed`, 'true');
}

function checkTipBannerStatus() {
  const banner = document.getElementById('appTipBanner');
  if (!banner) return;
  banner.style.display = safeStorage.get(`${STORAGE_PREFIX}tip_dismissed`) === 'true' ? 'none' : 'flex';
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
      const firstId = (prefSelect && prefSelect.value) || (activeRotations[0] && activeRotations[0].id);
      if (firstId) selectRotation(firstId, false);
    }
  } else {
    showListView();
  }
  setTimeout(() => { map.invalidateSize(); }, 120);
}

function syncCommuteModeUI(mode) {
  ['btnModeDriver', 'btnCardModeDriver'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active', mode === 'driver');
  });
  ['btnModeTransit', 'btnCardModeTransit'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active', mode === 'transit');
  });
  ['btnModeCustom', 'btnCardModeCustom'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active', mode === 'custom');
  });
}

function setCommuteMode(mode) {
  if (mode === 'custom' && (!customHomeBase || !customHomeBase.coords)) {
    openCustomBaseModal();
    return;
  }
  currentCommuteMode = mode;
  safeStorage.set(`${STORAGE_PREFIX}commute_mode`, mode);
  syncCommuteModeUI(mode);

  renderRotationCardsFeed(currentFilteredList);

  if (currentSelectedId && currentViewMode === 'details') {
    selectRotation(currentSelectedId, false);
  }

  const modeLabels = {
    driver: 'Base: Driver (Driving)',
    transit: 'Base: Public Transport (Train / Bus)',
    custom: 'Base: My Prospective Home Postcode'
  };
  showToast(modeLabels[mode] || `Base: ${mode}`);
}

function setShiftTiming(timing, showFeedback = true, render = true) {
  currentShiftTiming = ['0730', '1800', 'offpeak'].includes(timing) ? timing : '0730';
  safeStorage.set(`${STORAGE_PREFIX}shift_timing`, currentShiftTiming);

  ['btnTimingMorning', 'btnCardTimingMorning'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active', currentShiftTiming === '0730');
  });
  ['btnTimingEvening', 'btnCardTimingEvening'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active', currentShiftTiming === '1800');
  });
  ['btnTimingOffPeak', 'btnCardTimingOffPeak'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active', currentShiftTiming === 'offpeak');
  });

  let toastText = 'Commute model: Arrive by 07:30 (Morning Handover)';
  if (currentShiftTiming === '1800') {
    toastText = 'Commute model: Depart at 18:00 (Evening Rush Hour)';
  } else if (currentShiftTiming === 'offpeak') {
    toastText = 'Commute model: Off-Peak Baseline Drive';
  }

  if (render) {
    renderRotationCardsFeed(currentFilteredList);

    if (currentSelectedId && currentViewMode === 'details') {
      selectRotation(currentSelectedId, false);
    }
  }

  if (showFeedback) {
    showToast(toastText);
  }
}

function stepRotation(direction) {
  if (!currentFilteredList.length) return;
  const prevId = currentSelectedId;
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

  if (prevId) {
    const prevCard = document.getElementById(`feed-card-${prevId}`);
    if (prevCard) prevCard.classList.remove('active-card');
  }
  const nextCard = document.getElementById(`feed-card-${nextId}`);
  if (nextCard) {
    nextCard.classList.add('active-card');
    nextCard.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'nearest' });
  }
}

function focusHospitalByName(hospName) {
  if (!hospName) return;
  const h = activeHospitals[hospName];
  if (h) {
    if (prefersReducedMotion()) {
      map.setView(h.coords, 13);
    } else {
      map.flyTo(h.coords, 13, { duration: 1.0 });
    }
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
  const h = activeHospitals[hospName];
  if (!h) return;

  const modal = document.getElementById('hospitalProfileModal');
  const nameEl = document.getElementById('modalHospName');
  const regBadge = document.getElementById('modalHospRegionBadge');
  const typeIcon = document.getElementById('modalHospTypeIcon');
  const body = document.getElementById('modalHospBody');
  if (!modal || !body) return;

  const isTertiary = h.type === 'Tertiary';
  nameEl.textContent = hospName;
  regBadge.textContent = `${h.region} • ${isTertiary ? 'Tertiary Teaching' : 'DGH'}`;
  typeIcon.textContent = isTertiary ? 'Tertiary' : 'DGH';
  typeIcon.className = `badge ${isTertiary ? 'badge-tertiary' : 'badge-dgh'}`;

  // Identify all rotations in database that include this hospital
  const linked = hospitalRotationsMap.get(hospName) || [];

  body.innerHTML = `
    <div class="hosp-profile-summary">
      <b>${isTertiary ? 'Tertiary / Specialist Teaching Hospital' : 'District General Hospital (DGH)'}</b>
      <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
        Key clinical training base in ${escapeHtml(h.region)}. Included in <b>${linked.length}</b> ${escapeHtml(activeDataset.shortLabel)} rotation schemes.
      </div>
    </div>

    <div class="hosp-intel-grid">
      <div class="hosp-intel-card">
        <div class="hosp-intel-card-header">Electronic Records (EPR)</div>
        <div class="hosp-intel-card-body">${escapeHtml(h.epr || 'Electronic / Hybrid system')}</div>
      </div>
      <div class="hosp-intel-card">
        <div class="hosp-intel-card-header">Doctor Parking Policy</div>
        <div class="hosp-intel-card-body">${escapeHtml(h.parking || 'Staff parking permit scheme')}</div>
      </div>
      <div class="hosp-intel-card">
        <div class="hosp-intel-card-header">Rail &amp; Public Transport</div>
        <div class="hosp-intel-card-body">${escapeHtml(h.station || 'Local rail & bus connections')}</div>
      </div>
      <div class="hosp-intel-card">
        <div class="hosp-intel-card-header">Specialist Services</div>
        <div class="hosp-intel-card-body">${escapeHtml(h.highlights || 'General & emergency surgical services')}</div>
      </div>
    </div>

    <div class="hosp-rotations-box">
      <div class="hosp-rotations-title">Rotations that include this hospital (${linked.length}):</div>
      ${linked.length > 0 ? `
        <div class="hosp-rot-pills">
          ${linked.map(r => `
            <button class="hosp-rot-btn" data-action="dive-in-modal" data-id="${r.id}">
              <b>${escapeHtml(r.code)}</b>: ${escapeHtml(r.title)} &rarr;
            </button>
          `).join('')}
        </div>
      ` : `
        <div style="font-size:0.74rem; color:var(--text-muted); font-style:italic;">${escapeHtml(activeDataset.referenceNote || 'Reference regional training hospital.')}</div>
      `}
    </div>
  `;

  openModal('hospitalProfileModal');
}

function copyDirectShareLink() {
  const urlObj = new URL(window.location.href);
  urlObj.searchParams.set('prog', activeProgramme);
  urlObj.hash = currentSelectedId ? `#${currentSelectedId}` : '';
  const url = urlObj.toString();
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
  flushPendingNotes();
  cancelMapPick();

  currentSelectedId = id;
  currentViewMode = 'details';

  const prefSel = document.getElementById('prefSelect');
  if (prefSel && prefSel.value !== id) {
    prefSel.value = id;
  }
  
  if (window.location.hash !== '#' + id) {
    window.location.hash = id;
  }

  const listView = document.getElementById('listViewContainer');
  if (listView) listView.style.display = 'none';
  const inspectorCard = document.getElementById('inspectorCard');
  if (inspectorCard) inspectorCard.style.display = 'block';

  const rot = activeRotations.find(r => r.id === id);
  if (!rot) return;

  const isPool = isPoolRotation(rot);

  // Maintain active tab or default to Placements
  switchInspectorTab(currentInspectorTab || 'placements', { fitMap: false });

  activeRouteGroup.clearLayers();
  backgroundHospitalsGroup.clearLayers();
  overviewLinesGroup.clearLayers();

  document.getElementById('cardCode').textContent = rot.code;
  document.getElementById('cardPlaces').textContent = formatPlacesLabel(rot.places, false);
  document.getElementById('cardTitle').textContent = rot.title;

  const cardPoolBadge = document.getElementById('cardPoolBadge');
  if (cardPoolBadge) {
    cardPoolBadge.style.display = isPool ? 'inline-block' : 'none';
  }

  // Comparison toggle button state on card
  const cardCompareBtn = document.getElementById('cardCompareBtn');
  if (cardCompareBtn) {
    const isComparing = compareList.includes(rot.id);
    cardCompareBtn.classList.toggle('in-compare', isComparing);
    cardCompareBtn.textContent = isComparing ? 'In Compare' : 'Compare';
  }

  // Determine Active Base Coordinates
  let activeHub = rot.hubs[currentCommuteMode === 'transit' ? 'transit' : 'driver'];
  let activeHubCoords = activeHub.coords;
  let activeHubName = activeHub.name;

  const hubBox = document.getElementById('hubBox');
  const alertBox = document.getElementById('hubAlertBox');

  if (currentCommuteMode === 'custom' && customHomeBase && customHomeBase.coords) {
    hubBox.className = "hub-box custom-theme";
    document.getElementById('hubTitlePrefix').textContent = "Custom Home Base:";
    document.getElementById('hubTownName').textContent = customHomeBase.name;
    document.getElementById('hubDescription').textContent = "Personal commute matrix calculated from your prospective living location.";
    activeHubCoords = customHomeBase.coords;
    activeHubName = customHomeBase.name;
  } else if (currentCommuteMode === 'transit') {
    hubBox.className = "hub-box transit-theme";
    document.getElementById('hubTitlePrefix').textContent = "Suggested Base (Public Transport):";
    document.getElementById('hubTownName').textContent = activeHub.name;
    document.getElementById('hubDescription').textContent = activeHub.desc;
  } else {
    hubBox.className = "hub-box driver-theme";
    document.getElementById('hubTitlePrefix').textContent = "Suggested Base (Driver):";
    document.getElementById('hubTownName').textContent = activeHub.name;
    document.getElementById('hubDescription').textContent = activeHub.desc;
  }

  const cardRegionEl = document.getElementById('cardRegionText');
  if (cardRegionEl) cardRegionEl.textContent = rot.region;

  const cardHubSummaryEl = document.getElementById('cardHubSummary');
  if (cardHubSummaryEl) {
    cardHubSummaryEl.textContent = `Base: ${activeHubName}`;
    cardHubSummaryEl.style.display = (showCommuteOverlay || currentInspectorTab === 'commute') ? 'inline-block' : 'none';
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
  const fragHosp = document.createDocumentFragment();

  uniqueHospBases.forEach(hName => {
    const hData = activeHospitals[hName];
    const isTertiary = hData && hData.type === 'Tertiary';
    const chip = document.createElement('div');
    chip.className = "hospital-chip-item";
    
    const nameSpan = document.createElement('div');
    nameSpan.className = "hospital-chip-name";
    nameSpan.innerHTML = `<span class="badge ${isTertiary ? 'badge-tertiary' : 'badge-dgh'}" style="font-size:0.65rem; margin-right:4px;">${isTertiary ? 'Tertiary' : 'DGH'}</span>${escapeHtml(hName)}`;
    chip.appendChild(nameSpan);

    const btnGroup = document.createElement('div');
    btnGroup.style.display = "flex";
    btnGroup.style.gap = "4px";

    const focusBtn = document.createElement('button');
    focusBtn.className = "hospital-chip-btn";
    focusBtn.textContent = "Focus";
    focusBtn.dataset.hosp = hName;
    focusBtn.dataset.action = "focus-hospital";
    btnGroup.appendChild(focusBtn);

    const intelBtn = document.createElement('button');
    intelBtn.className = "hospital-chip-btn";
    intelBtn.textContent = "Profile";
    intelBtn.title = "View Ground Truth Trust intel, parking, EPR, and public transport";
    intelBtn.dataset.hosp = hName;
    intelBtn.dataset.action = "open-hospital-profile";
    btnGroup.appendChild(intelBtn);

    const mapLink = document.createElement('a');
    mapLink.className = "hospital-chip-btn";
    mapLink.textContent = "Maps ↗";
    mapLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hName + ', UK')}`;
    mapLink.target = "_blank";
    btnGroup.appendChild(mapLink);

    chip.appendChild(btnGroup);
    fragHosp.appendChild(chip);
  });
  hospitalsListContainer.replaceChildren(fragHosp);

  // Render Commute Matrix Breakdown from Chosen Base
  const commuteMatrixHubEl = document.getElementById('commuteMatrixHubName');
  if (commuteMatrixHubEl) commuteMatrixHubEl.textContent = activeHubName;
  const matrixContainer = document.getElementById('commuteMatrixList');
  if (matrixContainer) {
    const fragMatrix = document.createDocumentFragment();

    const pCommute = getPartnerCommuteSummary(rot);
    if (pCommute && activeHubCoords) {
      let pTimeClass = 'time-green';
      if (pCommute.activeMins > 50) pTimeClass = 'time-red';
      else if (pCommute.activeMins > 35) pTimeClass = 'time-amber';

      const originParam = Array.isArray(activeHubCoords)
        ? `${activeHubCoords[0]},${activeHubCoords[1]}`
        : encodeURIComponent(activeHubName + ', UK');
      const destParam = Array.isArray(pCommute.partnerCoords)
        ? `${pCommute.partnerCoords[0]},${pCommute.partnerCoords[1]}`
        : encodeURIComponent(pCommute.partnerName + ', UK');

      const pRow = document.createElement('div');
      pRow.className = "commute-matrix-item";
      pRow.style.background = "var(--bg-card-subtle)";
      pRow.style.padding = "6px 8px";
      pRow.style.borderRadius = "4px";
      pRow.style.marginBottom = "4px";
      pRow.innerHTML = `
        <span class="commute-hosp-label">
          <span class="badge badge-partner-commute" style="font-size:0.62rem; margin-right:4px;">Partner</span>Partner: ${escapeHtml(pCommute.partnerName)}
        </span>
        <div style="display:flex; align-items:center; gap:6px;">
          <span class="commute-time-pill ${pTimeClass}" title="07:30: ~${pCommute.mornMins}m | 18:00: ~${pCommute.eveMins}m">
            ${pCommute.dist} mi (~${pCommute.mornMins}m morn · ~${pCommute.eveMins}m eve)
          </span>
          <a href="https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}&travelmode=${currentCommuteMode === 'transit' ? 'transit' : 'driving'}" target="_blank" rel="noopener noreferrer" style="font-size:0.68rem; color:var(--primary); text-decoration:none;" title="Verify partner route in Google Maps">Directions &rarr;</a>
        </div>
      `;
      fragMatrix.appendChild(pRow);
    }

    uniqueHospBases.forEach(hName => {
      const hData = activeHospitals[hName];
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

        const isTertiary = hData.type === 'Tertiary';
        const row = document.createElement('div');
        row.className = "commute-matrix-item";
        row.innerHTML = `
          <span class="commute-hosp-label">
            <span class="badge ${isTertiary ? 'badge-tertiary' : 'badge-dgh'}" style="font-size:0.62rem; margin-right:4px;">${isTertiary ? 'Tertiary' : 'DGH'}</span>${escapeHtml(hName)}
          </span>
          <div style="display:flex; align-items:center; gap:6px;">
            <span class="commute-time-pill ${timeClass}" title="07:30 handover: ~${mornMins}m | 18:00 rush: ~${eveMins}m">
              ${dist} mi (~${mornMins}m morn · ~${eveMins}m eve)
            </span>
            <a href="https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}&travelmode=${currentCommuteMode === 'transit' ? 'transit' : 'driving'}" target="_blank" rel="noopener noreferrer" style="font-size:0.68rem; color:var(--primary); text-decoration:none;" title="Verify route and live traffic in Google Maps">Directions &rarr;</a>
          </div>
        `;
        fragMatrix.appendChild(row);
      }
    });
    matrixContainer.replaceChildren(fragMatrix);
  }

  // Render Placement Sequence Timeline
  const timelineHeading = document.getElementById('timelineHeading');
  if (timelineHeading) {
    timelineHeading.textContent = isPool ? 'CANDIDATE HOSPITAL BASES (LOCAL ALLOCATION):' : 'HOSPITAL PLACEMENT SEQUENCE:';
  }

  const timeline = document.getElementById('timelineContainer');
  const fragTimeline = document.createDocumentFragment();
  const poolColor = isPool ? getRotationLineStyle(rot).color : '';

  rot.stages.forEach((stg, idx) => {
    const step = document.createElement('div');
    step.className = "timeline-step";
    step.style.cursor = 'pointer';
    step.title = `Click to locate ${stg.hosp} on map`;
    step.dataset.action = "focus-hospital";
    step.dataset.hosp = stg.hosp;

    const h = activeHospitals[stg.hosp];
    const isTertiary = h && h.type === 'Tertiary';
    const hospMapQuery = (h && h.coords && Array.isArray(h.coords))
      ? `${h.coords[0]},${h.coords[1]}`
      : encodeURIComponent(stg.hosp + ', UK');

    const dotHtml = isPool ? '•' : (idx + 1);
    const dotStyle = isPool ? `style="background:${poolColor}; font-size:11px;"` : '';

    step.innerHTML = `
      <div class="timeline-dot" ${dotStyle}>${dotHtml}</div>
      <div class="timeline-content">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div class="timeline-stage">${escapeHtml(stg.stage)}</div>
          <span class="badge ${isTertiary ? 'badge-tertiary' : 'badge-dgh'}" style="font-size:0.65rem;">${isTertiary ? 'Tertiary' : 'DGH'}</span>
        </div>
        <div class="timeline-hosp">
          <span>${escapeHtml(stg.hosp)}</span>
          <a href="https://www.google.com/maps/search/?api=1&query=${hospMapQuery}" target="_blank" style="color:var(--primary); font-size:0.7rem; text-decoration:none;">Map ↗</a>
        </div>
        <div class="timeline-desc">${escapeHtml(stg.desc)}</div>
      </div>
    `;
    fragTimeline.appendChild(step);
  });
  timeline.replaceChildren(fragTimeline);

  const commute = getRotationCommuteSummary(rot);

  const spreadLabel = commute.maxDist === 0 ? 'Single site' : `${commute.maxDist} mi`;
  document.getElementById('metricSites').textContent = uniqueHospBases.length;
  document.getElementById('metricDistance').textContent = spreadLabel;

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
  spreadBadge.textContent = commute.maxDist === 0 ? 'Single site' : `Max: ${commute.maxDist} mi`;
  if (commute.activeMins <= 35) {
    spreadBadge.className = 'badge badge-spread-low';
    spreadBadge.textContent = `Low Spread: ${spreadLabel} (~${commute.mornMins}m morn · ~${commute.eveMins}m eve)`;
  } else if (commute.activeMins <= 50) {
    spreadBadge.className = 'badge badge-spread-med';
    spreadBadge.textContent = `Moderate: ${spreadLabel} (~${commute.mornMins}m morn · ~${commute.eveMins}m eve)`;
  } else {
    spreadBadge.className = 'badge badge-spread-high';
    spreadBadge.textContent = `High Spread: ${spreadLabel} (~${commute.mornMins}m morn · ~${commute.eveMins}m eve)`;
  }

  const miniTitleEl = document.getElementById('miniCardTitle');
  if (miniTitleEl) miniTitleEl.textContent = `${rot.title} (${rot.code})`;
  const miniSpreadEl = document.getElementById('miniCardSpread');
  if (miniSpreadEl) {
    const miniSpreadBase = commute.maxDist === 0 ? 'Single site' : (isPool ? `${commute.maxDist} mi span` : `${commute.maxDist} mi`);
    miniSpreadEl.textContent = `${miniSpreadBase} (~${commute.activeMins}m)`;
    miniSpreadEl.className = `badge ${isPool ? 'badge-pool' : commute.badgeClass}`;
  }
  const miniHubEl = document.getElementById('miniCardHub');
  if (miniHubEl) {
    miniHubEl.innerHTML = `<span>Base: <b>${escapeHtml(activeHubName)}</b> (${uniqueHospBases.length} ${isPool ? 'Candidate Sites' : 'Bases'})</span> <span style="font-weight:700; color:var(--primary);">Details &rarr;</span>`;
  }

  // Background subtle markers for other hospitals
  Object.keys(activeHospitals).forEach(hName => {
    if (!uniqueHospBases.includes(hName)) {
      const h = activeHospitals[hName];
      const isRef = (hospitalRotationsMap.get(hName) || []).length === 0;
      const bgIcon = L.divIcon({
        className: isRef ? 'bg-site-pin bg-site-pin-ref' : 'bg-site-pin',
        iconSize: isRef ? [6, 6] : [10, 10],
        iconAnchor: isRef ? [3, 3] : [5, 5]
      });
      const bgMarker = L.marker(h.coords, {
        icon: bgIcon,
        zIndexOffset: isRef ? 50 : 100,
        title: isRef ? `${hName} (Regional Reference Site)` : hName
      }).bindPopup(`<b>${escapeHtml(hName)}</b><br><span style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(h.region)}${isRef ? ' • Reference Hospital' : ''}</span>`);
      backgroundHospitalsGroup.addLayer(bgMarker);
    }
  });

  currentBaseMarker = null;
  currentCommuteCircle = null;
  currentPartnerMarker = null;
  currentPartnerLine = null;
  currentPlottedHospitalPoints = [];
  currentActiveHubCoords = activeHubCoords;

  // Prepare Living Base with 25-Mile Buffer Circle
  if (activeHubCoords) {
    let pinClass = 'home-pin-driver';
    let pinIconHtml = 'Base';
    let circleColor = '#16a34a';

    if (currentCommuteMode === 'transit') {
      pinClass = 'home-pin-transit';
      pinIconHtml = 'Base';
      circleColor = '#7c3aed';
    } else if (currentCommuteMode === 'custom') {
      pinClass = 'home-pin-custom';
      pinIconHtml = 'Home';
      circleColor = '#d97706';
    }

    const homeIcon = L.divIcon({
      className: pinClass,
      html: pinIconHtml,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });
    const hubDescText = currentCommuteMode === 'custom' ? 'Custom prospective living base' : (activeHub.desc || '');
    currentBaseMarker = L.marker(activeHubCoords, { icon: homeIcon, zIndexOffset: 2000 })
      .bindPopup(`<b>Base: ${escapeHtml(activeHubName)}</b><br><span style="font-size:0.8rem; color:var(--text-muted);">${escapeHtml(hubDescText)}</span>`);

    currentCommuteCircle = L.circle(activeHubCoords, {
      radius: 40233.6, // 25 miles
      color: circleColor,
      fillColor: circleColor,
      fillOpacity: 0.04,
      weight: 1.5,
      dashArray: '5, 5',
      interactive: false
    });

    if (partnerWorkBase && partnerWorkBase.coords) {
      const partnerIcon = L.divIcon({
        className: 'partner-work-pin',
        html: 'Partner',
        iconSize: [48, 26],
        iconAnchor: [24, 13]
      });
      const pComm = getPartnerCommuteSummary(rot);
      const pPopupExtra = pComm ? `<br><span style="font-size:0.76rem; color:var(--text-muted);">${pComm.dist} mi from ${escapeHtml(activeHubName)} (~${pComm.mornMins}m morn · ~${pComm.eveMins}m eve)</span>` : '';
      currentPartnerMarker = L.marker(partnerWorkBase.coords, { icon: partnerIcon, zIndexOffset: 1950 })
        .bindPopup(`<b>Partner Workplace: ${escapeHtml(partnerWorkBase.name)}</b>${pPopupExtra}`);
      currentPartnerLine = L.polyline([activeHubCoords, partnerWorkBase.coords], {
        color: '#e11d48',
        weight: 2.5,
        dashArray: '5, 6',
        opacity: 0.82
      });
    }
  }

  // Plot Active Placement Base Pins
  const plottedHospitalPoints = [];
  const hospitalPlacements = new Map();
  activeHospitalMarkers = {};

  rot.stages.forEach((stg, idx) => {
    const hData = activeHospitals[stg.hosp];
    if (hData) {
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
    const hospObj = activeHospitals[data.hosp];
    const isTertiary = hospObj && hospObj.type === 'Tertiary';

    let icon;
    if (isPool) {
      icon = L.divIcon({
        className: 'hover-stage-badge-icon',
        html: `<div class="pool-site-pin${isTertiary ? ' tertiary-pool-pin' : ''}" style="background-color:${poolColor}; --pool-pin-color:${poolColor};">${isTertiary ? 'T' : 'H'}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
    } else {
      const stageNumbers = data.stages.map(s => s.num);
      const isMulti = stageNumbers.length > 1;
      const labelText = stageNumbers.join(', ');

      let iconWidth = 28;
      if (stageNumbers.length === 2) {
        iconWidth = 38;
      } else if (stageNumbers.length >= 3) {
        iconWidth = 54;
      }

      icon = L.divIcon({
        className: 'numbered-pin' + (isMulti ? ' multi-stage-pin' : ''),
        html: labelText,
        iconSize: [iconWidth, 28],
        iconAnchor: [Math.round(iconWidth / 2), 14]
      });
    }

    let popupStagesHtml = '';
    if (isPool) {
      popupStagesHtml = `
        <div style="border-top:1px solid var(--border-color); padding-top:6px; font-size:0.78rem;">
          <span class="badge badge-pool" style="padding:1px 6px; font-size:0.7rem;">Candidate Base</span>
          <div style="color:var(--text-muted); font-size:0.73rem; margin-top:2px;">${escapeHtml(data.stages[0].desc || 'Candidate hospital base (allocated locally)')}</div>
        </div>
      `;
    } else if (data.stages.length > 1) {
      popupStagesHtml = `
        <div style="font-size:0.75rem; color:var(--primary); font-weight:700; margin:4px 0 6px 0;">
          Rotated in ${data.stages.length} placements:
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

    const popupContent = `
      <div style="min-width:220px; max-width:290px;">
        <div style="font-weight:800; font-size:0.9rem; color:var(--text-main); margin-bottom:2px;">
          ${escapeHtml(data.hosp)}
        </div>
        <div style="font-size:0.72rem; color:var(--text-muted); margin-bottom:6px;">
          ${escapeHtml(data.region)} • <span class="badge ${isTertiary ? 'badge-tertiary' : 'badge-dgh'}" style="font-size:0.65rem;">${isTertiary ? 'Tertiary' : 'DGH'}</span>
        </div>
        ${popupStagesHtml}
        <div style="margin-top:8px; padding-top:6px; border-top:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; gap:6px;">
          <button class="hospital-chip-btn" style="font-size:0.72rem; padding:3px 7px;" data-action="open-hospital-profile" data-hosp="${escapeHtml(data.hosp)}">Profile</button>
          <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.hosp + ', UK')}" target="_blank" style="color:var(--primary); font-size:0.72rem; text-decoration:none;">Maps ↗</a>
        </div>
      </div>
    `;

    const m = L.marker(data.coords, { icon, zIndexOffset: 1500 + (!isPool && data.stages.length > 1 ? 50 : 0) })
      .bindPopup(popupContent);
    activeRouteGroup.addLayer(m);
    activeHospitalMarkers[data.hosp] = m;
  });

  // Polyline route: sequential tracks or pool radial dotted spokes
  const primaryRouteColor = (typeof getComputedStyle === 'function' && getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()) || '#C96442';
  if (!isPool && plottedHospitalPoints.length > 1) {
    const polyline = L.polyline(plottedHospitalPoints, {
      color: primaryRouteColor,
      weight: 3.5,
      dashArray: '6, 6',
      opacity: 0.88
    });
    activeRouteGroup.addLayer(polyline);
  } else if (isPool) {
    const spokeSegments = generatePoolSpokeSegments(rot);
    if (spokeSegments.length > 0) {
      const spokeLine = L.polyline(spokeSegments, {
        color: poolColor || primaryRouteColor,
        weight: 2.8,
        dashArray: '4, 7',
        opacity: 0.85
      });
      activeRouteGroup.addLayer(spokeLine);
    }
  }

  currentPlottedHospitalPoints = plottedHospitalPoints;

  const shouldShowBase = (showCommuteOverlay || currentInspectorTab === 'commute');
  if (shouldShowBase && currentBaseMarker && currentCommuteCircle) {
    activeRouteGroup.addLayer(currentBaseMarker);
    activeRouteGroup.addLayer(currentCommuteCircle);
  }
  if (shouldShowBase && currentPartnerMarker && currentPartnerLine) {
    activeRouteGroup.addLayer(currentPartnerMarker);
    activeRouteGroup.addLayer(currentPartnerLine);
  }

  const boundsPoints = (shouldShowBase && currentActiveHubCoords)
    ? [...currentPlottedHospitalPoints, currentActiveHubCoords, ...(partnerWorkBase && partnerWorkBase.coords ? [partnerWorkBase.coords] : [])]
    : [...currentPlottedHospitalPoints];

  fitMapToPoints(boundsPoints, 12);

  updateMapLegend();

  if (shouldCloseMobile && window.innerWidth <= 768) {
    toggleMobileSidebar(false);
  }
}

// 11. NATIONAL OVERVIEW MAP VIEW (Route lines mirror the currently filtered feed)
function renderAllPlacements({ fitView = true } = {}) {
  activeRouteGroup.clearLayers();
  backgroundHospitalsGroup.clearLayers();
  overviewLinesGroup.clearLayers();
  hoverHighlightGroup.clearLayers();
  activeHospitalMarkers = {};

  const titleEl = document.getElementById('miniCardTitle');
  if (titleEl) titleEl.textContent = `All UK Placement Sites (${Object.keys(activeHospitals).length} Bases)`;
  const spreadEl = document.getElementById('miniCardSpread');
  if (spreadEl) spreadEl.textContent = `${currentFilteredList.length} Rotations`;
  const hubEl = document.getElementById('miniCardHub');
  if (hubEl) hubEl.innerHTML = `<span>National Map View</span> <span style="font-weight:700; color:var(--primary);">Menu &rarr;</span>`;

  const allPoints = [];
  const linesByHospital = {};
  const regionColorsMap = activeRegionColors || {};

  overviewPolylinesMap = {};
  overviewHospitalMarkersMap = {};

  // 11a. Separated curved route lines for every rotation in the filtered feed (region, pills, search)
  if (overviewLinesMode !== 'off') {
    const corridorRegistry = buildCorridorUsageRegistry(currentFilteredList);

    currentFilteredList.forEach(rot => {
      const isPool = isPoolRotation(rot);
      const curvedSegments = isPool
        ? generatePoolSpokeSegments(rot)
        : generateRotationCurvedPath(rot, corridorRegistry);

      if (curvedSegments.length > 0) {
        const lineStyle = getRotationLineStyle(rot);
        const maxDist = getRotationMaxDistance(rot);
        const lineWeight = isPool ? 1.8 : 2;
        const lineDash = isPool ? '3, 6' : (lineStyle.dashPattern === 'none' ? null : lineStyle.dashPattern);
        const lineOpacity = isPool ? 0.45 : 0.42;

        const polyline = L.polyline(curvedSegments, {
          color: lineStyle.color,
          weight: lineWeight,
          dashArray: lineDash,
          opacity: lineOpacity
        });

        const displayStages = isPool ? rot.stages : getOverviewStages(rot);
        const stagesSummary = isPool
          ? getRotationHospitalBases(rot).map(h => escapeHtml(h)).join(' • ')
          : displayStages.map(s => escapeHtml(s.hosp)).join(' &rarr; ');
        const isFilteredCore = !isPool && overviewLinesMode === 'core' && displayStages.length < rot.stages.length;

        const tooltipContent = `
          <div style="min-width:180px; max-width:290px;">
            <div style="font-weight:800; font-size:0.84rem; color:var(--text-main); margin-bottom:2px;">${escapeHtml(rot.title)}</div>
            <div style="font-size:0.72rem; color:var(--text-muted); margin-bottom:4px;">
              <span class="badge badge-code" style="padding:1px 4px; font-size:0.68rem;">${escapeHtml(rot.code)}</span>${isPool ? ' <span class="badge badge-pool" style="padding:1px 4px; font-size:0.65rem;">Pool</span>' : ''} • ${escapeHtml(formatPlacesLabel(rot.places, false))} • ${maxDist === 0 ? 'Single site' : `Max Spread: ${maxDist} mi`}
            </div>
            <div style="font-size:0.72rem; color:var(--primary); font-weight:700; line-height:1.35;">
              ${stagesSummary}
            </div>
            ${isFilteredCore ? `<div style="font-size:0.68rem; color:var(--text-muted); font-style:italic; margin-top:2px;">Core bases shown (${rot.stages.length - displayStages.length} 3m subspecialty hops filtered)</div>` : ''}
          </div>
        `;
        polyline.bindTooltip(tooltipContent, { sticky: true, className: 'rotation-line-tooltip' });

        polyline.on('mouseover', function() {
          highlightOverviewTrack(rot.id);
        });

        polyline.on('mouseout', function() {
          resetOverviewTrackHighlights();
        });

        polyline.on('click', function(e) {
          L.DomEvent.stopPropagation(e);
          openDetailsForRotation(rot.id);
        });

        overviewLinesGroup.addLayer(polyline);

        overviewPolylinesMap[rot.id] = {
          polyline,
          baseColor: lineStyle.color,
          baseWeight: lineWeight,
          baseDash: isPool ? '3, 6' : lineStyle.dashPattern,
          baseOpacity: lineOpacity,
          highlightColor: lineStyle.color
        };

        const hospNamesForLine = isPool ? getRotationHospitalBases(rot) : displayStages.map(s => s.hosp);
        hospNamesForLine.forEach(hName => {
          if (!hName) return;
          if (!linesByHospital[hName]) linesByHospital[hName] = [];
          linesByHospital[hName].push({ line: polyline, color: lineStyle.color, dash: isPool ? '3, 6' : lineStyle.dashPattern, weight: lineWeight, opacity: lineOpacity });
        });
      }
    });
  }

  // 11b. Plot Hospital Pins
  Object.keys(activeHospitals).forEach(hName => {
    const h = activeHospitals[hName];

    const linkedRotations = hospitalRotationsMap.get(hName) || [];

    if (activeRegionFilter !== "ALL" && h.region !== activeRegionFilter) {
      const linkedInRegion = linkedRotations.filter(r => r.region === activeRegionFilter);
      if (!linkedInRegion.length) return;
    }

    allPoints.push(h.coords);
    const regColor = regionColorsMap[h.region] || "#0284c7";
    const linkedPoolsInRegion = linkedRotations.filter(r => isPoolRotation(r) && r.region === h.region);
    const poolPinColors = [];
    linkedPoolsInRegion.forEach(p => {
      const c = getRotationLineStyle(p).color;
      if (c && !poolPinColors.includes(c)) poolPinColors.push(c);
    });

    let pinBgStyle = `background-color: ${regColor};`;
    let popupRegColor = regColor;
    if (poolPinColors.length === 1) {
      pinBgStyle = `background-color: ${poolPinColors[0]};`;
      popupRegColor = poolPinColors[0];
    } else if (poolPinColors.length === 2) {
      pinBgStyle = `background: linear-gradient(135deg, ${poolPinColors[0]} 0% 50%, ${poolPinColors[1]} 50% 100%);`;
      popupRegColor = poolPinColors[0];
    } else if (poolPinColors.length > 2) {
      const step = 360 / poolPinColors.length;
      const stops = poolPinColors.map((c, idx) => `${c} ${Math.round(idx * step)}deg ${Math.round((idx + 1) * step)}deg`).join(', ');
      pinBgStyle = `background: conic-gradient(${stops});`;
      popupRegColor = poolPinColors[0];
    }

    const linkedHtml = linkedRotations.length ? 
      `<div class="overview-popup-rot-list">
        <span style="font-size:0.7rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Click a rotation to view route:</span>
        ${linkedRotations.map(r => `
          <button class="popup-rotation-btn" data-action="dive-in" data-id="${escapeHtml(r.id)}">
            <span>${escapeHtml(r.code)}</span>
            <span style="font-size:0.7rem; color:var(--text-muted);">${escapeHtml(formatPlacesLabel(r.places, true))} &rarr;</span>
          </button>
        `).join('')}
       </div>` : '';

    const isTertiary = h.type === 'Tertiary';
    const isRefSite = (linkedRotations.length === 0);

    const icon = L.divIcon({
      className: isRefSite ? 'overview-hosp-pin reference-only-pin' : 'overview-hosp-pin',
      html: `<div style="${pinBgStyle} width: 100%; height: 100%; border-radius: 50%;"></div>`,
      iconSize: isRefSite ? [7, 7] : [12, 12],
      iconAnchor: isRefSite ? [3.5, 3.5] : [6, 6]
    });

    const hospCountHtml = linkedRotations.length > 0 ? `
      <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:6px;">Included in <b>${linkedRotations.length}</b> rotation scheme(s).</div>
      <button class="hospital-chip-btn" style="width:100%; margin-bottom:6px; font-size:0.73rem; padding:4px 8px; background:var(--primary); color:#fff; border-color:var(--primary);" data-action="filter-by-hospital" data-hosp="${escapeHtml(hName)}">
        Filter Map &amp; Feed to this Hospital (${linkedRotations.length})
      </button>
    ` : `
      <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:6px;">
        <span style="font-style:italic;">${escapeHtml(activeDataset.referenceNote || 'Regional Anaesthesia Training Hospital.')}</span>
      </div>
    `;

    const m = L.marker(h.coords, {
      icon,
      zIndexOffset: isRefSite ? 150 : 500,
      title: isRefSite ? `${hName} (Regional Reference Site)` : hName
    }).bindPopup(`
      <div class="overview-popup-title">${escapeHtml(hName)}</div>
      <div class="overview-popup-reg" style="color:${popupRegColor};">${escapeHtml(h.region)} • <span class="badge ${isTertiary ? 'badge-tertiary' : 'badge-dgh'}" style="font-size:0.65rem;">${isTertiary ? 'Tertiary' : 'DGH'}</span></div>
      ${hospCountHtml}
      <button class="hospital-chip-btn" style="width:100%; margin-bottom:8px; font-size:0.73rem; padding:4px 8px;" data-action="open-hospital-profile" data-hosp="${escapeHtml(hName)}">Hospital Profile &rarr;</button>
      ${linkedHtml}
    `, { maxWidth: 280 });

    m.on('mouseover', function() {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const lines = linesByHospital[hName] || [];
      lines.forEach(item => {
        item.line.setStyle({ weight: 3.8, opacity: 0.95, color: isDark ? '#38bdf8' : item.color });
        item.line.bringToFront();
      });
    });

    m.on('mouseout', function() {
      const lines = linesByHospital[hName] || [];
      lines.forEach(item => {
        item.line.setStyle({ weight: item.weight || 2, opacity: item.opacity || 0.42, color: item.color, dashArray: item.dash === 'none' ? null : item.dash });
      });
    });

    backgroundHospitalsGroup.addLayer(m);
    overviewHospitalMarkersMap[hName] = m;
  });

  if (fitView && allPoints.length > 0) {
    if (activeRegionFilter !== "ALL") {
      map.fitBounds(L.latLngBounds(allPoints), { padding: [50, 50], maxZoom: 10 });
    } else {
      map.setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM);
    }
  }

  updateMapLegend();
}

function toggleOverviewLines() {
  if (overviewLinesMode === 'all') {
    overviewLinesMode = 'core';
  } else if (overviewLinesMode === 'core') {
    overviewLinesMode = 'off';
  } else {
    overviewLinesMode = 'all';
  }

  const btnMap = document.getElementById('btnMapLinesToggle');
  if (btnMap) {
    if (overviewLinesMode === 'all') {
      btnMap.textContent = 'Lines: All';
      btnMap.classList.add('active-btn');
    } else if (overviewLinesMode === 'core') {
      btnMap.textContent = 'Lines: Core Bases';
      btnMap.classList.add('active-btn');
    } else {
      btnMap.textContent = 'Lines: OFF';
      btnMap.classList.remove('active-btn');
    }
  }

  if (currentViewMode === 'list') {
    renderAllPlacements({ fitView: false });
  }

  const modeLabels = {
    all: 'All Transitions',
    core: 'Core Bases Only (3m modules filtered)',
    off: 'Hidden'
  };
  showToast(`Rotation network lines: ${modeLabels[overviewLinesMode]}`);
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
function refreshAfterFilterChange(fitView = false, redrawMap = true) {
  if (currentViewMode === 'details') {
    applyFiltersAndSearch({ redrawMap: false });
    showListView();
  } else {
    applyFiltersAndSearch({ fitView, redrawMap });
  }
}

const QUICK_FILTER_PILLS = {
  ALL: 'pillAll', STARRED: 'pillStarred', TIER1: 'pillTier1',
  TIER2: 'pillTier2', TIER3: 'pillTier3', LOW_SPREAD: 'pillLowSpread',
  EXCLUDED: 'pillExcluded'
};

function updateQuickFilterPills() {
  Object.entries(QUICK_FILTER_PILLS).forEach(([key, elId]) => {
    const el = document.getElementById(elId);
    if (el) {
      const isActive = activeQuickFilter === key;
      el.classList.toggle('active', isActive);
      el.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    }
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
  refreshAfterFilterChange(false, false);
}

function resetAllFilters() {
  activeRegionFilter = 'ALL';
  activeQuickFilter = 'ALL';
  currentSortMode = 'ALPHA_ASC';
  currentSearchTerm = '';
  clearTimeout(searchDebounceTimer);

  const regSelect = document.getElementById('regionFilter');
  if (regSelect) regSelect.value = 'ALL';

  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) sortSelect.value = 'ALPHA_ASC';

  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';
  const clearBtn = document.getElementById('btnSearchClear');
  if (clearBtn) clearBtn.style.display = 'none';

  updateQuickFilterPills();
  refreshAfterFilterChange(true);
  showToast("All filters reset");
}

function applyFiltersAndSearch({ fitView = false, redrawMap = true } = {}) {
  let list = [...activeRotations];

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
  } else if (activeQuickFilter === 'EXCLUDED') {
    list = list.filter(r => getUserData(r.id).tier === 'EXCLUDE');
  }

  // Search Filter
  if (currentSearchTerm) {
    const q = currentSearchTerm;
    list = list.filter(r =>
      (r._meta && r._meta.searchText ? r._meta.searchText.includes(q) : false) ||
      (getUserData(r.id).notes && getUserData(r.id).notes.toLowerCase().includes(q))
    );
  }

  // Sort Engine
  const naturalCompare = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare;
  if (currentSortMode === 'ALPHA_ASC') {
    list.sort((a, b) => naturalCompare(a.code || a.title, b.code || b.title));
  } else if (currentSortMode === 'SPREAD_ASC') {
    list.sort((a, b) => ((a._meta && typeof a._meta.intrinsicSpread === 'number' ? a._meta.intrinsicSpread : getRotationMaxDistance(a)) - (b._meta && typeof b._meta.intrinsicSpread === 'number' ? b._meta.intrinsicSpread : getRotationMaxDistance(b))));
  } else if (currentSortMode === 'COMMUTE_ASC') {
    list.sort((a, b) => getRotationCommuteSummary(a).activeMins - getRotationCommuteSummary(b).activeMins);
  } else if (currentSortMode === 'PLACES_DESC') {
    list.sort((a, b) => ((b._meta ? b._meta.placesNum : parseInt(b.places, 10)) || 0) - ((a._meta ? a._meta.placesNum : parseInt(a.places, 10)) || 0));
  } else if (currentSortMode === 'RATING_DESC') {
    list.sort((a, b) => getUserData(b.id).rating - getUserData(a.id).rating);
  } else {
    list.sort((a, b) => naturalCompare(a.code || a.title, b.code || b.title));
  }

  currentFilteredList = list;
  const countBadge = document.getElementById('listCountBadge');
  if (countBadge) countBadge.textContent = list.length;

  populateDropdown(list);
  renderRotationCardsFeed(list);

  // Keep the national map's route lines in step with the feed
  if (currentViewMode === 'list' && redrawMap) {
    renderAllPlacements({ fitView });
  }
}

// 13. SHORTLIST, REORDERING & ORIEL SUBMISSION COMPANION
function openShortlistModal() {
  flushPendingNotes();
  renderShortlistModal();
  openModal('shortlistModal');
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
    textEl.innerHTML = `<b>Entered in Oriel:</b> ${enteredCount} of ${total} (${pct}%)`;
    if (enteredCount === total && total > 0) {
      textEl.innerHTML += ` <span style="color:var(--emerald); font-weight:800; margin-left:6px;">All Preferences Entered!</span>`;
    }
  }
  if (barEl) {
    barEl.style.width = `${pct}%`;
    barEl.style.backgroundColor = enteredCount === total ? 'var(--emerald)' : 'var(--primary)';
  }
}

function toggleOrielEntered(id) {
  if (!KNOWN_IDS.has(id)) return;
  if (orielCheckedSet.has(id)) {
    orielCheckedSet.delete(id);
  } else {
    orielCheckedSet.add(id);
  }
  safeStorage.set(`${STORAGE_PREFIX}oriel_checked`, JSON.stringify([...orielCheckedSet]));
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

async function resetOrielChecks() {
  if (!orielCheckedSet.size) {
    showToast("No checkmarks to reset.");
    return;
  }
  const confirmed = await requestUserConfirm({
    title: 'Reset Oriel Checkmarks',
    message: "Reset all 'Entered in Oriel' checkboxes?",
    confirmText: 'Reset Checks',
    danger: true
  });
  if (confirmed) {
    orielCheckedSet.clear();
    safeStorage.remove(`${STORAGE_PREFIX}oriel_checked`);
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
  let lines = [`${activeDataset.shortLabel} Anaesthetics — Ranked Preferencing List for Oriel:`];
  lines.push("=".repeat(50));
  shortlistOrder.forEach((id, idx) => {
    const r = activeRotations.find(x => x.id === id);
    if (r) {
      const d = getUserData(id);
      const tierStr = d.tier && d.tier !== 'UNSET' ? ` [${d.tier}]` : '';
      const notesStr = d.notes ? ` (Notes: ${d.notes})` : '';
      lines.push(`${idx + 1}. [${r.code}] ${r.title} — ${r.region} (${r.places})${tierStr}${notesStr}`);
    }
  });
  lines.push("=".repeat(50));
  lines.push(`Generated via ${activeDataset.shortLabel} Rotation Explorer (for personal records / Oriel entry)`);

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
    const r = activeRotations.find(x => x.id === id);
    if (!r) return;
    const d = getUserData(id);
    const commute = getRotationCommuteSummary(r);
    const activeBaseName = (currentCommuteMode === 'custom' && customHomeBase && customHomeBase.coords)
      ? customHomeBase.name
      : (currentCommuteMode === 'transit' && r.hubs && r.hubs.transit ? r.hubs.transit.name : r.hubs.driver.name);
    const activeBaseLabel = (currentCommuteMode === 'custom' && customHomeBase && customHomeBase.coords)
      ? 'Custom Base'
      : (currentCommuteMode === 'transit' ? 'Public Transport Base' : 'Driving Base');
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
          <div style="font-size:0.75rem; color:#444;">${escapeHtml(r.region)} • <b>${escapeHtml(formatPlacesLabel(r.places, false))}</b></div>
        </td>
        <td style="font-size:0.75rem;">
          <div><b>${escapeHtml(activeBaseLabel)}:</b> ${escapeHtml(activeBaseName)}</div>
          <div style="color:#555;">${escapeHtml(bases)}</div>
        </td>
        <td style="font-size:0.75rem; text-align:center; white-space:nowrap; width:95px;">
          <b>${commute.commuteDist} mi</b><br>
          ~${commute.mornMins}m (07:30)<br>
          ~${commute.eveMins}m (18:00)
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
          <h1 style="margin:0; font-size:1.4rem; color:#000;">${escapeHtml(activeDataset.shortLabel)} Anaesthetics — Oriel Preferencing Checklist</h1>
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
      <span>Generated by ${escapeHtml(activeDataset.appTitle)}</span>
      <span>Double check all codes and click Save in Oriel before the deadline!</span>
    </div>
  `;

  window.print();
}

function sortShortlistWithinTiers(mode) {
  syncShortlistOrder();
  if (shortlistOrder.length < 2) return;
  const naturalCompare = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare;
  const buckets = { 1: [], 2: [], 3: [], 4: [] };
  shortlistOrder.forEach(id => {
    const r = activeRotations.find(x => x.id === id);
    if (r) {
      const p = getTierPriority(getUserData(id).tier);
      buckets[p].push(r);
    }
  });
  [1, 2, 3, 4].forEach(p => {
    buckets[p].sort((a, b) => {
      if (mode === 'rating') {
        const diff = getUserData(b.id).rating - getUserData(a.id).rating;
        if (diff !== 0) return diff;
        return getRotationCommuteSummary(a).activeMins - getRotationCommuteSummary(b).activeMins;
      } else if (mode === 'commute') {
        const diff = getRotationCommuteSummary(a).activeMins - getRotationCommuteSummary(b).activeMins;
        if (diff !== 0) return diff;
        return getUserData(b.id).rating - getUserData(a.id).rating;
      }
      return naturalCompare(a.code || a.title, b.code || b.title);
    });
  });
  shortlistOrder = [1, 2, 3, 4].flatMap(p => buckets[p].map(r => r.id));
  safeStorage.set(`${STORAGE_PREFIX}shortlist_order`, JSON.stringify(shortlistOrder));
  renderShortlistModal();
  const labels = { rating: 'Star Rating (High → Low)', commute: 'Commute (Low → High)', alpha: 'Code (A–Z)' };
  showToast(`Sorted within tiers by ${labels[mode] || mode}`);
}

function renderShortlistModal() {
  const body = document.getElementById('shortlistModalBody');
  if (!body) return;

  const starred = syncShortlistOrder()
    .map(id => activeRotations.find(r => r.id === id))
    .filter(Boolean);

  if (!starred.length) {
    body.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted);"><p style="font-weight:700;">No rotations shortlisted yet!</p><p style="font-size:0.8rem; margin-top:4px;">Give stars, assign a Tier, or add notes to build your shortlist.</p></div>`;
    updateOrielProgressBar();
    return;
  }

  const frag = document.createDocumentFragment();

  const sortBar = document.createElement('div');
  sortBar.className = 'shortlist-autosort-bar';
  sortBar.innerHTML = `
    <span style="font-size:0.74rem; font-weight:800; color:var(--text-muted);">Sort within each Tier:</span>
    <div style="display:flex; gap:5px; flex-wrap:wrap;">
      <button type="button" class="btn-step" style="font-size:0.72rem; padding:3px 8px;" data-action="sort-shortlist-within-tiers" data-mode="rating">★ Rating ↓</button>
      <button type="button" class="btn-step" style="font-size:0.72rem; padding:3px 8px;" data-action="sort-shortlist-within-tiers" data-mode="commute">Commute ↑</button>
      <button type="button" class="btn-step" style="font-size:0.72rem; padding:3px 8px;" data-action="sort-shortlist-within-tiers" data-mode="alpha">A–Z Code</button>
    </div>
  `;
  frag.appendChild(sortBar);

  const tierLabels = {
    TIER1: 'Tier 1 — Top Choices',
    TIER2: 'Tier 2 — Strong Contenders',
    TIER3: 'Tier 3 — Backups',
    UNSET: 'Un-tiered (Starred / Noted)'
  };
  const tierCounts = {};
  starred.forEach(r => {
    const tk = getUserData(r.id).tier || 'UNSET';
    tierCounts[tk] = (tierCounts[tk] || 0) + 1;
  });
  let lastTierGroup = null;

  starred.forEach((r, idx) => {
    const data = getUserData(r.id);
    const tierKey = data.tier || 'UNSET';
    if (tierKey !== lastTierGroup) {
      lastTierGroup = tierKey;
      const divider = document.createElement('div');
      divider.className = `shortlist-tier-divider tier-div-${tierKey.toLowerCase()}`;
      divider.innerHTML = `
        <span>${tierLabels[tierKey] || tierKey}</span>
        <span class="shortlist-tier-count">${tierCounts[tierKey] || 0} rotation${tierCounts[tierKey] === 1 ? '' : 's'}</span>
      `;
      frag.appendChild(divider);
    }

    const commute = getRotationCommuteSummary(r);
    const activeBaseName = (currentCommuteMode === 'custom' && customHomeBase && customHomeBase.coords)
      ? customHomeBase.name
      : (currentCommuteMode === 'transit' && r.hubs && r.hubs.transit ? r.hubs.transit.name : r.hubs.driver.name);
    const activeBaseLabel = (currentCommuteMode === 'custom' && customHomeBase && customHomeBase.coords)
      ? 'Custom Base'
      : (currentCommuteMode === 'transit' ? 'Public Transport Base' : 'Driving Base');
    const isEntered = orielCheckedSet.has(r.id);

    let tierBadgeHtml = '';
    if (data.tier === 'TIER1') tierBadgeHtml = '<span class="badge badge-tier-1">Tier 1</span>';
    else if (data.tier === 'TIER2') tierBadgeHtml = '<span class="badge badge-tier-2">Tier 2</span>';
    else if (data.tier === 'TIER3') tierBadgeHtml = '<span class="badge badge-tier-3">Tier 3</span>';
    else if (data.tier === 'EXCLUDE') tierBadgeHtml = '<span class="badge badge-tier-exclude">Excluded</span>';

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
        safeStorage.set(`${STORAGE_PREFIX}shortlist_order`, JSON.stringify(shortlistOrder));
        renderShortlistModal();
      }
    };

    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
          <span style="cursor:grab; font-size:1.05rem;" title="Drag card to reorder rank">☰</span>
          <span style="font-size:0.75rem; font-weight:800; color:var(--text-muted);">Rank:</span>
          <input type="number" class="rank-input" value="${idx + 1}" min="1" max="${starred.length}" data-action="change-rank-input" data-index="${idx}" aria-label="Rank for ${escapeHtml(r.code)}" title="Change rank number">
          <strong class="oriel-code-badge" title="Oriel Track Code">${escapeHtml(r.code)}</strong>
          <button class="btn-copy-code" data-action="copy-oriel-code" data-code="${escapeHtml(r.code)}" title="Copy exact Oriel code to clipboard">Copy</button>
          ${tierBadgeHtml}
          <span class="badge ${commute.badgeClass}" style="font-size:0.68rem;" title="Peak commute estimates">
            ${commute.commuteDist} mi (~${commute.mornMins}m morn · ~${commute.eveMins}m eve)
          </span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <label class="oriel-check-label" title="Mark as entered into Oriel portal">
            <input type="checkbox" ${isEntered ? 'checked' : ''} data-action="toggle-oriel-entered" data-id="${r.id}">
            <span>${isEntered ? '✓ Entered on Oriel' : 'Mark Entered'}</span>
          </label>
          <span style="color:var(--amber); font-weight:800; font-size:0.85rem;">${'★'.repeat(data.rating)}</span>
          <div style="display:flex; gap:2px;">
            <button class="btn-step" style="padding:2px 6px; font-size:0.7rem;" data-action="move-shortlist" data-index="${idx}" data-dir="-1" aria-label="Move item up">▲</button>
            <button class="btn-step" style="padding:2px 6px; font-size:0.7rem;" data-action="move-shortlist" data-index="${idx}" data-dir="1" aria-label="Move item down">▼</button>
          </div>
        </div>
      </div>
      <div style="font-weight:700; font-size:0.9rem; margin:6px 0 3px 0;">${escapeHtml(r.title)}</div>
      <div style="font-size:0.75rem; color:var(--text-muted);">
        <span>${escapeHtml(activeBaseLabel)}: <b>${escapeHtml(activeBaseName)}</b></span> • 
        <span>Region: <b>${escapeHtml(r.region)}</b></span> • 
        <span>Places: <b>${escapeHtml(formatPlacesLabel(r.places, false))}</b></span>
      </div>
      ${data.notes ? `<div style="margin-top:6px; font-size:0.74rem; background:var(--bg-card-subtle); border:1px solid var(--border-color); color:var(--text-main); padding:6px 9px; border-radius:4px; font-style:italic;">"${escapeHtml(data.notes)}"</div>` : ''}
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; padding-top:6px; border-top:1px solid var(--border-color);">
        <button class="btn-step" style="font-size:0.7rem; padding:3px 8px;" data-action="view-details-shortlist" data-id="${r.id}">View Details &amp; Hospitals &rarr;</button>
        <button style="border:none; background:none; color:#b91c1c; font-size:0.72rem; font-weight:700; cursor:pointer;" data-action="remove-shortlist-item" data-id="${r.id}">✕ Remove from Shortlist</button>
      </div>
    `;
    frag.appendChild(div);
  });

  body.replaceChildren(frag);
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
  safeStorage.set(`${STORAGE_PREFIX}shortlist_order`, JSON.stringify(shortlistOrder));
  renderShortlistModal();
}

function moveShortlistItem(index, dir) {
  const newIndex = index + dir;
  if (newIndex < 0 || newIndex >= shortlistOrder.length) return;
  const temp = shortlistOrder[index];
  shortlistOrder[index] = shortlistOrder[newIndex];
  shortlistOrder[newIndex] = temp;
  safeStorage.set(`${STORAGE_PREFIX}shortlist_order`, JSON.stringify(shortlistOrder));
  renderShortlistModal();
}

async function removeShortlistItem(id) {
  const r = activeRotations.find(x => x.id === id);
  const label = r ? r.code : 'this rotation';
  const confirmed = await requestUserConfirm({
    title: 'Remove from Shortlist',
    message: `Remove ${label} from your shortlist? This clears its star rating, tier and notes.`,
    confirmText: 'Remove',
    danger: true
  });
  if (!confirmed) return;

  shortlistOrder = shortlistOrder.filter(x => x !== id);
  safeStorage.set(`${STORAGE_PREFIX}shortlist_order`, JSON.stringify(shortlistOrder));
  orielCheckedSet.delete(id);
  safeStorage.set(`${STORAGE_PREFIX}oriel_checked`, JSON.stringify([...orielCheckedSet]));
  setUserData(id, { rating: 0, tier: 'UNSET', notes: "" });
  updateShortlistBadge();
  updateLandingStatsAndBadges();
  applyFiltersAndSearch();
  if (currentViewMode === 'details' && currentSelectedId === id) {
    selectRotation(id, false);
  }
  renderShortlistModal();
  showToast("Removed from shortlist");
}

// 14. SIDE-BY-SIDE ROTATION COMPARISON

function toggleCompareFromCard() {
  if (currentSelectedId) toggleCompare(currentSelectedId);
}

function toggleCompare(id) {
  if (!KNOWN_IDS.has(id)) return;
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
  safeStorage.set(`${STORAGE_PREFIX}compare_list`, JSON.stringify(compareList));
  updateCompareBadge();
  renderRotationCardsFeed(currentFilteredList);
  if (currentSelectedId && currentViewMode === 'details') {
    const cardCompareBtn = document.getElementById('cardCompareBtn');
    if (cardCompareBtn) {
      const isComparing = compareList.includes(currentSelectedId);
      cardCompareBtn.classList.toggle('in-compare', isComparing);
      cardCompareBtn.textContent = isComparing ? 'In Compare' : 'Compare';
    }
  }
}

function openCompareModal() {
  flushPendingNotes();
  renderCompareModal();
  openModal('compareModal');
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

  const rotations = compareList.map(id => activeRotations.find(x => x.id === id)).filter(Boolean);
  if (!rotations.length) return;

  const minDist = Math.min(...rotations.map(r => getRotationCommuteSummary(r).maxDist));

  let html = `
    <div class="compare-matrix-wrapper" tabindex="0" role="region" aria-label="Side-by-side rotation comparison">
      <table class="compare-table">
        <caption class="visually-hidden">Side-by-side comparison of selected Anaesthetics training rotations</caption>
        <thead>
          <tr>
            <th scope="col" class="compare-label-th">Rotation Scheme</th>
            ${rotations.map(r => `
              <th scope="col" class="compare-col-header">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px; gap:4px; flex-wrap:wrap;">
                  <div style="display:flex; gap:4px; align-items:center;">
                    <span class="badge badge-code">${escapeHtml(r.code)}</span>
                    ${isPoolRotation(r) ? '<span class="badge badge-pool" style="font-size:0.68rem; padding:1px 5px;">Pool</span>' : ''}
                  </div>
                  <button style="border:none; background:none; color:#b91c1c; font-size:0.75rem; font-weight:800; cursor:pointer;" data-action="remove-compare" data-id="${r.id}">✕ Remove</button>
                </div>
                <div style="font-weight:800; font-size:0.88rem; margin-bottom:2px;">${escapeHtml(r.title)}</div>
                <div style="font-size:0.72rem; color:var(--text-muted); font-weight:normal;">${escapeHtml(r.region)} • <b>${escapeHtml(formatPlacesLabel(r.places, false))}</b></div>
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" class="compare-label-th">Training Balance</th>
            ${rotations.map(r => {
              const split = getRotationTrainingSplit(r);
              return `
                <td>
                  <div style="font-weight:700; font-size:0.78rem; margin-bottom:4px;">
                    ${split.tertiary}% Tertiary • ${split.dgh}% DGH
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
            <th scope="row" class="compare-label-th">Peak Commute Spread</th>
            ${rotations.map(r => {
              const commute = getRotationCommuteSummary(r);
              const isBest = commute.maxDist === minDist && rotations.length > 1;
              return `
                <td>
                  <div style="font-weight:800; font-size:0.85rem;">
                    ${commute.maxDist === 0 ? 'Single site' : `${commute.maxDist} mi`} ${isBest ? '<span class="compare-best-badge">Lowest Spread</span>' : ''}
                  </div>
                  <div style="font-size:0.74rem; color:var(--text-muted); margin-top:3px;">
                    ~${commute.mornMins}m @ 07:30<br>
                    ~${commute.eveMins}m @ 18:00
                  </div>
                </td>
              `;
            }).join('')}
          </tr>
          <tr>
            <th scope="row" class="compare-label-th">Living Hub Base</th>
            ${rotations.map(r => `
              <td>
                <div style="font-size:0.76rem;"><b>Driver:</b> ${escapeHtml(r.hubs.driver.name)}</div>
                <div style="font-size:0.76rem; margin-top:3px; color:var(--text-muted);"><b>Public Transport:</b> ${escapeHtml(r.hubs.transit.name)}</div>
              </td>
            `).join('')}
          </tr>
          ${partnerWorkBase && partnerWorkBase.coords ? `
          <tr>
            <th scope="row" class="compare-label-th">Partner Commute (${escapeHtml(partnerWorkBase.name)})</th>
            ${rotations.map(r => {
              const pComm = getPartnerCommuteSummary(r);
              if (!pComm) return `<td><span style="color:var(--text-muted);">—</span></td>`;
              return `
                <td>
                  <div style="font-weight:800; font-size:0.84rem; color:#e11d48;">
                    ${pComm.dist} mi <span style="font-size:0.7rem; font-weight:600; color:var(--text-muted);">(from ${escapeHtml(pComm.baseName)})</span>
                  </div>
                  <div style="font-size:0.74rem; color:var(--text-muted); margin-top:3px;">
                    ~${pComm.mornMins}m @ 07:30<br>
                    ~${pComm.eveMins}m @ 18:00
                  </div>
                </td>
              `;
            }).join('')}
          </tr>
          ` : ''}
          <tr>
            <th scope="row" class="compare-label-th">Hospital Bases</th>
            ${rotations.map(r => {
              const bases = getRotationHospitalBases(r);
              return `
                <td>
                  <div style="display:flex; flex-direction:column; gap:3px;">
                    ${bases.map(b => {
                      const h = activeHospitals[b];
                      const isTertiary = h && h.type === 'Tertiary';
                      return `<span style="font-size:0.74rem;">${escapeHtml(b)} <span class="badge ${isTertiary ? 'badge-tertiary' : 'badge-dgh'}" style="font-size:0.62rem; margin-left:3px;">${isTertiary ? 'Tertiary' : 'DGH'}</span></span>`;
                    }).join('')}
                  </div>
                </td>
              `;
            }).join('')}
          </tr>
          <tr>
            <th scope="row" class="compare-label-th">Rating &amp; Tier</th>
            ${rotations.map(r => {
              const data = getUserData(r.id);
              let tierBadge = '<span style="color:var(--text-muted); font-size:0.72rem;">Unset</span>';
              if (data.tier === 'TIER1') tierBadge = '<span class="badge badge-tier-1">Tier 1</span>';
              else if (data.tier === 'TIER2') tierBadge = '<span class="badge badge-tier-2">Tier 2</span>';
              else if (data.tier === 'TIER3') tierBadge = '<span class="badge badge-tier-3">Tier 3</span>';
              else if (data.tier === 'EXCLUDE') tierBadge = '<span class="badge badge-tier-exclude">Excluded</span>';
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
            <th scope="row" class="compare-label-th">Action</th>
            ${rotations.map(r => `
              <td>
                <button class="btn-top btn-export" style="width:100%; justify-content:center; padding:5px 8px; font-size:0.73rem;" data-action="view-details-compare" data-id="${r.id}">
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
let pendingMapPick = null;
let pendingMapPickTimer = null;
let activeGeocodeController = null;

function isWithinUkBounds(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= 49.0 && lat <= 61.5 && lng >= -9.5 && lng <= 3.0;
}

async function fetchJsonChecked(url, signal) {
  const r = await fetch(url, { signal });
  if (!r.ok) {
    const err = new Error(`HTTP ${r.status}`);
    err.status = r.status;
    throw err;
  }
  return r.json();
}

async function geocodeUkLocation(query, onFound, notFoundMsg) {
  if (activeGeocodeController) {
    activeGeocodeController.abort();
  }
  const controller = new AbortController();
  activeGeocodeController = controller;
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  const cleanPC = query.replace(/\s+/g, '');

  try {
    try {
      const data = await fetchJsonChecked(`https://api.postcodes.io/postcodes/${encodeURIComponent(cleanPC)}`, controller.signal);
      if (data && data.status === 200 && data.result) {
        onFound(data.result.postcode, [data.result.latitude, data.result.longitude]);
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') throw e;
    }

    try {
      const outData = await fetchJsonChecked(`https://api.postcodes.io/outcodes/${encodeURIComponent(cleanPC)}`, controller.signal);
      if (outData && outData.status === 200 && outData.result) {
        onFound(outData.result.outcode.toUpperCase(), [outData.result.latitude, outData.result.longitude]);
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') throw e;
    }

    const nomData = await fetchJsonChecked(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=gb&q=${encodeURIComponent(query)}`, controller.signal);
    if (Array.isArray(nomData) && nomData.length > 0) {
      const place = nomData[0];
      onFound(query.toUpperCase(), [parseFloat(place.lat), parseFloat(place.lon)]);
    } else {
      showToast(notFoundMsg);
    }
  } catch (err) {
    if (err && err.name === 'AbortError') {
      showToast("Location lookup timed out.");
    } else {
      showToast("Error connecting to geocoding service.");
    }
  } finally {
    clearTimeout(timeoutId);
    if (activeGeocodeController === controller) {
      activeGeocodeController = null;
    }
  }
}

function cancelMapPick() {
  if (pendingMapPick) {
    map.off('click', pendingMapPick);
    pendingMapPick = null;
  }
  if (pendingMapPickTimer) {
    clearTimeout(pendingMapPickTimer);
    pendingMapPickTimer = null;
  }
  const container = map.getContainer();
  if (container) container.classList.remove('map-picking');
}

function openCustomBaseModal() {
  cancelMapPick();
  updateCustomBaseUI();
  openModal('customBaseModal', 'customPostcodeInput');
}

function lookupCustomPostcode() {
  const input = document.getElementById('customPostcodeInput');
  if (!input) return;
  const query = input.value.trim();
  if (!query) {
    showToast("Please enter a UK postcode or town.");
    return;
  }
  showToast("Looking up UK location...");
  geocodeUkLocation(query, saveCustomHomeBase, "Location not found. Please try a valid UK postcode or town.");
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
  cancelMapPick();
  closeModal('customBaseModal');
  if (window.innerWidth <= 768) toggleMobileSidebar(false);
  const container = map.getContainer();
  if (container) container.classList.add('map-picking');
  showToast("Click anywhere in the UK on the map to set your home base (Esc to cancel)");
  pendingMapPick = (e) => {
    const lat = e && e.latlng ? e.latlng.lat : NaN;
    const lng = e && e.latlng ? e.latlng.lng : NaN;
    cancelMapPick();
    if (!isWithinUkBounds(lat, lng)) {
      showToast("Please select a location within the UK.");
      return;
    }
    saveCustomHomeBase("Custom Map Pin", [lat, lng]);
  };
  map.once('click', pendingMapPick);
  pendingMapPickTimer = setTimeout(() => {
    cancelMapPick();
  }, 30000);
}

function saveCustomHomeBase(name, coords) {
  const normalized = normalizeCustomBase({ name, coords });
  if (!normalized) {
    showToast("Invalid coordinates for custom base.");
    return;
  }
  customHomeBase = normalized;
  safeStorage.set(`${STORAGE_PREFIX}custom_home`, JSON.stringify(customHomeBase));
  updateCustomBaseUI();
  setCommuteMode('custom');
  closeModal('customBaseModal');
  showToast(`Custom Base saved: ${customHomeBase.name}`);
}

function clearCustomHomeBase() {
  customHomeBase = null;
  safeStorage.remove(`${STORAGE_PREFIX}custom_home`);
  updateCustomBaseUI();
  setCommuteMode('driver');
  closeModal('customBaseModal');
  showToast("Custom Base cleared");
}

function lookupPartnerPostcode() {
  const input = document.getElementById('partnerPostcodeInput');
  if (!input) return;
  const query = input.value.trim();
  if (!query) {
    showToast("Please enter a partner workplace postcode or town.");
    return;
  }
  showToast("Looking up partner workplace...");
  geocodeUkLocation(query, savePartnerWorkBase, "Partner location not found. Try a valid UK postcode or town.");
}

function startMapPickPartnerBase() {
  cancelMapPick();
  closeModal('customBaseModal');
  if (window.innerWidth <= 768) toggleMobileSidebar(false);
  const container = map.getContainer();
  if (container) container.classList.add('map-picking');
  showToast("Click anywhere in the UK on the map to set your partner's workplace (Esc to cancel)");
  pendingMapPick = (e) => {
    const lat = e && e.latlng ? e.latlng.lat : NaN;
    const lng = e && e.latlng ? e.latlng.lng : NaN;
    cancelMapPick();
    if (!isWithinUkBounds(lat, lng)) {
      showToast("Please select a location within the UK.");
      return;
    }
    savePartnerWorkBase("Partner Map Pin", [lat, lng]);
  };
  map.once('click', pendingMapPick);
  pendingMapPickTimer = setTimeout(() => {
    cancelMapPick();
  }, 30000);
}

function savePartnerWorkBase(name, coords) {
  const normalized = normalizeCustomBase({ name, coords });
  if (!normalized) {
    showToast("Invalid coordinates for partner workplace.");
    return;
  }
  partnerWorkBase = normalized;
  safeStorage.set(`${STORAGE_PREFIX}partner_work`, JSON.stringify(partnerWorkBase));
  updateCustomBaseUI();
  renderRotationCardsFeed(currentFilteredList);
  if (currentSelectedId && currentViewMode === 'details') {
    selectRotation(currentSelectedId, false);
  }
  closeModal('customBaseModal');
  showToast(`Partner Workplace saved: ${partnerWorkBase.name}`);
}

function clearPartnerWorkBase() {
  partnerWorkBase = null;
  safeStorage.remove(`${STORAGE_PREFIX}partner_work`);
  updateCustomBaseUI();
  renderRotationCardsFeed(currentFilteredList);
  if (currentSelectedId && currentViewMode === 'details') {
    selectRotation(currentSelectedId, false);
  }
  closeModal('customBaseModal');
  showToast("Partner Workplace cleared");
}

// 16. FULLSCREEN, MAP LEGEND & GPS CONTROLS
function toggleMapLegend(forceState = null) {
  isMapLegendOpen = (typeof forceState === 'boolean') ? forceState : !isMapLegendOpen;
  const body = document.getElementById('mapLegendBody');
  const btn = document.getElementById('btnMapLegendToggle');
  const chev = document.getElementById('mapLegendChevron');
  if (body) body.style.display = isMapLegendOpen ? 'block' : 'none';
  if (btn) btn.setAttribute('aria-expanded', isMapLegendOpen ? 'true' : 'false');
  if (chev) chev.textContent = isMapLegendOpen ? '▾' : '▴';
  if (isMapLegendOpen) updateMapLegend();
}

function updateMapLegend() {
  const body = document.getElementById('mapLegendBody');
  if (!body) return;

  const regionColorsMap = activeRegionColors || {};

  let colourSectionHtml = '';
  if (activeRegionFilter !== 'ALL') {
    const poolGroups = getGeographicPoolGroupsForRegion(activeRegionFilter);
    const fixedTracks = (Array.isArray(activeRotations) ? activeRotations : [])
      .filter(r => r.region === activeRegionFilter && !isPoolRotation(r));

    const items = [];
    poolGroups.forEach((grp, idx) => {
      const firstRot = grp.rotations[0];
      if (!firstRot) return;
      const c = getRotationLineStyle(firstRot).color;
      const codes = grp.rotations.map(r => r.code).join(', ');
      items.push(`
        <div class="legend-color-row">
          <span class="legend-color-dot" style="background:${c};"></span>
          <span class="legend-color-label">Pool Group ${idx + 1}: <b>${escapeHtml(codes)}</b></span>
        </div>
      `);
    });
    fixedTracks.slice(0, 6).forEach(r => {
      const c = getRotationLineStyle(r).color;
      items.push(`
        <div class="legend-color-row">
          <span class="legend-color-dot" style="background:${c};"></span>
          <span class="legend-color-label">${escapeHtml(r.code)}</span>
        </div>
      `);
    });

    colourSectionHtml = `
      <div class="legend-section-title">${escapeHtml(activeRegionFilter)} Key</div>
      <div class="legend-color-list">
        ${items.join('') || `<div class="legend-color-row"><span class="legend-color-dot" style="background:${regionColorsMap[activeRegionFilter] || '#0284c7'};"></span><span class="legend-color-label">${escapeHtml(activeRegionFilter)}</span></div>`}
      </div>
      <button type="button" class="legend-region-pill" style="margin-top:6px; width:100%; justify-content:center;" data-action="legend-filter-region" data-region="ALL">Show All UK Regions</button>
    `;
  } else {
    const regPills = Object.keys(regionColorsMap).sort().map(reg => {
      const c = regionColorsMap[reg] || '#0284c7';
      return `
        <button type="button" class="legend-region-pill" data-action="legend-filter-region" data-region="${escapeHtml(reg)}" title="Filter map &amp; list to ${escapeHtml(reg)}">
          <span class="legend-color-dot" style="background:${c};"></span>
          <span>${escapeHtml(reg)}</span>
        </button>
      `;
    }).join('');

    colourSectionHtml = `
      <div class="legend-section-title">NHS Regions (Click to Filter)</div>
      <div class="legend-region-grid">
        ${regPills}
      </div>
    `;
  }

  body.innerHTML = `
    <div class="legend-section-title">Pins &amp; Routes</div>
    <div class="legend-pin-list">
      <div class="legend-pin-row">
        <span class="legend-pin-sample tertiary-sample">T</span>
        <span><b>Tertiary</b> Teaching Centre (halo)</span>
      </div>
      <div class="legend-pin-row">
        <span class="legend-pin-sample dgh-sample">H</span>
        <span><b>DGH</b> Pool / District Hospital</span>
      </div>
      <div class="legend-pin-row">
        <span class="legend-pin-sample split-sample"></span>
        <span>Shared Hospital (2+ Pools)</span>
      </div>
      <div class="legend-pin-row">
        <span class="legend-line-sample solid-sample"></span>
        <span>Sequential Fixed Track</span>
      </div>
      <div class="legend-pin-row">
        <span class="legend-line-sample dotted-sample"></span>
        <span>Candidate Pool Spokes</span>
      </div>
    </div>
    <div style="border-top:1px solid var(--border-color); margin:7px 0;"></div>
    ${colourSectionHtml}
  `;
}

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
      if (prefersReducedMotion()) { map.setView(latlng, 12); } else { map.flyTo(latlng, 12); }
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
      }).bindPopup("<b>Your Current Location</b>").addTo(map);
      currentUserLocationMarker.openPopup();
      if (window.innerWidth <= 768) toggleMobileSidebar(false);
    },
    () => showToast("Unable to access GPS location.")
  );
}

// 17. BACKUP, RESTORE & CSV EXPORT
function buildBackupObject() {
  const ratings = {};
  activeRotations.forEach(r => {
    const d = getUserData(r.id);
    if (hasUserPreference(d)) ratings[r.id] = d;
  });
  return {
    version: 1,
    programme: activeProgramme,
    exportDate: new Date().toISOString(),
    ratings,
    shortlistOrder: syncShortlistOrder(),
    orielChecked: [...orielCheckedSet],
    customHomeBase,
    partnerWorkBase
  };
}

let lastFocusedElement = null;

function restoreModalFocusIfNoneOpen() {
  if (!document.querySelector('dialog[open]') && lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    const toFocus = lastFocusedElement;
    lastFocusedElement = null;
    toFocus.focus();
  }
}

function attachDialogPolyfills(modal) {
  if (!modal) return;
  if (!modal.dataset.closeBound) {
    modal.dataset.closeBound = '1';
    modal.addEventListener('close', () => {
      restoreModalFocusIfNoneOpen();
    });
  }
  const supportsClosedBy = typeof HTMLDialogElement !== 'undefined' && ('closedBy' in HTMLDialogElement.prototype);
  if (!supportsClosedBy && modal.getAttribute('closedby') === 'any' && !modal.dataset.backdropBound) {
    modal.dataset.backdropBound = '1';
    let pointerDownOutside = false;
    const isOutside = (e) => {
      const rect = modal.getBoundingClientRect();
      return e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom;
    };
    modal.addEventListener('pointerdown', (e) => {
      pointerDownOutside = (e.target === modal) && isOutside(e);
    });
    modal.addEventListener('pointerup', (e) => {
      if (pointerDownOutside && e.target === modal && isOutside(e)) {
        closeModal(modal.id);
      }
      pointerDownOutside = false;
    });
  }
}

function openModal(id, preferredFocusId = null) {
  const modal = document.getElementById(id);
  if (!modal) return;
  if (!document.querySelector('dialog[open]') && document.activeElement && document.activeElement !== document.body && !document.activeElement.closest('dialog')) {
    lastFocusedElement = document.activeElement;
  }
  attachDialogPolyfills(modal);
  if (!modal.open && typeof modal.showModal === 'function') {
    modal.showModal();
  }
  setTimeout(() => {
    const preferred = preferredFocusId ? document.getElementById(preferredFocusId) : null;
    if (preferred && typeof preferred.focus === 'function') {
      preferred.focus();
      return;
    }
    const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable && typeof focusable.focus === 'function') {
      focusable.focus();
    }
  }, 50);
}

function openSyncModal() {
  flushPendingNotes();
  const area = document.getElementById('syncJsonArea');
  if (area) area.value = JSON.stringify(buildBackupObject(), null, 2);
  openModal('syncModal');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal || !modal.open) return;
  modal.close();
}

async function requestUserConfirm({ title = 'Confirm Action', message = '', confirmText = 'Confirm', cancelText = 'Cancel', danger = false } = {}) {
  const dialog = document.getElementById('confirmDialog');
  if (!dialog || typeof dialog.showModal !== 'function') {
    return typeof window.confirm === 'function' ? window.confirm(message) : false;
  }
  attachDialogPolyfills(dialog);
  if (!document.querySelector('dialog[open]') && document.activeElement && document.activeElement !== document.body && !document.activeElement.closest('dialog')) {
    lastFocusedElement = document.activeElement;
  }

  const headingEl = document.getElementById('confirmDialogHeading');
  const messageEl = document.getElementById('confirmDialogMessage');
  const cancelBtn = document.getElementById('confirmDialogCancelBtn');
  const confirmBtn = document.getElementById('confirmDialogConfirmBtn');

  if (headingEl) headingEl.textContent = title;
  if (messageEl) messageEl.textContent = message;
  if (cancelBtn) cancelBtn.textContent = cancelText;
  if (confirmBtn) {
    confirmBtn.textContent = confirmText;
    confirmBtn.style.background = danger ? 'var(--rose)' : '';
    confirmBtn.style.borderColor = danger ? 'var(--rose)' : '';
  }

  dialog.returnValue = '';
  if (!dialog.open) {
    dialog.showModal();
  }

  return new Promise((resolve) => {
    const onClose = () => {
      dialog.removeEventListener('close', onClose);
      const confirmed = dialog.returnValue === 'confirm';
      dialog.returnValue = '';
      resolve(confirmed);
    };
    dialog.addEventListener('close', onClose);
  });
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

async function importSyncData() {
  try {
    const area = document.getElementById('syncJsonArea');
    const parsed = JSON.parse(area.value);
    const confirmed = await requestUserConfirm({
      title: 'Overwrite Current Preferences?',
      message: 'Importing this backup will overwrite your current ratings, notes, and shortlist ranking. Do you want to proceed?',
      confirmText: 'Import & Overwrite',
      danger: true
    });
    if (!confirmed) {
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
  downloadBlob(jsonStr, `${activeDataset.shortLabel}_Anaesthetics_Preferences_Backup.json`, "application/json");
  showToast("Backup JSON file downloaded!");
}

function handleBackupFileUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (file.size > 1_000_000) {
    showToast("Backup file too large (max 1 MB).");
    event.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      const confirmed = await requestUserConfirm({
        title: 'Overwrite Current Preferences?',
        message: `Importing backup "${file.name}" will overwrite your current ratings, notes, and shortlist ranking. Do you want to proceed?`,
        confirmText: 'Import & Overwrite',
        danger: true
      });
      if (!confirmed) {
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
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    showToast("Invalid backup format");
    return;
  }

  const rawRatingKeys = (parsed.ratings && typeof parsed.ratings === 'object' && !Array.isArray(parsed.ratings)) ? Object.keys(parsed.ratings) : [];
  const rawShortlist = Array.isArray(parsed.shortlistOrder) ? parsed.shortlistOrder : [];
  const matchingIds = [...rawRatingKeys, ...rawShortlist].filter(id => typeof id === 'string' && KNOWN_IDS.has(id));
  const validBase = normalizeCustomBase(parsed.customHomeBase);
  const validPartnerBase = normalizeCustomBase(parsed.partnerWorkBase);
  if ((rawRatingKeys.length > 0 || rawShortlist.length > 0) && matchingIds.length === 0 && !validBase && !validPartnerBase) {
    showToast("Backup belongs to a different rotation programme (no matching IDs).");
    return;
  }

  // True Overwrite: Reset all rotations in userPrefsCache and clear existing pref keys from localStorage
  if (Array.isArray(activeRotations)) {
    activeRotations.forEach(r => {
      userPrefsCache.set(r.id, { rating: 0, notes: "", tier: "UNSET" });
      safeStorage.remove(`${STORAGE_PREFIX}pref_${r.id}`);
    });
  }

  if (parsed.ratings && typeof parsed.ratings === 'object' && !Array.isArray(parsed.ratings)) {
    Object.keys(parsed.ratings).forEach(k => {
      if (KNOWN_IDS.has(k)) {
        setUserData(k, normalizePref(parsed.ratings[k]));
      }
    });
  }
  if (Array.isArray(parsed.shortlistOrder)) {
    shortlistOrder = parsed.shortlistOrder.filter((id, i, a) => typeof id === 'string' && KNOWN_IDS.has(id) && a.indexOf(id) === i);
  } else {
    shortlistOrder = [];
  }
  syncShortlistOrder();

  if (parsed.orielChecked && Array.isArray(parsed.orielChecked)) {
    orielCheckedSet = new Set(parsed.orielChecked.filter(id => typeof id === 'string' && KNOWN_IDS.has(id)));
    safeStorage.set(`${STORAGE_PREFIX}oriel_checked`, JSON.stringify([...orielCheckedSet]));
  } else {
    orielCheckedSet.clear();
    safeStorage.remove(`${STORAGE_PREFIX}oriel_checked`);
  }

  if (validBase) {
    customHomeBase = validBase;
    safeStorage.set(`${STORAGE_PREFIX}custom_home`, JSON.stringify(customHomeBase));
    currentCommuteMode = 'custom';
    safeStorage.set(`${STORAGE_PREFIX}commute_mode`, 'custom');
    syncCommuteModeUI('custom');
  } else {
    customHomeBase = null;
    safeStorage.remove(`${STORAGE_PREFIX}custom_home`);
    if (currentCommuteMode === 'custom') {
      currentCommuteMode = 'driver';
      safeStorage.set(`${STORAGE_PREFIX}commute_mode`, 'driver');
      syncCommuteModeUI('driver');
    }
  }

  if (validPartnerBase) {
    partnerWorkBase = validPartnerBase;
    safeStorage.set(`${STORAGE_PREFIX}partner_work`, JSON.stringify(partnerWorkBase));
  } else {
    partnerWorkBase = null;
    safeStorage.remove(`${STORAGE_PREFIX}partner_work`);
  }
  updateCustomBaseUI();

  updateShortlistBadge();
  updateLandingStatsAndBadges();
  applyFiltersAndSearch();
  if (currentSelectedId && currentViewMode === 'details') {
    selectRotation(currentSelectedId, false);
  }
  showToast("Preferences restored!");
}

function encodeBase64Utf8(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
    return String.fromCharCode(parseInt(p1, 16));
  }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function decodeBase64Utf8(str) {
  let clean = decodeURIComponent(str.trim()).replace(/-/g, '+').replace(/_/g, '/');
  while (clean.length % 4) clean += '=';
  return decodeURIComponent(Array.prototype.map.call(atob(clean), function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}

async function generatePartnerShareLink() {
  flushPendingNotes();
  const backup = buildBackupObject();
  const count = Object.keys(backup.ratings || {}).length;
  if (count === 0 && !backup.customHomeBase && !backup.partnerWorkBase) {
    showToast("No preferences or custom base to share yet.");
    return;
  }
  if (backup.customHomeBase || backup.partnerWorkBase) {
    const includeBase = await requestUserConfirm({
      title: 'Include Home & Partner Locations?',
      message: 'Include your custom home base and partner workplace locations in the share link?',
      confirmText: 'Include Locations',
      cancelText: 'Ratings Only'
    });
    if (!includeBase) {
      backup.customHomeBase = null;
      backup.partnerWorkBase = null;
      if (count === 0) {
        showToast("No preferences to share.");
        return;
      }
    }
  }
  const jsonStr = JSON.stringify(backup);
  try {
    const encoded = encodeBase64Utf8(jsonStr);
    const urlObj = new URL(window.location.href);
    urlObj.searchParams.set('prog', activeProgramme);
    urlObj.hash = `share=${encoded}`;
    const shareUrl = urlObj.toString();
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl)
        .then(() => showToast("Partner share link copied to clipboard!"))
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

function parseSharedLinkPayload(hashStr = window.location.hash) {
  if (!hashStr || !hashStr.startsWith('#share=')) return null;
  const rawEncoded = hashStr.substring(7);
  if (!rawEncoded) return null;
  try {
    const jsonStr = decodeBase64Utf8(rawEncoded);
    return JSON.parse(jsonStr);
  } catch (e) {
    return { _corrupted: true };
  }
}

function detectProgrammeForSharePayload(parsed) {
  if (!parsed || typeof parsed !== 'object' || parsed._corrupted) return activeProgramme;
  const datasets = getAvailableDatasets();
  if (parsed.programme && datasets[parsed.programme]) {
    return parsed.programme;
  }
  const candidateIds = [
    ...((parsed.ratings && typeof parsed.ratings === 'object' && !Array.isArray(parsed.ratings)) ? Object.keys(parsed.ratings) : []),
    ...(Array.isArray(parsed.shortlistOrder) ? parsed.shortlistOrder : [])
  ].filter(id => typeof id === 'string');

  if (candidateIds.length) {
    let bestProg = activeProgramme;
    let bestHits = 0;
    for (const [progKey, ds] of Object.entries(datasets)) {
      const idSet = new Set((ds.rotations || []).map(r => r.id));
      const hits = candidateIds.filter(id => idSet.has(id)).length;
      if (hits > bestHits) {
        bestHits = hits;
        bestProg = progKey;
      }
    }
    return bestProg;
  }
  return activeProgramme;
}

function checkForSharedLink(overrideHash = null) {
  const hash = overrideHash || window.location.hash;
  if (!hash || !hash.startsWith('#share=')) return;
  const parsed = parseSharedLinkPayload(hash);
  if (history.replaceState) {
    const urlObj = new URL(window.location.href);
    urlObj.searchParams.set('prog', activeProgramme);
    urlObj.hash = '';
    history.replaceState(null, '', urlObj.pathname + urlObj.search);
  } else {
    window.location.hash = '';
  }

  if (!parsed || parsed._corrupted) {
    console.error("Failed to parse shared partner link");
    showToast("Invalid or corrupted share link");
    return;
  }

  if (typeof parsed === 'object' && !Array.isArray(parsed) && (parsed.ratings || parsed.shortlistOrder || parsed.customHomeBase || parsed.partnerWorkBase)) {
    const validRatingKeys = (parsed.ratings && typeof parsed.ratings === 'object' && !Array.isArray(parsed.ratings))
      ? Object.keys(parsed.ratings).filter(k => KNOWN_IDS.has(k) && hasUserPreference(normalizePref(parsed.ratings[k])))
      : [];
    const validShortlistKeys = Array.isArray(parsed.shortlistOrder)
      ? parsed.shortlistOrder.filter(id => typeof id === 'string' && KNOWN_IDS.has(id))
      : [];
    const validCustomBase = normalizeCustomBase(parsed.customHomeBase);
    const validPartnerBase = normalizeCustomBase(parsed.partnerWorkBase);
    const validCount = new Set([...validRatingKeys, ...validShortlistKeys]).size;

    if (validCount === 0 && !validCustomBase && !validPartnerBase) {
      showToast("Share link contains no valid rotations for this programme");
      return;
    }

    setTimeout(async () => {
      const accepted = await requestUserConfirm({
        title: `Import Partner ${activeDataset.shortLabel} Preferences?`,
        message: `A partner has shared their ${activeDataset.shortLabel} Anaesthetics rotation preferences (${validCount} rotation${validCount === 1 ? '' : 's'} shortlisted). Would you like to import their ratings, tiers, and notes?`,
        confirmText: 'Import Preferences'
      });
      if (accepted) {
        applyParsedBackup(parsed);
        showToast("Partner preferences successfully loaded!");
      }
    }, 300);
  } else {
    showToast("Invalid or corrupted share link");
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
  flushPendingNotes();
  let csv = "OrielCode,TrackTitle,Region,PlacesAvailable,TierPreference,DriverLivingHub,PublicTransportLivingHub,HospitalBases,RatingStars,MorningDriveMins_0730,EveningDriveMins_1800,PersonalNotes\n";
  activeRotations.forEach(r => {
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
  downloadBlob(csv, `${activeDataset.shortLabel}_Anaesthetics_All_Rotations.csv`, "text/csv;charset=utf-8;");
  showToast("All rotations reference CSV downloaded!");
}

function exportShortlistCSV() {
  flushPendingNotes();
  const orderedIds = syncShortlistOrder();
  if (!orderedIds.length) {
    showToast("No rotations in shortlist to export.");
    return;
  }
  let csv = "AssignedRank,EnteredInOriel,OrielCode,TrackTitle,Region,PlacesAvailable,TierPreference,DriverLivingHub,PublicTransportLivingHub,HospitalBases,RatingStars,MorningDriveMins_0730,EveningDriveMins_1800,PersonalNotes\n";
  orderedIds.forEach((id, idx) => {
    const r = activeRotations.find(x => x.id === id);
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
  downloadBlob(csv, `${activeDataset.shortLabel}_Anaesthetics_MyShortlist_Ranked.csv`, "text/csv;charset=utf-8;");
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
  setTimeout(() => URL.revokeObjectURL(url), 1500);
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
  const openDialog = document.querySelector('dialog[open]');

  if (e.key === 'Escape') {
    if (pendingMapPick) {
      cancelMapPick();
      showToast("Map pin selection cancelled");
    }
    if (!openDialog && window.innerWidth <= 768) {
      toggleMobileSidebar(false);
    }
    return;
  }

  if (openDialog) return;

  const activeTag = document.activeElement ? document.activeElement.tagName : '';
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag)) return;
  if (e.target && e.target.closest && e.target.closest('.leaflet-container, [role="tablist"], [role="group"], .star-row')) return;

  if (e.key === 'ArrowRight') {
    e.preventDefault();
    stepRotation(1);
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    stepRotation(-1);
  }
});

const inspectorTabsOrder = [
  { key: 'placements', id: 'tabBtnPlacements' },
  { key: 'commute', id: 'tabBtnCommute' },
  { key: 'intel', id: 'tabBtnIntel' },
  { key: 'notes', id: 'tabBtnNotes' }
];
const inspectorTabsNav = document.querySelector('.inspector-tabs-nav');
if (inspectorTabsNav) {
  inspectorTabsNav.addEventListener('keydown', (e) => {
    const currentBtn = e.target.closest('[role="tab"]');
    if (!currentBtn) return;
    const currentIdx = inspectorTabsOrder.findIndex(t => t.id === currentBtn.id);
    if (currentIdx === -1) return;

    let nextIdx = -1;
    if (e.key === 'ArrowRight') {
      nextIdx = (currentIdx + 1) % inspectorTabsOrder.length;
    } else if (e.key === 'ArrowLeft') {
      nextIdx = (currentIdx - 1 + inspectorTabsOrder.length) % inspectorTabsOrder.length;
    } else if (e.key === 'Home') {
      nextIdx = 0;
    } else if (e.key === 'End') {
      nextIdx = inspectorTabsOrder.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    const target = inspectorTabsOrder[nextIdx];
    switchInspectorTab(target.key);
    const nextEl = document.getElementById(target.id);
    if (nextEl && typeof nextEl.focus === 'function') {
      nextEl.focus();
    }
  });
}

// Setup native <dialog> close focus restoration & light-dismiss fallback
function setupModalBackdrops() {
  document.querySelectorAll('dialog.app-dialog').forEach(modal => {
    attachDialogPolyfills(modal);
  });
}

// Delegated event listener for all dynamic data-action controls
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;

  // Prevent double-firing or premature execution: handled strictly by change listener
  if (action === 'toggle-oriel-entered' || action === 'change-rank-input') {
    return;
  }

  if (action === 'select-programme' || action === 'switch-programme') {
    switchProgramme(el.dataset.programme, { closeLanding: true });
  } else if (action === 'open-rotation-details') {
    openDetailsForRotation(el.dataset.id);
  } else if (action === 'reset-all-filters') {
    resetAllFilters();
  } else if (action === 'toggle-compare-card') {
    e.stopPropagation();
    toggleCompare(el.dataset.id);
  } else if (action === 'remove-compare') {
    toggleCompare(el.dataset.id);
    renderCompareModal();
  } else if (action === 'view-details-compare') {
    closeModal('compareModal');
    openDetailsForRotation(el.dataset.id);
  } else if (action === 'open-hospital-profile') {
    openHospitalProfile(el.dataset.hosp);
  } else if (action === 'filter-by-hospital') {
    const hospName = el.dataset.hosp;
    const linked = hospitalRotationsMap.get(hospName) || [];
    if (activeRegionFilter !== 'ALL' && !linked.some(r => r.region === activeRegionFilter)) {
      activeRegionFilter = 'ALL';
      const regSelect = document.getElementById('regionFilter');
      if (regSelect) regSelect.value = 'ALL';
    }
    if (activeQuickFilter !== 'ALL') {
      const matchesQuick = linked.some(r => {
        const d = getUserData(r.id);
        if (activeQuickFilter === 'STARRED') return d.rating > 0;
        if (activeQuickFilter === 'TIER1') return d.tier === 'TIER1';
        if (activeQuickFilter === 'TIER2') return d.tier === 'TIER2';
        if (activeQuickFilter === 'TIER3') return d.tier === 'TIER3';
        if (activeQuickFilter === 'LOW_SPREAD') return getRotationMaxDistance(r) <= 25;
        if (activeQuickFilter === 'EXCLUDED') return d.tier === 'EXCLUDE';
        return true;
      });
      if (!matchesQuick) {
        activeQuickFilter = 'ALL';
        updateQuickFilterPills();
      }
    }
    clearTimeout(searchDebounceTimer);
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = hospName;
    const clearBtn = document.getElementById('btnSearchClear');
    if (clearBtn) clearBtn.style.display = hospName ? 'block' : 'none';
    currentSearchTerm = hospName.toLowerCase().trim();
    refreshAfterFilterChange(true);
    map.closePopup();
  } else if (action === 'focus-hospital') {
    if (e.target.tagName === 'A') return;
    focusHospitalByName(el.dataset.hosp);
  } else if (action === 'dive-in') {
    diveInFromPopup(el.dataset.id);
  } else if (action === 'dive-in-modal') {
    closeModal('hospitalProfileModal');
    diveInFromPopup(el.dataset.id);
  } else if (action === 'copy-oriel-code') {
    copyOrielCode(el.dataset.code);
  } else if (action === 'move-shortlist') {
    moveShortlistItem(parseInt(el.dataset.index, 10), parseInt(el.dataset.dir, 10));
  } else if (action === 'view-details-shortlist') {
    closeModal('shortlistModal');
    openDetailsForRotation(el.dataset.id);
  } else if (action === 'remove-shortlist-item') {
    removeShortlistItem(el.dataset.id);
  } else if (action === 'quick-card-rate') {
    e.stopPropagation();
    const id = el.dataset.id;
    const val = parseInt(el.dataset.rating, 10) || 0;
    const current = getUserData(id).rating;
    const next = (current === val) ? 0 : val;
    setUserData(id, { rating: next });
    syncShortlistOrder();
    updateShortlistBadge();
    updateLandingStatsAndBadges();
    applyFiltersAndSearch({ redrawMap: activeQuickFilter === 'STARRED' });
    showToast(next > 0 ? `Rated ${next}★` : 'Rating cleared');
  } else if (action === 'quick-card-tier') {
    e.stopPropagation();
    const id = el.dataset.id;
    const tierVal = el.dataset.tier;
    const current = getUserData(id);
    const nextTier = (current.tier === tierVal) ? 'UNSET' : tierVal;
    setUserData(id, { tier: nextTier });
    if (current.tier !== nextTier) {
      shortlistOrder = (Array.isArray(shortlistOrder) ? shortlistOrder : []).filter(x => x !== id);
    }
    syncShortlistOrder();
    updateShortlistBadge();
    updateLandingStatsAndBadges();
    applyFiltersAndSearch({ redrawMap: ['TIER1', 'TIER2', 'TIER3', 'EXCLUDED'].includes(activeQuickFilter) });
    showToast(`Tier updated: ${nextTier}`);
  } else if (action === 'sort-shortlist-within-tiers') {
    sortShortlistWithinTiers(el.dataset.mode);
  } else if (action === 'legend-filter-region') {
    const reg = el.dataset.region || 'ALL';
    const regSelect = document.getElementById('regionFilter');
    if (regSelect) regSelect.value = reg;
    filterRegion(reg);
  }
});

document.addEventListener('change', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;

  if (action === 'toggle-oriel-entered') {
    toggleOrielEntered(el.dataset.id);
  } else if (action === 'change-rank-input') {
    changeRankInput(parseInt(el.dataset.index, 10), el.value);
  }
});

// 20. MULTI-PROGRAMME ENGINE, LANDING SCREEN & BROWSER ROUTING
function applyDatasetBindings(progId) {
  const ds = resolveDataset(progId);
  if (!ds) return;
  activeProgramme = ds.id || (progId === 'ct1' ? 'ct1' : 'st4');
  activeDataset = ds;
  activeHospitals = ds.hospitals || {};
  activeRotations = Array.isArray(ds.rotations) ? ds.rotations : [];
  activeRegionColors = ds.regionColors || {};
  STORAGE_PREFIX = ds.storagePrefix || `${activeProgramme}_`;
  KNOWN_IDS = new Set(activeRotations.map(r => r.id));
  DEFAULT_MAP_CENTER = ds.defaultCenter || [52.8, -1.8];
  DEFAULT_MAP_ZOOM = ds.defaultZoom || 6;

  if (typeof window !== 'undefined') {
    window.HOSPITALS = activeHospitals;
    window.ROTATIONS_DATA = activeRotations;
    window.REGION_COLORS = activeRegionColors;
  }

  userPrefsCache.clear();
  regionCategoricalStyleCache.clear();
  filteredListCategoricalCache = { ref: null, map: null };
  overviewPolylinesMap = {};
  overviewHospitalMarkersMap = {};

  if (ds.appTitle) {
    document.title = ds.appTitle;
  }
  const titleEl = document.getElementById('sidebarTitleText');
  if (titleEl && ds.headerTitle) {
    titleEl.textContent = ds.headerTitle;
  }
  const subtitleEl = document.getElementById('sidebarSubtitleText');
  if (subtitleEl && ds.headerSubtitle) {
    subtitleEl.textContent = ds.headerSubtitle;
  }

  const btnCt1 = document.getElementById('btnSwitchCt1');
  if (btnCt1) {
    btnCt1.classList.toggle('active', activeProgramme === 'ct1');
    btnCt1.setAttribute('aria-pressed', activeProgramme === 'ct1' ? 'true' : 'false');
  }
  const btnSt4 = document.getElementById('btnSwitchSt4');
  if (btnSt4) {
    btnSt4.classList.toggle('active', activeProgramme === 'st4');
    btnSt4.setAttribute('aria-pressed', activeProgramme === 'st4' ? 'true' : 'false');
  }
}

function updateLandingStatsAndBadges() {
  const datasets = getAvailableDatasets();
  const entries = [
    { key: 'ct1', statsId: 'landingCt1Stats', badgeId: 'landingCt1SavedBadge' },
    { key: 'st4', statsId: 'landingSt4Stats', badgeId: 'landingSt4SavedBadge' }
  ];

  entries.forEach(({ key, statsId, badgeId }) => {
    const ds = datasets[key];
    if (!ds) return;
    const rots = Array.isArray(ds.rotations) ? ds.rotations : [];
    const hospsCount = ds.hospitals ? Object.keys(ds.hospitals).length : 0;
    const regsCount = ds.regionColors ? Object.keys(ds.regionColors).length : new Set(rots.map(r => r.region)).size;

    const statsEl = document.getElementById(statsId);
    if (statsEl) {
      statsEl.textContent = `${rots.length} Rotations • ${hospsCount} Hospitals • ${regsCount} Regions`;
    }

    let savedCount = 0;
    const prefix = ds.storagePrefix || `${key}_`;
    rots.forEach(r => {
      try {
        const raw = safeStorage.get(`${prefix}pref_${r.id}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (isShortlisted(normalizePref(parsed))) savedCount++;
        }
      } catch (e) {}
    });

    const badgeEl = document.getElementById(badgeId);
    if (badgeEl) {
      badgeEl.textContent = `${savedCount} Shortlisted`;
      badgeEl.hidden = savedCount === 0;
    }
  });
}

function toggleRememberProgramme(checked) {
  safeStorage.set(REMEMBER_PROG_KEY, checked ? '1' : '0');
  if (checked) {
    safeStorage.set(LAST_PROG_KEY, activeProgramme);
  }
}

function showProgrammeLanding() {
  flushPendingNotes();
  cancelMapPick();
  updateLandingStatsAndBadges();
  document.title = 'UK Anaesthetics Rotation & Commute Explorer (CT1 & ST4)';
  const rememberCb = document.getElementById('rememberProgrammeCheckbox');
  if (rememberCb) {
    rememberCb.checked = safeStorage.get(REMEMBER_PROG_KEY) === '1';
  }

  const landing = document.getElementById('programmeLanding');
  const appShell = document.getElementById('appShell');
  const reveal = () => {
    if (landing) landing.hidden = false;
    if (appShell) appShell.inert = true;
  };
  if (landing && landing.hidden && typeof document.startViewTransition === 'function' && !prefersReducedMotion()) {
    document.startViewTransition(reveal);
  } else {
    reveal();
  }
  setTimeout(() => {
    const heading = document.getElementById('landingHeading');
    if (heading && typeof heading.focus === 'function') {
      heading.focus();
    }
  }, 60);
}

function switchProgramme(progId, { closeLanding = true, updateUrl = true, targetRotationId = null } = {}) {
  const ds = resolveDataset(progId);
  const resolvedId = (ds && ds.id) || (progId === 'ct1' ? 'ct1' : 'st4');
  const isSwitching = resolvedId !== activeProgramme;

  flushPendingNotes();
  cancelMapPick();
  document.querySelectorAll('dialog[open]').forEach(d => {
    try { d.close(); } catch (e) {}
  });

  if (isSwitching) {
    currentSelectedId = null;
    activeRegionFilter = 'ALL';
    activeQuickFilter = 'ALL';
    currentSearchTerm = '';
    currentSortMode = 'ALPHA_ASC';
    clearTimeout(searchDebounceTimer);

    const regSelect = document.getElementById('regionFilter');
    if (regSelect) regSelect.value = 'ALL';
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    const clearBtn = document.getElementById('btnSearchClear');
    if (clearBtn) clearBtn.style.display = 'none';
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) sortSelect.value = 'ALPHA_ASC';
    updateQuickFilterPills();
  }

  applyDatasetBindings(resolvedId);
  initRotationMetadata();
  migrateLegacyStorage();
  loadPersistedState();
  initUserPrefsCache();
  populateRegionDropdown();
  syncCommuteModeUI(currentCommuteMode);
  setShiftTiming(currentShiftTiming, false, false);
  updateShortlistBadge();
  updateCompareBadge();
  updateCustomBaseUI();
  updateLandingStatsAndBadges();
  checkTipBannerStatus();
  applyFiltersAndSearch({ redrawMap: false });

  if (closeLanding) {
    safeStorage.set(LAST_PROG_KEY, activeProgramme);
  }

  const hasTarget = Boolean(targetRotationId && activeRotations.some(r => r.id === targetRotationId));
  if (hasTarget) {
    const prefSel = document.getElementById('prefSelect');
    if (prefSel) prefSel.value = targetRotationId;
    selectRotation(targetRotationId, false);
    setViewMode('details');
  } else {
    showListView({ fitView: true });
  }

  if (updateUrl && history.replaceState) {
    const urlObj = new URL(window.location.href);
    urlObj.searchParams.set('prog', activeProgramme);
    urlObj.hash = hasTarget ? `#${targetRotationId}` : '';
    history.replaceState(null, '', urlObj.pathname + urlObj.search + urlObj.hash);
  }

  if (closeLanding) {
    const landing = document.getElementById('programmeLanding');
    const appShell = document.getElementById('appShell');
    const wasLandingVisible = Boolean(landing && !landing.hidden);
    const hideLanding = () => {
      if (landing) landing.hidden = true;
      if (appShell) appShell.inert = false;
    };
    if (wasLandingVisible && typeof document.startViewTransition === 'function' && !prefersReducedMotion()) {
      document.startViewTransition(hideLanding);
    } else {
      hideLanding();
    }
    setTimeout(() => {
      map.invalidateSize();
      if (wasLandingVisible) {
        const heading = document.getElementById('appMainHeading');
        if (heading && typeof heading.focus === 'function') {
          heading.focus();
        }
      }
    }, 80);
  }
}

function findProgrammeForRotationId(rotId) {
  if (!rotId) return null;
  const datasets = getAvailableDatasets();
  for (const [progKey, ds] of Object.entries(datasets)) {
    if (ds && Array.isArray(ds.rotations) && ds.rotations.some(r => r.id === rotId)) {
      return progKey;
    }
  }
  return null;
}

window.addEventListener('hashchange', () => {
  if (window.location.hash.startsWith('#share=')) {
    const parsed = parseSharedLinkPayload(window.location.hash);
    const shareProg = detectProgrammeForSharePayload(parsed);
    if (shareProg && shareProg !== activeProgramme) {
      const shareHash = window.location.hash;
      switchProgramme(shareProg, { closeLanding: true, updateUrl: false });
      checkForSharedLink(shareHash);
    } else {
      checkForSharedLink();
    }
    return;
  }
  const hashId = window.location.hash.replace('#', '');
  if (hashId) {
    if (activeRotations.some(r => r.id === hashId)) {
      if (hashId !== currentSelectedId || currentViewMode !== 'details') {
        const prefSel = document.getElementById('prefSelect');
        if (prefSel) prefSel.value = hashId;
        selectRotation(hashId, false);
        setViewMode('details');
      }
    } else {
      const targetProg = findProgrammeForRotationId(hashId);
      if (targetProg) {
        switchProgramme(targetProg, { closeLanding: true, updateUrl: true, targetRotationId: hashId });
      }
    }
  } else {
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
window.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  setupModalBackdrops();

  const rememberCb = document.getElementById('rememberProgrammeCheckbox');
  const rememberEnabled = safeStorage.get(REMEMBER_PROG_KEY) === '1';
  if (rememberCb) {
    rememberCb.checked = rememberEnabled;
  }

  const datasets = getAvailableDatasets();
  const urlParams = new URLSearchParams(window.location.search);
  const urlProg = (urlParams.get('prog') || '').toLowerCase();
  const hash = window.location.hash || '';

  if (hash.startsWith('#share=')) {
    const parsed = parseSharedLinkPayload(hash);
    const shareProg = detectProgrammeForSharePayload(parsed);
    switchProgramme(shareProg, { closeLanding: true, updateUrl: false });
    checkForSharedLink(hash);
  } else {
    const hashId = hash.replace('#', '');
    const hashProg = hashId ? findProgrammeForRotationId(hashId) : null;
    if (hashProg) {
      switchProgramme(hashProg, { closeLanding: true, updateUrl: true, targetRotationId: hashId });
    } else if (urlProg && datasets[urlProg]) {
      switchProgramme(urlProg, { closeLanding: true, updateUrl: true });
    } else {
      const lastProg = safeStorage.get(LAST_PROG_KEY);
      if (rememberEnabled && lastProg && datasets[lastProg]) {
        switchProgramme(lastProg, { closeLanding: true, updateUrl: true });
      } else {
        switchProgramme('st4', { closeLanding: false, updateUrl: false });
        document.title = 'UK Anaesthetics Rotation & Commute Explorer (CT1 & ST4)';
        const appShell = document.getElementById('appShell');
        const landing = document.getElementById('programmeLanding');
        if (appShell) appShell.inert = true;
        if (landing) landing.hidden = false;
        updateLandingStatsAndBadges();
        const landingHeading = document.getElementById('landingHeading');
        if (landingHeading && typeof landingHeading.focus === 'function') {
          landingHeading.focus();
        }
      }
    }
  }

  if (window.innerWidth <= 768) {
    toggleMobileSidebar(false);
  }
});

window.addEventListener('beforeunload', flushPendingNotes);
