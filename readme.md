# ST4 Anaesthetics National Rotation & Commute Explorer

An interactive, open-source web application designed to help UK Anaesthetics trainees and their partners visualise, compare, and rank ST4 training rotations from Oriel.

**Live Tool:** [https://samrowles.github.io/Anaesthetics-ST4-Rotation-Map/](https://samrowles.github.io/Anaesthetics-ST4-Rotation-Map/)

---

## Key Features

### 🏛️ Tertiary vs DGH Training Balance Breakdown
- **Duration-Weighted Training Metric:** Automatically calculates the clinical split between Tertiary / Teaching hospitals and District General Hospitals (DGH), weighted by placement duration (e.g. 3-month, 6-month, or 12-month blocks).
- **Visual Balance Bar:** Two-tone progress bar in the rotation inspector and compact badge pills (`XX% Tert • YY% DGH`) on rotation feed cards.

### ℹ️ Hospital Trust Profiles
  - 📋 **Electronic Patient Records (EPR):** System deployed (Epic, Cerner Millennium, CareFlow, Sunrise, Nervecentre, Meditech, Welsh Clinical Portal, etc.).
  - 🚗 **Doctor Parking Policies:** Barrier schemes, multi-storeys, staff permit rules, and Park & Ride options.
  - 🚆 **Rail & Transit Connections:** Nearest stations, walking times, and transit connections.
  - 🩺 **Specialist Clinical Services:** Major Trauma Centres, Cardiothoracic surgery, ECMO, Neuroanaesthesia, Regional Burns & Plastic surgery, and Paediatric ICUs.
- **Interactive Intel Modal:** Accessible via hospital chips, map pins, or the national overview. Displays all ST4 rotations that include each hospital with one-click navigation.

### 🌅 Realistic Shift Commute Modeling (07:30 & 18:00 Peak Traffic)
- **Calibrated for Handover:** Commute calculations factor in UK doctor shift patterns:
  - 🌅 **07:30 Arrival:** Morning handover peak incoming rush hour traffic.
  - 🌆 **18:00 Departure:** Evening handover peak outbound rush hour traffic.
  - 🚗 **Off-Peak Baseline:** Free-flow benchmark travel times.
- **Dynamic Commute Radii:** 25-mile suggested living buffers with regional speed adjustments.
- **Personalized Living Hubs (🏡):**
  - **🚗 Driving / Mixed:** Motorway and bypass corridors for trainees with cars.
  - **🚆 Transit Only:** Major rail/bus hubs with shift feasibility warnings for early starts.
  - **📍 Custom Home Postcode:** Enter your prospective home postcode/town or click anywhere on the map to recalculate personal stage-by-stage drive times to every hospital.

### ⚖️ Side-by-Side Comparison Matrix Table
- **Multi-Rotation Matrix:** Compare up to 3 candidate rotations side-by-side in a responsive table.
- **Direct Row Comparison:** Evaluates training balance, peak commute spreads (highlighting the ⭐ Lowest Spread), driver and transit living hubs, hospital bases, and your personal ratings and notes.

### ⭐ Shortlist Reordering & Oriel Preferencing Companion
- **Interactive Ranking:** Drag-and-drop cards or type numbers directly into rank inputs with instant reordering.
- **Oriel Manual Entry Helper:** Because Oriel requires manual entry (no direct CSV upload), each rotation includes:
  - 📋 **1-Click Track Code Copy:** Quickly copy exact Oriel codes for pasting into the search filter.
  - ⏱️ **"Entered on Oriel" Check-off:** Live checklist with progress bar tracking percentage completion.
- **🖨️ Printable A4 Desk Cheat Sheet:** Clean `@media print` formatted summary to print out or save as PDF to keep beside your keyboard while preferencing on Oriel.
- **📊 Export Hard Copy / Reference Sheet (CSV):** Export shortlisted ranks or the entire national dataset to CSV for spreadsheet analysis and personal records. Includes automatic sanitization against CSV formula injection.

### 🔗 1-Click Instant Partner Sharing & JSON Backup
- **🔗 Instant Share Links (`#share=...`):** Generates a single URL encoding your shortlist, preference tiers, notes, and custom home base using safe UTF-8 Base64. When opened by a partner, it automatically prompts them to view and import your preferences.
- **💾 JSON Backup & Restore:** Download or upload complete preference state as a `.json` backup file.

### 📱 Progressive Web App (PWA) & Offline Resilience
- **Offline Capable:** Registered Service Worker (`sw.js`) and Web App Manifest (`manifest.json`) cache the application shell and map tiles.
- **Basement & Theatre Reliable:** Review rotations and commute matrices even with poor signal in hospital basements, operating theatres, or doctors' mess rooms.
- **Installable:** Can be installed directly to home screens on iOS/Android or desktop Chrome/Edge.

### 🎨 UI & Privacy
- **Automatic & Manual Dark Mode:** Matches system preferences (`prefers-color-scheme: dark`) with manual `🌓 Auto` / `🌙 Dark` / `☀️ Light` toggling. Features GPU-filtered high-contrast dark map tiles.
- **100% Client-Side & Private:** Zero tracking cookies, zero analytics, zero external user databases. All preferences stay in your local browser (`localStorage`).

---

## Automated Data Validation

The repository includes an automated validation suite (`validate_data.py`) that checks `data.js` for:
- Unique rotation IDs
- 100% stage-to-hospital dictionary mapping
- Valid UK geographical bounding coordinates (`49.0°N–61.5°N`, `-9.5°W–3.0°E`)
- Schema completeness across all declared hospitals

To run checks locally:
```bash
python validate_data.py
```

---

## How to Edit or Update Data

Rotation schemes and hospital trust metadata are cleanly separated in `data.js`:
1. Open `data.js`.
2. To update a hospital: edit its entry in the `HOSPITALS` dictionary.
3. To update a rotation: edit the corresponding entry under `ROTATIONS_DATA`.
4. Run `python validate_data.py` to confirm schema integrity before pushing.

---

## Disclaimer

This is an independent community project created by trainees for trainees. Always cross-reference all rotational details with the official **Oriel preference portal** and regional School of Anaesthesia recruitment handbooks before final submission.
