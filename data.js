// data.js
const ST4_DATA = {
  hospitals: {
    "add": { name: "Addenbrooke's Hospital", lat: 52.1751, lng: 0.1408, region: "East of England" },
    "nnu": { name: "Norfolk and Norwich University Hospital", lat: 52.6186, lng: 1.2227, region: "East of England" },
    // ... rest of your hospital registry
  },
  rotations: [
    {
      id: "EoE-01",
      orielCode: "EOE/ST4/001",
      title: "Norfolk & Cambridge Core Track",
      region: "East of England",
      places: 4,
      hospitals: ["add", "nnu"],
      suggestedHub: "Bury St Edmunds",
      maxSpreadMiles: 42
    },
    // ... all 76 rotation objects
  ]
};