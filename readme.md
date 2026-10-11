# ST4 Anaesthetics National Rotation & Commute Explorer

An interactive, open-source web application designed to help UK Anaesthetics trainees and their partners visualise, compare, and rank ST4 training rotations from Oriel.

**Live Tool:** [https://samrowles.github.io/Anaesthetics-ST4-Rotation-Map/](https://samrowles.github.io/Anaesthetics-ST4-Rotation-Map/)

---

## Features

- **National Overview Map with Network Lines:** All 60+ NHS hospital trusts colour-coded by NHS region, connected by interactive dashed rotation route lines. Hover over any line or hospital to highlight linked placements, or click to dive into details.
- **Chronological Route Paths:** Numbers each placement stage (`1`, `2`, `3`...) and connects them with sequential route lines to illustrate the multi-year rotational footprint.
- **Personalized Living Hubs & Commute Calculator (🏡):**
  - **🚗 Driving / Mixed:** Motorway and bypass corridors for trainees with cars.
  - **🚆 Public Transport Only:** Major rail/bus junctions with shift feasibility warnings for early 07:45 handovers.
  - **📍 Custom Home Postcode:** Input your own prospective home postcode or town (or click on the map) to calculate a stage-by-stage commute breakdown with drive times to every hospital base.
- **Side-by-Side Comparison Matrix (⚖️):** Compare up to 3 candidate rotations side-by-side (footprint, commute spread, hospital types, living hubs, user notes, and ratings).
- **Preferencing Tiers & Star Ratings:** Categorize rotations into standard Oriel tiers (🟢 Tier 1, 🟡 Tier 2, 🔴 Tier 3, ⚪ Excluded) and 1–5 stars with personal notes saved locally in your browser (`localStorage`).
- **Interactive Shortlist Reordering & Oriel Submission Companion:**
  - Drag-and-drop ranking or direct rank number inputs with instant recalculation.
  - **Manual Entry Helper:** Because Oriel requires manual entry (no CSV imports), each post has a **1-click code copy button** to paste into Oriel's search bar and an **"Entered in Oriel" check-off tracker** with live completion progress.
  - **Printable A4 / PDF Desk Cheat Sheet:** One-click `@media print` formatted cheat sheet to print out for your desk while typing numbers into Oriel.
  - **Spreadsheet Backup (CSV):** Export complete preference matrices or shortlisted ranks to CSV for Excel / Google Sheets analysis, offline partner review, and personal record keeping.
- **One-Click Backup & Partner Sync:** Download or upload your preferences as a `.json` backup file, or transfer them to a partner with a one-click sync code.
- **Automatic & Manual Dark Mode (Night Shift Mode):** Automatically matches your OS/device preference (`prefers-color-scheme: dark`) with a manual `🌓 Auto` / `🌙 Dark` / `☀️ Light` header switcher. Features GPU-filtered high-contrast dark map tiles with zero API keys.
- **Map Tools:** Fullscreen toggle, GPS "Locate Me", and rotation network line visibility toggles.
- **Zero API Keys & Privacy:** 100% client-side, zero analytics, zero cookies, runs on free OpenStreetMap tiles and UK Postcodes API.

---

## How to Edit or Update Data

Rotation and hospital datasets are cleanly separated in `data.js`. If your training programme publishes updated rotation details:
1. Open `data.js`.
2. Locate the rotation under `ROTATIONS_DATA`.
3. Update the `stages` or `hubs` array and commit.

---

## Disclaimer

This is an independent community tool built by trainees for trainees. Always cross-reference details with your official **Oriel preference portal** and regional School of Anaesthesia websites before final submission.
