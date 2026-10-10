# ST4 Anaesthetics National Rotation & Commute Explorer

An interactive, open-source web application designed to help UK Anaesthetics trainees and their partners visualise, compare, and rank ST4 training rotations from Oriel.

👉 **Live Tool:** [https://samrowles.github.io/Anaesthetics-ST4-Rotation-Map/](https://samrowles.github.io/Anaesthetics-ST4-Rotation-Map/)

---

## Features

- **National Overview Map:** All 60+ NHS hospital trusts colour-coded by NHS region. Click any hospital pin on the map to see every rotation that visits it.
- **Chronological Route Paths:** Numbers each placement stage (`1`, `2`, `3`...) and connects them with route lines to illustrate the 4-year rotational footprint.
- **Dual Living Hubs (🏡):**
  - **🚗 Driving / Mixed:** Motorway and bypass corridors for trainees with cars.
  - **🚆 Public Transport Only:** Major rail/bus junctions with shift feasibility warnings for early 07:45 handovers.
- **Commute Spread Analysis:** Calculates the maximum pairwise mileage spread with realistic drive-time estimates.
- **Ratings & Notes:** Star-rate rotations (1–5) and save personal notes directly in your browser (`localStorage`).
- **Shortlist Reordering & CSV Export:** Drag or reorder your top choices into an ordered rank list and export to CSV.
- **Partner Sync:** Transfer your ratings and notes to a partner's device with a one-click sync code.
- **Zero API Keys & Privacy:** 100% client-side, zero analytics, zero cookies, runs on free OpenStreetMap tiles.

---

## How to Edit or Update Data

Rotation and hospital datasets are cleanly separated in `data.js`. If your training programme publishes updated rotation details:
1. Open `data.js`.
2. Locate the rotation under `ROTATIONS_DATA`.
3. Update the `stages` or `hubs` array and commit.

---

## Disclaimer

This is an independent community tool built by trainees for trainees. Always cross-reference details with your official **Oriel preference portal** and regional School of Anaesthesia websites before final submission.