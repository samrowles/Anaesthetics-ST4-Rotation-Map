/**
 * ST4 Anaesthetics National Rotation & Hospital Dataset
 * - hospitals: Normalized lookup table (key -> details)
 * - rotations: Tracks referencing hospital keys
 */
window.ST4_DATA = {
  hospitals: {
    // East of England
    "addenbrookes": {
      name: "Addenbrooke's Hospital",
      trust: "Cambridge University Hospitals NHS FT",
      region: "East of England",
      lat: 52.1751,
      lng: 0.1408
    },
    "royal_papworth": {
      name: "Royal Papworth Hospital",
      trust: "Royal Papworth Hospital NHS FT",
      region: "East of England",
      lat: 52.1732,
      lng: 0.1415
    },
    "colchester": {
      name: "Colchester General Hospital",
      trust: "East Suffolk and North Essex NHS FT",
      region: "East of England",
      lat: 51.9128,
      lng: 0.8984
    },
    "ipswich": {
      name: "Ipswich Hospital",
      trust: "East Suffolk and North Essex NHS FT",
      region: "East of England",
      lat: 52.0612,
      lng: 1.1963
    },
    "nnu": {
      name: "Norfolk and Norwich University Hospital",
      trust: "Norfolk and Norwich University Hospitals NHS FT",
      region: "East of England",
      lat: 52.6186,
      lng: 1.2227
    },
    "jpaget": {
      name: "James Paget University Hospital",
      trust: "James Paget University Hospitals NHS FT",
      region: "East of England",
      lat: 52.5645,
      lng: 1.7196
    },
    "broomfield": {
      name: "Broomfield Hospital",
      trust: "Mid and South Essex NHS FT",
      region: "East of England",
      lat: 51.7766,
      lng: 0.4735
    },
    "basildon": {
      name: "Basildon University Hospital",
      trust: "Mid and South Essex NHS FT",
      region: "East of England",
      lat: 51.5582,
      lng: 0.4468
    },
    "southend": {
      name: "Southend University Hospital",
      trust: "Mid and South Essex NHS FT",
      region: "East of England",
      lat: 51.5552,
      lng: 0.7001
    },

    // London
    "uclh": {
      name: "University College Hospital",
      trust: "University College London Hospitals NHS FT",
      region: "London",
      lat: 51.5252,
      lng: -0.1378
    },
    "royal_free": {
      name: "Royal Free Hospital",
      trust: "Royal Free London NHS FT",
      region: "London",
      lat: 51.5532,
      lng: -0.1656
    },
    "st_georges": {
      name: "St George's Hospital",
      trust: "St George's University Hospitals NHS FT",
      region: "London",
      lat: 51.4276,
      lng: -0.1752
    },
    "guys_st_thomas": {
      name: "St Thomas' Hospital",
      trust: "Guy's and St Thomas' NHS FT",
      region: "London",
      lat: 51.4988,
      lng: -0.1187
    },
    "kings": {
      name: "King's College Hospital",
      trust: "King's College Hospital NHS FT",
      region: "London",
      lat: 51.4682,
      lng: -0.0917
    },

    // West Midlands
    "qeh_birmingham": {
      name: "Queen Elizabeth Hospital Birmingham",
      trust: "University Hospitals Birmingham NHS FT",
      region: "West Midlands",
      lat: 52.4514,
      lng: -1.9392
    },
    "heartlands": {
      name: "Birmingham Heartlands Hospital",
      trust: "University Hospitals Birmingham NHS FT",
      region: "West Midlands",
      lat: 52.4812,
      lng: -1.8315
    },
    "worcester": {
      name: "Worcestershire Royal Hospital",
      trust: "Worcestershire Acute Hospitals NHS Trust",
      region: "West Midlands",
      lat: 52.1974,
      lng: -2.1813
    },
    "stoke": {
      name: "Royal Stoke University Hospital",
      trust: "University Hospitals of North Midlands NHS Trust",
      region: "West Midlands",
      lat: 53.0039,
      lng: -2.2158
    },

    // North West
    "mri": {
      name: "Manchester Royal Infirmary",
      trust: "Manchester University NHS FT",
      region: "North West",
      lat: 53.4616,
      lng: -2.2274
    },
    "salford": {
      name: "Salford Royal Hospital",
      trust: "Northern Care Alliance NHS FT",
      region: "North West",
      lat: 53.4883,
      lng: -2.3235
    },
    "rluh": {
      name: "Royal Liverpool University Hospital",
      trust: "Liverpool University Hospitals NHS FT",
      region: "North West",
      lat: 53.4093,
      lng: -2.9615
    },

    // South West
    "bri": {
      name: "Bristol Royal Infirmary",
      trust: "University Hospitals Bristol and Weston NHS FT",
      region: "South West",
      lat: 51.4589,
      lng: -2.5975
    },
    "southmead": {
      name: "Southmead Hospital",
      trust: "North Bristol NHS Trust",
      region: "South West",
      lat: 51.4965,
      lng: -2.5908
    },
    "bath_ruh": {
      name: "Royal United Hospital Bath",
      trust: "Royal United Hospitals Bath NHS FT",
      region: "South West",
      lat: 51.3934,
      lng: -2.3941
    }
  },

  rotations: [
    {
      id: "EOE-01",
      orielCode: "EOE/ST4/001",
      title: "Cambridge, Papworth & Ipswich Core Track",
      region: "East of England",
      places: 4,
      hospitals: ["addenbrookes", "royal_papworth", "ipswich"],
      suggestedHub: "Newmarket / Bury St Edmunds",
      maxSpreadMiles: 48,
      hubDetails: "Equal A14 commute split between tertiary Cambridge sites and DGH modules in Ipswich.",
      description: "Tertiary cardiac and neuro exposure with standard DGH district general rotation."
    },
    {
      id: "EOE-02",
      orielCode: "EOE/ST4/002",
      title: "South Essex DGH & Regional Network",
      region: "East of England",
      places: 3,
      hospitals: ["colchester", "ipswich", "broomfield"],
      suggestedHub: "Colchester / Manningtree",
      maxSpreadMiles: 38,
      hubDetails: "Living in north Essex keeps all three sites within a 30-45 minute drive via the A12.",
      description: "Excellent regional plastics and burns exposure at Broomfield paired with high throughput general anaesthesia."
    },
    {
      id: "EOE-03",
      orielCode: "EOE/ST4/003",
      title: "Norfolk Broadlands & Norwich Tertiary Track",
      region: "East of England",
      places: 3,
      hospitals: ["nnu", "jpaget"],
      suggestedHub: "Norwich South",
      maxSpreadMiles: 23,
      hubDetails: "Low mileage rotation based primarily around Norwich with coastal DGH attachment.",
      description: "Manageable travel with dedicated obstetric, paediatric, and regional blocks."
    },
    {
      id: "EOE-04",
      orielCode: "EOE/ST4/004",
      title: "Mid & South Essex Consolidated",
      region: "East of England",
      places: 2,
      hospitals: ["broomfield", "basildon", "southend"],
      suggestedHub: "Chelmsford / Billericay",
      maxSpreadMiles: 24,
      hubDetails: "Central Essex commute using A12/A130 corridors.",
      description: "Cardiothoracics at Basildon Essex CTC, burns at Broomfield, high acute DGH at Southend."
    },
    {
      id: "LDN-01",
      orielCode: "LDN/ST4/101",
      title: "North Central London Central Sector",
      region: "London",
      places: 5,
      hospitals: ["uclh", "royal_free"],
      suggestedHub: "Camden / Highbury (Public Transport)",
      maxSpreadMiles: 3,
      hubDetails: "Minimal commute. Short tube/bus journeys across zone 1-2.",
      description: "Major academic teaching hospital experience across neuro, hepatobiliary, and vascular."
    },
    {
      id: "LDN-02",
      orielCode: "LDN/ST4/102",
      title: "South London Tertiary Network",
      region: "London",
      places: 4,
      hospitals: ["guys_st_thomas", "kings", "st_georges"],
      suggestedHub: "Clapham / Brixton",
      maxSpreadMiles: 6,
      hubDetails: "Well connected by Northern Line, London Overground, and cycle routes.",
      description: "Major trauma centre rotation with high-risk obstetrics and paediatric modules."
    },
    {
      id: "WM-01",
      orielCode: "WM/ST4/201",
      title: "Birmingham Central & South Core",
      region: "West Midlands",
      places: 4,
      hospitals: ["qeh_birmingham", "heartlands", "worcester"],
      suggestedHub: "South Birmingham (Harborne / Solihull)",
      maxSpreadMiles: 32,
      hubDetails: "Balanced motorway access via the M5 and M42.",
      description: "Level 1 Major Trauma Centre at QE combined with county DGH intensive care."
    },
    {
      id: "WM-02",
      orielCode: "WM/ST4/202",
      title: "North Midlands Trauma & Critical Care",
      region: "West Midlands",
      places: 2,
      hospitals: ["stoke", "heartlands"],
      suggestedHub: "Stafford / Stone",
      maxSpreadMiles: 46,
      hubDetails: "M6 commute spine connecting Stoke-on-Trent down to the West Midlands conurbation.",
      description: "Extensive regional major trauma, neuro, and paediatric critical care exposure."
    },
    {
      id: "NW-01",
      orielCode: "NW/ST4/301",
      title: "Greater Manchester Academic Core",
      region: "North West",
      places: 6,
      hospitals: ["mri", "salford"],
      suggestedHub: "Manchester City Centre / Salford Quays",
      maxSpreadMiles: 4,
      hubDetails: "Short Metrolink tram commute or cycle commute between tertiary bases.",
      description: "Comprehensive neuroanaesthesia, tertiary intensive care, and renal transplant experience."
    },
    {
      id: "NW-02",
      orielCode: "NW/ST4/302",
      title: "Mersey & Manchester Cross-City Track",
      region: "North West",
      places: 3,
      hospitals: ["mri", "rluh"],
      suggestedHub: "Warrington / Newton-le-Willows",
      maxSpreadMiles: 34,
      hubDetails: "Midpoint living near the M62 allows balanced 30-minute drives in both directions.",
      description: "Diverse exposure spanning two premier North West teaching hubs."
    },
    {
      id: "SW-01",
      orielCode: "SW/ST4/401",
      title: "Severn Core Track: Bristol & Bath",
      region: "South West",
      places: 4,
      hospitals: ["bri", "southmead", "bath_ruh"],
      suggestedHub: "North Bristol / Keynsham",
      maxSpreadMiles: 15,
      hubDetails: "Living along the A4 corridor or North Bristol connects to all three sites easily.",
      description: "Major trauma centre experience at Southmead, adult tertiary care at BRI, high-volume DGH in Bath."
    }
  ]
};
