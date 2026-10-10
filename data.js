// ============================================================================
// ST4 Anaesthetics National Placement Data
// ============================================================================

// 1. MASTER HOSPITAL COORDINATES
const HOSPITALS = {
  // Cambridge Biomedical Campus
  "Addenbrooke's Hospital, Cambridge": { coords: [52.1751, 0.1408], region: "East of England" },
  "Royal Papworth Hospital, Cambridge": { coords: [52.1738, 0.1388], region: "East of England" },
  
  // East of England
  "Watford General Hospital": { coords: [51.6471, -0.4035], region: "East of England" },
  "Lister Hospital, Stevenage": { coords: [51.9162, -0.2154], region: "East of England" },
  "Broomfield Hospital, Chelmsford": { coords: [51.7762, 0.4682], region: "East of England" },
  "Basildon Cardiothoracic Centre": { coords: [51.5562, 0.4491], region: "East of England" },
  "Southend Hospital": { coords: [51.5544, 0.6861], region: "East of England" },
  "Colchester Hospital": { coords: [51.9142, 0.9011], region: "East of England" },
  "Princess Alexandra Hospital, Harlow": { coords: [51.7725, 0.0894], region: "East of England" },
  "Bedford Hospital": { coords: [52.1292, -0.4683], region: "East of England" },
  "Luton & Dunstable Hospital": { coords: [51.8972, -0.4721], region: "East of England" },
  "Norfolk & Norwich University Hospital": { coords: [52.6181, 1.2212], region: "East of England" },
  "Ipswich Hospital": { coords: [52.0543, 1.2001], region: "East of England" },
  "West Suffolk Hospital, Bury St Edmunds": { coords: [52.2321, 0.7042], region: "East of England" },
  "James Paget Hospital, Great Yarmouth": { coords: [52.5492, 1.7161], region: "East of England" },
  "Queen Elizabeth Hospital, Kings Lynn": { coords: [52.7531, 0.4431], region: "East of England" },

  // London
  "Royal Free Hospital": { coords: [51.5532, -0.1652], region: "London - North Central East" },
  "St Bartholomew's Hospital (Barts Cardiac)": { coords: [51.5173, -0.1002], region: "London - North Central East" },
  "Queen Square (NHNN)": { coords: [51.5221, -0.1224], region: "London - North Central East" },
  "University College Hospital (UCH)": { coords: [51.5252, -0.1362], region: "London - North Central East" },
  "Moorfields Eye Hospital": { coords: [51.5273, -0.0881], region: "London - North Central East" },
  "Royal London Hospital": { coords: [51.5192, -0.0593], region: "London - North Central East" },
  "Barnet Hospital (BCF)": { coords: [51.6521, -0.2223], region: "London - North Central East" },
  "RNOH Stanmore": { coords: [51.6262, -0.3204], region: "London - North Central East" },
  "Queen's Hospital, Romford": { coords: [51.5691, 0.1792], region: "London - North Central East" },
  "Whittington Hospital (London General)": { coords: [51.5661, -0.1402], region: "London - North Central East" },
  
  "Chelsea & Westminster Hospital": { coords: [51.4842, -0.1824], region: "London - North West" },
  "Charing Cross Hospital": { coords: [51.4883, -0.2192], region: "London - North West" },
  "Northwick Park Hospital": { coords: [51.5772, -0.3202], region: "London - North West" },
  "Hammersmith Hospital": { coords: [51.5171, -0.2372], region: "London - North West" },
  "St Mary's Hospital, Paddington": { coords: [51.5172, -0.1742], region: "London - North West" },
  "Royal Brompton Hospital": { coords: [51.4902, -0.1693], region: "London - North West" },
  "West Middlesex University Hospital": { coords: [51.4782, -0.3271], region: "London - North West" },
  "Hillingdon Hospital": { coords: [51.5232, -0.4601], region: "London - North West" },

  "St George's Hospital, Tooting": { coords: [51.4272, -0.1752], region: "London - South" },
  "King's College Hospital": { coords: [51.4682, -0.0931], region: "London - South" },
  "Guy's & St Thomas' Hospital": { coords: [51.4982, -0.1192], region: "London - South" },

  // Thames Valley
  "John Radcliffe Hospital, Oxford": { coords: [51.7652, -1.2191], region: "Thames Valley" },
  "Royal Berkshire Hospital, Reading": { coords: [51.4472, -0.9602], region: "Thames Valley" },

  // Wessex
  "Southampton General Hospital": { coords: [50.9341, -1.4322], region: "Wessex" },
  "Queen Alexandra Hospital, Portsmouth": { coords: [50.8492, -1.0712], region: "Wessex" },
  "Basingstoke & North Hampshire Hospital": { coords: [51.2721, -1.1092], region: "Wessex" },
  "Royal Hampshire County Hospital, Winchester": { coords: [51.0641, -1.3321], region: "Wessex" },
  "Poole Hospital": { coords: [50.7252, -1.9772], region: "Wessex" },
  "Royal Bournemouth Hospital": { coords: [50.7422, -1.8261], region: "Wessex" },
  "Dorset County Hospital, Dorchester": { coords: [50.7132, -2.4462], region: "Wessex" },
  "Salisbury District Hospital": { coords: [51.0471, -1.7962], region: "Wessex" },

  // Severn & Peninsula
  "Bristol Royal Infirmary (UHBW)": { coords: [51.4582, -2.5971], region: "South West - Severn" },
  "Southmead Hospital (NBT)": { coords: [51.4972, -2.5931], region: "South West - Severn" },
  "Gloucestershire Royal Hospital": { coords: [51.8682, -2.2341], region: "South West - Severn" },
  "Great Western Hospital, Swindon": { coords: [51.5332, -1.7331], region: "South West - Severn" },
  "Royal Cornwall Hospital, Truro": { coords: [50.2712, -5.0931], region: "South West - Peninsula" },
  "Derriford Hospital, Plymouth": { coords: [50.4162, -4.1162], region: "South West - Peninsula" },
  "Royal Devon & Exeter Hospital": { coords: [50.7152, -3.5131], region: "South West - Peninsula" },
  "Torbay Hospital": { coords: [50.4852, -3.5571], region: "South West - Peninsula" },
  "Musgrove Park Hospital, Taunton": { coords: [51.0142, -3.1202], region: "South West - Peninsula" },

  // East Midlands
  "Queen's Medical Centre (QMC), Nottingham": { coords: [52.9431, -1.1862], region: "East Midlands" },
  "Nottingham City Hospital": { coords: [52.9862, -1.1612], region: "East Midlands" },
  "Royal Derby Hospital": { coords: [52.9102, -1.5121], region: "East Midlands" },
  "Chesterfield Royal Hospital": { coords: [53.2272, -1.3912], region: "East Midlands" },
  "Lincoln County Hospital": { coords: [53.2321, -0.5182], region: "East Midlands" },
  "Boston Pilgrim Hospital": { coords: [52.9892, -0.0071], region: "East Midlands" },
  "Kings Mill Hospital, Mansfield": { coords: [53.1362, -1.2181], region: "East Midlands" },
  "Leicester Royal Infirmary": { coords: [52.6282, -1.1342], region: "East Midlands" },
  "Glenfield Hospital, Leicester": { coords: [52.6542, -1.1802], region: "East Midlands" },
  "Northampton General Hospital": { coords: [52.2352, -0.8871], region: "East Midlands" },
  "Kettering General Hospital": { coords: [52.3992, -0.7381], region: "East Midlands" },

  // Wales
  "Glan Clwyd Hospital, Rhyl": { coords: [53.2682, -3.5161], region: "Wales" },
  "The Walton Centre, Liverpool": { coords: [53.4752, -2.9421], region: "Wales" },
  "Glangwili Hospital, Carmarthen": { coords: [51.8642, -4.2882], region: "Wales" },
  "Royal Glamorgan Hospital, Llantrisant": { coords: [51.5452, -3.3981], region: "Wales" },
  "Morriston Hospital, Swansea": { coords: [51.6702, -3.9262], region: "Wales" },
  "University Hospital of Wales, Cardiff": { coords: [51.5072, -3.1902], region: "Wales" },

  // West Midlands
  "Royal Stoke University Hospital": { coords: [53.0052, -2.2152], region: "West Midlands" },
  "New Cross Hospital, Wolverhampton": { coords: [52.5972, -2.0972], region: "West Midlands" },
  "Walsall Manor Hospital": { coords: [52.5852, -1.9962], region: "West Midlands" },
  "Midlands Met University Hospital": { coords: [52.4972, -1.9672], region: "West Midlands" },
  "Royal Shrewsbury Hospital": { coords: [52.7062, -2.7842], region: "West Midlands" },
  "Queen Elizabeth Hospital Birmingham": { coords: [52.4512, -1.9402], region: "West Midlands" },
  "UHCW Coventry": { coords: [52.4172, -1.4362], region: "West Midlands" },
  "Warwick Hospital": { coords: [52.2852, -1.5972], region: "West Midlands" },

  // Yorkshire and the Humber
  "Hull Royal Infirmary": { coords: [53.7442, -0.3582], region: "Yorkshire and the Humber" },
  "York Hospital": { coords: [53.9702, -1.0832], region: "Yorkshire and the Humber" },
  "Scarborough Hospital": { coords: [54.2792, -0.4282], region: "Yorkshire and the Humber" },
  "Scunthorpe General Hospital": { coords: [53.5902, -0.6692], region: "Yorkshire and the Humber" },
  "Northern General Hospital, Sheffield": { coords: [53.4152, -1.4582], region: "Yorkshire and the Humber" },
  "Doncaster Royal Infirmary": { coords: [53.5282, -1.1062], region: "Yorkshire and the Humber" },
  "Rotherham Hospital": { coords: [53.4182, -1.3482], region: "Yorkshire and the Humber" },
  "Barnsley Hospital": { coords: [53.5582, -1.5042], region: "Yorkshire and the Humber" },
  "Leeds General Infirmary": { coords: [53.8012, -1.5532], region: "Yorkshire and the Humber" },
  "Bradford Royal Infirmary": { coords: [53.8042, -1.7962], region: "Yorkshire and the Humber" },
  "Pinderfields Hospital, Wakefield": { coords: [53.6932, -1.4842], region: "Yorkshire and the Humber" },

  // North West & North East
  "Royal Liverpool University Hospital": { coords: [53.4092, -2.9642], region: "North West" },
  "Manchester Royal Infirmary": { coords: [53.4622, -2.2272], region: "North West" },
  "Royal Victoria Infirmary, Newcastle": { coords: [54.9782, -1.6232], region: "North East" }
};

// 2. REGIONAL COLOUR MAPPING
const REGION_COLORS = {
  "East of England": "#ea580c",
  "East Midlands": "#16a34a",
  "London - North Central East": "#dc2626",
  "London - North West": "#e11d48",
  "London - South": "#b91c1c",
  "Wessex": "#2563eb",
  "Thames Valley": "#8b5cf6",
  "South West - Severn": "#0891b2",
  "South West - Peninsula": "#0d9488",
  "Wales": "#c026d3",
  "West Midlands": "#d97706",
  "Yorkshire and the Humber": "#4f46e5",
  "North West": "#0284c7",
  "North East": "#6366f1"
};

// 3. MASTER ROTATIONS DATA (76 valid, non-zero rotations)
const ROTATIONS_DATA = [
  // ==================== WESSEX ====================
  {
    id: "wessex-west", code: "Wessex - West (Posts 1, 2 & 3)", region: "Wessex", title: "Wessex West Rotational Scheme", places: "7 total",
    hubs: {
      driver: { name: "Wimborne Minster / Ringwood", coords: [50.8000, -1.9860], desc: "A31/A338. Commute: 20m to Poole/Bournemouth, 32m to Southampton, 40m to Salisbury/Dorchester.", alert: "Central base across Dorset and Hampshire." },
      transit: { name: "Bournemouth Central / Poole", coords: [50.7262, -1.8662], desc: "Frequent m1/m2 buses connect Poole and Bournemouth 24/7; direct trains to Southampton (30m) and Dorchester (40m).", alert: "⚠️ Note: Salisbury requires connecting hospital bus from station." }
    },
    stages: [
      { stage: "West Base Network", hosp: "Southampton General Hospital", desc: "Regional MTC & Specialist Surgery" },
      { stage: "West Base Network", hosp: "Poole Hospital", desc: "Acute District General Placements" },
      { stage: "West Base Network", hosp: "Royal Bournemouth Hospital", desc: "Major Elective Centre" },
      { stage: "West Base Network", hosp: "Salisbury District Hospital", desc: "Regional Burns & Plastics" },
      { stage: "West Base Network", hosp: "Dorset County Hospital, Dorchester", desc: "DGH Anaesthesia" }
    ]
  },
  {
    id: "wessex-east", code: "Wessex - East (Posts 4, 5 & 6)", region: "Wessex", title: "Wessex East Rotational Scheme", places: "7 total",
    hubs: {
      driver: { name: "Winchester", coords: [51.0632, -1.3080], desc: "M3/M27/A34 junction. Driving: 18m to Southampton General, 28m to Portsmouth (QA), 22m to Basingstoke.", alert: "Premier driving base for Wessex East." },
      transit: { name: "Eastleigh / Southampton Central", coords: [50.9682, -1.3532], desc: "Eastleigh connects directly by train to Basingstoke (22m), Winchester (12m), and Portsmouth (40m); Unilink bus to Southampton General.", alert: "Southampton General requires bus connection from station." }
    },
    stages: [
      { stage: "East Base Network", hosp: "Southampton General Hospital", desc: "Regional Major Trauma & Cardiac Centre" },
      { stage: "East Base Network", hosp: "Queen Alexandra Hospital, Portsmouth", desc: "Major Acute & Vascular Centre" },
      { stage: "East Base Network", hosp: "Basingstoke & North Hampshire Hospital", desc: "Pseudomyxoma & General Surgery" },
      { stage: "East Base Network", hosp: "Royal Hampshire County Hospital, Winchester", desc: "Elective Orthopaedics & General" }
    ]
  },

  // ==================== LONDON - NCEL ====================
  {
    id: "ncel-l20", code: "NCEL - L20", region: "London - North Central East", title: "Central London Tertiary Track", places: "1",
    hubs: {
      driver: { name: "Finsbury Park / Highbury", coords: [51.5642, -0.1062], desc: "Driving not recommended to UCH/Barts due to lack of staff parking.", alert: "Public transport is standard for central London." },
      transit: { name: "Finsbury Park / Highbury & Islington", coords: [51.5462, -0.1032], desc: "Victoria & Piccadilly lines + Thameslink. 10m to UCH, 15m to Royal Free, 15m to Barts & Queen Square.", alert: "24-hour Tube connectivity across central teaching hospitals." }
    },
    stages: [
      { stage: "ST4 (6m)", hosp: "Royal Free Hospital", desc: "General & Vascular Anaesthesia" },
      { stage: "ST4 (3m)", hosp: "Royal Free Hospital", desc: "Intensive Care Medicine" },
      { stage: "ST5 (3m)", hosp: "St Bartholomew's Hospital (Barts Cardiac)", desc: "Cardiothoracic Anaesthesia" },
      { stage: "ST5 (3m)", hosp: "Queen Square (NHNN)", desc: "Neuroanaesthesia" },
      { stage: "ST5 (3m)", hosp: "University College Hospital (UCH)", desc: "Head & Neck, General" },
      { stage: "ST5 (3m)", hosp: "Moorfields Eye Hospital", desc: "Ophthalmic Anaesthesia" }
    ]
  },
  {
    id: "ncel-l17", code: "NCEL - L17", region: "London - North Central East", title: "Queen Square, UCH, Chelsea & Barts", places: "1",
    hubs: {
      driver: { name: "Camden / Highbury", coords: [51.5432, -0.1422], desc: "Central location connecting UCH, Queen Square, Barts, and Chelsea.", alert: "Public transit recommended." },
      transit: { name: "Finsbury Park / Kings Cross", coords: [51.5302, -0.1242], desc: "Piccadilly/Victoria lines to Queen Sq and UCH; Piccadilly line to Chelsea & Westminster; direct to Barts.", alert: "Very central rotation with great Tube links." }
    },
    stages: [
      { stage: "Stage 1", hosp: "Queen Square (NHNN)", desc: "Neuroanaesthesia (3m)" },
      { stage: "Stage 2", hosp: "University College Hospital (UCH)", desc: "General (6m) & ITU (3m)" },
      { stage: "Stage 3", hosp: "Chelsea & Westminster Hospital", desc: "Anaesthesia (6m)" },
      { stage: "Stage 4", hosp: "St Bartholomew's Hospital (Barts Cardiac)", desc: "Cardiothoracic Module (3m)" },
      { stage: "Stage 5", hosp: "Whittington Hospital (London General)", desc: "DGH Anaesthesia (3m)" }
    ]
  },
  {
    id: "ncel-l18", code: "NCEL - L18", region: "London - North Central East", title: "BCF, Stanmore, Chelsea, Barts & Queen Sq", places: "1",
    hubs: {
      driver: { name: "Mill Hill / Golders Green", coords: [51.6162, -0.2242], desc: "A41/A1 corridor. Good car access to Barnet (BCF) and RNOH Stanmore.", alert: "Staff parking at Barnet and Stanmore." },
      transit: { name: "West Hampstead / Finchley Road", coords: [51.5472, -0.1912], desc: "Jubilee Line to Stanmore (RNOH); Thameslink to central London; Northern line / bus to Barnet (BCF).", alert: "Jubilee line provides 25m transit out to Stanmore." }
    },
    stages: [
      { stage: "ST4 (3m)", hosp: "Barnet Hospital (BCF)", desc: "General DGH Anaesthetics" },
      { stage: "ST4 (3m)", hosp: "University College Hospital (UCH)", desc: "ICU Module" },
      { stage: "ST4 (6m)", hosp: "RNOH Stanmore", desc: "Specialist Orthopaedic Anaesthesia" },
      { stage: "ST5 (6m)", hosp: "Chelsea & Westminster Hospital", desc: "Burns, Paeds & General" },
      { stage: "ST5 (3m)", hosp: "St Bartholomew's Hospital (Barts Cardiac)", desc: "Cardiothoracic Module" },
      { stage: "ST5 (3m)", hosp: "Queen Square (NHNN)", desc: "Neuroanaesthesia Module" }
    ]
  },
  {
    id: "ncel-l19", code: "NCEL - L19", region: "London - North Central East", title: "Royal Free, Barts, Queen Sq, UCH & Chelsea", places: "1",
    hubs: {
      driver: { name: "Highbury / Islington", coords: [51.5462, -0.1032], desc: "Central location linking Royal Free, UCH, Barts, and Chelsea.", alert: "Public transport recommended." },
      transit: { name: "Highbury & Islington / Finsbury Park", coords: [51.5462, -0.1032], desc: "Victoria line, Overground, and Piccadilly lines connect all sites effortlessly.", alert: "24-hour Tube connectivity across all teaching sites." }
    },
    stages: [
      { stage: "Stage 1", hosp: "Royal Free Hospital", desc: "General (6m) & ITU (3m)" },
      { stage: "Stage 2", hosp: "St Bartholomew's Hospital (Barts Cardiac)", desc: "Cardiothoracics (3m)" },
      { stage: "Stage 3", hosp: "Queen Square (NHNN)", desc: "Neuroanaesthesia (3m)" },
      { stage: "Stage 4", hosp: "University College Hospital (UCH)", desc: "Thoracic Anaesthesia (3m)" },
      { stage: "Stage 5", hosp: "Chelsea & Westminster Hospital", desc: "General & Paeds (6m)" }
    ]
  },
  {
    id: "ncel-l12-13-14", code: "NCEL - L12, L13 & L14", region: "London - North Central East", title: "BCF, Chelsea, Barts, Queen Sq & UCH", places: "3 total",
    hubs: {
      driver: { name: "East Finchley", coords: [51.5872, -0.1652], desc: "A1/North Circular. Good for driving to Barnet while staying close to central sites.", alert: "Car useful for Barnet blocks." },
      transit: { name: "Camden / Highbury", coords: [51.5432, -0.1422], desc: "Northern line to Barnet; Piccadilly/Victoria lines to central teaching hospitals; Overground to West London.", alert: "Central pivot point with 24h Northern Line." }
    },
    stages: [
      { stage: "Stage 1 (6m)", hosp: "Barnet Hospital (BCF)", desc: "General Placement" },
      { stage: "Stage 2 (6m)", hosp: "Chelsea & Westminster Hospital", desc: "Paeds & General" },
      { stage: "Stage 3 (3m)", hosp: "Whittington Hospital (London General)", desc: "General DGH" },
      { stage: "Stage 4 (3m)", hosp: "St Bartholomew's Hospital (Barts Cardiac)", desc: "Cardiothoracics" },
      { stage: "Stage 5 (3m)", hosp: "Queen Square (NHNN)", desc: "Neuroanaesthesia" },
      { stage: "Stage 6 (3m)", hosp: "University College Hospital (UCH)", desc: "ICU Module" }
    ]
  },
  {
    id: "ncel-l16", code: "NCEL - L16", region: "London - North Central East", title: "UCH ITU, Queen Sq, Barts & Royal Free", places: "1",
    hubs: {
      driver: { name: "Hampstead / Highgate", coords: [51.5562, -0.1782], desc: "Close to Royal Free for the 9-month block.", alert: "Parking restricted in central London." },
      transit: { name: "Kentish Town / Camden", coords: [51.5432, -0.1422], desc: "Northern line directly to Royal Free (Belsize Park/Hampstead) and central hospitals (UCH, Barts, Queen Square).", alert: "Very short commutes across all sites." }
    },
    stages: [
      { stage: "Stage 1 (3m)", hosp: "University College Hospital (UCH)", desc: "ITU Module" },
      { stage: "Stage 2 (3m)", hosp: "Queen Square (NHNN)", desc: "Neuroanaesthesia" },
      { stage: "Stage 3 (3m)", hosp: "St Bartholomew's Hospital (Barts Cardiac)", desc: "Cardiothoracics" },
      { stage: "Stage 4 (3m)", hosp: "Whittington Hospital (London General)", desc: "General DGH" },
      { stage: "Stage 5 (9m)", hosp: "Royal Free Hospital", desc: "General Anaesthesia" }
    ]
  },
  {
    id: "ncel-l15", code: "NCEL - L15", region: "London - North Central East", title: "Royal Free, Romford, UCH & Barts", places: "1",
    hubs: {
      driver: { name: "South Woodford / Redbridge", coords: [51.5912, 0.0272], desc: "A406 / A12 intersection. 22m drive east to Queen's Hospital (Romford); good link to Royal Free.", alert: "A12 provides fast vehicular access to Romford." },
      transit: { name: "Stratford / Whitechapel", coords: [51.5412, -0.0032], desc: "Elizabeth line takes you to Romford in 18 minutes; Central Line into Barts/City; Overground to Hampstead.", alert: "Elizabeth line has significantly improved the Romford commute." }
    },
    stages: [
      { stage: "Stage 1 (6m)", hosp: "Royal Free Hospital", desc: "General Anaesthesia" },
      { stage: "Stage 2 (6m)", hosp: "Queen's Hospital, Romford", desc: "General & Neuro" },
      { stage: "Stage 3 (6m)", hosp: "University College Hospital (UCH)", desc: "Thoracic & ICU" },
      { stage: "Stage 4 (3m)", hosp: "St Bartholomew's Hospital (Barts Cardiac)", desc: "Cardiothoracics Module" }
    ]
  },
  {
    id: "ncel-l21", code: "NCEL - L21", region: "London - North Central East", title: "Romford, Royal London, Royal Free & Barts", places: "1",
    hubs: {
      driver: { name: "Stratford / Leyton", coords: [51.5502, -0.0102], desc: "A12 access to Romford; A11 into City and East London.", alert: "Good east London road connectivity." },
      transit: { name: "Stratford / Whitechapel", coords: [51.5412, -0.0032], desc: "Elizabeth line direct to Romford (18m), Whitechapel (Royal London), and Farringdon (Barts).", alert: "Elizabeth line makes this rotation seamless." }
    },
    stages: [
      { stage: "Stage 1 (6m)", hosp: "Queen's Hospital, Romford", desc: "General & Neuro" },
      { stage: "Stage 2 (3m)", hosp: "Whittington Hospital (London General)", desc: "General DGH" },
      { stage: "Stage 3 (3m)", hosp: "Royal London Hospital", desc: "ITU Module" },
      { stage: "Stage 4 (6m)", hosp: "Royal Free Hospital", desc: "General & ITU" },
      { stage: "Stage 5 (3m)", hosp: "St Bartholomew's Hospital (Barts Cardiac)", desc: "Cardiothoracics" }
    ]
  },
  {
    id: "ncel-l22", code: "NCEL - L22", region: "London - North Central East", title: "UCH, Romford, Royal London, Barts & Chelsea", places: "1",
    hubs: {
      driver: { name: "City of London / East End border", coords: [51.5202, -0.0602], desc: "Central location linking UCH, Romford, Royal London, and Chelsea.", alert: "Public transit recommended." },
      transit: { name: "Whitechapel / Stratford", coords: [51.5192, -0.0593], desc: "Elizabeth line to Romford (18m) and Farringdon/Tottenham Court Rd (UCH/Barts); District line to Chelsea.", alert: "Whitechapel is directly on the Elizabeth line and District line." }
    },
    stages: [
      { stage: "Stage 1 (6m)", hosp: "University College Hospital (UCH)", desc: "General" },
      { stage: "Stage 2 (6m)", hosp: "Queen's Hospital, Romford", desc: "Neuro & General" },
      { stage: "Stage 3 (3m)", hosp: "Royal London Hospital", desc: "ITU Module" },
      { stage: "Stage 4 (3m)", hosp: "St Bartholomew's Hospital (Barts Cardiac)", desc: "Cardiothoracics" },
      { stage: "Stage 5 (6m)", hosp: "Chelsea & Westminster Hospital", desc: "General" }
    ]
  },

  // ==================== LONDON - NWL ====================
  {
    id: "nwl-l10", code: "NWL - L10", region: "London - North West", title: "Chelsea, Charing Cross, Northwick Park & Hammersmith", places: "1",
    hubs: {
      driver: { name: "Acton / Ealing", coords: [51.5132, -0.3042], desc: "A40 / North Circular. 20m drive to Northwick Park; 15m to Hammersmith; 20m to Chelsea.", alert: "Driving allows easy cross-suburban transit to Northwick Park." },
      transit: { name: "Ealing Broadway / Hammersmith", coords: [51.5142, -0.3022], desc: "Piccadilly/District lines to Charing Cross & Chelsea; Central line to Hammersmith; Metropolitan to Northwick Park.", alert: "Superb West London public transport connectivity." }
    },
    stages: [
      { stage: "Stage 1 (6m)", hosp: "Chelsea & Westminster Hospital", desc: "ICM (3m) & Anaesthesia (3m)" },
      { stage: "Stage 2 (6m)", hosp: "Charing Cross Hospital", desc: "Neuro, Head & Neck, Vascular" },
      { stage: "Stage 3 (6m)", hosp: "Northwick Park Hospital", desc: "Obstetrics & General DGH" },
      { stage: "Stage 4 (6m)", hosp: "Hammersmith Hospital", desc: "Renal & Cardiothoracics" }
    ]
  },
  {
    id: "nwl-l3", code: "NWL - L3", region: "London - North West", title: "St Mary's, Brompton, Charing Cross & Chelsea", places: "1",
    hubs: {
      driver: { name: "Shepherd's Bush / Hammersmith", coords: [51.5032, -0.2242], desc: "A4/A40 access. Central West London location.", alert: "Close proximity to all west London teaching sites." },
      transit: { name: "Hammersmith / South Kensington", coords: [51.4922, -0.2242], desc: "District/Piccadilly lines connect Charing Cross, Brompton, Chelsea & Westminster, and St Mary's.", alert: "Very short commutes across central West London." }
    },
    stages: [
      { stage: "Stage 1 (6m)", hosp: "St Mary's Hospital, Paddington", desc: "General & ICM" },
      { stage: "Stage 2 (3m)", hosp: "Royal Brompton Hospital", desc: "Cardiothoracics" },
      { stage: "Stage 3 (9m)", hosp: "Charing Cross Hospital", desc: "General & Trauma" },
      { stage: "Stage 4 (6m)", hosp: "Chelsea & Westminster Hospital", desc: "Burns & Paeds" }
    ]
  },
  {
    id: "nwl-l7", code: "NWL - L7", region: "London - North West", title: "Chelsea, Hammersmith, Charing Cross & Northwick Park", places: "1",
    hubs: {
      driver: { name: "Acton / Ealing", coords: [51.5132, -0.3042], desc: "A40 / North Circular. Easy access to Northwick Park, Hammersmith, and Chelsea.", alert: "Central West London location." },
      transit: { name: "Hammersmith / Acton", coords: [51.4922, -0.2242], desc: "Piccadilly/District lines to Chelsea & Charing Cross; Central line to Hammersmith; Piccadilly to Northwick Park.", alert: "Easy commutes across West London." }
    },
    stages: [
      { stage: "Stage 1 (6m)", hosp: "Chelsea & Westminster Hospital", desc: "General & ICM" },
      { stage: "Stage 2 (6m)", hosp: "Hammersmith Hospital", desc: "Renal & Surgery" },
      { stage: "Stage 3 (6m)", hosp: "Charing Cross Hospital", desc: "Neuro & General" },
      { stage: "Stage 4 (6m)", hosp: "Northwick Park Hospital", desc: "Obstetrics & DGH" }
    ]
  },
  {
    id: "nwl-l8", code: "NWL - L8", region: "London - North West", title: "Charing Cross, Brompton, Chelsea & West Mid", places: "1",
    hubs: {
      driver: { name: "Chiswick / Brentford", coords: [51.4922, -0.2552], desc: "A4/M4. 12m drive to West Middlesex; 15m to Charing Cross.", alert: "A4 allows fast off-peak driving to West Mid." },
      transit: { name: "Hammersmith / Earl's Court", coords: [51.4922, -0.2242], desc: "Walk or 5m bus to Charing Cross; District line to Chelsea & Westminster; Piccadilly to Royal Brompton.", alert: "Walkable hub for Charing Cross and West London sites." }
    },
    stages: [
      { stage: "Stage 1 (9m)", hosp: "Charing Cross Hospital", desc: "Major Elective & Trauma" },
      { stage: "Stage 2 (3m)", hosp: "Royal Brompton Hospital", desc: "Tertiary Cardiothoracics" },
      { stage: "Stage 3 (6m)", hosp: "Chelsea & Westminster Hospital", desc: "General & ICM" },
      { stage: "Stage 4 (6m)", hosp: "West Middlesex University Hospital", desc: "DGH Anaesthesia" }
    ]
  },
  {
    id: "nwl-l9", code: "NWL - L9", region: "London - North West", title: "Northwick Park, Queen Square, Hammersmith & St Mary's", places: "1",
    hubs: {
      driver: { name: "Wembley / Harrow", coords: [51.5602, -0.3102], desc: "A404 / North Circular. Easy access to Northwick Park and St Mary's.", alert: "Outer London driving is straightforward." },
      transit: { name: "Baker Street / Marylebone", coords: [51.5202, -0.1632], desc: "Metropolitan Line directly to Northwick Park (18m) and Queen Square; Bakerloo to St Mary's (5m).", alert: "Metropolitan Line fast trains make Northwick Park commute rapid." }
    },
    stages: [
      { stage: "Stage 1 (9m)", hosp: "Northwick Park Hospital", desc: "Obstetrics & Acute Base" },
      { stage: "Stage 2 (6m)", hosp: "Queen Square (NHNN)", desc: "Tertiary Neuroanaesthesia" },
      { stage: "Stage 3 (6m)", hosp: "Hammersmith Hospital", desc: "ICM & Surgery" },
      { stage: "Stage 4 (3m)", hosp: "St Mary's Hospital, Paddington", desc: "Major Trauma Centre" }
    ]
  },
  {
    id: "nwl-l6", code: "NWL - L6", region: "London - North West", title: "Hammersmith, Charing Cross, Hillingdon & St Mary's", places: "1",
    hubs: {
      driver: { name: "Ealing / Acton", coords: [51.5132, -0.3042], desc: "A40 corridor. Easy road connection to Hillingdon, Hammersmith, and Paddington.", alert: "A40 provides direct car access out to Hillingdon." },
      transit: { name: "Ealing Broadway / Shepherd's Bush", coords: [51.5142, -0.3022], desc: "Central line to White City; District to Charing Cross; Piccadilly line / Elizabeth line out to Hillingdon.", alert: "Central West London transport hub." }
    },
    stages: [
      { stage: "Stage 1 (6m)", hosp: "Hammersmith Hospital", desc: "Renal & Surgery" },
      { stage: "Stage 2 (6m)", hosp: "Charing Cross Hospital", desc: "ICM & Anaesthesia" },
      { stage: "Stage 3 (6m)", hosp: "Hillingdon Hospital", desc: "DGH Anaesthesia" },
      { stage: "Stage 4 (6m)", hosp: "St Mary's Hospital, Paddington", desc: "Major Trauma Centre" }
    ]
  },
  {
    id: "nwl-l5", code: "NWL - L5", region: "London - North West", title: "Hammersmith, Northwick Park, Chelsea & Charing Cross", places: "1",
    hubs: {
      driver: { name: "Acton / Ealing", coords: [51.5132, -0.3042], desc: "A40 / North Circular. Central to Northwick Park, Hammersmith, and Chelsea.", alert: "Good parking options in outer boroughs." },
      transit: { name: "Hammersmith / Ealing", coords: [51.4922, -0.2242], desc: "Piccadilly/District lines to Charing Cross & Chelsea; Metropolitan/Piccadilly to Northwick Park.", alert: "Smooth West London connections." }
    },
    stages: [
      { stage: "Stage 1 (6m)", hosp: "Hammersmith Hospital", desc: "Renal & Surgery" },
      { stage: "Stage 2 (6m)", hosp: "Northwick Park Hospital", desc: "Obstetrics & DGH" },
      { stage: "Stage 3 (6m)", hosp: "Chelsea & Westminster Hospital", desc: "ICM & Anaesthesia" },
      { stage: "Stage 4 (6m)", hosp: "Charing Cross Hospital", desc: "Neuro & General" }
    ]
  },
  {
    id: "nwl-l11", code: "NWL - L11", region: "London - North West", title: "Northwick Park, Queen Square, St Mary's & Brompton", places: "1",
    hubs: {
      driver: { name: "Harrow / Wembley", coords: [51.5602, -0.3102], desc: "North Circular/A40 access for Northwick Park and central hospital sites.", alert: "Car useful for Northwick Park." },
      transit: { name: "Marylebone / Baker Street", coords: [51.5202, -0.1632], desc: "Metropolitan Line to Northwick Park (18m) and Queen Square; Bakerloo to St Mary's; Piccadilly to Brompton.", alert: "Rapid Metropolitan Line commutes." }
    },
    stages: [
      { stage: "Stage 1 (6m)", hosp: "Northwick Park Hospital", desc: "Obstetrics & DGH" },
      { stage: "Stage 2 (6m)", hosp: "Queen Square (NHNN)", desc: "Tertiary Neuroanaesthesia" },
      { stage: "Stage 3 (9m)", hosp: "St Mary's Hospital, Paddington", desc: "ICM & Anaesthesia" },
      { stage: "Stage 4 (3m)", hosp: "Royal Brompton Hospital", desc: "Cardiothoracics" }
    ]
  },
  {
    id: "nwl-l4", code: "NWL - L4", region: "London - North West", title: "Northwick Park, St Mary's, Queen Sq, Brompton & Chelsea", places: "1",
    hubs: {
      driver: { name: "Wembley / Ealing", coords: [51.5602, -0.3102], desc: "North Circular access to Northwick Park and central West London.", alert: "Good parking availability." },
      transit: { name: "Paddington / Baker Street", coords: [51.5172, -0.1742], desc: "Walk to St Mary's; Metropolitan to Northwick Park & Queen Sq; District/Piccadilly to Brompton & Chelsea.", alert: "Extremely well connected for Central/West London." }
    },
    stages: [
      { stage: "Stage 1 (6m)", hosp: "Northwick Park Hospital", desc: "Obstetrics & DGH" },
      { stage: "Stage 2 (6m)", hosp: "St Mary's Hospital, Paddington", desc: "ICM & Anaesthesia" },
      { stage: "Stage 3 (3m)", hosp: "Queen Square (NHNN)", desc: "Neuroanaesthesia" },
      { stage: "Stage 4 (3m)", hosp: "Royal Brompton Hospital", desc: "Cardiothoracics" },
      { stage: "Stage 5 (6m)", hosp: "Chelsea & Westminster Hospital", desc: "Burns & Paeds" }
    ]
  },

  // ==================== LONDON - SOUTH ====================
  {
    id: "south-l1", code: "South London - L1", region: "London - South", title: "St George's Hospital Base", places: "1",
    hubs: {
      driver: { name: "Wimbledon / Earlsfield", coords: [51.4322, -0.1982], desc: "A24/A3. Quick 12m drive to St George's Hospital (Tooting) with staff parking.", alert: "Convenient for commuting south into Surrey on later years." },
      transit: { name: "Balham / Tooting Bec", coords: [51.4432, -0.1522], desc: "Northern line: Tooting Broadway station is directly under St George's Hospital entrance (5m ride).", alert: "24-hour Night Tube on weekends." }
    },
    stages: [
      { stage: "ST4 (12m)", hosp: "St George's Hospital, Tooting", desc: "Major Trauma Centre, Neuro & Paeds Base" }
    ]
  },
  {
    id: "south-l23", code: "South London - L23", region: "London - South", title: "King's College Hospital Base", places: "1",
    hubs: {
      driver: { name: "Dulwich / Crystal Palace", coords: [51.4452, -0.0882], desc: "A205 South Circular. 15m drive to Denmark Hill.", alert: "Residential area with on-street parking options." },
      transit: { name: "Herne Hill / Camberwell", coords: [51.4552, -0.0982], desc: "Short walk or 5m bus to King's; Denmark Hill station has direct Thameslink and Overground.", alert: "Cycling distance to the hospital is effortless." }
    },
    stages: [
      { stage: "ST4 (12m)", hosp: "King's College Hospital", desc: "Major Trauma, Liver & Paeds Base" }
    ]
  },
  {
    id: "south-l2", code: "South London - L2", region: "London - South", title: "Guy's & St Thomas' Hospital Base", places: "3",
    hubs: {
      driver: { name: "Greenwich / Blackheath", coords: [51.4782, -0.0082], desc: "A2 corridor. Driving not recommended to London Bridge/Waterloo due to congestion charges.", alert: "Public transport strongly recommended." },
      transit: { name: "London Bridge / Waterloo / Kennington", coords: [51.4952, -0.1102], desc: "Guy's is at London Bridge station; St Thomas' is directly opposite Waterloo. Walking between both is 15 mins.", alert: "Exceptional public transport right at your doorstep." }
    },
    stages: [
      { stage: "ST4 (12m)", hosp: "Guy's & St Thomas' Hospital", desc: "Cardiothoracics, Vascular, Major Paeds Base" }
    ]
  },

  // ==================== THAMES VALLEY ====================
  {
    id: "tv-oxford", code: "Thames Valley - OUH 1", region: "Thames Valley", title: "John Radcliffe Hospital, Oxford", places: "10",
    hubs: {
      driver: { name: "Headington / Kidlington", coords: [51.7582, -1.2182], desc: "A40/A34 access. Headington allows quick driving into John Radcliffe campus.", alert: "Living east of Oxford centre is essential for driving to JR." },
      transit: { name: "Headington (Oxford)", coords: [51.7562, -1.2142], desc: "Walking or 5m cycle to John Radcliffe Hospital; Oxford Tube coach stops directly in Headington for London.", alert: "Car-free living is very easy in Headington." }
    },
    stages: [
      { stage: "ST4 (12m)", hosp: "John Radcliffe Hospital, Oxford", desc: "MTC, Neuro, Paeds, Cardiac Base" }
    ]
  },
  {
    id: "tv-reading", code: "Thames Valley - RBH 2", region: "Thames Valley", title: "Royal Berkshire Hospital, Reading", places: "1",
    hubs: {
      driver: { name: "Caversham / Winnersh", coords: [51.4622, -0.9720], desc: "M4 corridor. Commute: 10m drive to Royal Berkshire Hospital; easy links across Berkshire.", alert: "Straightforward access to M4." },
      transit: { name: "Reading Central", coords: [51.4582, -0.9720], desc: "15-minute walk or short bus (9/21) to hospital entrance; Elizabeth line into London in 45m.", alert: "Major railway hub." }
    },
    stages: [
      { stage: "ST4 (12m)", hosp: "Royal Berkshire Hospital, Reading", desc: "Acute General & ICU Base" }
    ]
  },

  // ==================== SEVERN ====================
  {
    id: "severn-glos-3", code: "Severn - Glos 3", region: "South West - Severn", title: "Gloucester, UHBW & Southmead", places: "2",
    hubs: {
      driver: { name: "North Bristol (Bradley Stoke / Thornbury)", coords: [51.5362, -2.5482], desc: "M5 Junction 16. Driving: 15m to Southmead, 22m to Bristol BRI, 30m up M5 to Gloucester.", alert: "Motorway access avoids Bristol Clean Air Zone." },
      transit: { name: "Bristol (Temple Meads / Central)", coords: [51.4492, -2.5812], desc: "Direct trains to Gloucester (38m); direct MetroBus (M1/M2) to Southmead Hospital and BRI.", alert: "MetroBus routes run directly to Southmead entrance." }
    },
    stages: [
      { stage: "Stage 1 (9m)", hosp: "Gloucestershire Royal Hospital", desc: "Acute General Anaesthesia" },
      { stage: "Stage 2 (9m)", hosp: "Bristol Royal Infirmary (UHBW)", desc: "Cardiac, Paeds & Major Surgery" },
      { stage: "Stage 3 (6m)", hosp: "Southmead Hospital (NBT)", desc: "Neuro & Major Trauma Centre" }
    ]
  },
  {
    id: "severn-swindon-5", code: "Severn - Swindon 5", region: "South West - Severn", title: "Swindon, UHBW & Southmead", places: "2",
    hubs: {
      driver: { name: "Chippenham / M4 Junction 17", coords: [51.4582, -2.1162], desc: "M4 corridor midway between Swindon (GWH) and Bristol (BRI/Southmead). Commute: 22m to Swindon, 28m to Bristol.", alert: "Direct M4 motorway driving in both directions." },
      transit: { name: "Swindon Central / Bristol Temple Meads", coords: [51.5652, -1.7852], desc: "Direct fast GWR trains between Swindon and Bristol Temple Meads (25m); bus from Swindon station to Great Western Hospital.", alert: "Frequent fast trains run on the mainline." }
    },
    stages: [
      { stage: "Stage 1 (9m)", hosp: "Great Western Hospital, Swindon", desc: "Acute General Base" },
      { stage: "Stage 2 (9m)", hosp: "Bristol Royal Infirmary (UHBW)", desc: "Cardiac & Surgery" },
      { stage: "Stage 3 (6m)", hosp: "Southmead Hospital (NBT)", desc: "Neuro & Trauma" }
    ]
  },

  // ==================== PENINSULA ====================
  {
    id: "peninsula-cornwall-1e", code: "Peninsula - Cornwall 1E", region: "South West - Peninsula", title: "Cornwall 1E (Truro & Derriford)", places: "1",
    hubs: {
      driver: { name: "Bodmin / Liskeard", coords: [50.4682, -4.7182], desc: "A30/A38 midpoint. Commute: 35m to Truro (Royal Cornwall), 35m to Plymouth (Derriford).", alert: "Strategic cross-county driving base." },
      transit: { name: "Truro Central / Plymouth", coords: [50.2632, -5.0512], desc: "Direct bus from Truro station to Royal Cornwall Hospital; mainline train to Plymouth.", alert: "⚠️ Note: Moving to Plymouth for the Derriford block is common." }
    },
    stages: [
      { stage: "First Placement", hosp: "Royal Cornwall Hospital, Truro", desc: "General & Obstetric Anaesthesia" },
      { stage: "Rotational Base", hosp: "Derriford Hospital, Plymouth", desc: "Regional Major Trauma & Neuro" }
    ]
  },
  {
    id: "peninsula-exeter-1", code: "Peninsula - Exeter 1", region: "South West - Peninsula", title: "Exeter 1 (Exeter & Derriford)", places: "2",
    hubs: {
      driver: { name: "Newton Abbot / Ashburton", coords: [50.5312, -3.6102], desc: "A38 dual carriageway. Commute: 22m drive to Exeter (RD&E), 32m to Plymouth (Derriford).", alert: "A38 dual carriageway connects both hospitals easily." },
      transit: { name: "Exeter (St David's) / Plymouth", coords: [50.7292, -3.5432], desc: "Frequent city buses from Exeter stations to RD&E Wonford; direct 55m mainline trains to Plymouth station.", alert: "Exeter St David's is a major rail hub." }
    },
    stages: [
      { stage: "First Placement", hosp: "Royal Devon & Exeter Hospital", desc: "Acute General Base" },
      { stage: "Rotational Base", hosp: "Derriford Hospital, Plymouth", desc: "Major Trauma & Neuro" }
    ]
  },
  {
    id: "peninsula-taunton-5", code: "Peninsula - Taunton 5", region: "South West - Peninsula", title: "Taunton 5 (Taunton & Derriford)", places: "1",
    hubs: {
      driver: { name: "Exeter (North / Cullompton)", coords: [50.8542, -3.3902], desc: "M5 corridor. Commute: 22m drive north to Taunton, 50m drive south to Plymouth.", alert: "Straightforward motorway driving on the M5." },
      transit: { name: "Taunton Central", coords: [51.0202, -3.1002], desc: "Frequent bus from Taunton station to Musgrove Park Hospital; direct mainline train to Plymouth (1h 15m).", alert: "Musgrove Park is easily accessible by bus from Taunton centre." }
    },
    stages: [
      { stage: "First Placement", hosp: "Musgrove Park Hospital, Taunton", desc: "Somerset Acute Base" },
      { stage: "Rotational Base", hosp: "Derriford Hospital, Plymouth", desc: "Major Trauma & Neuro" }
    ]
  },
  {
    id: "peninsula-torbay-4", code: "Peninsula - Torbay 4", region: "South West - Peninsula", title: "Torbay 4 (Torbay & Derriford)", places: "4",
    hubs: {
      driver: { name: "Totnes / Newton Abbot", coords: [50.4322, -3.6842], desc: "A38/A380 midpoint. Commute: 18m drive to Torbay Hospital, 35m drive to Plymouth (Derriford).", alert: "Scenic, manageable dual carriageway driving." },
      transit: { name: "Newton Abbot / Torquay", coords: [50.5312, -3.6102], desc: "Frequent local buses (12, 13) connect directly to Torbay Hospital; direct 40m mainline train from Newton Abbot to Plymouth.", alert: "Newton Abbot is a key rail junction station." }
    },
    stages: [
      { stage: "First Placement", hosp: "Torbay Hospital", desc: "South Devon Acute Base" },
      { stage: "Rotational Base", hosp: "Derriford Hospital, Plymouth", desc: "Major Trauma & Neuro" }
    ]
  },

  // ==================== EAST OF ENGLAND ====================
  {
    id: "eoe-watford-12-13", code: "EoE - Watford 12 & 13", region: "East of England", title: "Hertfordshire & Cambridge Track", places: "3 total",
    hubs: {
      driver: { name: "St Albans / Welwyn Garden City", coords: [51.7522, -0.3392], desc: "A414/A1(M)/M25 junction. Commute by car: 20m to Watford General, 22m to Lister, 55m to Cambridge (ST5), 45m to Broomfield (A414).", alert: "A414 corridor avoids M25 morning jams." },
      transit: { name: "Stevenage (Station Area)", coords: [51.9032, -0.2012], desc: "East Coast Main Line: 10m bus to Lister Hospital, 25m fast train to Cambridge (Addenbrooke's). Watford reachable via Thameslink/rail.", alert: "⚠️ Note: Broomfield (ST7) requires train to Chelmsford then hospital shuttle bus (C1/C2)." }
    },
    stages: [
      { stage: "ST4 (12m)", hosp: "Watford General Hospital", desc: "General & Obstetric Anaesthesia" },
      { stage: "ST4/ST5", hosp: "Lister Hospital, Stevenage", desc: "General Acute DGH" },
      { stage: "ST5", hosp: "Addenbrooke's Hospital, Cambridge", desc: "Tertiary Neuroanaesthesia" },
      { stage: "ST5", hosp: "Royal Papworth Hospital, Cambridge", desc: "Cardiothoracic Anaesthesia" },
      { stage: "ST6 (12m)", hosp: "Watford General Hospital", desc: "Higher General Anaesthesia" },
      { stage: "ST7 (12m)", hosp: "Broomfield Hospital, Chelmsford", desc: "Burns & Plastics Specialist Centre" }
    ]
  },
  {
    id: "eoe-chelmsford-7-9", code: "EoE - Chelmsford 7 & 9", region: "East of England", title: "Essex & Cambridge Track", places: "2 total",
    hubs: {
      driver: { name: "Chelmsford (South) / Shenfield", coords: [51.7352, 0.4682], desc: "A12/A130. Commute: 10m to Broomfield, 25m to Basildon CTC, 35m to Southend, 55m to Cambridge.", alert: "Quick access to the A130 bypass makes reaching Basildon and Southend straightforward." },
      transit: { name: "Chelmsford Central", coords: [51.7362, 0.4692], desc: "Direct C1/C2 buses to Broomfield front entrance (15m). Direct trains to Shenfield, Southend Victoria, and London.", alert: "⚠️ Note: Cambridge (ST5) requires cross-country connection; plan ahead for ST5." }
    },
    stages: [
      { stage: "ST4 (12m)", hosp: "Broomfield Hospital, Chelmsford", desc: "Regional Burns & General" },
      { stage: "ST5", hosp: "Addenbrooke's Hospital, Cambridge", desc: "Neuroanaesthesia Module" },
      { stage: "ST5", hosp: "Basildon Cardiothoracic Centre", desc: "Cardiothoracic Anaesthesia" },
      { stage: "ST6 (12m)", hosp: "Southend Hospital", desc: "Acute DGH Anaesthesia" },
      { stage: "ST7 (12m)", hosp: "Lister Hospital, Stevenage", desc: "Advanced General Anaesthesia" }
    ]
  },
  {
    id: "eoe-colchester-8-10", code: "EoE - Colchester 8 & 10", region: "East of England", title: "North Essex & Cambridge Track", places: "2 total",
    hubs: {
      driver: { name: "Bishop's Stortford / Great Dunmow", coords: [51.8712, 0.1602], desc: "A120 & M11. Commute: 25m to Harlow, 30m to Cambridge, 35m to Broomfield, 45m to Colchester, 35m to Lister.", alert: "A120 dual carriageway provides swift cross-county links." },
      transit: { name: "Stratford / Tottenham Hale", coords: [51.5412, -0.0032], desc: "Greater Anglia rail hub: 30m to Harlow Town, 45m to Cambridge, 45m to Colchester.", alert: "Living in North-East London interchange allows reverse rail commutes." }
    },
    stages: [
      { stage: "ST4", hosp: "Colchester Hospital", desc: "Acute General Surgery" },
      { stage: "ST4/ST5", hosp: "Broomfield Hospital, Chelmsford", desc: "Burns, Plastics, ICU" },
      { stage: "ST5", hosp: "Addenbrooke's Hospital, Cambridge", desc: "Neuroanaesthesia Module" },
      { stage: "ST5", hosp: "Basildon Cardiothoracic Centre", desc: "Cardiothoracic Module" },
      { stage: "ST6 (12m)", hosp: "Princess Alexandra Hospital, Harlow", desc: "General DGH" },
      { stage: "ST7 (12m)", hosp: "Lister Hospital, Stevenage", desc: "Senior Placement" }
    ]
  },
  {
    id: "eoe-bedford-1", code: "EoE - Bedford 1", region: "East of England", title: "Bedford, Cambridge & Norwich", places: "1",
    hubs: {
      driver: { name: "St Neots / Royston", coords: [52.2272, -0.2682], desc: "A421/A1/A505 corridor. Commute: 22m to Bedford, 30m to Cambridge (Addenbrooke's/Papworth).", alert: "A421 provides smooth daily driving to Bedford." },
      transit: { name: "Cambridge (South / Central)", coords: [52.1952, 0.1312], desc: "Direct bus/cycle to Addenbrooke's; X5 coach line to Bedford; direct 1h 10m train to Norwich.", alert: "Cambridge is an exceptional cycle and public transport hub." }
    },
    stages: [
      { stage: "ST4", hosp: "Bedford Hospital", desc: "General DGH" },
      { stage: "ST4/ST5", hosp: "Addenbrooke's Hospital, Cambridge", desc: "Neuro & Major Surgery" },
      { stage: "ST5", hosp: "Royal Papworth Hospital, Cambridge", desc: "Heart & Lung Centre" },
      { stage: "ST6 (12m)", hosp: "Bedford Hospital", desc: "Higher General" },
      { stage: "ST7 (12m)", hosp: "Norfolk & Norwich University Hospital", desc: "Tertiary Teaching Hospital" }
    ]
  },
  {
    id: "eoe-cambridge-2", code: "EoE - Cambridge 2", region: "East of England", title: "Cambridge, Luton & Lister", places: "1",
    hubs: {
      driver: { name: "Royston / Hitchin", coords: [52.0522, -0.0222], desc: "A505/A1(M) midpoint. Commute: 25m to Cambridge, 18m to Lister, 30m to Luton.", alert: "Avoids heavy M25 traffic." },
      transit: { name: "Stevenage (Station Hub)", coords: [51.9032, -0.2012], desc: "East Coast Main Line: 25m to Cambridge, short bus/walk to Lister, direct connection to Luton.", alert: "Direct fast trains run early morning to late night." }
    },
    stages: [
      { stage: "ST4", hosp: "Addenbrooke's Hospital, Cambridge", desc: "Neuro & Major Trauma" },
      { stage: "ST5", hosp: "Royal Papworth Hospital, Cambridge", desc: "Cardiothoracics Module" },
      { stage: "ST6 (12m)", hosp: "Luton & Dunstable Hospital", desc: "Obstetrics & General" },
      { stage: "ST7 (12m)", hosp: "Lister Hospital, Stevenage", desc: "Senior Placement" }
    ]
  },
  {
    id: "eoe-ipswich-11", code: "EoE - Ipswich 11", region: "East of England", title: "Ipswich, Norwich, Cambridge & Colchester", places: "1",
    hubs: {
      driver: { name: "Bury St Edmunds / Stowmarket", coords: [52.2472, 0.7182], desc: "A14 trunk road. Commute: 35m to Ipswich, 38m to Cambridge, 45m to Norwich, 38m to Colchester.", alert: "Central base in East Anglia." },
      transit: { name: "Ipswich Central or Stowmarket", coords: [52.0582, 1.1502], desc: "Direct junction station connecting Cambridge (50m), Norwich (35m), and Colchester (18m).", alert: "⚠️ Note: Broomfield (ST7) requires rail to Chelmsford + C1 bus." }
    },
    stages: [
      { stage: "ST4", hosp: "Ipswich Hospital", desc: "Acute General" },
      { stage: "ST4/ST5", hosp: "Norfolk & Norwich University Hospital", desc: "Tertiary Hospital" },
      { stage: "ST5", hosp: "Royal Papworth Hospital, Cambridge", desc: "Cardiothoracics Module" },
      { stage: "ST5", hosp: "Addenbrooke's Hospital, Cambridge", desc: "Neuro Module" },
      { stage: "ST6", hosp: "Colchester Hospital", desc: "General DGH" },
      { stage: "ST7 (12m)", hosp: "Broomfield Hospital, Chelmsford", desc: "Burns & Plastics Specialist Base" }
    ]
  },
  {
    id: "eoe-ipswich-5-6", code: "EoE - Ipswich 5 & 6", region: "East of England", title: "Ipswich, Norwich, Cambridge & Broomfield", places: "2 total",
    hubs: {
      driver: { name: "Bury St Edmunds / Stowmarket", coords: [52.2472, 0.7182], desc: "A14 trunk road. Commute: 35m to Ipswich, 38m to Cambridge, 45m to Norwich.", alert: "Central base in East Anglia." },
      transit: { name: "Ipswich Central or Stowmarket", coords: [52.0582, 1.1502], desc: "Direct junction station connecting Cambridge (50m), Norwich (35m), and Ipswich.", alert: "⚠️ Note: Broomfield (ST7) requires rail to Chelmsford + C1 bus." }
    },
    stages: [
      { stage: "ST4", hosp: "Ipswich Hospital", desc: "Acute General" },
      { stage: "ST4/ST5", hosp: "Norfolk & Norwich University Hospital", desc: "Tertiary Hospital" },
      { stage: "ST5", hosp: "Royal Papworth Hospital, Cambridge", desc: "Cardiothoracics Module" },
      { stage: "ST5", hosp: "Addenbrooke's Hospital, Cambridge", desc: "Neuro Module" },
      { stage: "ST6", hosp: "Ipswich Hospital", desc: "General DGH (Return)" },
      { stage: "ST7 (12m)", hosp: "Broomfield Hospital, Chelmsford", desc: "Burns & Plastics Specialist Base" }
    ]
  },
  {
    id: "eoe-ipswich-16", code: "EoE - Ipswich 16", region: "East of England", title: "Ipswich, Broomfield, Harlow & Cambridge", places: "1",
    hubs: {
      driver: { name: "Chelmsford / Stansted", coords: [51.7352, 0.4682], desc: "A12/A120/M11 corridor linking Ipswich, Broomfield, Harlow, and Cambridge.", alert: "Good motorway links." },
      transit: { name: "Chelmsford Central", coords: [51.7362, 0.4692], desc: "Rail links on Greater Anglia line to Ipswich, London, and Stansted.", alert: "Central hub for Essex." }
    },
    stages: [
      { stage: "ST4", hosp: "Ipswich Hospital", desc: "Acute General" },
      { stage: "ST4/ST5", hosp: "Broomfield Hospital, Chelmsford", desc: "Burns & Plastics" },
      { stage: "ST5", hosp: "Basildon Cardiothoracic Centre", desc: "Cardiac Module" },
      { stage: "ST5", hosp: "Addenbrooke's Hospital, Cambridge", desc: "Neuro Module" },
      { stage: "ST6", hosp: "Princess Alexandra Hospital, Harlow", desc: "General DGH" },
      { stage: "ST7 (12m)", hosp: "Addenbrooke's Hospital, Cambridge", desc: "Senior Placement" }
    ]
  },
  {
    id: "eoe-luton-14", code: "EoE - Luton 14", region: "East of England", title: "Luton, Lister & Addenbrooke's", places: "1",
    hubs: {
      driver: { name: "Hitchin / Welwyn", coords: [51.9472, -0.2822], desc: "A505/A1(M) corridor. Commute: 10m to Lister, 20m to Luton, 35m to Cambridge via A505.", alert: "Hitchin provides fast road links to all sites." },
      transit: { name: "Stevenage / Luton Town", coords: [51.9032, -0.2012], desc: "Thameslink and East Coast Mainline provide early connections between Stevenage, Cambridge, and Luton.", alert: "Guided Busway connects Luton Station directly to the hospital." }
    },
    stages: [
      { stage: "ST4", hosp: "Luton & Dunstable Hospital", desc: "High Risk Obstetrics & General" },
      { stage: "ST4/ST5", hosp: "Lister Hospital, Stevenage", desc: "Acute General" },
      { stage: "ST5", hosp: "Addenbrooke's Hospital, Cambridge", desc: "Neuroanaesthesia" },
      { stage: "ST5", hosp: "Royal Papworth Hospital, Cambridge", desc: "Cardiothoracics" },
      { stage: "ST6 (12m)", hosp: "Luton & Dunstable Hospital", desc: "General Placements (Return)" },
      { stage: "ST7 (12m)", hosp: "Addenbrooke's Hospital, Cambridge", desc: "Senior Placement" }
    ]
  },
  {
    id: "eoe-luton-15", code: "EoE - Luton 15", region: "East of England", title: "Luton, Lister, Cambridge, Watford & Broomfield", places: "1",
    hubs: {
      driver: { name: "Hitchin / Welwyn", coords: [51.9472, -0.2822], desc: "A505/A1(M) corridor. Commute: 10m to Lister, 20m to Luton, 35m to Cambridge via A505, 30m to Watford.", alert: "Hitchin provides fast road links to all sites." },
      transit: { name: "Stevenage / Luton Town", coords: [51.9032, -0.2012], desc: "Thameslink connects Stevenage and Luton easily.", alert: "⚠️ Note: ST7 at Broomfield will require travel to Chelmsford." }
    },
    stages: [
      { stage: "ST4", hosp: "Luton & Dunstable Hospital", desc: "High Risk Obstetrics & General" },
      { stage: "ST4/ST5", hosp: "Lister Hospital, Stevenage", desc: "Acute General" },
      { stage: "ST5", hosp: "Addenbrooke's Hospital, Cambridge", desc: "Neuroanaesthesia" },
      { stage: "ST5", hosp: "Royal Papworth Hospital, Cambridge", desc: "Cardiothoracics" },
      { stage: "ST6 (12m)", hosp: "Watford General Hospital", desc: "General Placements" },
      { stage: "ST7 (12m)", hosp: "Broomfield Hospital, Chelmsford", desc: "Specialist Centre" }
    ]
  },
  {
    id: "eoe-norwich-17", code: "EoE - Norwich 17", region: "East of England", title: "NNUH, Cambridge & West Suffolk", places: "1",
    hubs: {
      driver: { name: "Thetford / Bury St Edmunds", coords: [52.4142, 0.7502], desc: "A11/A14 midpoint between Norwich (NNUH), Cambridge, and Bury St Edmunds (West Suffolk).", alert: "A11 dual carriageway connects all sites." },
      transit: { name: "Norwich City Centre / Cambridge", coords: [52.6282, 1.2982], desc: "Direct rail between Norwich, Thetford, and Cambridge.", alert: "Frequent mainline trains." }
    },
    stages: [
      { stage: "ST4 (12m)", hosp: "Norfolk & Norwich University Hospital", desc: "Tertiary Teaching Base" },
      { stage: "ST5", hosp: "Royal Papworth Hospital, Cambridge", desc: "Cardiac Module" },
      { stage: "ST5", hosp: "Addenbrooke's Hospital, Cambridge", desc: "Neuro Module" },
      { stage: "ST6", hosp: "West Suffolk Hospital, Bury St Edmunds", desc: "General Placement" },
      { stage: "ST7", hosp: "Addenbrooke's Hospital, Cambridge", desc: "Senior Placement" }
    ]
  },
  {
    id: "eoe-norwich-18", code: "EoE - Norwich 18", region: "East of England", title: "NNUH, Cambridge & James Paget", places: "1",
    hubs: {
      driver: { name: "Norwich (South / Cringleford)", coords: [52.6102, 1.2502], desc: "A11/A47. 8m to NNUH, 30m to James Paget (Gt Yarmouth), 55m to Cambridge.", alert: "Quick bypass access." },
      transit: { name: "Norwich City Centre", coords: [52.6282, 1.2982], desc: "Direct 25/26 bus to NNUH; 30m train to Gt Yarmouth; 1h 10m train to Cambridge.", alert: "Hospital has dedicated Blue Line bus." }
    },
    stages: [
      { stage: "ST4 (12m)", hosp: "Norfolk & Norwich University Hospital", desc: "Tertiary Teaching Base" },
      { stage: "ST5", hosp: "Royal Papworth Hospital, Cambridge", desc: "Cardiac Module" },
      { stage: "ST5", hosp: "Addenbrooke's Hospital, Cambridge", desc: "Neuro Module" },
      { stage: "ST6", hosp: "Addenbrooke's Hospital, Cambridge", desc: "Tertiary Surgery" },
      { stage: "ST7", hosp: "James Paget Hospital, Great Yarmouth", desc: "Senior Placement" }
    ]
  },
  {
    id: "eoe-norwich-19", code: "EoE - Norwich 19", region: "East of England", title: "NNUH, Cambridge & Kings Lynn", places: "1",
    hubs: {
      driver: { name: "Swaffham / Dereham", coords: [52.6502, 0.6902], desc: "A47 midpoint between Norwich (NNUH) and Queen Elizabeth Hospital (Kings Lynn).", alert: "A47 connects both Norfolk hospitals." },
      transit: { name: "Norwich City Centre", coords: [52.6282, 1.2982], desc: "Direct 25/26 bus to NNUH; Excel D coach to Kings Lynn.", alert: "⚠️ Note: Kings Lynn is 1h+ on bus from Norwich." }
    },
    stages: [
      { stage: "ST4 (12m)", hosp: "Norfolk & Norwich University Hospital", desc: "Tertiary Teaching Base" },
      { stage: "ST5", hosp: "Royal Papworth Hospital, Cambridge", desc: "Cardiac Module" },
      { stage: "ST5", hosp: "Addenbrooke's Hospital, Cambridge", desc: "Neuro Module" },
      { stage: "ST6", hosp: "Queen Elizabeth Hospital, Kings Lynn", desc: "General Placement" },
      { stage: "ST7", hosp: "Addenbrooke's Hospital, Cambridge", desc: "Senior Placement" }
    ]
  },
  {
    id: "eoe-norwich-3", code: "EoE - Norwich 3", region: "East of England", title: "NNUH, Cambridge & Colchester", places: "2",
    hubs: {
      driver: { name: "Diss / Thetford", coords: [52.3782, 1.1102], desc: "A140/A11 midpoint between Norwich, Colchester, and Cambridge.", alert: "Central rural base." },
      transit: { name: "Norwich / Cambridge", coords: [52.6282, 1.2982], desc: "Direct Greater Anglia mainline trains between Norwich, Colchester, and Cambridge.", alert: "Frequent mainline services." }
    },
    stages: [
      { stage: "ST4 (12m)", hosp: "Norfolk & Norwich University Hospital", desc: "Tertiary Teaching Base" },
      { stage: "ST5", hosp: "Addenbrooke's Hospital, Cambridge", desc: "Neuro Module" },
      { stage: "ST5", hosp: "Royal Papworth Hospital, Cambridge", desc: "Cardiac Module" },
      { stage: "ST6", hosp: "Colchester Hospital", desc: "General Placement" },
      { stage: "ST7", hosp: "Addenbrooke's Hospital, Cambridge", desc: "Senior Placement" }
    ]
  },
  {
    id: "eoe-norwich-4", code: "EoE - Norwich 4", region: "East of England", title: "NNUH, Cambridge & James Paget (Track 4)", places: "1",
    hubs: {
      driver: { name: "Norwich (South / Cringleford)", coords: [52.6102, 1.2502], desc: "A11/A47. 8m to NNUH, 30m to James Paget (Gt Yarmouth), 55m to Cambridge.", alert: "Fast bypass driving." },
      transit: { name: "Norwich City Centre", coords: [52.6282, 1.2982], desc: "Direct 25/26 bus to NNUH; 30m train to Gt Yarmouth; 1h 10m train to Cambridge.", alert: "Hospital has dedicated Blue Line bus." }
    },
    stages: [
      { stage: "ST4 (12m)", hosp: "Norfolk & Norwich University Hospital", desc: "Tertiary Teaching Base" },
      { stage: "ST5", hosp: "Royal Papworth Hospital, Cambridge", desc: "Cardiac Module" },
      { stage: "ST5", hosp: "Addenbrooke's Hospital, Cambridge", desc: "Neuro Module" },
      { stage: "ST6", hosp: "James Paget Hospital, Great Yarmouth", desc: "General Placement" },
      { stage: "ST7", hosp: "Addenbrooke's Hospital, Cambridge", desc: "Senior Placement" }
    ]
  },

  // ==================== EAST MIDLANDS NORTH ====================
  {
    id: "emids-north-1", code: "East Midlands - North 1 (N1)", region: "East Midlands", title: "Boston, Derby, QMC, City & Chesterfield", places: "1",
    hubs: {
      driver: { name: "Long Eaton / Nottingham East", coords: [52.8982, -1.2702], desc: "M1 Junction 25. 15m drive to Derby, 15m to QMC, 35m to Chesterfield, 55m to Boston Pilgrim.", alert: "Central M1 driving hub." },
      transit: { name: "Nottingham City Centre", coords: [52.9502, -1.1502], desc: "NET Tram to QMC; Medilink bus to City Hospital; 22m train to Derby.", alert: "⚠️ Note: Boston Pilgrim has poor Sunday early public transit." }
    },
    stages: [
      { stage: "Feb-27", hosp: "Boston Pilgrim Hospital", desc: "General Anaesthesia" },
      { stage: "Aug-27", hosp: "Royal Derby Hospital", desc: "Acute Surgery" },
      { stage: "Feb-28", hosp: "Queen's Medical Centre (QMC), Nottingham", desc: "Major Trauma Centre" },
      { stage: "Aug-28", hosp: "Nottingham City Hospital", desc: "Thoracics & Elective" },
      { stage: "Feb-29", hosp: "Chesterfield Royal Hospital", desc: "General DGH" },
      { stage: "Aug-29", hosp: "Royal Derby Hospital", desc: "Specialist Placement" },
      { stage: "Feb-30", hosp: "Nottingham City Hospital", desc: "Senior Placement" },
      { stage: "Aug-30", hosp: "Queen's Medical Centre (QMC), Nottingham", desc: "Advanced MTC & ICU" }
    ]
  },
  {
    id: "emids-north-2", code: "East Midlands - North 2 (N2)", region: "East Midlands", title: "Boston, Derby, QMC, City & Lincoln", places: "1",
    hubs: {
      driver: { name: "Newark-on-Trent", coords: [53.0782, -0.8122], desc: "A46/A1 corridor. 30m drive to Lincoln, 30m to Nottingham, 50m to Boston Pilgrim, 45m to Derby.", alert: "A46 dual carriageway connects Lincoln and Nottingham." },
      transit: { name: "Newark / Nottingham", coords: [53.0782, -0.8122], desc: "Trains connect Newark to Nottingham and Lincoln directly.", alert: "⚠️ Note: Boston Pilgrim has poor public transport." }
    },
    stages: [
      { stage: "Feb-27", hosp: "Boston Pilgrim Hospital", desc: "General Anaesthesia" },
      { stage: "Aug-27", hosp: "Royal Derby Hospital", desc: "Acute Surgery" },
      { stage: "Feb-28", hosp: "Queen's Medical Centre (QMC), Nottingham", desc: "Major Trauma Centre" },
      { stage: "Aug-28", hosp: "Nottingham City Hospital", desc: "Thoracics & Elective" },
      { stage: "Feb-29", hosp: "Lincoln County Hospital", desc: "General Placement" },
      { stage: "Aug-29", hosp: "Royal Derby Hospital", desc: "Specialist Placement" },
      { stage: "Feb-30", hosp: "Nottingham City Hospital", desc: "Senior Placement" },
      { stage: "Aug-30", hosp: "Queen's Medical Centre (QMC), Nottingham", desc: "Advanced MTC & ICU" }
    ]
  },
  {
    id: "emids-north-3", code: "East Midlands - North 3 (N3)", region: "East Midlands", title: "Lincoln, Chesterfield, City & QMC", places: "1",
    hubs: {
      driver: { name: "Mansfield / Worksop", coords: [53.1452, -1.1982], desc: "M1 Junction 28/30. 25m to Chesterfield Royal, 25m to Nottingham, 40m to Lincoln.", alert: "M1 corridor makes accessing acute sites straightforward." },
      transit: { name: "Nottingham Central", coords: [52.9502, -1.1502], desc: "Direct train north to Chesterfield (30m); Tram directly into QMC; bus to City Hospital.", alert: "Nottingham tram network stops directly inside QMC." }
    },
    stages: [
      { stage: "Feb-27", hosp: "Lincoln County Hospital", desc: "Acute General" },
      { stage: "Aug-27", hosp: "Chesterfield Royal Hospital", desc: "DGH Anaesthesia" },
      { stage: "Feb-28", hosp: "Nottingham City Hospital", desc: "Elective Surgery" },
      { stage: "Aug-28", hosp: "Queen's Medical Centre (QMC), Nottingham", desc: "Major Trauma Centre" },
      { stage: "Feb-29", hosp: "Lincoln County Hospital", desc: "Acute General" },
      { stage: "Aug-29", hosp: "Nottingham City Hospital", desc: "Senior Placement" },
      { stage: "Feb-30", hosp: "Nottingham City Hospital", desc: "Senior Placement" },
      { stage: "Aug-30", hosp: "Queen's Medical Centre (QMC), Nottingham", desc: "Advanced MTC & ICU" }
    ]
  },
  {
    id: "emids-north-4", code: "East Midlands - North 4 (N4)", region: "East Midlands", title: "Lincoln, QMC, Chesterfield & City", places: "1",
    hubs: {
      driver: { name: "Mansfield / Nottingham North", coords: [53.1452, -1.1982], desc: "M1 corridor. Commute: 25m to Chesterfield Royal, 22m to Nottingham, 40m to Lincoln.", alert: "M1 access to both Derbyshire and Nottinghamshire." },
      transit: { name: "Nottingham (Central / Beeston)", coords: [52.9272, -1.2142], desc: "Tram directly into QMC; direct bus to City Hospital; train north to Chesterfield (30m).", alert: "Frequent tram and train services." }
    },
    stages: [
      { stage: "Feb-27", hosp: "Lincoln County Hospital", desc: "Acute General" },
      { stage: "Aug-27", hosp: "Queen's Medical Centre (QMC), Nottingham", desc: "Major Trauma Centre" },
      { stage: "Feb-28", hosp: "Chesterfield Royal Hospital", desc: "DGH Anaesthesia" },
      { stage: "Aug-28", hosp: "Nottingham City Hospital", desc: "Elective Surgery" },
      { stage: "Feb-29", hosp: "Lincoln County Hospital", desc: "Acute General" },
      { stage: "Aug-29", hosp: "Queen's Medical Centre (QMC), Nottingham", desc: "MTC & Specialist" },
      { stage: "Feb-30", hosp: "Queen's Medical Centre (QMC), Nottingham", desc: "Senior MTC" },
      { stage: "Aug-30", hosp: "Nottingham City Hospital", desc: "Senior Placement" }
    ]
  },
  {
    id: "emids-north-5", code: "East Midlands - North 5 (N5)", region: "East Midlands", title: "City, Kings Mill, Lincoln, QMC & Derby", places: "1",
    hubs: {
      driver: { name: "Nottingham (West / Wollaton)", coords: [52.9502, -1.2102], desc: "A52/M1. Commute: 8m to QMC, 15m to City, 22m to Kings Mill, 20m to Derby.", alert: "Exceptionally convenient driving hub." },
      transit: { name: "Nottingham Central / Beeston", coords: [52.9272, -1.2142], desc: "Tram to QMC; Medilink bus to City Hospital; train to Derby (20m); Robin Hood Line to Kings Mill (Mansfield).", alert: "Very strong public transport links." }
    },
    stages: [
      { stage: "Feb-27", hosp: "Nottingham City Hospital", desc: "Elective Surgery" },
      { stage: "Aug-27", hosp: "Kings Mill Hospital, Mansfield", desc: "Acute DGH Base" },
      { stage: "Feb-28", hosp: "Lincoln County Hospital", desc: "Acute General" },
      { stage: "Aug-28", hosp: "Queen's Medical Centre (QMC), Nottingham", desc: "Major Trauma Centre" },
      { stage: "Feb-29", hosp: "Kings Mill Hospital, Mansfield", desc: "DGH Base" },
      { stage: "Aug-29", hosp: "Royal Derby Hospital", desc: "Specialist Surgery" },
      { stage: "Feb-30", hosp: "Queen's Medical Centre (QMC), Nottingham", desc: "Senior MTC" },
      { stage: "Aug-30", hosp: "Nottingham City Hospital", desc: "Senior Placement" }
    ]
  },

  // ==================== EAST MIDLANDS SOUTH ====================
  {
    id: "emids-south-6", code: "East Midlands - South 6 (S1)", region: "East Midlands", title: "LRI, Northampton, QMC & Glenfield (S1)", places: "1",
    hubs: {
      driver: { name: "Market Harborough / South Leicester", coords: [52.4782, -0.9222], desc: "A6/M1 corridor. Commute: 22m to Leicester (LRI/Glenfield), 30m to Northampton, 40m to QMC.", alert: "Sits right in the sweet spot between Leicester and Northants." },
      transit: { name: "Leicester Central", coords: [52.6312, -1.1252], desc: "The 'Hospital Hopper' bus connects station directly to LRI and Glenfield Hospital. Midland Mainline connects to Nottingham.", alert: "Hospital Hopper runs frequently for hospital staff." }
    },
    stages: [
      { stage: "Feb-27", hosp: "Leicester Royal Infirmary", desc: "Teaching Hospital Base" },
      { stage: "Aug-27", hosp: "Northampton General Hospital", desc: "Acute Surgery" },
      { stage: "Feb-28", hosp: "Queen's Medical Centre (QMC), Nottingham", desc: "Trauma Module" },
      { stage: "Aug-28", hosp: "Glenfield Hospital, Leicester", desc: "Cardiothoracics Module" },
      { stage: "Feb-29", hosp: "Northampton General Hospital", desc: "Acute Surgery" },
      { stage: "Aug-29", hosp: "Leicester Royal Infirmary", desc: "Senior Base" },
      { stage: "Feb-30", hosp: "Leicester Royal Infirmary", desc: "Senior Base" },
      { stage: "Aug-30", hosp: "Glenfield Hospital, Leicester", desc: "Cardiothoracics" }
    ]
  },
  {
    id: "emids-south-7", code: "East Midlands - South 7 (S2)", region: "East Midlands", title: "Glenfield, LRI, QMC & Kettering (S2)", places: "1",
    hubs: {
      driver: { name: "Market Harborough / South Leicester", coords: [52.4782, -0.9222], desc: "A6/A14 corridor. Commute: 20m to Kettering, 22m to Leicester (LRI/Glenfield).", alert: "Very manageable driving times." },
      transit: { name: "Leicester Central", coords: [52.6312, -1.1252], desc: "Hospital Hopper bus between LRI and Glenfield; train to Kettering (25m) and Nottingham.", alert: "Direct trains on Midland Main Line." }
    },
    stages: [
      { stage: "Feb-27", hosp: "Glenfield Hospital, Leicester", desc: "Cardiothoracics" },
      { stage: "Aug-27", hosp: "Leicester Royal Infirmary", desc: "Teaching Base" },
      { stage: "Feb-28", hosp: "Queen's Medical Centre (QMC), Nottingham", desc: "Trauma Module" },
      { stage: "Aug-28", hosp: "Kettering General Hospital", desc: "General Placement" },
      { stage: "Feb-29", hosp: "Kettering General Hospital", desc: "General Placement" },
      { stage: "Aug-29", hosp: "Leicester Royal Infirmary", desc: "Senior Base" },
      { stage: "Feb-30", hosp: "Leicester Royal Infirmary", desc: "Senior Base" },
      { stage: "Aug-30", hosp: "Glenfield Hospital, Leicester", desc: "Senior Placement" }
    ]
  },
  {
    id: "emids-south-8", code: "East Midlands - South 8 (S3)", region: "East Midlands", title: "Derby, LRI, QMC & Glenfield (S3)", places: "1",
    hubs: {
      driver: { name: "Loughborough / North Leicester", coords: [52.7702, -1.2102], desc: "A6/M1 corridor. Commute: 25m to Derby, 20m to Leicester (LRI/Glenfield), 30m to QMC.", alert: "Central between Derby, Nottingham, and Leicester." },
      transit: { name: "Loughborough / Leicester", coords: [52.7702, -1.2102], desc: "Midland Mainline connects Loughborough to Derby (18m), Leicester (10m), and Nottingham (15m).", alert: "Superb mainline railway access." }
    },
    stages: [
      { stage: "Feb-27", hosp: "Royal Derby Hospital", desc: "Acute Surgery" },
      { stage: "Aug-27", hosp: "Leicester Royal Infirmary", desc: "Teaching Base" },
      { stage: "Feb-28", hosp: "Queen's Medical Centre (QMC), Nottingham", desc: "Trauma Module" },
      { stage: "Aug-28", hosp: "Glenfield Hospital, Leicester", desc: "Cardiothoracics" },
      { stage: "Feb-29", hosp: "Royal Derby Hospital", desc: "Specialist Surgery" },
      { stage: "Aug-29", hosp: "Royal Derby Hospital", desc: "Specialist Surgery" },
      { stage: "Feb-30", hosp: "Leicester Royal Infirmary", desc: "Senior Base" },
      { stage: "Aug-30", hosp: "Glenfield Hospital, Leicester", desc: "Senior Placement" }
    ]
  },
  {
    id: "emids-south-9", code: "East Midlands - South 9 (S4)", region: "East Midlands", title: "QMC, Northampton, Glenfield & LRI (S4)", places: "1",
    hubs: {
      driver: { name: "Market Harborough / South Leicester", coords: [52.4782, -0.9222], desc: "A6/M1 corridor. Commute: 22m to Leicester (LRI/Glenfield), 30m to Northampton, 40m to QMC.", alert: "Central driving base." },
      transit: { name: "Leicester Central", coords: [52.6312, -1.1252], desc: "Hospital Hopper bus between LRI and Glenfield; train to Nottingham and Kettering.", alert: "Regular train and bus connections." }
    },
    stages: [
      { stage: "Feb-27", hosp: "Queen's Medical Centre (QMC), Nottingham", desc: "Trauma Module" },
      { stage: "Aug-27", hosp: "Northampton General Hospital", desc: "Acute Surgery" },
      { stage: "Feb-28", hosp: "Glenfield Hospital, Leicester", desc: "Cardiothoracics" },
      { stage: "Aug-28", hosp: "Leicester Royal Infirmary", desc: "Teaching Base" },
      { stage: "Feb-29", hosp: "Northampton General Hospital", desc: "Acute Surgery" },
      { stage: "Aug-29", hosp: "Glenfield Hospital, Leicester", desc: "Senior Placement" },
      { stage: "Feb-30", hosp: "Leicester Royal Infirmary", desc: "Senior Base" },
      { stage: "Aug-30", hosp: "Leicester Royal Infirmary", desc: "Senior Base" }
    ]
  },
  {
    id: "emids-south-10", code: "East Midlands - South 10 (S5)", region: "East Midlands", title: "QMC, Kettering, LRI & Glenfield (S5)", places: "1",
    hubs: {
      driver: { name: "Market Harborough", coords: [52.4782, -0.9222], desc: "A6/A14 corridor. Commute: 18m to Kettering, 22m to Leicester (LRI/Glenfield).", alert: "Short driving commutes." },
      transit: { name: "Leicester Central / Market Harborough", coords: [52.6312, -1.1252], desc: "Direct train to Kettering (12m); Hospital Hopper in Leicester.", alert: "Direct rail on Midland Mainline." }
    },
    stages: [
      { stage: "Feb-27", hosp: "Queen's Medical Centre (QMC), Nottingham", desc: "Trauma Module" },
      { stage: "Aug-27", hosp: "Kettering General Hospital", desc: "Acute Placement" },
      { stage: "Feb-28", hosp: "Leicester Royal Infirmary", desc: "Teaching Base" },
      { stage: "Aug-28", hosp: "Glenfield Hospital, Leicester", desc: "Cardiothoracics" },
      { stage: "Feb-29", hosp: "Kettering General Hospital", desc: "General Placement" },
      { stage: "Aug-29", hosp: "Glenfield Hospital, Leicester", desc: "Senior Placement" },
      { stage: "Feb-30", hosp: "Leicester Royal Infirmary", desc: "Senior Base" },
      { stage: "Aug-30", hosp: "Leicester Royal Infirmary", desc: "Senior Base" }
    ]
  },
  {
    id: "emids-south-13", code: "East Midlands - South 13 (S8)", region: "East Midlands", title: "QMC, Northampton, LRI & Glenfield (S8)", places: "1",
    hubs: {
      driver: { name: "Market Harborough / South Leicester", coords: [52.4782, -0.9222], desc: "A6/M1 corridor. Commute: 22m to Leicester (LRI/Glenfield), 30m to Northampton, 40m to QMC.", alert: "Central driving base." },
      transit: { name: "Leicester Central", coords: [52.6312, -1.1252], desc: "Hospital Hopper bus between LRI and Glenfield; train to Nottingham.", alert: "Regular train and bus connections." }
    },
    stages: [
      { stage: "Feb-27", hosp: "Queen's Medical Centre (QMC), Nottingham", desc: "Trauma Module" },
      { stage: "Aug-27", hosp: "Northampton General Hospital", desc: "Acute Surgery" },
      { stage: "Feb-28", hosp: "Leicester Royal Infirmary", desc: "Teaching Base" },
      { stage: "Aug-28", hosp: "Glenfield Hospital, Leicester", desc: "Cardiothoracics" },
      { stage: "Feb-29", hosp: "Northampton General Hospital", desc: "Acute Surgery" },
      { stage: "Aug-29", hosp: "Leicester Royal Infirmary", desc: "Senior Base" },
      { stage: "Feb-30", hosp: "Glenfield Hospital, Leicester", desc: "Senior Placement" },
      { stage: "Aug-30", hosp: "Glenfield Hospital, Leicester", desc: "Senior Placement" }
    ]
  },
  {
    id: "emids-south-1e", code: "East Midlands - South 1E", region: "East Midlands", title: "Northampton General Starting Base", places: "2",
    hubs: {
      driver: { name: "Northampton / Milton Keynes", coords: [52.2352, -0.8871], desc: "M1 Junction 15. Commute: 8m drive to Northampton General Hospital.", alert: "Easy driving with staff parking." },
      transit: { name: "Northampton Central", coords: [52.2352, -0.8871], desc: "15-minute walk or short bus ride from Northampton railway station to hospital.", alert: "Walkable from town centre." }
    },
    stages: [
      { stage: "Starting Trust", hosp: "Northampton General Hospital", desc: "Acute Surgery & Trauma Base" }
    ]
  },

  // ==================== WALES ====================
  {
    id: "wales-1", code: "Wales - ST4 - Feb - 1", region: "Wales", title: "Wales 1 (Glan Clwyd, Walton Neuro -> South Wales)", places: "1",
    hubs: {
      driver: { name: "Chester / St Asaph", coords: [53.1902, -2.8902], desc: "A55 expressway. Commute: 35m to Rhyl (Glan Clwyd), 30m to Walton Neuro (Liverpool). ST6/7 in South Wales.", alert: "A55 provides fast coastal driving in North Wales." },
      transit: { name: "Chester Central", coords: [53.1962, -2.8792], desc: "Direct mainline trains along North Wales coast (Rhyl 35m) and north to Liverpool/Walton (40m).", alert: "⚠️ Note: Glan Clwyd requires bus connection from Rhyl." }
    },
    stages: [
      { stage: "ST4 (9m)", hosp: "Glan Clwyd Hospital, Rhyl", desc: "North Wales Acute Base" },
      { stage: "ST4 (3m)", hosp: "The Walton Centre, Liverpool", desc: "Tertiary Neuroanaesthesia" },
      { stage: "ST5-ST7", hosp: "University Hospital of Wales, Cardiff", desc: "South Wales Regional Centre" }
    ]
  },
  {
    id: "wales-5", code: "Wales - ST4 - Feb - 5", region: "Wales", title: "Wales 5 (Royal Glamorgan Llantrisant)", places: "1",
    hubs: {
      driver: { name: "Cardiff (West) / Pontypridd", coords: [51.5202, -3.2802], desc: "M4 / A4119. Commute: 18m drive to Royal Glamorgan Hospital (Llantrisant).", alert: "Easy driving access across South Wales." },
      transit: { name: "Cardiff Central", coords: [51.4782, -3.1782], desc: "Direct 122 bus runs from Cardiff city centre directly to Royal Glamorgan Hospital entrance.", alert: "Regular bus routes serve the hospital from Cardiff." }
    },
    stages: [
      { stage: "ST4 (12m)", hosp: "Royal Glamorgan Hospital, Llantrisant", desc: "South Wales Acute Base" },
      { stage: "ST5-ST7", hosp: "University Hospital of Wales, Cardiff", desc: "South Wales Teaching Rotations" }
    ]
  },
  {
    id: "wales-6", code: "Wales - ST4 - Feb - 6", region: "Wales", title: "Wales 6 (Glangwili Carmarthen)", places: "1",
    hubs: {
      driver: { name: "Carmarthen / Llanelli", coords: [51.8542, -4.3002], desc: "A48/A40. Commute: 8m drive to Glangwili General Hospital.", alert: "Rural West Wales base." },
      transit: { name: "Carmarthen Town", coords: [51.8542, -4.3002], desc: "Local buses connect Carmarthen railway station directly to Glangwili Hospital.", alert: "Hospital has regular local town bus connections." }
    },
    stages: [
      { stage: "ST4 (12m)", hosp: "Glangwili Hospital, Carmarthen", desc: "West Wales Acute Base" },
      { stage: "ST5-ST7", hosp: "University Hospital of Wales, Cardiff", desc: "South Wales Rotations" }
    ]
  },
  {
    id: "wales-7", code: "Wales - ST4 - Feb - 7", region: "Wales", title: "Wales 7 (Morriston Swansea - LTFT 70%)", places: "3",
    hubs: {
      driver: { name: "Swansea (Mumbles / Sketty)", coords: [51.6202, -3.9502], desc: "M4 Junction 45. Commute: 15m drive to Morriston Hospital.", alert: "Coastal living in South Wales." },
      transit: { name: "Swansea Central", coords: [51.6202, -3.9402], desc: "Frequent 4/4A buses run directly from Swansea city centre to Morriston Hospital.", alert: "Very frequent dedicated hospital bus service." }
    },
    stages: [
      { stage: "ST4 (12m - LTFT 70%)", hosp: "Morriston Hospital, Swansea", desc: "Regional Burns, Cardiac & Intensive Care" },
      { stage: "ST5-ST7", hosp: "University Hospital of Wales, Cardiff", desc: "South Wales Rotations" }
    ]
  },
  {
    id: "wales-8-9", code: "Wales - ST4 - Feb - 8 & 9", region: "Wales", title: "Wales 8 & 9 (UHW Cardiff Base)", places: "2 total",
    hubs: {
      driver: { name: "Cardiff (North / Heath)", coords: [51.5072, -3.1802], desc: "A48 Eastern Avenue. Walking/driving distance to University Hospital of Wales.", alert: "Staff parking available on site." },
      transit: { name: "Cardiff (Heath / Roath)", coords: [51.5072, -3.1802], desc: "Heath High Level and Heath Low Level train stations are adjacent to UHW; frequent city buses.", alert: "Completely walkable from Heath residential area." }
    },
    stages: [
      { stage: "ST4 (12m)", hosp: "University Hospital of Wales, Cardiff", desc: "Major Trauma & Tertiary Teaching Centre" },
      { stage: "ST5-ST7", hosp: "University Hospital of Wales, Cardiff", desc: "South Wales Rotations" }
    ]
  },

  // ==================== WEST MIDLANDS ====================
  {
    id: "wmid-1-warwickshire", code: "West Midlands - ST4 - Feb - 1", region: "West Midlands", title: "Warwickshire Scheme", places: "5",
    hubs: {
      driver: { name: "Coventry / Kenilworth / Warwick", coords: [52.3802, -1.5502], desc: "A46 corridor. Commute: 15m to UHCW Coventry, 15m to Warwick Hospital.", alert: "A46 dual carriageway connects all Warwickshire hospitals." },
      transit: { name: "Coventry Central / Leamington Spa", coords: [52.4082, -1.5102], desc: "Frequent direct buses (9, 9A) connect Coventry station to UHCW; direct train to Warwick.", alert: "UHCW has extensive bus links from Coventry railway station." }
    },
    stages: [
      { stage: "Warwickshire Network", hosp: "UHCW Coventry", desc: "Major Teaching Hospital & Trauma Base" },
      { stage: "Warwickshire Network", hosp: "Warwick Hospital", desc: "Acute General Surgery" }
    ]
  },
  {
    id: "wmid-2-birmingham", code: "West Midlands - ST4 - Feb - 2", region: "West Midlands", title: "Birmingham Scheme", places: "9",
    hubs: {
      driver: { name: "Harborne / Edgbaston / Solihull", coords: [52.4512, -1.9602], desc: "Central location for Queen Elizabeth Hospital Birmingham, Heartlands, Worcester, and Dudley.", alert: "Central base across the West Midlands." },
      transit: { name: "Birmingham City Centre / Selly Oak", coords: [52.4772, -1.8982], desc: "CrossCity rail line stops at University station right inside Queen Elizabeth Hospital (7m from New St).", alert: "University station is on the QE hospital grounds." }
    },
    stages: [
      { stage: "Birmingham Network", hosp: "Queen Elizabeth Hospital Birmingham", desc: "Major Trauma & Tertiary Base" }
    ]
  },
  {
    id: "wmid-3-stoke", code: "West Midlands - ST4 - Feb - 3", region: "West Midlands", title: "Stoke UHNM Base", places: "3",
    hubs: {
      driver: { name: "Newcastle-under-Lyme / Stafford", coords: [53.0052, -2.2252], desc: "A34/M6. 8m drive to Royal Stoke University Hospital (UHNM).", alert: "Easy driving with staff parking." },
      transit: { name: "Stoke-on-Trent (Station)", coords: [53.0082, -2.1812], desc: "Frequent direct 25 bus from Stoke railway station to Royal Stoke Hospital front entrance.", alert: "Hospital has regular station bus links." }
    },
    stages: [
      { stage: "Stoke School Base", hosp: "Royal Stoke University Hospital", desc: "Major Trauma & Tertiary Base" }
    ]
  },
  {
    id: "wmid-4-wolverhampton", code: "West Midlands - ST4 - Feb - 4", region: "West Midlands", title: "Wolverhampton New Cross", places: "2",
    hubs: {
      driver: { name: "Wolverhampton (Tettenhall / Wednesfield)", coords: [52.5972, -2.1072], desc: "Wednesfield is 5m from New Cross Hospital.", alert: "Easy local driving." },
      transit: { name: "Wolverhampton Central", coords: [52.5862, -2.1222], desc: "Frequent buses (number 59) connect Wolverhampton station directly to New Cross Hospital in 12 mins.", alert: "Bus runs every 8 minutes." }
    },
    stages: [
      { stage: "Stoke School Base", hosp: "New Cross Hospital, Wolverhampton", desc: "Heart & Lung Centre Base" }
    ]
  },
  {
    id: "wmid-5-walsall", code: "West Midlands - ST4 - Feb - 5", region: "West Midlands", title: "Walsall Manor", places: "1",
    hubs: {
      driver: { name: "Walsall / Sutton Coldfield", coords: [52.5852, -1.9862], desc: "M6 Junction 9/10. 5m drive to Walsall Manor Hospital.", alert: "Convenient M6 access." },
      transit: { name: "Walsall Town Centre", coords: [52.5852, -1.9862], desc: "Walsall railway station is a short walk or 5m bus from Walsall Manor Hospital.", alert: "Very accessible on foot from Walsall town." }
    },
    stages: [
      { stage: "Stoke School Base", hosp: "Walsall Manor Hospital", desc: "Acute General Base" }
    ]
  },
  {
    id: "wmid-6-mmuh", code: "West Midlands - ST4 - Feb - 6", region: "West Midlands", title: "Midlands Met MMUH", places: "3",
    hubs: {
      driver: { name: "Harborne / Smethwick", coords: [52.4972, -1.9672], desc: "Close to the newly opened Midlands Metropolitan University Hospital.", alert: "Staff parking on site." },
      transit: { name: "Birmingham New Street / Smethwick Galton Bridge", coords: [52.4972, -1.9672], desc: "Direct buses (82, 87) connect Birmingham city centre directly to MMUH.", alert: "Rapid bus connections from central Birmingham." }
    },
    stages: [
      { stage: "Stoke School Base", hosp: "Midlands Met University Hospital", desc: "Acute Teaching Centre" }
    ]
  },
  {
    id: "wmid-7-shrewsbury", code: "West Midlands - ST4 - Feb - 7", region: "West Midlands", title: "Shrewsbury & Telford", places: "3",
    hubs: {
      driver: { name: "Shrewsbury / Telford midpoint", coords: [52.7062, -2.6502], desc: "A5/M54 dual carriageway. Commute: 15m to Royal Shrewsbury, 15m to Princess Royal (Telford).", alert: "A5 dual carriageway links both hospitals." },
      transit: { name: "Shrewsbury Central", coords: [52.7112, -2.7502], desc: "Frequent bus from Shrewsbury railway station to Royal Shrewsbury Hospital; direct trains to Telford (18m).", alert: "Trains connect Shrewsbury and Telford stations." }
    },
    stages: [
      { stage: "Stoke School Base", hosp: "Royal Shrewsbury Hospital", desc: "Shropshire Acute Base" }
    ]
  },

  // ==================== YORKSHIRE & THE HUMBER ====================
  {
    id: "york-north-east-1", code: "Yorkshire - North / East 1", region: "Yorkshire and the Humber", title: "Hull, York, Scarborough & Scunthorpe", places: "6",
    hubs: {
      driver: { name: "Beverley / York East", coords: [53.8422, -0.4282], desc: "A1079/A64 corridor linking York Hospital and Hull Royal Infirmary.", alert: "Car recommended due to rural East Yorkshire distances." },
      transit: { name: "York City Centre", coords: [53.9582, -1.0902], desc: "York Hospital is walking distance (15m) from centre; direct trains to Hull (1h) and Scarborough (50m).", alert: "York is a major national rail interchange." }
    },
    stages: [
      { stage: "Regional Base", hosp: "Hull Royal Infirmary", desc: "Major Trauma Centre" },
      { stage: "Regional Base", hosp: "York Hospital", desc: "Acute General" },
      { stage: "Regional Base", hosp: "Scarborough Hospital", desc: "Coast Placement" },
      { stage: "Regional Base", hosp: "Scunthorpe General Hospital", desc: "General DGH" }
    ]
  },
  {
    id: "york-south-2-3e", code: "Yorkshire - South 2 & 3E", region: "Yorkshire and the Humber", title: "South Yorkshire Scheme (Sheffield, Doncaster, Barnsley, Rotherham)", places: "8 total",
    hubs: {
      driver: { name: "Sheffield (West) / Rotherham", coords: [53.3812, -1.4682], desc: "M1 corridor connecting Northern General (Sheffield), Doncaster Royal, Rotherham, and Barnsley.", alert: "M1 enables 20-30m driving to all acute sites." },
      transit: { name: "Sheffield City Centre", coords: [53.3782, -1.4622], desc: "Supertram and buses link station directly to Northern General Hospital; trains to Doncaster (22m) and Barnsley (20m).", alert: "Extensive tram and bus lines for hospital staff." }
    },
    stages: [
      { stage: "South Yorks Network", hosp: "Northern General Hospital, Sheffield", desc: "Major Trauma Centre" },
      { stage: "South Yorks Network", hosp: "Doncaster Royal Infirmary", desc: "Acute General" },
      { stage: "South Yorks Network", hosp: "Rotherham Hospital", desc: "General Placement" },
      { stage: "South Yorks Network", hosp: "Barnsley Hospital", desc: "DGH Base" }
    ]
  },
  {
    id: "york-west-3-4e", code: "Yorkshire - West 3 & 4E", region: "Yorkshire and the Humber", title: "West Yorkshire Scheme (Leeds, Bradford, Wakefield)", places: "9 total",
    hubs: {
      driver: { name: "Leeds (North / Horsforth)", coords: [53.8342, -1.6422], desc: "Ring road access. Commute: 15m to Leeds General Infirmary, 22m to Bradford Royal, 25m to Pinderfields.", alert: "Avoids inner-city congestion." },
      transit: { name: "Leeds City Centre", coords: [53.7952, -1.5482], desc: "12m walk or free city bus to Leeds General Infirmary; frequent 20m trains to Bradford and Wakefield.", alert: "High frequency West Yorkshire rail network." }
    },
    stages: [
      { stage: "West Yorks Network", hosp: "Leeds General Infirmary", desc: "Major Trauma & Cardiac Centre" },
      { stage: "West Yorks Network", hosp: "Bradford Royal Infirmary", desc: "Acute General" },
      { stage: "West Yorks Network", hosp: "Pinderfields Hospital, Wakefield", desc: "Burns & Plastics" }
    ]
  },

  // ==================== NORTH WEST & NORTH EAST ====================
  {
    id: "nw-cheshire-mersey", code: "North West - Cheshire & Mersey 1 & 1E", region: "North West", title: "Cheshire & Merseyside Scheme", places: "13 total",
    hubs: {
      driver: { name: "Liverpool (South / Aigburth) / Chester", coords: [53.3702, -2.9302], desc: "M62/M53/M56. Central driving location across Merseyside and Cheshire.", alert: "Fast road access via Queensway/Kingsway tunnels." },
      transit: { name: "Liverpool City Centre", coords: [53.4092, -2.9642], desc: "Walking distance to Royal Liverpool; Merseyrail network to Walton and Arrowe Park.", alert: "Merseyrail connects all hospital sites." }
    },
    stages: [
      { stage: "Merseyside Network", hosp: "Royal Liverpool University Hospital", desc: "Teaching Hospital Base" },
      { stage: "Merseyside Network", hosp: "The Walton Centre, Liverpool", desc: "Tertiary Neuroanaesthesia" }
    ]
  },
  {
    id: "nw-gt-manchester", code: "North West - Gt Manchester 2 & 2E", region: "North West", title: "Greater Manchester Scheme", places: "16 total",
    hubs: {
      driver: { name: "South Manchester (Didsbury / Altrincham)", coords: [53.4102, -2.2302], desc: "M60/M56. Commute: 20m to MRI, 15m to Wythenshawe, 22m to Salford Royal.", alert: "Good parking options in South Manchester." },
      transit: { name: "Manchester City Centre (Oxford Road)", coords: [53.4732, -2.2412], desc: "Oxford Road is walking distance to MRI; Metrolink tram connects to Salford Royal and Wythenshawe.", alert: "Metrolink tram makes non-driving commutes very easy." }
    },
    stages: [
      { stage: "Manchester Network", hosp: "Manchester Royal Infirmary", desc: "Major Acute Centre Base" }
    ]
  },
  {
    id: "north-east-1", code: "North East - 1", region: "North East", title: "North East & North Cumbria Scheme", places: "4",
    hubs: {
      driver: { name: "Newcastle upon Tyne / Durham", coords: [54.9782, -1.6172], desc: "A1(M) spine connecting Newcastle (RVI, Freeman), Sunderland, and James Cook (Middlesbrough).", alert: "Straightforward highway links north and south." },
      transit: { name: "Newcastle City Centre (Haymarket)", coords: [54.9782, -1.6142], desc: "Walk (8m) to Royal Victoria Infirmary (RVI); Tyne & Wear Metro connects directly to Freeman Hospital and Sunderland.", alert: "Tyne & Wear Metro offers rapid transit to hospitals." }
    },
    stages: [
      { stage: "North East Network", hosp: "Royal Victoria Infirmary, Newcastle", desc: "Major Trauma & Neuro Base" }
    ]
  }
];

// Helper to extract unique hospital bases from any rotation
function getRotationHospitalBases(rot) {
  return [...new Set(rot.stages.map(s => s.hosp))];
}

// Global window exposure for zero-configuration browser loading
window.HOSPITALS = HOSPITALS;
window.REGION_COLORS = REGION_COLORS;
window.ROTATIONS_DATA = ROTATIONS_DATA;
window.getRotationHospitalBases = getRotationHospitalBases;
window.ROTATIONS_DATA = ROTATIONS_DATA;
window.getRotationHospitalBases = getRotationHospitalBases;
