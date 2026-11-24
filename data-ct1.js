// ============================================================================
// CT1 Anaesthetics National Placement Data
// ============================================================================
(function() {
const APP_CONFIG = {
  storagePrefix: "ct1_",
  appTitle: "CT1 Anaesthetics National Rotation & Commute Explorer",
  cycleName: "Aug 2026 / Feb 2027",
  defaultCenter: [52.8, -1.8],
  defaultZoom: 6
};

const HOSPITALS = {
  "Boston Pilgrim Hospital": {
    coords: [52.9892, -0.0071],
    region: "East Midlands",
    type: "DGH",
    epr: "CareFlow / Medway EPR",
    parking: "Ample on-site staff car parking; zero traffic congestion",
    station: "Boston Rail Station (2.0 miles / quick bus)",
    highlights: "Rural DGH experience, Solo list confidence building, Intensive Care Medicine exposure"
  },
  "Chesterfield Royal Hospital": {
    coords: [53.2272, -1.3912],
    region: "East Midlands",
    type: "DGH",
    epr: "CareFlow EPR",
    parking: "Plentiful staff parking on site; permit readily granted on induction",
    station: "Chesterfield Rail Station (1.8 miles / 10m bus link)",
    highlights: "Extremely friendly DGH reputation, High volume independent lists, Emergency General Surgery"
  },
  "Kings Mill Hospital, Mansfield": {
    coords: [53.1362, -1.2181],
    region: "East Midlands",
    type: "DGH",
    epr: "Nervecentre EPR (Sherwood Forest Hospitals)",
    parking: "Modern multi-storey staff parking with permit scheme; A38 corridor",
    station: "Mansfield Rail Station (2.0 miles), Sutton Parkway (1.5 miles)",
    highlights: "Outstanding CQC rated trust, Modern hospital layout, High trainee satisfaction in NTS"
  },
  "Leicester Royal Infirmary": {
    coords: [52.6282, -1.1342],
    region: "East Midlands",
    type: "Tertiary",
    epr: "Nervecentre EPR (UHL Trust-wide digital programme)",
    parking: "Strict staff permit scheme; Leicester Hospital Hopper bus connects rail station",
    station: "Leicester Rail Station (0.6 miles / 10m walk)",
    highlights: "Major Trauma Centre, Leicester Children's Hospital, High-risk Obstetrics, Busy Emergency Floor"
  },
  "Lincoln County Hospital": {
    coords: [53.2321, -0.5182],
    region: "East Midlands",
    type: "DGH",
    epr: "CareFlow / Medway EPR",
    parking: "Staff parking permits available on site",
    station: "Lincoln Central Rail Station (1.5 miles / 10m bus)",
    highlights: "Trauma Unit, Vascular surgery, Supportive senior faculty, Close-knit anaesthetic department"
  },
  "Northampton General Hospital": {
    coords: [52.2352, -0.8871],
    region: "East Midlands",
    type: "DGH",
    epr: "Nervecentre EPR",
    parking: "Staff permit parking scheme on site; walking distance to town centre",
    station: "Northampton Rail Station (1.2 miles / 20m walk)",
    highlights: "Large acute DGH, Interventional Cardiology, Cancer Centre, Supportive anaesthetic department"
  },
  "Nottingham City Hospital": {
    coords: [52.9862, -1.1612],
    region: "East Midlands",
    type: "DGH",
    epr: "Nervecentre EPR / Notis",
    parking: "Staff permit parking scheme with good campus capacity; Medilink bus link",
    station: "Nottingham Rail Station (3.8 miles / Medilink shuttle bus)",
    highlights: "Regional Cardiothoracics & Thoracic Surgery, Burns & Plastics, Renal Transplant, Elective Hub"
  },
  "Queen's Hospital, Burton": {
    coords: [52.8177, -1.656],
    region: "East Midlands",
    type: "DGH",
    epr: "Nervecentre / Lorenzo electronic records",
    parking: "Staff permit scheme",
    station: "Burton-on-Trent railway station (approx 1.5 miles)",
    highlights: "Orthopaedic surgical centre, general surgery, obstetric anaesthesia and acute critical care"
  },
  "Queen's Medical Centre (QMC), Nottingham": {
    coords: [52.9431, -1.1862],
    region: "East Midlands",
    type: "Tertiary",
    epr: "Nervecentre EPR / Notis Clinical System",
    parking: "Permit scheme strictly managed; Nottingham Express Transit (NET Tram) stops at hospital!",
    station: "Nottingham Rail Station (2.2 miles / direct Tram connection in 12m)",
    highlights: "Major Trauma Centre (one of UK's busiest), Nottingham Children's Hospital, Regional Neuro, Spine"
  },
  "Royal Derby Hospital": {
    coords: [52.9102, -1.5121],
    region: "East Midlands",
    type: "DGH",
    epr: "Lorenzo / CareFlow EPR (UHDB Trust)",
    parking: "Staff permit scheme on site; Kingsway Park & Ride link",
    station: "Derby Rail Station (2.8 miles / direct hospital buses)",
    highlights: "Large modern PFI hospital, National Hand Surgery Centre (Pulvertaft), Bariatric, Vascular"
  },
  "Bedford Hospital": {
    coords: [52.1292, -0.4683],
    region: "East of England",
    type: "DGH",
    epr: "SystmOne / Bedfordshire Hospitals EPR",
    parking: "Staff permit parking scheme across North & South wings",
    station: "Bedford St Johns (0.4 miles / 8m walk), Bedford Midland (0.9 miles)",
    highlights: "Friendly DGH training culture, General & Colorectal surgery, Vascular, Day Surgery"
  },
  "Broomfield Hospital, Chelmsford": {
    coords: [51.7762, 0.4682],
    region: "East of England",
    type: "DGH",
    epr: "Cerner Millennium / Lorenzo",
    parking: "On-site staff parking permits available via Mid & South Essex Trust",
    station: "Chelmsford Station (4.0 miles / direct C1/C2 bus connection)",
    highlights: "St Andrew's Regional Burns & Plastic Surgery Centre, Head & Neck / MaxFax, Upper GI"
  },
  "Colchester Hospital": {
    coords: [51.9142, 0.9011],
    region: "East of England",
    type: "DGH",
    epr: "CareFlow / ESNEFT Digital Portal",
    parking: "Staff permit scheme via ESNEFT; dedicated trainee permits allocated",
    station: "Colchester North Station (1.2 miles / 20m walk or 5m bus)",
    highlights: "Elective Orthopaedic Centre, Laparoscopic Colorectal Surgery, Busy Acute Theatres"
  },
  "Ipswich Hospital": {
    coords: [52.0543, 1.2001],
    region: "East of England",
    type: "DGH",
    epr: "Lorenzo / ESNEFT Portal",
    parking: "Staff permit parking on-site; easy barrier access for on-call teams",
    station: "Ipswich Rail Station (2.7 miles / direct hospital buses)",
    highlights: "Major Trauma Unit, Spinal Surgery, Regional Gynaecology, High-volume independent lists"
  },
  "James Paget Hospital, Great Yarmouth": {
    coords: [52.5492, 1.7161],
    region: "East of England",
    type: "DGH",
    epr: "Lorenzo EPR",
    parking: "Abundant on-site staff car parking; low congestion",
    station: "Great Yarmouth Station (3.5 miles), Lowestoft Station (6 miles)",
    highlights: "Supportive coastal DGH, Elective Orthopaedics, Day case surgery, Close consultant supervision"
  },
  "Lister Hospital, Stevenage": {
    coords: [51.9162, -0.2154],
    region: "East of England",
    type: "DGH",
    epr: "Lorenzo / CareFlow EPR",
    parking: "On-site multi-storey with trainee parking permit system",
    station: "Stevenage Rail Station (1.3 miles / 20m walk or quick bus)",
    highlights: "Regional Renal Centre, Robotic Surgery, High-risk Obstetrics, Busy ITU"
  },
  "Luton & Dunstable Hospital": {
    coords: [51.8972, -0.4721],
    region: "East of England",
    type: "DGH",
    epr: "Cerner Millennium / Lorenzo",
    parking: "Staff multi-storey parking adjacent to Lewsey Road; permit required",
    station: "Leagrave Rail Station (1.5 miles / short bus)",
    highlights: "Tertiary Neonatal Intensive Care (NICU), Regional Bariatric Centre, MaxFax, Busy Trauma"
  },
  "Norfolk & Norwich University Hospital": {
    coords: [52.6181, 1.2212],
    region: "East of England",
    type: "Tertiary",
    epr: "Lorenzo / Trust Electronic Portal (EPR)",
    parking: "Staff permit scheme with qualifying criteria; Costessey Park & Ride frequent link",
    station: "Norwich Rail Station (4.5 miles / direct hospital express buses)",
    highlights: "Major Regional Teaching Hospital, Complex Paeds, Thoracics, Vascular, Major Head & Neck"
  },
  "Peterborough City Hospital": {
    coords: [52.5844, -0.2786],
    region: "East of England",
    type: "DGH",
    epr: "Oracle Cerner Millennium EPR",
    parking: "Staff permit scheme with barrier access",
    station: "Peterborough railway station (bus link / 10 min drive)",
    highlights: "Modern PFI hospital, emergency vascular, acute orthopaedics, obstetrics and intensive care"
  },
  "Princess Alexandra Hospital, Harlow": {
    coords: [51.7725, 0.0894],
    region: "East of England",
    type: "DGH",
    epr: "Cerner Millennium (Electronic Health Record)",
    parking: "Staff parking permits available on induction; on-site barrier controlled",
    station: "Harlow Town Rail Station (1.1 miles / 15m walk)",
    highlights: "High-volume Emergency General Surgery, Level 2 ICU, High-risk Labour Ward"
  },
  "Queen Elizabeth Hospital, Kings Lynn": {
    coords: [52.7531, 0.4431],
    region: "East of England",
    type: "DGH",
    epr: "CareFlow EPR",
    parking: "Staff parking permits readily accessible on site",
    station: "King's Lynn Rail Station (2.0 miles / direct bus link)",
    highlights: "Autonomous DGH surgical experience, Obstetrics, General & Orthopaedic trauma"
  },
  "Watford General Hospital": {
    coords: [51.6471, -0.4035],
    region: "East of England",
    type: "DGH",
    epr: "Cerner Millennium (EPR)",
    parking: "Multi-storey on-site parking for staff via application; pay & display fallback",
    station: "Watford High Street (0.7 miles / 15m walk), Watford Junction (1.5 miles)",
    highlights: "High-volume DGH, Acute Surgical Hub, Busy Maternity & Obstetric Anaesthesia"
  },
  "Maidstone Hospital": {
    coords: [51.2747, 0.4857],
    region: "Kent, Surrey and Sussex",
    type: "DGH",
    epr: "Altera Sunrise Electronic Patient Record",
    parking: "Staff permit scheme",
    station: "Barming railway station (10 min walk)",
    highlights: "Kent Oncology Centre base, elective surgical hub, ophthalmology and general surgery"
  },
  "Medway Maritime Hospital, Gillingham": {
    coords: [51.3795, 0.5416],
    region: "Kent, Surrey and Sussex",
    type: "DGH",
    epr: "System C CareFlow clinical workspace",
    parking: "Staff parking permit scheme with multi-storey",
    station: "Gillingham (Kent) railway station (15-20 min walk / bus)",
    highlights: "One of Kent's busiest acute hospitals, vascular surgery, high-volume obstetrics and trauma"
  },
  "Tunbridge Wells Hospital (Pembury)": {
    coords: [51.1488, 0.3081],
    region: "Kent, Surrey and Sussex",
    type: "DGH",
    epr: "Altera Sunrise Electronic Patient Record",
    parking: "Staff permit parking scheme with multi-storey",
    station: "High Brooms or Tonbridge stations (bus connection)",
    highlights: "First all single-room NHS hospital in England, trauma unit, acute surgery & critical care"
  },
  "Barnet Hospital (BCF)": {
    coords: [51.6521, -0.2223],
    region: "London",
    type: "DGH",
    epr: "Cerner Millennium (Royal Free London trust)",
    parking: "Staff car parking permits available on site; easy access from A1 / M25",
    station: "High Barnet (Northern line - 1.2 miles / 10m bus corridor)",
    highlights: "Busy Acute DGH, General & Emergency surgery, Colorectal, Intensive Care Medicine"
  },
  "Chelsea & Westminster Hospital": {
    coords: [51.4842, -0.1824],
    region: "London",
    type: "Tertiary",
    epr: "Cerner Millennium (Full electronic prescribing & the EPR)",
    parking: "Underground staff car park; limited trainee permits, cycling/transit popular",
    station: "Fulham Broadway (District line - 12m walk), South Kensington (15m walk)",
    highlights: "Regional Burns Centre, Specialist Paediatric Surgery, High-risk Obstetrics, Bariatrics"
  },
  "Hammersmith Hospital": {
    coords: [51.5171, -0.2372],
    region: "London",
    type: "Tertiary",
    epr: "Cerner Millennium (Imperial College Healthcare)",
    parking: "Staff car parking permits available on induction; Central line nearby",
    station: "East Acton Tube Station (Central line - 8m walk), White City (15m)",
    highlights: "Cardiothoracic Surgery, Hepatobiliary (HPB) surgery, Renal Transplant, Gynae-Oncology"
  },
  "Homerton University Hospital": {
    coords: [51.5504, -0.0483],
    region: "London",
    type: "DGH",
    epr: "Oracle Cerner Millennium electronic patient records",
    parking: "Extremely limited permit parking; excellent public transit",
    station: "Homerton Overground station (3 min walk)",
    highlights: "Level 3 neonatal intensive care, regional bariatric surgery, and active obstetric service"
  },
  "Queen's Hospital, Romford": {
    coords: [51.5691, 0.1792],
    region: "London",
    type: "DGH",
    epr: "CareFlow / Medway EPR",
    parking: "Staff permit parking scheme via BHRUT",
    station: "Romford Rail Station (Elizabeth Line - 0.7 miles / 12m walk or quick bus)",
    highlights: "Major Acute DGH, Regional Neurosciences, High-risk Obstetrics, Hyper-acute Stroke"
  },
  "Royal Free Hospital": {
    coords: [51.5532, -0.1652],
    region: "London",
    type: "Tertiary",
    epr: "Cerner Millennium (Full electronic prescribing & charting)",
    parking: "Heavily restricted staff parking; Underground / public transit strongly advised",
    station: "Belsize Park (Northern line, 7m walk), Hampstead Heath (Overground, 3m walk)",
    highlights: "Liver Transplant Centre, High Consequence Infectious Diseases (HCID), Vascular, Plastics"
  },
  "West Middlesex University Hospital": {
    coords: [51.4782, -0.3271],
    region: "London",
    type: "DGH",
    epr: "Cerner Millennium (Chelsea & Westminster trust)",
    parking: "Staff car park with permit system on site; easy access from A4 / M4",
    station: "Syon Lane Rail Station (0.5 miles / 10m walk), Isleworth (0.6 miles)",
    highlights: "Friendly West London DGH, General & Emergency surgery, High-throughput elective theatre lists"
  },
  "Cumberland Infirmary, Carlisle": {
    coords: [54.8965, -2.9577],
    region: "North East",
    type: "DGH",
    epr: "System C CareFlow clinical workspace",
    parking: "Staff permit scheme",
    station: "Carlisle railway station (1.5 miles via bus/cycle)",
    highlights: "Principal acute general hospital for north Cumbria, intensive care and emergency theatres"
  },
  "Freeman Hospital, Newcastle": {
    coords: [55.002, -1.594],
    region: "North East",
    type: "Tertiary",
    epr: "Oracle Cerner Millennium (Newcastle eRecord)",
    parking: "Newcastle Hospitals permit scheme / High Friars",
    station: "Longbenton Metro station (15 min walk / direct shuttle)",
    highlights: "World-renowned cardiothoracic transplantation, liver/renal transplant, vascular and oncology"
  },
  "James Cook University Hospital, Middlesbrough": {
    coords: [54.552, -1.214],
    region: "North East",
    type: "Tertiary",
    epr: "Altera Digital Health (Sunrise EPR)",
    parking: "Staff permit parking scheme with dedicated barriers",
    station: "James Cook rail halt (dedicated on-site railway platform)",
    highlights: "Major Trauma Centre, neurosurgery, cardiothoracics, vascular and specialist tertiary services"
  },
  "Royal Victoria Infirmary, Newcastle": {
    coords: [54.9782, -1.6232],
    region: "North East",
    type: "Tertiary",
    epr: "Cerner Millennium (e-Record - Newcastle Hospitals)",
    parking: "Restricted city parking; Newcastle Metro (Haymarket) directly adjacent",
    station: "Haymarket Metro Station (0.3 miles / 5m walk), Newcastle Central (0.8 miles)",
    highlights: "Major Trauma Centre, Great North Children's Hospital, Neurosciences, High-risk Obstetrics"
  },
  "Sunderland Royal Hospital": {
    coords: [54.9031, -1.4097],
    region: "North East",
    type: "DGH",
    epr: "Meditech / Nervecentre electronic records",
    parking: "Staff permit scheme with barrier access",
    station: "Millfield Tyne and Wear Metro station (5 min walk)",
    highlights: "Major teaching DGH, acute surgical emergencies, vascular hub, obstetrics and critical care"
  },
  "Aintree University Hospital, Liverpool": {
    coords: [53.4616, -2.9434],
    region: "North West",
    type: "Tertiary",
    epr: "Electronic EPR (transitioning with LUHFT)",
    parking: "Staff permit parking scheme with on-site multi-storey",
    station: "Fazakerley railway station (5 min walk)",
    highlights: "Major Trauma Centre (Cheshire & Merseyside), regional maxillofacial surgery and stroke"
  },
  "Arrowe Park Hospital (Wirral)": {
    coords: [53.3699, -3.096],
    region: "North West",
    type: "DGH",
    epr: "Oracle Cerner Millennium electronic patient records",
    parking: "Staff permit scheme with barrier access",
    station: "Upton (Merseyside) or Birkenhead rail links via direct bus",
    highlights: "Large teaching DGH, acute critical care, high-volume obstetrics and emergency theatres"
  },
  "Countess of Chester Hospital": {
    coords: [53.2086, -2.8986],
    region: "North West",
    type: "DGH",
    epr: "Oracle Cerner Millennium EPR",
    parking: "Staff permit scheme with dedicated doctor bays",
    station: "Bache railway station (adjacent, 2 min walk)",
    highlights: "High-volume elective orthopaedics, obstetrics, critical care, and general surgery"
  },
  "Leighton Hospital, Crewe": {
    coords: [53.1199, -2.4778],
    region: "North West",
    type: "DGH",
    epr: "System C CareFlow / Medway EPR",
    parking: "Staff permit parking scheme",
    station: "Crewe railway station (approx 3 miles via bus)",
    highlights: "Busy DGH anaesthesia, regional vascular unit, obstetrics, and high-volume trauma theatre"
  },
  "Liverpool Women's Hospital (LWH)": {
    coords: [53.3985, -2.961],
    region: "North West",
    type: "Tertiary",
    epr: "Electronic clinical records portal",
    parking: "Staff permit scheme on-site",
    station: "Edge Hill railway station (15 min walk / bus)",
    highlights: "Europe's largest specialist obstetric tertiary hospital, neonatal ICU & advanced gynaecology"
  },
  "Manchester Royal Infirmary": {
    coords: [53.4622, -2.2272],
    region: "North West",
    type: "Tertiary",
    epr: "Hive (Epic Systems - full MFT trust-wide rollout)",
    parking: "Permit allocation via MFT; Oxford Road bus corridor (busiest in Europe)",
    station: "Manchester Oxford Road (1.2 miles / 15m walk or 5m bus)",
    highlights: "Flagship Epic Trust, Royal Manchester Children's Hospital, Cardiothoracics, Renal/Pancreas Transplant"
  },
  "Royal Bolton Hospital": {
    coords: [53.5539, -2.4299],
    region: "North West",
    type: "DGH",
    epr: "Altera Sunrise EPR",
    parking: "Staff permit scheme",
    station: "Moses Gate railway station (15 min walk)",
    highlights: "Regional Level 3 neonatal intensive care, high-birthrate obstetrics and emergency surgery"
  },
  "Royal Liverpool University Hospital": {
    coords: [53.4092, -2.9642],
    region: "North West",
    type: "Tertiary",
    epr: "CareFlow EPR (New state-of-the-art Royal building)",
    parking: "Staff parking permit scheme with on-call priority; central city location",
    station: "Liverpool Lime Street (0.8 miles / 15m walk)",
    highlights: "Major Teaching Hospital, Major Trauma Centre, Pancreatic Surgery, Vascular, MaxFax"
  },
  "Salford Royal Hospital": {
    coords: [53.4881, -2.3214],
    region: "North West",
    type: "Tertiary",
    epr: "Dedalus Electronic Patient Record (NCA EPR)",
    parking: "Staff permit scheme with Metrolink links",
    station: "Eccles railway station / Metrolink tram (10 min walk)",
    highlights: "Major Trauma Centre, regional neurosurgery, comprehensive stroke centre & intestinal failure"
  },
  "Southport and Formby District General Hospital": {
    coords: [53.6338, -2.9787],
    region: "North West",
    type: "DGH",
    epr: "System C Medway EPR",
    parking: "Staff permit parking scheme",
    station: "Meols Cop railway station (10 min walk)",
    highlights: "Elective orthopaedics, acute medicine, rehabilitation and emergency surgical coverage"
  },
  "Stepping Hill Hospital, Stockport": {
    coords: [53.3839, -2.1318],
    region: "North West",
    type: "DGH",
    epr: "System C CareFlow clinical workspace",
    parking: "Staff parking permit scheme",
    station: "Woodsmoor railway station (5 min walk)",
    highlights: "High-volume emergency admissions, laparoscopic surgery, obstetrics and critical care"
  },
  "Warrington Hospital": {
    coords: [53.3938, -2.6097],
    region: "North West",
    type: "DGH",
    epr: "Nervecentre / Lorenzo electronic records",
    parking: "Staff permit parking scheme",
    station: "Warrington Central & Bank Quay stations (approx 1 mile)",
    highlights: "Acute emergency admissions, critical care, general surgery, trauma and obstetrics"
  },
  "Whiston Hospital, Prescot": {
    coords: [53.4208, -2.7877],
    region: "North West",
    type: "DGH",
    epr: "System C CareFlow clinical workspace",
    parking: "Multi-storey staff permit scheme",
    station: "Prescot railway station (10 min walk)",
    highlights: "Regional Mersey Burns and Plastic Surgery Unit, high-volume acute theatres & trauma"
  },
  "Wythenshawe Hospital, Manchester": {
    coords: [53.3897, -2.295],
    region: "North West",
    type: "Tertiary",
    epr: "Epic Electronic Patient Record (MFT Hive)",
    parking: "Staff permit scheme with Metrolink connection",
    station: "Roundthorn Metrolink tram stop (adjacent, 3 min walk)",
    highlights: "Major cardiothoracic centre, heart & lung transplantation, ECMO, regional burns & plastics"
  },
  "Derriford Hospital, Plymouth": {
    coords: [50.4162, -4.1162],
    region: "South West - Peninsula",
    type: "Tertiary",
    epr: "CareFlow / Epic deployment roadmap (UHP Trust)",
    parking: "Multi-storey staff permit scheme; Plymouth Park & Ride link",
    station: "Plymouth Rail Station (3.5 miles / regular hospital express bus)",
    highlights: "Major Trauma Centre (Peninsula), Cardiothoracic Surgery, Neuroanaesthesia, Military Trauma"
  },
  "Musgrove Park Hospital, Taunton": {
    coords: [51.0142, -3.1202],
    region: "South West - Peninsula",
    type: "DGH",
    epr: "Epic Systems (Somerset NHS Foundation Trust)",
    parking: "Staff permit scheme available; Taunton Silk Mills Park & Ride",
    station: "Taunton Rail Station (2.0 miles / direct hospital bus)",
    highlights: "Fully integrated Epic EPR system, Bariatric surgery, Vascular, Modern surgical centre"
  },
  "North Devon District Hospital, Barnstaple": {
    coords: [51.0922, -4.0504],
    region: "South West - Peninsula",
    type: "DGH",
    epr: "Epic Electronic Patient Record (Devon-wide MyCare)",
    parking: "Staff permit parking scheme",
    station: "Barnstaple railway station (bus link)",
    highlights: "Comprehensive rural acute anaesthesia, general surgery, ICU, and remote medicine skills"
  },
  "Royal Cornwall Hospital, Truro": {
    coords: [50.2712, -5.0931],
    region: "South West - Peninsula",
    type: "DGH",
    epr: "CareFlow EPR (Treliske digital portal)",
    parking: "Staff car parking permits available; on-site Park & Ride",
    station: "Truro Rail Station (1.5 miles / direct hospital bus link)",
    highlights: "Only acute trust in Cornwall, Vascular, High-risk Obstetrics, Paediatric surgery, Cornwall lifestyle"
  },
  "Bristol Royal Infirmary (UHBW)": {
    coords: [51.4582, -2.5971],
    region: "South West - Severn",
    type: "Tertiary",
    epr: "CareFlow / Medway Clinical Portal",
    parking: "Restricted central Bristol parking; Park & Ride (Long Ashton) or cycling popular",
    station: "Bristol Temple Meads (1.2 miles / 10m bus corridor)",
    highlights: "Major Teaching Hospital, Bristol Heart Institute (Cardiac), Bristol Children's Hospital, Thoracics"
  },
  "Gloucestershire Royal Hospital": {
    coords: [51.8682, -2.2341],
    region: "South West - Severn",
    type: "DGH",
    epr: "InterSystems TrakCare EPR",
    parking: "Multi-storey on-site staff car park; permit scheme available",
    station: "Gloucester Rail Station (0.4 miles / 8m walk)",
    highlights: "Busy Teaching DGH, Acute Surgical Floor, Vascular Surgery Hub, Dedicated Intensive Care"
  },
  "Great Western Hospital, Swindon": {
    coords: [51.5332, -1.7331],
    region: "South West - Severn",
    type: "DGH",
    epr: "SystmOne / Medway EPR",
    parking: "Large staff car park adjacent to M4 Junction 15; permit system",
    station: "Swindon Rail Station (3.5 miles / direct hospital buses)",
    highlights: "High-volume Acute DGH, Emergency General Surgery, Orthopaedics, Supportive senior team"
  },
  "Southmead Hospital (NBT)": {
    coords: [51.4972, -2.5931],
    region: "South West - Severn",
    type: "Tertiary",
    epr: "CareFlow / Lorenzo EPR (Brunel Building digital site)",
    parking: "Staff multi-storey parking permit scheme; M5 / M4 corridor",
    station: "Bristol Parkway (2.8 miles / 15m bus link)",
    highlights: "Major Trauma Centre, Brunel Building (Modern state-of-the-art facility), Regional Neuro, Plastics"
  },
  "Yeovil District Hospital": {
    coords: [50.9452, -2.6339],
    region: "South West - Severn",
    type: "DGH",
    epr: "Epic Electronic Patient Record (Somerset-wide)",
    parking: "Staff multi-storey permit scheme",
    station: "Yeovil Pen Mill railway station (bus link)",
    highlights: "High-performing DGH, fast-track surgical pathways, ICU and acute obstetric anaesthesia"
  },
  "Horton General Hospital, Banbury": {
    coords: [52.0537, -1.3363],
    region: "Thames Valley",
    type: "DGH",
    epr: "Oracle Cerner Millennium (integrated Oxford EPR)",
    parking: "Staff parking permit scheme",
    station: "Banbury railway station (10-15 min walk)",
    highlights: "Associate DGH base of Oxford Deanery, emergency medicine, elective general & trauma theatre"
  },
  "John Radcliffe Hospital, Oxford": {
    coords: [51.7652, -1.2191],
    region: "Thames Valley",
    type: "Tertiary",
    epr: "Cerner Millennium (Oxford University Hospitals EPR)",
    parking: "Permit scheme with strict criteria; Thornhill / Water Eaton Park & Ride recommended",
    station: "Oxford Rail Station (3.2 miles / frequent hospital express buses)",
    highlights: "Major Trauma Centre, West Wing Neurosciences, Oxford Children's Hospital, Cardiothoracics"
  },
  "Royal Berkshire Hospital, Reading": {
    coords: [51.4472, -0.9602],
    region: "Thames Valley",
    type: "DGH",
    epr: "Cerner Millennium (Electronic patient records)",
    parking: "Multi-storey on-site car park with staff permit scheme; M4 corridor",
    station: "Reading Mainline Station (1.1 miles / 18m walk or frequent bus)",
    highlights: "Large thriving DGH, Robotic Urology, Major Trauma Unit, Interventional Cardiology"
  },
  "Stoke Mandeville Hospital, Aylesbury": {
    coords: [51.7997, -0.8024],
    region: "Thames Valley",
    type: "Tertiary",
    epr: "System C CareFlow / Medway",
    parking: "Staff permit parking scheme",
    station: "Stoke Mandeville railway station (15 min walk)",
    highlights: "National Spinal Injuries Centre (NSIC), regional burns unit, acute surgery and critical care"
  },
  "Wycombe Hospital, High Wycombe": {
    coords: [51.6262, -0.7536],
    region: "Thames Valley",
    type: "DGH",
    epr: "System C CareFlow clinical workspace",
    parking: "Staff permit parking scheme",
    station: "High Wycombe railway station (10 min walk)",
    highlights: "Regional heart and stroke centre, high-volume elective day-case and inpatient surgical hub"
  },
  "Glan Clwyd Hospital, Rhyl": {
    coords: [53.2682, -3.5161],
    region: "Wales",
    type: "DGH",
    epr: "Welsh Clinical Portal (WCP) & Electronic Prescribing",
    parking: "Free staff parking across NHS Wales sites; permit registration on induction",
    station: "Rhyl Rail Station (3.8 miles / bus connection)",
    highlights: "Sub-regional acute hospital, Level 2 ICU, North Wales Cancer Centre, High case variety"
  },
  "Glangwili Hospital, Carmarthen": {
    coords: [51.8642, -4.2882],
    region: "Wales",
    type: "DGH",
    epr: "Welsh Clinical Portal (WCP)",
    parking: "Free on-site staff parking in NHS Wales",
    station: "Carmarthen Rail Station (1.8 miles / bus link)",
    highlights: "West Wales General Hospital, Rural emergency anaesthesia, Paediatrics, High autonomy"
  },
  "Grange University Hospital, Cwmbran": {
    coords: [51.647, -2.996],
    region: "Wales",
    type: "Tertiary",
    epr: "Welsh Clinical Portal (WCP) & Welsh Nursing Care Record",
    parking: "Free staff permit parking on-site",
    station: "Cwmbran railway station (bus link)",
    highlights: "State-of-the-art specialist critical care centre, major emergency surgery & paediatric resuscitation"
  },
  "Morriston Hospital, Swansea": {
    coords: [51.6702, -3.9262],
    region: "Wales",
    type: "Tertiary",
    epr: "Welsh Clinical Portal (WCP) & Welsh Nursing Record",
    parking: "Free staff parking across site; M4 Junction 45 direct slipway",
    station: "Swansea Rail Station (4.5 miles / direct hospital buses)",
    highlights: "Welsh Centre for Burns & Plastic Surgery, Cardiothoracic Centre, Major Trauma Centre, Bariatrics"
  },
  "Prince Charles Hospital, Merthyr Tydfil": {
    coords: [51.7641, -3.3849],
    region: "Wales",
    type: "DGH",
    epr: "Welsh Clinical Portal (WCP)",
    parking: "Free staff parking scheme",
    station: "Merthyr Tydfil railway station (bus connection)",
    highlights: "Acute general hospital serving south Wales valleys, critical care and emergency theatres"
  },
  "Princess of Wales Hospital, Bridgend": {
    coords: [51.5174, -3.5717],
    region: "Wales",
    type: "DGH",
    epr: "Welsh Clinical Portal (WCP)",
    parking: "Free staff permit parking on-site",
    station: "Bridgend railway station (15 min walk / bus)",
    highlights: "Acute general surgery, trauma and orthopaedics, obstetrics and intensive care unit"
  },
  "University Hospital of Wales, Cardiff": {
    coords: [51.5072, -3.1902],
    region: "Wales",
    type: "Tertiary",
    epr: "Welsh Clinical Portal (WCP) & Welsh Digital Record",
    parking: "Free NHS Wales staff permit parking; Heath Park rail station nearby",
    station: "Heath High Level / Heath Low Level Stations (0.5 miles / 10m walk)",
    highlights: "Major Trauma Centre, Children's Hospital for Wales, Neurosciences, Cardiac Surgery, Transplant"
  },
  "Ysbyty Gwynedd, Bangor": {
    coords: [53.209, -4.162],
    region: "Wales",
    type: "DGH",
    epr: "Welsh Clinical Portal (WCP)",
    parking: "Free staff permit parking on-site",
    station: "Bangor (Gwynedd) railway station (approx 2 miles via bus)",
    highlights: "Principal general hospital for north-west Wales, mountain medicine, ICU and trauma"
  },
  "Basingstoke & North Hampshire Hospital": {
    coords: [51.2721, -1.1092],
    region: "Wessex",
    type: "DGH",
    epr: "CareFlow / Lorenzo EPR",
    parking: "Spacious on-site staff car parking with permits readily granted",
    station: "Basingstoke Rail Station (2.2 miles / 10m bus connection)",
    highlights: "World centre for Pseudomyxoma Peritonei (Peritoneal Malignancy), Colorectal, Friendly DGH"
  },
  "Dorset County Hospital, Dorchester": {
    coords: [50.7132, -2.4462],
    region: "Wessex",
    type: "DGH",
    epr: "SystmOne / CareFlow EPR",
    parking: "Staff car parking permits available on induction; quiet town setting",
    station: "Dorchester South / West Stations (0.7 miles / 14m walk)",
    highlights: "Close-knit supportive DGH team, General Surgery, Acute Obstetrics, Great work-life balance"
  },
  "Poole Hospital": {
    coords: [50.7252, -1.9772],
    region: "Wessex",
    type: "DGH",
    epr: "CareFlow / Lorenzo EPR (UHD Trust)",
    parking: "Staff car parking permits available; Poole town centre access",
    station: "Poole Rail Station (0.6 miles / 12m walk)",
    highlights: "Regional Trauma & Acute Surgical Hospital for Dorset, ENT & Head & Neck, Paediatric Theatres"
  },
  "Queen Alexandra Hospital, Portsmouth": {
    coords: [50.8492, -1.0712],
    region: "Wessex",
    type: "DGH",
    epr: "Epic Systems (Portsmouth Hospitals EPR)",
    parking: "Staff multi-storey parking with permit scheme; easily accessible from M27/A3(M)",
    station: "Cosham Rail Station (0.6 miles / 10m walk)",
    highlights: "Large teaching DGH, Regional Renal Centre, Robotic Colorectal, High-volume Emergency Theatres"
  },
  "Royal Bournemouth Hospital": {
    coords: [50.7422, -1.8261],
    region: "Wessex",
    type: "DGH",
    epr: "CareFlow / Lorenzo EPR (UHD Trust)",
    parking: "On-site staff car parking with permit scheme; A338 bypass link",
    station: "Pokesdown Rail Station (1.8 miles), Christchurch (2.2 miles)",
    highlights: "Major Elective Surgical Hub, High-volume Robotic Orthopaedics, Cardiac Intervention"
  },
  "Royal Hampshire County Hospital, Winchester": {
    coords: [51.0641, -1.3321],
    region: "Wessex",
    type: "DGH",
    epr: "CareFlow / Lorenzo EPR",
    parking: "On-site staff car parking with permit system; M3 corridor",
    station: "Winchester Rail Station (0.8 miles / 15m walk)",
    highlights: "Charming historic DGH, High consultant involvement, General elective surgery & Orthopaedics"
  },
  "Salisbury District Hospital": {
    coords: [51.0471, -1.7962],
    region: "Wessex",
    type: "DGH",
    epr: "Lorenzo / CareFlow EPR",
    parking: "Extensive on-site staff parking with minimal permit delays",
    station: "Salisbury Rail Station (2.5 miles / regular hospital bus)",
    highlights: "Regional Spinal Injuries Centre, Regional Plastic Surgery & Burns Unit, Friendly DGH lists"
  },
  "Southampton General Hospital": {
    coords: [50.9341, -1.4322],
    region: "Wessex",
    type: "Tertiary",
    epr: "CareFlow EPR / CHARM clinical records",
    parking: "Multi-storey permit scheme with on-call priority; M27 / M3 access",
    station: "Southampton Central (2.5 miles / direct hospital buses every 10m)",
    highlights: "Major Trauma Centre, Wessex Neurosciences, Southampton Children's Hospital, Cardiothoracics"
  },
  "New Cross Hospital, Wolverhampton": {
    coords: [52.5972, -2.0972],
    region: "West Midlands",
    type: "DGH",
    epr: "CareFlow EPR (Royal Wolverhampton Trust)",
    parking: "Staff car parking permit scheme on site",
    station: "Wolverhampton Rail Station (1.8 miles / frequent bus link)",
    highlights: "Heart & Lung Centre (Cardiothoracic Surgery), High-risk Obstetrics, High-volume emergency lists"
  },
  "Queen Elizabeth Hospital Birmingham": {
    coords: [52.4512, -1.9402],
    region: "West Midlands",
    type: "Tertiary",
    epr: "PICS (Prescribing, Information & Communication System - custom digital EPR)",
    parking: "Permit criteria apply; University Rail Station directly connects to campus in 2m!",
    station: "University (Birmingham) Rail Station (0.2 miles / 3m walk)",
    highlights: "Major Trauma Centre, Royal Centre for Defence Medicine, Liver/Renal/Cardiac Transplant, Neuro"
  },
  "Russells Hall Hospital, Dudley": {
    coords: [52.5024, -2.1191],
    region: "West Midlands",
    type: "DGH",
    epr: "Altera Sunrise Electronic Patient Record",
    parking: "Staff permit barrier parking scheme",
    station: "Dudley Port or Cradley Heath rail links via bus",
    highlights: "Busy Black Country acute hub, emergency theatre, vascular services and critical care"
  },
  "UHCW Coventry": {
    coords: [52.4172, -1.4362],
    region: "West Midlands",
    type: "Tertiary",
    epr: "CareFlow EPR",
    parking: "Multi-storey staff permit scheme; M6 / M69 junction corridor",
    station: "Coventry Rail Station (4.2 miles / direct hospital buses)",
    highlights: "Major Trauma Centre, Cardiothoracic Surgery, Neurosurgery, Paediatric Theatres, Robotics"
  },
  "Warwick Hospital": {
    coords: [52.2852, -1.5972],
    region: "West Midlands",
    type: "DGH",
    epr: "Lorenzo / CareFlow EPR",
    parking: "Staff car parking permits available; M40 corridor",
    station: "Warwick Rail Station (0.4 miles / 8m walk)",
    highlights: "Friendly Warwickshire DGH, Elective Orthopaedic Centre, General surgery, Great team spirit"
  },
  "Airedale General Hospital, Steeton": {
    coords: [53.898, -1.9627],
    region: "Yorkshire and the Humber",
    type: "DGH",
    epr: "TPP SystmOne integrated acute electronic records",
    parking: "Dedicated staff barrier permit scheme",
    station: "Steeton & Silsden railway station (12 min walk / local bus)",
    highlights: "Friendly DGH anaesthetics, general surgery, trauma orthopaedics and obstetrics"
  },
  "Barnsley Hospital": {
    coords: [53.5582, -1.5042],
    region: "Yorkshire and the Humber",
    type: "DGH",
    epr: "SystmOne / Lorenzo EPR",
    parking: "Staff car parking permits available on site; M1 Junction 37",
    station: "Barnsley Interchange (1.2 miles / 10m bus link)",
    highlights: "Friendly DGH team, General Surgery, Emergency Theatres, High trainee morale"
  },
  "Bassetlaw Hospital, Worksop": {
    coords: [53.317, -1.1104],
    region: "Yorkshire and the Humber",
    type: "DGH",
    epr: "System C CareFlow electronic records",
    parking: "Staff on-site parking permits",
    station: "Worksop railway station (short bus/taxi link)",
    highlights: "Community DGH anaesthetic base, day surgery, elective orthopaedics and acute care"
  },
  "Bradford Royal Infirmary": {
    coords: [53.8042, -1.7962],
    region: "Yorkshire and the Humber",
    type: "DGH",
    epr: "Cerner Millennium (Electronic patient records)",
    parking: "Staff permit scheme available; A6177 corridor",
    station: "Bradford Forster Square (2.2 miles), Bradford Interchange (2.5 miles)",
    highlights: "Major Teaching DGH, Vascular Hub, High-risk Obstetrics, Paediatric Theatres, MaxFax"
  },
  "Calderdale Royal Hospital, Halifax": {
    coords: [53.705, -1.8574],
    region: "Yorkshire and the Humber",
    type: "DGH",
    epr: "Oracle Cerner Millennium EPR",
    parking: "Staff permit scheme with park & ride links",
    station: "Halifax railway station (1.5 miles via frequent bus)",
    highlights: "Centralised acute inpatient care, paediatric surgery, and emergency obstetrics"
  },
  "Diana, Princess of Wales Hospital, Grimsby": {
    coords: [53.5448, -0.0962],
    region: "Yorkshire and the Humber",
    type: "DGH",
    epr: "WebV in-house clinical portal & SystmOne",
    parking: "Staff barrier parking scheme",
    station: "Grimsby Town railway station (bus link)",
    highlights: "Acute emergency services, intensive care, general surgery, and obstetric anaesthesia"
  },
  "Doncaster Royal Infirmary": {
    coords: [53.5282, -1.1062],
    region: "Yorkshire and the Humber",
    type: "DGH",
    epr: "SystmOne / Medway EPR",
    parking: "Staff parking permits on site; A1(M) / M18 corridor",
    station: "Doncaster Rail Station (1.8 miles / 10m bus corridor)",
    highlights: "Large Acute DGH, Emergency General Surgery, Orthopaedics, Close supervision"
  },
  "Goole and District Hospital": {
    coords: [53.7166, -0.8745],
    region: "Yorkshire and the Humber",
    type: "DGH",
    epr: "WebV electronic clinical records",
    parking: "On-site surface staff parking",
    station: "Goole railway station (approx 1 mile)",
    highlights: "Protected elective surgical centre, ophthalmology, orthopaedics and day-case surgery"
  },
  "Harrogate District Hospital": {
    coords: [53.9937, -1.5176],
    region: "Yorkshire and the Humber",
    type: "DGH",
    epr: "CareFlow / SystmOne electronic records",
    parking: "Staff permit scheme",
    station: "Harrogate or Starbeck railway station (approx 15 min walk)",
    highlights: "Outstanding training feedback, general anaesthesia, elective orthopaedics, and critical care"
  },
  "Hull Royal Infirmary": {
    coords: [53.7442, -0.3582],
    region: "Yorkshire and the Humber",
    type: "Tertiary",
    epr: "Lorenzo / CareFlow EPR",
    parking: "Staff permit scheme on site; proximity to A63",
    station: "Hull Paragon Interchange (0.8 miles / 15m walk)",
    highlights: "Major Trauma Centre, Neurosciences, Vascular Surgery, Head & Neck, High-volume emergency floor"
  },
  "Leeds General Infirmary": {
    coords: [53.8012, -1.5532],
    region: "Yorkshire and the Humber",
    type: "Tertiary",
    epr: "PPM+ (Leeds Teaching Hospitals digital system)",
    parking: "Strict permit allocation; central Leeds location near universities",
    station: "Leeds City Rail Station (0.6 miles / 10m walk)",
    highlights: "Major Trauma Centre, Leeds Children's Hospital, Cardiothoracic Surgery, Neurosciences, PICU"
  },
  "Northern General Hospital, Sheffield": {
    coords: [53.4152, -1.4582],
    region: "Yorkshire and the Humber",
    type: "Tertiary",
    epr: "Lorenzo / CareFlow (Sheffield Teaching Hospitals)",
    parking: "Campus staff permit scheme; easily accessible from M1 Junction 36",
    station: "Sheffield Rail Station (3.2 miles / direct hospital express buses)",
    highlights: "Major Trauma Centre, Cardiothoracic Centre, Regional Spinal Injuries, Burns & Plastics"
  },
  "Pinderfields Hospital, Wakefield": {
    coords: [53.6932, -1.4842],
    region: "Yorkshire and the Humber",
    type: "DGH",
    epr: "System C / Medway EPR",
    parking: "Staff permit parking scheme on site; M1 / M62 corridor",
    station: "Wakefield Westgate (1.5 miles / frequent bus link)",
    highlights: "Regional Burns Centre, Regional Spinal Cord Injuries Centre, Trauma Unit, Modern PFI site"
  },
  "Rotherham Hospital": {
    coords: [53.4182, -1.3482],
    region: "Yorkshire and the Humber",
    type: "DGH",
    epr: "Meditech EPR",
    parking: "Staff permit scheme on site; M1 Junction 33 proximity",
    station: "Rotherham Central (2.0 miles / bus link)",
    highlights: "Community DGH feel, High-throughput elective theatres, General surgery, Paediatrics"
  },
  "Scarborough Hospital": {
    coords: [54.2792, -0.4282],
    region: "Yorkshire and the Humber",
    type: "DGH",
    epr: "CareFlow EPR",
    parking: "Staff car parking permits readily available",
    station: "Scarborough Rail Station (1.6 miles / bus link)",
    highlights: "Coastal DGH, High clinical autonomy, Supportive consultant team, Great seaside lifestyle"
  },
  "Scunthorpe General Hospital": {
    coords: [53.5902, -0.6692],
    region: "Yorkshire and the Humber",
    type: "DGH",
    epr: "SystmOne / WebV EPR",
    parking: "Staff parking permits available on induction; low congestion",
    station: "Scunthorpe Rail Station (0.7 miles / 12m walk)",
    highlights: "Supportive DGH, General & Trauma surgery, Independent list experience"
  },
  "York Hospital": {
    coords: [53.9702, -1.0832],
    region: "Yorkshire and the Humber",
    type: "DGH",
    epr: "CareFlow EPR",
    parking: "Staff permit parking scheme; Rawcliffe Bar Park & Ride link",
    station: "York Rail Station (1.3 miles / 20m walk or quick bus)",
    highlights: "Teaching DGH, Head & Neck surgery, Orthopaedics, Excellent living location in historic York"
  }
};

const ROTATIONS_DATA = [
  // ==================== SOUTH WEST - SEVERN ====================
  {
    id: "ct1-severn-north-bristol-1e",
    code: "South West - Severn - North Bristol - CT1 - Feb - 1E",
    region: "South West - Severn",
    title: "North Bristol (2 yrs) & Swindon (1 yr)",
    places: "1",
    hubs: {
      driver: { name: "North Bristol / Almondsbury (M4/M5)", coords: [51.545, -2.575], desc: "M4 junction 16/19. 15m to Southmead; 42m to Swindon via M4.", alert: "Convenient M4 access for the final Swindon year." },
      transit: { name: "Bristol Parkway", coords: [51.513, -2.542], desc: "Fast direct trains to Swindon (23m); frequent local buses to Southmead.", alert: "Bristol Parkway provides direct high-speed rail to Swindon." }
    },
    stages: [
      { stage: "CT1 - CT2 (24m)", hosp: "Southmead Hospital (NBT)", desc: "North Bristol Trust acute anaesthesia base" },
      { stage: "CT3 (12m)", hosp: "Great Western Hospital, Swindon", desc: "Swindon acute placement" },
    ]
  },
  {
    id: "ct1-severn-bristol-2",
    code: "South West - Severn - Bristol - CT1 - Feb - 2",
    region: "South West - Severn",
    title: "Bristol BRI (CT1), Swindon (CT2) & Bristol (CT3)",
    places: "1",
    hubs: {
      driver: { name: "Bristol / Keynsham", coords: [51.413, -2.497], desc: "Central Bristol access via A4; M4 corridor access to Swindon.", alert: "Swindon year requires 45m drive via M4." },
      transit: { name: "Bristol Temple Meads", coords: [51.449, -2.581], desc: "Walk/bus to BRI; direct fast trains to Swindon (35m).", alert: "Trains run frequently between Bristol and Swindon." }
    },
    stages: [
      { stage: "CT1 (12m)", hosp: "Bristol Royal Infirmary (UHBW)", desc: "Central Bristol teaching base" },
      { stage: "CT2 (12m)", hosp: "Great Western Hospital, Swindon", desc: "Swindon acute placement" },
      { stage: "CT3 (12m)", hosp: "Bristol Royal Infirmary (UHBW)", desc: "Central Bristol teaching base" },
    ]
  },
  {
    id: "ct1-severn-cheltenham-gloucester-3",
    code: "South West - Severn - Cheltenham/Gloucester - CT1 - Feb - 3",
    region: "South West - Severn",
    title: "Gloucester (2 yrs) & Bristol BRI (1 yr)",
    places: "1",
    hubs: {
      driver: { name: "Stonehouse / Stroud (M5 J13)", coords: [51.748, -2.282], desc: "M5 corridor midway between Gloucester (18m) and Bristol (32m).", alert: "Ideal equidistant location on the M5 corridor." },
      transit: { name: "Gloucester / Cheltenham Spa", coords: [51.865, -2.238], desc: "Direct rail to Bristol Temple Meads (40m) and central Gloucester.", alert: "Direct trains on CrossCountry/GWR line." }
    },
    stages: [
      { stage: "CT1 - CT2 (24m)", hosp: "Gloucestershire Royal Hospital", desc: "Gloucestershire acute base" },
      { stage: "CT3 (12m)", hosp: "Bristol Royal Infirmary (UHBW)", desc: "Central Bristol UHBW placement" },
    ]
  },
  {
    id: "ct1-severn-swindon-2e",
    code: "South West - Severn - Swindon - CT1 - Feb - 2E",
    region: "South West - Severn",
    title: "Swindon (2 yrs) & North Bristol (1 yr)",
    places: "1",
    hubs: {
      driver: { name: "Swindon / Chippenham (M4 J16/17)", coords: [51.515, -1.912], desc: "M4 corridor. 15m to Great Western Hospital; 35m to Southmead.", alert: "Chippenham/Swindon gives easy access to both sites." },
      transit: { name: "Swindon Station", coords: [51.564, -1.785], desc: "High-speed rail to Bristol Parkway (23m); local buses to GWH.", alert: "Local buses connect Swindon station to Great Western Hospital." }
    },
    stages: [
      { stage: "CT1 - CT2 (24m)", hosp: "Great Western Hospital, Swindon", desc: "Swindon acute base" },
      { stage: "CT3 (12m)", hosp: "Southmead Hospital (NBT)", desc: "North Bristol Trust base" },
    ]
  },
  {
    id: "ct1-severn-yeovil-6",
    code: "South West - Severn - Yeovil - CT1 - Feb - 6",
    region: "South West - Severn",
    title: "Taunton (Musgrove Park) & Yeovil Rotation",
    places: "1",
    hubs: {
      driver: { name: "Somerton / Ilminster", coords: [51.053, -2.735], desc: "A303 / A358 corridor midway between Taunton (25m) and Yeovil (22m).", alert: "Rural commute along A358 and A372." },
      transit: { name: "Taunton Station", coords: [51.023, -3.103], desc: "Mainline rail to Taunton; bus services connect to Yeovil.", alert: "Public transport between Taunton and Yeovil can be limited for early shifts; car recommended." }
    },
    stages: [
      { stage: "CT1 (12m)", hosp: "Musgrove Park Hospital, Taunton", desc: "Musgrove Park Hospital Taunton (first 12 months)" },
      { stage: "CT2 - CT3 (24m)", hosp: "Yeovil District Hospital", desc: "Working between Yeovil District Hospital & Musgrove Park" },
      { stage: "CT2 - CT3 (24m)", hosp: "Musgrove Park Hospital, Taunton", desc: "Musgrove Park shared placement" },
    ]
  },
  // ==================== SOUTH WEST - PENINSULA ====================
  {
    id: "ct1-peninsula-north-devon-2",
    code: "South West - Peninsula - North Devon - CT1 - Feb - 2",
    region: "South West - Peninsula",
    title: "North Devon (Barnstaple) CT1-CT2 Post",
    places: "1",
    hubs: {
      driver: { name: "Barnstaple / Bideford", coords: [51.082, -4.062], desc: "5-10m drive to North Devon District Hospital.", alert: "Picturesque coastal location; driving recommended due to rural transit links." },
      transit: { name: "Barnstaple Station", coords: [51.074, -4.063], desc: "Tarka Line trains to Exeter; local buses connect to hospital.", alert: "Bus connection needed from Barnstaple rail station." }
    },
    stages: [
      { stage: "CT1 - CT2 (24m)", hosp: "North Devon District Hospital, Barnstaple", desc: "North Devon acute placement (CT3 year agreed with TPD)" },
    ]
  },
  {
    id: "ct1-peninsula-cornwall-4",
    code: "South West - Peninsula - Cornwall - CT1 - Feb - 4",
    region: "South West - Peninsula",
    title: "Cornwall (Royal Cornwall, Truro) 3-Year Post",
    places: "1",
    hubs: {
      driver: { name: "Truro / Falmouth", coords: [50.235, -5.075], desc: "A39 corridor. 8m from Truro centre; 20m from Falmouth.", alert: "Main hospital located at Treliske, west of Truro." },
      transit: { name: "Truro Station", coords: [50.264, -5.064], desc: "Direct buses and Park & Ride services from Truro station to Treliske.", alert: "Frequent bus services run between station and hospital." }
    },
    stages: [
      { stage: "CT1 - CT3 (36m)", hosp: "Royal Cornwall Hospital, Truro", desc: "Treliske site for full 3-year programme" },
    ]
  },
  {
    id: "ct1-peninsula-plymouth-3",
    code: "South West - Peninsula - Plymouth - CT1 - Feb - 3",
    region: "South West - Peninsula",
    title: "Plymouth (Derriford) 3-Year Post (Post 3)",
    places: "1",
    hubs: {
      driver: { name: "Plymouth North / Crownhill", coords: [50.41, -4.135], desc: "5m drive to Derriford Hospital.", alert: "Tavistock Road / A386 corridor can have morning congestion." },
      transit: { name: "Plymouth Station / City Centre", coords: [50.378, -4.143], desc: "Frequent bus routes (42, 50, 51) run direct to Derriford Hospital.", alert: "Dedicated hospital bus interchange at main entrance." }
    },
    stages: [
      { stage: "CT1 - CT3 (36m)", hosp: "Derriford Hospital, Plymouth", desc: "Derriford Major Trauma Centre for full 3-year programme" },
    ]
  },
  {
    id: "ct1-peninsula-plymouth-1e",
    code: "South West - Peninsula - Plymouth - CT1 - Feb - 1E",
    region: "South West - Peninsula",
    title: "Plymouth (Derriford) 3-Year Post (Post 1E)",
    places: "1",
    hubs: {
      driver: { name: "Plymouth North / Crownhill", coords: [50.41, -4.135], desc: "5m drive to Derriford Hospital.", alert: "Tavistock Road / A386 corridor can have morning congestion." },
      transit: { name: "Plymouth Station / City Centre", coords: [50.378, -4.143], desc: "Frequent bus routes (42, 50, 51) run direct to Derriford Hospital.", alert: "Dedicated hospital bus interchange at main entrance." }
    },
    stages: [
      { stage: "CT1 - CT3 (36m)", hosp: "Derriford Hospital, Plymouth", desc: "Derriford Major Trauma Centre for full 3-year programme" },
    ]
  },
  // ==================== WALES ====================
  {
    id: "ct1-wales-south-7",
    code: "Wales - South - CT1 - Feb - 7",
    region: "Wales",
    title: "Cardiff (UHW 24m) & Bridgend (12m)",
    places: "1",
    hubs: {
      driver: { name: "Cardiff West / Cowbridge", coords: [51.485, -3.355], desc: "M4 J33/J34 corridor. 18m to UHW Cardiff; 16m to Princess of Wales Bridgend.", alert: "M4 corridor makes commuting easy between Cardiff and Bridgend." },
      transit: { name: "Cardiff Central / Bridgend Station", coords: [51.475, -3.178], desc: "Direct fast trains between Cardiff Central and Bridgend (20m).", alert: "UHW requires bus from Cardiff Central; Bridgend station has local buses to hospital." }
    },
    stages: [
      { stage: "CT1 - CT2 (24m)", hosp: "University Hospital of Wales, Cardiff", desc: "Tertiary Major Trauma Centre & teaching base" },
      { stage: "CT3 (12m)", hosp: "Princess of Wales Hospital, Bridgend", desc: "District general acute base" },
    ]
  },
  {
    id: "ct1-wales-south-4",
    code: "Wales - South - CT1 - Feb - 4",
    region: "Wales",
    title: "Bridgend (24m) & Cwmbran (Grange 12m)",
    places: "1",
    hubs: {
      driver: { name: "Cardiff North / M4 J30-32", coords: [51.528, -3.215], desc: "Equidistant on M4 corridor. 25m west to Bridgend; 22m northeast to Grange Cwmbran.", alert: "Cardiff North provides central positioning along the M4." },
      transit: { name: "Newport / Cardiff Central", coords: [51.588, -2.998], desc: "Rail connections along South Wales mainline.", alert: "Grange Hospital is rural off Cwmbran; car recommended for early shifts." }
    },
    stages: [
      { stage: "CT1 - CT2 (24m)", hosp: "Princess of Wales Hospital, Bridgend", desc: "District general acute base" },
      { stage: "CT3 (12m)", hosp: "Grange University Hospital, Cwmbran", desc: "Specialist Critical Care Centre" },
    ]
  },
  {
    id: "ct1-wales-south-2",
    code: "Wales - South - CT1 - Feb - 2",
    region: "Wales",
    title: "Cwmbran (Grange 24m) & Merthyr Tydfil (12m)",
    places: "1",
    hubs: {
      driver: { name: "Pontypool / Abergavenny / A465", coords: [51.725, -3.055], desc: "A465 Heads of the Valleys corridor. 20m south to Grange; 25m west to Merthyr.", alert: "New A465 dual carriageway provides fast links between valleys." },
      transit: { name: "Cwmbran / Abergavenny", coords: [51.655, -3.018], desc: "Welsh Marches line rail links.", alert: "Valley terrain makes public transit between these two sites slow; car strongly recommended." }
    },
    stages: [
      { stage: "CT1 - CT2 (24m)", hosp: "Grange University Hospital, Cwmbran", desc: "Specialist Critical Care Centre" },
      { stage: "CT3 (12m)", hosp: "Prince Charles Hospital, Merthyr Tydfil", desc: "Acute general placement" },
    ]
  },
  {
    id: "ct1-wales-south-3",
    code: "Wales - South - CT1 - Feb - 3",
    region: "Wales",
    title: "Cwmbran (Grange 12m) & Merthyr Tydfil (24m)",
    places: "1",
    hubs: {
      driver: { name: "Pontypool / Abergavenny / A465", coords: [51.725, -3.055], desc: "A465 Heads of the Valleys corridor. 20m south to Grange; 25m west to Merthyr.", alert: "New A465 dual carriageway provides fast links between valleys." },
      transit: { name: "Cwmbran / Abergavenny", coords: [51.655, -3.018], desc: "Welsh Marches line rail links.", alert: "Valley terrain makes public transit between these two sites slow; car strongly recommended." }
    },
    stages: [
      { stage: "CT1 (12m)", hosp: "Grange University Hospital, Cwmbran", desc: "Specialist Critical Care Centre" },
      { stage: "CT2 - CT3 (24m)", hosp: "Prince Charles Hospital, Merthyr Tydfil", desc: "Acute general placement" },
    ]
  },
  {
    id: "ct1-wales-south-5",
    code: "Wales - South - CT1 - Feb - 5",
    region: "Wales",
    title: "Carmarthen (Glangwili 24m) & Swansea (Morriston 12m)",
    places: "1",
    hubs: {
      driver: { name: "Cross Hands / Llanelli (M4 J49)", coords: [51.785, -4.085], desc: "M4 terminus / A48 corridor. 18m west to Glangwili; 16m east to Morriston.", alert: "Cross Hands is the strategic midway base between Carmarthen and Swansea." },
      transit: { name: "Carmarthen / Swansea Station", coords: [51.621, -3.942], desc: "Direct rail between Swansea and Carmarthen (45m).", alert: "Local buses link stations to hospitals; Morriston is close to M4 J46." }
    },
    stages: [
      { stage: "CT1 - CT2 (24m)", hosp: "Glangwili Hospital, Carmarthen", desc: "West Wales general acute base" },
      { stage: "CT3 (12m)", hosp: "Morriston Hospital, Swansea", desc: "Major Trauma & Regional Burns/Plastics" },
    ]
  },
  {
    id: "ct1-wales-south-6",
    code: "Wales - South - CT1 - Feb - 6",
    region: "Wales",
    title: "Carmarthen (Glangwili 24m) & Swansea (Morriston 12m) (Post 6)",
    places: "1",
    hubs: {
      driver: { name: "Cross Hands / Llanelli (M4 J49)", coords: [51.785, -4.085], desc: "M4 terminus / A48 corridor. 18m west to Glangwili; 16m east to Morriston.", alert: "Cross Hands is the strategic midway base between Carmarthen and Swansea." },
      transit: { name: "Carmarthen / Swansea Station", coords: [51.621, -3.942], desc: "Direct rail between Swansea and Carmarthen (45m).", alert: "Local buses link stations to hospitals; Morriston is close to M4 J46." }
    },
    stages: [
      { stage: "CT1 - CT2 (24m)", hosp: "Glangwili Hospital, Carmarthen", desc: "West Wales general acute base" },
      { stage: "CT3 (12m)", hosp: "Morriston Hospital, Swansea", desc: "Major Trauma & Regional Burns/Plastics" },
    ]
  },
  {
    id: "ct1-wales-north-1",
    code: "Wales - North - CT1 - Feb - 1",
    region: "Wales",
    title: "North Wales: Bangor (12m) & Rhyl (Glan Clwyd 24m)",
    places: "1",
    hubs: {
      driver: { name: "Conwy / Llandudno Junction (A55)", coords: [53.282, -3.815], desc: "A55 North Wales Expressway midway. 20m west to Bangor; 20m east to Glan Clwyd.", alert: "A55 expressway gives straightforward direct drives to both North Wales sites." },
      transit: { name: "Llandudno Junction", coords: [53.284, -3.811], desc: "Major North Wales railway junction on North Wales Coast Line.", alert: "Direct trains to Bangor (18m) and Rhyl (15m)." }
    },
    stages: [
      { stage: "CT1 (12m)", hosp: "Ysbyty Gwynedd, Bangor", desc: "North West Wales acute base" },
      { stage: "CT2 - CT3 (24m)", hosp: "Glan Clwyd Hospital, Rhyl", desc: "Sub-regional trauma & specialist acute base" },
    ]
  },
  // ==================== THAMES VALLEY ====================
  {
    id: "ct1-thames-valley-oxford-ouh-1",
    code: "Thames Valley Oxford - Oxford University Hospitals NHS Trust - CT1 - Feb - 1",
    region: "Thames Valley",
    title: "Oxford University Hospitals (JR / Horton) CT1 Post",
    places: "1",
    hubs: {
      driver: { name: "North Oxford / Kidlington (A34 / A4260)", coords: [51.825, -1.285], desc: "15m south to John Radcliffe; 22m north to Horton Banbury.", alert: "Strategic location linking both potential Oxford trust hospital sites." },
      transit: { name: "Oxford Parkway", coords: [51.802, -1.275], desc: "Chiltern Railways line to Banbury (18m); bus 700 direct to JR Hospital.", alert: "Bus 700 connects Oxford Parkway directly to the John Radcliffe." }
    },
    stages: [
      { stage: "CT1 (12m)", hosp: "John Radcliffe Hospital, Oxford", desc: "Tertiary teaching & trauma base (or Horton General)" },
      { stage: "CT1 (12m)", hosp: "Horton General Hospital, Banbury", desc: "District general placement alternative" },
    ]
  },
  {
    id: "ct1-thames-valley-oxford-ouh-1e",
    code: "Thames Valley Oxford - Oxford University Hospitals NHS Trust - CT1 - Feb - 1E",
    region: "Thames Valley",
    title: "Oxford (John Radcliffe) 4-Place Track",
    places: "4",
    hubs: {
      driver: { name: "Headington / Marston", coords: [51.765, -1.215], desc: "Immediate proximity to John Radcliffe campus.", alert: "Hospital parking is restricted; cycling or Park & Ride widely used." },
      transit: { name: "Oxford City Centre / Thornhill P&R", coords: [51.755, -1.185], desc: "Frequent hospital buses (700, 8, 9, 280) serve the Headington hospitals.", alert: "Thornhill Park & Ride provides fast dedicated buses to JR." }
    },
    stages: [
      { stage: "CT1 (12m)", hosp: "John Radcliffe Hospital, Oxford", desc: "Oxford University Hospitals NHS Trust base (Years 2 & 3 TBC)" },
    ]
  },
  {
    id: "ct1-thames-valley-royal-berkshire-3",
    code: "Thames Valley Oxford - Royal Berkshire NHS Foundation Trust - CT1 - Feb - 3",
    region: "Thames Valley",
    title: "Reading (Royal Berkshire) CT1 Post",
    places: "1",
    hubs: {
      driver: { name: "Reading Central / Earley", coords: [51.445, -0.955], desc: "5-10m drive to Royal Berkshire Hospital; easy access from M4 J10/J11.", alert: "Town centre hospital with staff permit parking." },
      transit: { name: "Reading Station", coords: [51.458, -0.972], desc: "Major Great Western / Elizabeth Line interchange; 15m walk or bus to RBH.", alert: "Frequent buses (3, 9, 17) run between station and hospital." }
    },
    stages: [
      { stage: "CT1 (12m)", hosp: "Royal Berkshire Hospital, Reading", desc: "Royal Berkshire NHS Foundation Trust base (Years 2 & 3 TBC)" },
    ]
  },
  {
    id: "ct1-thames-valley-buckinghamshire-2",
    code: "Thames Valley Oxford - Buckinghamshire Healthcare NHS Trust - CT1 - Feb - 2",
    region: "Thames Valley",
    title: "Bucks: Stoke Mandeville & Wycombe (4 Places)",
    places: "4",
    hubs: {
      driver: { name: "Princes Risborough / Great Missenden", coords: [51.725, -0.825], desc: "A4010 corridor. 15m north to Stoke Mandeville; 18m south to Wycombe.", alert: "A4010 links Aylesbury and High Wycombe directly across the Chilterns." },
      transit: { name: "Aylesbury / High Wycombe", coords: [51.815, -0.815], desc: "Chiltern Railways and Arriva 300 bus connects Aylesbury and High Wycombe.", alert: "Arriva 300 bus connects Stoke Mandeville and Wycombe hospital sites." }
    },
    stages: [
      { stage: "CT1 (12m)", hosp: "Stoke Mandeville Hospital, Aylesbury", desc: "Bucks Healthcare NHS Trust base (National Spinal & Acute)" },
      { stage: "CT1 (12m)", hosp: "Wycombe Hospital, High Wycombe", desc: "Elective surgical & outpatient base" },
    ]
  },
  // ==================== YORKSHIRE AND THE HUMBER ====================
  {
    id: "ct1-yorkshire-south-2e",
    code: "Yorkshire and the Humber - South - CT1 - Feb - 2E",
    region: "Yorkshire and the Humber",
    title: "South Yorkshire 6-Monthly Rotations (2E)",
    places: "2",
    isPool: true,
    hubs: {
      driver: { name: "Sheffield North / Meadowhall (M1 J34)", coords: [53.415, -1.415], desc: "M1 corridor. 12m to Northern General, 15m to Rotherham, 25m to Barnsley.", alert: "Strategic location linking Sheffield and Rotherham hospitals." },
      transit: { name: "Meadowhall Interchange", coords: [53.417, -1.412], desc: "Supertram into central Sheffield; direct trains to Rotherham, Barnsley, Doncaster.", alert: "Excellent multi-modal transport hub for South Yorkshire." }
    },
    stages: [
      { stage: "CT1 - CT3", hosp: "Northern General Hospital, Sheffield", desc: "Major Trauma Centre & Sheffield Teaching Hospitals" },
      { stage: "CT1 - CT3", hosp: "Rotherham Hospital", desc: "District general acute placement" },
      { stage: "CT1 - CT3", hosp: "Doncaster Royal Infirmary", desc: "Acute Doncaster base" },
      { stage: "CT1 - CT3", hosp: "Barnsley Hospital", desc: "Acute Barnsley base" },
    ]
  },
  {
    id: "ct1-yorkshire-south-3",
    code: "Yorkshire and the Humber - South - CT1 - Feb - 3",
    region: "Yorkshire and the Humber",
    title: "South Yorkshire Network (Barnsley, Doncaster, Sheffield, Rotherham)",
    places: "4",
    isPool: true,
    hubs: {
      driver: { name: "Rotherham / M1 J33/J34", coords: [53.432, -1.355], desc: "Equidistant across South Yorkshire footprint via M1 and M18.", alert: "M18 provides rapid transit east to Doncaster." },
      transit: { name: "Sheffield / Meadowhall", coords: [53.378, -1.462], desc: "Central rail connections across the South Yorkshire region.", alert: "Rail lines run directly from Sheffield to Barnsley and Doncaster." }
    },
    stages: [
      { stage: "CT1 - CT3", hosp: "Northern General Hospital, Sheffield", desc: "Sheffield base" },
      { stage: "CT1 - CT3", hosp: "Doncaster Royal Infirmary", desc: "Doncaster base" },
      { stage: "CT1 - CT3", hosp: "Barnsley Hospital", desc: "Barnsley base" },
      { stage: "CT1 - CT3", hosp: "Rotherham Hospital", desc: "Rotherham base" },
      { stage: "CT1 - CT3", hosp: "Bassetlaw Hospital, Worksop", desc: "Worksop placement" },
    ]
  },
  {
    id: "ct1-yorkshire-west-4",
    code: "Yorkshire and the Humber - West - CT1 - Feb - 4",
    region: "Yorkshire and the Humber",
    title: "West Yorkshire Core Network (Leeds, Bradford, Airedale, Calderdale)",
    places: "4",
    isPool: true,
    hubs: {
      driver: { name: "Leeds West / Pudsey (Ring Road / M621)", coords: [53.795, -1.665], desc: "Strategic nexus between Leeds (15m), Bradford (15m), and M62 towards Calderdale/Wakefield.", alert: "Pudsey/Bramley gives balanced access east and west." },
      transit: { name: "Leeds Central", coords: [53.795, -1.547], desc: "Dense commuter rail network: 18m to Bradford, 15m to Wakefield, 25m to Halifax.", alert: "Fast local trains connect West Yorkshire towns efficiently." }
    },
    stages: [
      { stage: "CT1 - CT3", hosp: "Leeds General Infirmary", desc: "Leeds Teaching Hospitals base" },
      { stage: "CT1 - CT3", hosp: "Bradford Royal Infirmary", desc: "Bradford acute base" },
      { stage: "CT1 - CT3", hosp: "Pinderfields Hospital, Wakefield", desc: "Mid Yorkshire Trust base" },
      { stage: "CT1 - CT3", hosp: "Calderdale Royal Hospital, Halifax", desc: "Calderdale & Huddersfield Trust" },
      { stage: "CT1 - CT3", hosp: "Airedale General Hospital, Steeton", desc: "Airedale acute base" },
      { stage: "CT1 - CT3", hosp: "Harrogate District Hospital", desc: "Harrogate general base" },
    ]
  },
  {
    id: "ct1-yorkshire-west-1e",
    code: "Yorkshire and the Humber - West - CT1 - Feb - 1E",
    region: "Yorkshire and the Humber",
    title: "West Yorkshire 6-Monthly Rotations (1E)",
    places: "1",
    isPool: true,
    hubs: {
      driver: { name: "Leeds West / Pudsey (Ring Road / M621)", coords: [53.795, -1.665], desc: "Strategic nexus between Leeds (15m), Bradford (15m), and M62 towards Calderdale/Wakefield.", alert: "Pudsey/Bramley gives balanced access east and west." },
      transit: { name: "Leeds Central", coords: [53.795, -1.547], desc: "Dense commuter rail network: 18m to Bradford, 15m to Wakefield, 25m to Halifax.", alert: "Fast local trains connect West Yorkshire towns efficiently." }
    },
    stages: [
      { stage: "CT1 - CT3", hosp: "Leeds General Infirmary", desc: "Leeds Teaching Hospitals base" },
      { stage: "CT1 - CT3", hosp: "Bradford Royal Infirmary", desc: "Bradford acute base" },
      { stage: "CT1 - CT3", hosp: "Pinderfields Hospital, Wakefield", desc: "Mid Yorkshire Trust base" },
      { stage: "CT1 - CT3", hosp: "Calderdale Royal Hospital, Halifax", desc: "Calderdale & Huddersfield Trust" },
      { stage: "CT1 - CT3", hosp: "Airedale General Hospital, Steeton", desc: "Airedale acute base" },
      { stage: "CT1 - CT3", hosp: "Harrogate District Hospital", desc: "Harrogate general base" },
    ]
  },
  {
    id: "ct1-yorkshire-north-1",
    code: "Yorkshire and the Humber - North - CT1 - Feb - 1",
    region: "Yorkshire and the Humber",
    title: "North Yorkshire: York, Scarborough & Harrogate",
    places: "2",
    isPool: true,
    hubs: {
      driver: { name: "York Ring Road / Malton (A64)", coords: [53.995, -1.055], desc: "A64 corridor. 10m into York Hospital; 45m to Scarborough; 35m west to Harrogate via A59.", alert: "Scarborough is on the East Coast (~40 mi from York via A64)." },
      transit: { name: "York Station", coords: [53.958, -1.093], desc: "Direct trains to Harrogate (30m) and Scarborough (48m).", alert: "York station is a major hub with direct lines to both Harrogate and Scarborough." }
    },
    stages: [
      { stage: "CT1 - CT3", hosp: "York Hospital", desc: "York Teaching Hospital base" },
      { stage: "CT1 - CT3", hosp: "Harrogate District Hospital", desc: "Harrogate District acute base" },
      { stage: "CT1 - CT3", hosp: "Scarborough Hospital", desc: "East Coast general base" },
    ]
  },
  {
    id: "ct1-yorkshire-east-2",
    code: "Yorkshire and the Humber - East - CT1 - Feb - 2",
    region: "Yorkshire and the Humber",
    title: "East Yorkshire & Humber: Hull, Scunthorpe & Grimsby",
    places: "2",
    isPool: true,
    hubs: {
      driver: { name: "Hessle / Humber Bridge (A15)", coords: [53.715, -0.445], desc: "Immediate access to Humber Bridge. 12m to Hull Royal; 25m south to Scunthorpe; 35m to Grimsby.", alert: "Humber Bridge connects north and south banks seamlessly (£1.50 toll)." },
      transit: { name: "Hull Paragon Interchange", coords: [53.744, -0.344], desc: "Rail connections across Humberside.", alert: "Cross-Humber public transit is limited; car strongly recommended." }
    },
    stages: [
      { stage: "CT1 - CT3", hosp: "Hull Royal Infirmary", desc: "Tertiary Major Trauma Centre" },
      { stage: "CT1 - CT3", hosp: "Scunthorpe General Hospital", desc: "Northern Lincolnshire acute base" },
      { stage: "CT1 - CT3", hosp: "Diana, Princess of Wales Hospital, Grimsby", desc: "Grimsby acute general base" },
      { stage: "CT1 - CT3", hosp: "Goole and District Hospital", desc: "Goole elective base" },
    ]
  },
  {
    id: "ct1-yorkshire-east-5e",
    code: "Yorkshire and the Humber - East - CT1 - Feb - 5E",
    region: "Yorkshire and the Humber",
    title: "East Yorkshire 6-Monthly Rotations (5E)",
    places: "1",
    isPool: true,
    hubs: {
      driver: { name: "Hessle / Humber Bridge (A15)", coords: [53.715, -0.445], desc: "Immediate access to Humber Bridge. 12m to Hull Royal; 25m south to Scunthorpe; 35m to Grimsby.", alert: "Humber Bridge connects north and south banks seamlessly (£1.50 toll)." },
      transit: { name: "Hull Paragon Interchange", coords: [53.744, -0.344], desc: "Rail connections across Humberside.", alert: "Cross-Humber public transit is limited; car strongly recommended." }
    },
    stages: [
      { stage: "CT1 - CT3", hosp: "Hull Royal Infirmary", desc: "Tertiary Major Trauma Centre" },
      { stage: "CT1 - CT3", hosp: "Scunthorpe General Hospital", desc: "Northern Lincolnshire acute base" },
      { stage: "CT1 - CT3", hosp: "Diana, Princess of Wales Hospital, Grimsby", desc: "Grimsby acute general base" },
      { stage: "CT1 - CT3", hosp: "Goole and District Hospital", desc: "Goole elective base" },
    ]
  },
  // ==================== WESSEX ====================
  {
    id: "ct1-wessex-1",
    code: "Wessex - CT1 - Feb - 1",
    region: "Wessex",
    title: "Wessex Core Anaesthetics Scheme (8 Places)",
    places: "8",
    isPool: true,
    hubs: {
      driver: { name: "Winchester / Eastleigh (M3/M27)", coords: [51.025, -1.335], desc: "Central Wessex hub. 18m to Southampton, 28m to Portsmouth, 22m to Basingstoke.", alert: "Premier driving base for the Wessex training network." },
      transit: { name: "Eastleigh / Southampton Central", coords: [50.968, -1.353], desc: "Direct rail to Winchester (12m), Basingstoke (22m), and Portsmouth (40m).", alert: "Frequent train services along the South Coast rail line." }
    },
    stages: [
      { stage: "CT1 - CT3", hosp: "Southampton General Hospital", desc: "Regional MTC & Specialist Cardiac/Neuro Centre" },
      { stage: "CT1 - CT3", hosp: "Queen Alexandra Hospital, Portsmouth", desc: "Major Acute & Vascular Centre" },
      { stage: "CT1 - CT3", hosp: "Royal Hampshire County Hospital, Winchester", desc: "Elective Orthopaedics & General" },
      { stage: "CT1 - CT3", hosp: "Basingstoke & North Hampshire Hospital", desc: "DGH Anaesthesia & Critical Care" },
      { stage: "CT1 - CT3", hosp: "Poole Hospital", desc: "Acute District General Placement" },
      { stage: "CT1 - CT3", hosp: "Royal Bournemouth Hospital", desc: "Major Elective Centre" },
      { stage: "CT1 - CT3", hosp: "Salisbury District Hospital", desc: "Regional Burns & Plastics" },
      { stage: "CT1 - CT3", hosp: "Dorset County Hospital, Dorchester", desc: "DGH Anaesthesia" },
    ]
  },
  {
    id: "ct1-wessex-1e",
    code: "Wessex - CT1 - Feb - 1E",
    region: "Wessex",
    title: "Wessex Core Anaesthetics Scheme (1E)",
    places: "1",
    isPool: true,
    hubs: {
      driver: { name: "Winchester / Eastleigh (M3/M27)", coords: [51.025, -1.335], desc: "Central Wessex hub. 18m to Southampton, 28m to Portsmouth, 22m to Basingstoke.", alert: "Premier driving base for the Wessex training network." },
      transit: { name: "Eastleigh / Southampton Central", coords: [50.968, -1.353], desc: "Direct rail to Winchester (12m), Basingstoke (22m), and Portsmouth (40m).", alert: "Frequent train services along the South Coast rail line." }
    },
    stages: [
      { stage: "CT1 - CT3", hosp: "Southampton General Hospital", desc: "Regional MTC & Specialist Cardiac/Neuro Centre" },
      { stage: "CT1 - CT3", hosp: "Queen Alexandra Hospital, Portsmouth", desc: "Major Acute & Vascular Centre" },
      { stage: "CT1 - CT3", hosp: "Royal Hampshire County Hospital, Winchester", desc: "Elective Orthopaedics & General" },
      { stage: "CT1 - CT3", hosp: "Basingstoke & North Hampshire Hospital", desc: "DGH Anaesthesia & Critical Care" },
      { stage: "CT1 - CT3", hosp: "Poole Hospital", desc: "Acute District General Placement" },
      { stage: "CT1 - CT3", hosp: "Royal Bournemouth Hospital", desc: "Major Elective Centre" },
      { stage: "CT1 - CT3", hosp: "Salisbury District Hospital", desc: "Regional Burns & Plastics" },
      { stage: "CT1 - CT3", hosp: "Dorset County Hospital, Dorchester", desc: "DGH Anaesthesia" },
    ]
  },
  // ==================== LONDON ====================
  {
    id: "ct1-london-north-west-lr4",
    code: "North London - North West London - CT1 - Feb - LR4",
    region: "London",
    title: "NW London: West Middlesex, Hammersmith & Chelsea",
    places: "1",
    hubs: {
      driver: { name: "Chiswick / Acton", coords: [51.492, -0.272], desc: "A4 / M4 / A40 corridor. 15m to West Mid, 12m to Hammersmith, 20m to Chelsea.", alert: "Public transport strongly recommended across West London." },
      transit: { name: "Hammersmith / Turnham Green", coords: [51.493, -0.225], desc: "District & Piccadilly lines. Direct buses to West Mid (H91), easy tube to Hammersmith & Chelsea.", alert: "Excellent 24-hr Tube and bus connectivity." }
    },
    stages: [
      { stage: "CT1 (Feb 27)", hosp: "West Middlesex University Hospital", desc: "Initial Assessment of Competence (IAC) & 3m ICM" },
      { stage: "CT2 (Feb 28)", hosp: "Hammersmith Hospital", desc: "Imperial College Healthcare (QCCH) - IACOA" },
      { stage: "CT3 (Feb 29)", hosp: "Chelsea & Westminster Hospital", desc: "3m ICM, Stage 1 Obs & Paediatric Anaesthesia" },
    ]
  },
  {
    id: "ct1-london-north-central-lr2",
    code: "North Central London - CT1 - Feb - LR2",
    region: "London",
    title: "NC London: Romford (BHRUT 2 yrs) & Royal Free (1 yr)",
    places: "1",
    hubs: {
      driver: { name: "Stratford / Wanstead (A12 / North Circular)", coords: [51.575, 0.025], desc: "A12 corridor. 20m east to Romford; 30m west to Hampstead (Royal Free).", alert: "A12 gives good car access east to Queen's Hospital Romford." },
      transit: { name: "Stratford Interchange", coords: [51.542, -0.003], desc: "Elizabeth line direct to Romford (18m); Overground / Jubilee + Northern line to Royal Free.", alert: "Elizabeth Line provides ultrafast transit to Romford." }
    },
    stages: [
      { stage: "CT1 (Feb 27 - Feb 28)", hosp: "Queen's Hospital, Romford", desc: "Barking, Havering & Redbridge (BHRUT) - Complete IAC" },
      { stage: "CT2 (Feb 28 - Feb 29)", hosp: "Queen's Hospital, Romford", desc: "BHRUT - 6m ITU & 3m Obs for IACOA" },
      { stage: "CT3 (Feb 29 - Feb 30)", hosp: "Royal Free Hospital", desc: "Royal Free London - Stage 1 Anaesthesia completion" },
    ]
  },
  {
    id: "ct1-london-north-central-lr3",
    code: "North Central London - CT1 - Feb - LR3",
    region: "London",
    title: "NC London: Royal Free (2 yrs) & Barnet Hospital (1 yr)",
    places: "1",
    hubs: {
      driver: { name: "Finchley / Golders Green (A1 / A598)", coords: [51.595, -0.195], desc: "A1 corridor. 15m south to Royal Free (Hampstead); 18m north to Barnet Hospital.", alert: "Convenient car access up the A1 corridor to Barnet." },
      transit: { name: "Northern Line Corridor (Camden / Highgate / Finchley)", coords: [51.572, -0.145], desc: "Northern line (High Barnet branch) connects directly to High Barnet, and south to Belsize Park.", alert: "Belsize Park (Northern line) is 5m walk from Royal Free; bus 107/263 to Barnet." }
    },
    stages: [
      { stage: "CT1 (Feb 27 - Feb 28)", hosp: "Royal Free Hospital", desc: "Royal Free Hampstead - Complete IAC" },
      { stage: "CT2 (Feb 28 - Feb 29)", hosp: "Royal Free Hospital", desc: "Royal Free - 3m ITU & 3m Obs for IACOA" },
      { stage: "CT3 (Feb 29 - Feb 30)", hosp: "Barnet Hospital (BCF)", desc: "Barnet Hospital - 3m ITU & Stage 1 Anaesthesia" },
    ]
  },
  {
    id: "ct1-london-north-east-lr1",
    code: "North East London - CT1 - Feb - LR1",
    region: "London",
    title: "NE London: Homerton (1 yr) & Romford (BHRUT 2 yrs)",
    places: "1",
    hubs: {
      driver: { name: "Stratford / Leyton (A12)", coords: [51.555, -0.015], desc: "10m to Homerton; 22m via A12 to Queen's Hospital Romford.", alert: "A12 provides direct connection out to Romford." },
      transit: { name: "Stratford / Hackney Central", coords: [51.545, -0.015], desc: "Overground direct to Homerton (5m); Elizabeth Line direct to Romford (18m).", alert: "Overground and Elizabeth Line make this rotation commute very fast." }
    },
    stages: [
      { stage: "CT1 (Feb 27 - Feb 28)", hosp: "Homerton University Hospital", desc: "Homerton Hospital CT1 initial placement" },
      { stage: "CT2 (Feb 28 - Feb 29)", hosp: "Queen's Hospital, Romford", desc: "BHRUT acute anaesthesia & ITU" },
      { stage: "CT3 (Feb 29 - Feb 30)", hosp: "Queen's Hospital, Romford", desc: "BHRUT Stage 1 completion" },
    ]
  },
  // ==================== KENT, SURREY AND SUSSEX ====================
  {
    id: "ct1-kss-kent-1",
    code: "Kent, Surrey and Sussex - Kent - CT1 - Feb - 1",
    region: "Kent, Surrey and Sussex",
    title: "KSS Kent: Maidstone & Tunbridge Wells NHS Trust",
    places: "1",
    hubs: {
      driver: { name: "Tonbridge / Paddock Wood (A21 / A228)", coords: [51.195, 0.325], desc: "A21/A228 corridor midway. 12m south to Tunbridge Wells Hospital; 15m north to Maidstone Hospital.", alert: "Easy driving links between Tonbridge, Pembury and Maidstone." },
      transit: { name: "Tonbridge Station", coords: [51.191, 0.274], desc: "Major Kent railway hub with direct buses/shuttles to Pembury and Maidstone.", alert: "Dedicated hospital shuttle bus connects Maidstone and Tunbridge Wells hospitals." }
    },
    stages: [
      { stage: "CT1 (12m)", hosp: "Tunbridge Wells Hospital (Pembury)", desc: "Maidstone & Tunbridge Wells NHS Trust base" },
      { stage: "CT1 (12m)", hosp: "Maidstone Hospital", desc: "Maidstone Hospital acute base alternative" },
    ]
  },
  {
    id: "ct1-kss-kent-medway-k1e",
    code: "Kent, Surrey and Sussex - Kent - Medway - CT1 - Feb - K1E",
    region: "Kent, Surrey and Sussex",
    title: "KSS Kent: Medway Maritime Hospital",
    places: "2",
    hubs: {
      driver: { name: "Rochester / Chatham / Gillingham (M2 J3/J4)", coords: [51.375, 0.525], desc: "5-10m drive to Medway Maritime Hospital; quick access from M2 / A2.", alert: "Medway town centre hospital with staff permit parking." },
      transit: { name: "Gillingham Station (Kent)", coords: [51.387, 0.551], desc: "Southeastern high-speed line to St Pancras (45m); 15m walk or bus to Medway Maritime.", alert: "High-speed rail connects Gillingham into central London." }
    },
    stages: [
      { stage: "CT1 (12m)", hosp: "Medway Maritime Hospital, Gillingham", desc: "Medway NHS Foundation Trust base (CT2 & CT3 TBC)" },
    ]
  },
  // ==================== WEST MIDLANDS ====================
  {
    id: "ct1-west-midlands-2",
    code: "West Midlands - CT1 - Feb - 2",
    region: "West Midlands",
    title: "Coventry (UHCW) Starting Scheme (6 Places)",
    places: "6",
    hubs: {
      driver: { name: "Coventry East / Kenilworth", coords: [52.385, -1.515], desc: "A46 / A45 corridor. 12m to UHCW Walsgrave; 15m to Warwick Hospital.", alert: "A46 bypass gives quick access to hospitals across Coventry & Warwickshire." },
      transit: { name: "Coventry Station", coords: [52.401, -1.513], desc: "Direct hospital buses (9, 9A) link Coventry railway station to UHCW.", alert: "Frequent bus services run between station and hospital." }
    },
    stages: [
      { stage: "CT1 (12m)", hosp: "UHCW Coventry", desc: "Major Trauma Centre & Tertiary Teaching Base" },
      { stage: "CT2 - CT3", hosp: "Warwick Hospital", desc: "South Warwickshire acute placement" },
    ]
  },
  {
    id: "ct1-west-midlands-1",
    code: "West Midlands - CT1 - Feb - 1",
    region: "West Midlands",
    title: "Dudley (Russells Hall) Starting Scheme",
    places: "1",
    hubs: {
      driver: { name: "Stourbridge / Dudley West (A491 / A4123)", coords: [52.485, -2.135], desc: "5-10m drive to Russells Hall Hospital; convenient access towards Wolverhampton and Birmingham.", alert: "Central Black Country base." },
      transit: { name: "Stourbridge Junction / Dudley Bus Station", coords: [52.455, -2.135], desc: "Direct buses to Russells Hall Hospital; train links into Birmingham Snow Hill.", alert: "Frequent bus services link Dudley town and Stourbridge to Russells Hall." }
    },
    stages: [
      { stage: "CT1 (12m)", hosp: "Russells Hall Hospital, Dudley", desc: "Dudley Group NHS Foundation Trust base" },
      { stage: "CT2 - CT3", hosp: "New Cross Hospital, Wolverhampton", desc: "Black Country acute placement" },
      { stage: "CT2 - CT3", hosp: "Queen Elizabeth Hospital Birmingham", desc: "Regional tertiary MTC placement" },
    ]
  },
  // ==================== NORTH EAST ====================
  {
    id: "ct1-north-east-1",
    code: "North East - CT1 - Feb - 1",
    region: "North East",
    title: "North East & Cumbria 6-Monthly Scheme (4 Places)",
    places: "4",
    isPool: true,
    hubs: {
      driver: { name: "Newcastle / Gateshead (A1 corridor)", coords: [54.965, -1.615], desc: "Central North East hub. 10m to RVI/Freeman, 20m to Sunderland Royal via A184/A19.", alert: "Carlisle is ~58 mi west via the A69 across northern Pennines." },
      transit: { name: "Newcastle Central Station / Metro", coords: [54.968, -1.617], desc: "Tyne & Wear Metro connects directly to RVI (Haymarket) and Sunderland.", alert: "Metro network provides seamless links across Newcastle, Gateshead and Sunderland." }
    },
    stages: [
      { stage: "CT1 - CT3", hosp: "Royal Victoria Infirmary, Newcastle", desc: "Major Trauma Centre & tertiary acute" },
      { stage: "CT1 - CT3", hosp: "Freeman Hospital, Newcastle", desc: "Regional Cardiothoracic & Transplant Centre" },
      { stage: "CT1 - CT3", hosp: "Sunderland Royal Hospital", desc: "South Tyneside and Sunderland acute base" },
      { stage: "CT1 - CT3", hosp: "James Cook University Hospital, Middlesbrough", desc: "Teesside Major Trauma Centre" },
      { stage: "CT1 - CT3", hosp: "Cumberland Infirmary, Carlisle", desc: "North Cumbria acute base" },
    ]
  },
  // ==================== EAST OF ENGLAND ====================
  {
    id: "ct1-eoe-norfolk-norwich-1",
    code: "East of England - Norfolk - Norwich - CT1 - Feb - 1",
    region: "East of England",
    title: "Norfolk: Norwich (24m) & Great Yarmouth (James Paget 12m)",
    places: "2",
    hubs: {
      driver: { name: "Acle / Brundall (A47)", coords: [52.635, 1.485], desc: "A47 corridor midway. 16m west to NNUH Norwich; 15m east to James Paget Gorleston.", alert: "A47 dual carriageway provides quick links between Norwich and Great Yarmouth." },
      transit: { name: "Norwich Station", coords: [52.627, 1.306], desc: "Direct rail to Great Yarmouth (30m); frequent hospital buses from Norwich station to NNUH.", alert: "Connecting bus needed from Great Yarmouth station to James Paget." }
    },
    stages: [
      { stage: "CT1 - CT2 (24m)", hosp: "Norfolk & Norwich University Hospital", desc: "Tertiary teaching and acute base" },
      { stage: "CT3 (12m)", hosp: "James Paget Hospital, Great Yarmouth", desc: "Coastal general acute base" },
    ]
  },
  {
    id: "ct1-eoe-essex-chelmsford-8",
    code: "East of England - Essex - Chelmsford - CT1 - Feb - 8",
    region: "East of England",
    title: "Essex: Chelmsford (Broomfield 24m) & Harlow (12m)",
    places: "2",
    hubs: {
      driver: { name: "Great Dunmow / Stansted / A120", coords: [51.875, 0.365], desc: "A120 / A414 corridor. 22m south-east to Broomfield; 20m south-west to Harlow.", alert: "A120 and A414 give rural cross-county connections between Chelmsford and Harlow." },
      transit: { name: "Chelmsford / Harlow Town", coords: [51.737, 0.468], desc: "Direct Greater Anglia rail lines to London; local bus connections.", alert: "East-west public transport between Chelmsford and Harlow is bus-based; car recommended." }
    },
    stages: [
      { stage: "CT1 - CT2 (24m)", hosp: "Broomfield Hospital, Chelmsford", desc: "Mid Essex acute & plastic surgery base" },
      { stage: "CT3 (12m)", hosp: "Princess Alexandra Hospital, Harlow", desc: "West Essex acute general base" },
    ]
  },
  {
    id: "ct1-eoe-essex-colchester-1e",
    code: "East of England - Essex - Colchester - CT1 - Feb - 1E",
    region: "East of England",
    title: "Essex: Colchester Hospital CT1 Post",
    places: "1",
    hubs: {
      driver: { name: "Colchester North / Mile End (A12)", coords: [51.915, 0.895], desc: "Immediate access to Colchester Hospital off A12 J28.", alert: "Direct access off the A12; staff parking on site." },
      transit: { name: "Colchester North Station", coords: [51.902, 0.894], desc: "15m walk or 5m bus ride from Colchester mainline station to hospital.", alert: "Frequent buses run between station and hospital." }
    },
    stages: [
      { stage: "CT1 (12m)", hosp: "Colchester Hospital", desc: "East Suffolk & North Essex NHS Foundation Trust base" },
    ]
  },
  {
    id: "ct1-eoe-bedfordshire-bedford-3e",
    code: "East of England - Bedfordshire - Bedford - CT1 - Feb - 3E",
    region: "East of England",
    title: "Bedfordshire: Bedford Hospital CT1 Post",
    places: "1",
    hubs: {
      driver: { name: "Bedford South / Ampthill", coords: [52.085, -0.465], desc: "5-10m drive to Bedford Hospital; convenient access to A6 and A421.", alert: "Town centre hospital with staff parking." },
      transit: { name: "Bedford Station (Midland)", coords: [52.136, -0.478], desc: "Thameslink / EMR mainline station; 15m walk to Bedford Hospital South wing.", alert: "Bedford St Johns station is also nearby." }
    },
    stages: [
      { stage: "CT1 (12m)", hosp: "Bedford Hospital", desc: "Bedfordshire Hospitals NHS Foundation Trust base" },
    ]
  },
  {
    id: "ct1-eoe-bedfordshire-bedford-4",
    code: "East of England - Bedfordshire - Bedford - CT1 - Feb - 4",
    region: "East of England",
    title: "Bedfordshire: Bedford (24m) & Luton & Dunstable (12m)",
    places: "1",
    hubs: {
      driver: { name: "Flitwick / Ampthill / Harlington (M1 J12/A6)", coords: [52.005, -0.495], desc: "Midway on the Bedfordshire corridor. 15m north to Bedford; 16m south to Luton & Dunstable.", alert: "Flitwick / Ampthill offers a perfect equidistant midpoint on the A6." },
      transit: { name: "Flitwick Station (Thameslink)", coords: [52.004, -0.496], desc: "Direct Thameslink trains north to Bedford (12m) and south to Leagrave/Luton (12m).", alert: "Thameslink connects directly to both towns." }
    },
    stages: [
      { stage: "CT1 - CT2 (24m)", hosp: "Bedford Hospital", desc: "Bedford South wing acute base" },
      { stage: "CT3 (12m)", hosp: "Luton & Dunstable Hospital", desc: "Luton & Dunstable acute base" },
    ]
  },
  {
    id: "ct1-eoe-hertfordshire-watford-6",
    code: "East of England - Hertfordshire - Watford - CT1 - Feb - 6",
    region: "East of England",
    title: "Herts: Watford (24m) & Stevenage (Lister 12m)",
    places: "1",
    hubs: {
      driver: { name: "St Albans / Hatfield (A414 / M25 J21A)", coords: [51.755, -0.335], desc: "Central Herts hub. 18m south-west to Watford; 18m north to Lister Stevenage via A1(M).", alert: "St Albans provides balanced access to both hospital sites." },
      transit: { name: "St Albans City / Hatfield", coords: [51.75, -0.325], desc: "Thameslink rail to St Albans; local buses and rail connections across Herts.", alert: "Car is generally much faster between Watford and Stevenage." }
    },
    stages: [
      { stage: "CT1 - CT2 (24m)", hosp: "Watford General Hospital", desc: "West Herts Teaching Hospitals base" },
      { stage: "CT3 (12m)", hosp: "Lister Hospital, Stevenage", desc: "East & North Herts NHS Trust base" },
    ]
  },
  {
    id: "ct1-eoe-hertfordshire-watford-7",
    code: "East of England - Hertfordshire - Watford - CT1 - Feb - 7",
    region: "East of England",
    title: "Herts: Watford (12m) & Stevenage (Lister 24m)",
    places: "2",
    hubs: {
      driver: { name: "St Albans / Hatfield (A414 / M25 J21A)", coords: [51.755, -0.335], desc: "Central Herts hub. 18m south-west to Watford; 18m north to Lister Stevenage via A1(M).", alert: "St Albans provides balanced access to both hospital sites." },
      transit: { name: "St Albans City / Hatfield", coords: [51.75, -0.325], desc: "Thameslink rail to St Albans; local buses and rail connections across Herts.", alert: "Car is generally much faster between Watford and Stevenage." }
    },
    stages: [
      { stage: "CT1 (12m)", hosp: "Watford General Hospital", desc: "West Herts Teaching Hospitals base" },
      { stage: "CT2 - CT3 (24m)", hosp: "Lister Hospital, Stevenage", desc: "East & North Herts NHS Trust base" },
    ]
  },
  {
    id: "ct1-eoe-essex-harlow-5",
    code: "East of England - Essex - Harlow - CT1 - Feb - 5",
    region: "East of England",
    title: "Essex: Harlow (24m) & Chelmsford (Broomfield 12m)",
    places: "1",
    hubs: {
      driver: { name: "Great Dunmow / Stansted / A120", coords: [51.875, 0.365], desc: "A120 / A414 corridor. 22m south-east to Broomfield; 20m south-west to Harlow.", alert: "A120 and A414 give rural cross-county connections between Chelmsford and Harlow." },
      transit: { name: "Chelmsford / Harlow Town", coords: [51.737, 0.468], desc: "Direct Greater Anglia rail lines to London; local bus connections.", alert: "East-west public transport between Chelmsford and Harlow is bus-based; car recommended." }
    },
    stages: [
      { stage: "CT1 - CT2 (24m)", hosp: "Princess Alexandra Hospital, Harlow", desc: "West Essex acute general base" },
      { stage: "CT3 (12m)", hosp: "Broomfield Hospital, Chelmsford", desc: "Mid Essex acute & plastic surgery base" },
    ]
  },
  {
    id: "ct1-eoe-bedfordshire-luton-3",
    code: "East of England - Bedfordshire - Luton - CT1 - Feb - 3",
    region: "East of England",
    title: "Bedfordshire: Luton & Dunstable (24m) & Bedford (12m)",
    places: "1",
    hubs: {
      driver: { name: "Flitwick / Ampthill / Harlington (M1 J12/A6)", coords: [52.005, -0.495], desc: "Midway on the Bedfordshire corridor. 15m north to Bedford; 16m south to Luton & Dunstable.", alert: "Flitwick / Ampthill offers a perfect equidistant midpoint on the A6." },
      transit: { name: "Flitwick Station (Thameslink)", coords: [52.004, -0.496], desc: "Direct Thameslink trains north to Bedford (12m) and south to Leagrave/Luton (12m).", alert: "Thameslink connects directly to both towns." }
    },
    stages: [
      { stage: "CT1 - CT2 (24m)", hosp: "Luton & Dunstable Hospital", desc: "Luton & Dunstable acute base" },
      { stage: "CT3 (12m)", hosp: "Bedford Hospital", desc: "Bedford South wing acute base" },
    ]
  },
  {
    id: "ct1-eoe-norfolk-kings-lynn-2",
    code: "East of England - Norfolk - Kings Lynn - CT1 - Feb - 2",
    region: "East of England",
    title: "Norfolk & Cambs: Kings Lynn (24m) & Peterborough (12m)",
    places: "2",
    hubs: {
      driver: { name: "Wisbech / Guyhirn (A47)", coords: [52.655, 0.055], desc: "A47 corridor midway. 18m east to Queen Elizabeth Kings Lynn; 22m west to Peterborough City Hospital.", alert: "A47 provides the direct arterial route between Kings Lynn and Peterborough." },
      transit: { name: "Peterborough Station", coords: [52.574, -0.25], desc: "Major ECML railway interchange; Excel bus connects Peterborough to Kings Lynn.", alert: "First Excel bus runs between Peterborough rail station and Kings Lynn." }
    },
    stages: [
      { stage: "CT1 - CT2 (24m)", hosp: "Queen Elizabeth Hospital, Kings Lynn", desc: "Queen Elizabeth Hospital acute base" },
      { stage: "CT3 (12m)", hosp: "Peterborough City Hospital", desc: "Peterborough City acute base" },
    ]
  },
  {
    id: "ct1-eoe-suffolk-ipswich-2e",
    code: "East of England - Suffolk - Ipswich - CT1 - Feb - 2E",
    region: "East of England",
    title: "Suffolk: Ipswich Hospital CT1 Post",
    places: "1",
    hubs: {
      driver: { name: "Ipswich East / Kesgrave (A12 / A14)", coords: [52.065, 1.225], desc: "5-10m drive to Ipswich Hospital; easy access to A12 and A14.", alert: "East Ipswich location with on-site staff parking." },
      transit: { name: "Ipswich Station", coords: [52.051, 1.144], desc: "Frequent buses (66, 66A) link Ipswich railway station directly to Ipswich Hospital.", alert: "Direct Superroute 66 bus connects station to hospital every 15 mins." }
    },
    stages: [
      { stage: "CT1 (12m)", hosp: "Ipswich Hospital", desc: "East Suffolk & North Essex NHS Foundation Trust base" },
    ]
  },
  {
    id: "ct1-eoe-suffolk-ipswich-9",
    code: "East of England - Suffolk - Ipswich - CT1 - Feb - 9",
    region: "East of England",
    title: "Suffolk & Essex: Ipswich (24m) & Colchester (12m)",
    places: "2",
    hubs: {
      driver: { name: "Manningtree / Stratford St Mary (A12)", coords: [51.965, 1.015], desc: "A12 corridor midway. 16m north-east to Ipswich Hospital; 14m south-west to Colchester Hospital.", alert: "A12 dual carriageway provides very fast 15-20m drives to both hospitals." },
      transit: { name: "Manningtree Station", coords: [51.945, 1.055], desc: "Mainline rail station with 10m direct trains to both Colchester and Ipswich.", alert: "Direct trains link Manningtree to both towns in 10 mins." }
    },
    stages: [
      { stage: "CT1 - CT2 (24m)", hosp: "Ipswich Hospital", desc: "Ipswich Hospital acute base" },
      { stage: "CT3 (12m)", hosp: "Colchester Hospital", desc: "Colchester Hospital acute base" },
    ]
  },
  // ==================== NORTH WEST ====================
  {
    id: "ct1-north-west-greater-manchester-9",
    code: "North West - Greater Manchester, Lancashire and South Cumbria - Gt Manchester - CT1 - Feb - 9",
    region: "North West",
    title: "Greater Manchester Anaesthesia Scheme (13 Places)",
    places: "13",
    isPool: true,
    hubs: {
      driver: { name: "Sale / Altrincham / M60 J6-8", coords: [53.425, -2.315], desc: "M60 orbital motorway access: 15m to Wythenshawe, 18m to Salford Royal, 20m to MRI.", alert: "M60 ring road provides rapid connections across Greater Manchester." },
      transit: { name: "Manchester Piccadilly / Metrolink", coords: [53.477, -2.231], desc: "Extensive Metrolink tram network and local rail connecting all Manchester hospitals.", alert: "Metrolink connects directly to Salford Royal and Wythenshawe." }
    },
    stages: [
      { stage: "CT1 - CT3", hosp: "Manchester Royal Infirmary", desc: "Central Manchester Teaching Hospitals" },
      { stage: "CT1 - CT3", hosp: "Salford Royal Hospital", desc: "Regional Major Trauma & Neuro Centre" },
      { stage: "CT1 - CT3", hosp: "Wythenshawe Hospital, Manchester", desc: "Regional Cardiothoracics & Burns" },
      { stage: "CT1 - CT3", hosp: "Royal Bolton Hospital", desc: "Acute DGH Base" },
      { stage: "CT1 - CT3", hosp: "Stepping Hill Hospital, Stockport", desc: "Stockport Acute Base" },
    ]
  },
  {
    id: "ct1-north-west-greater-manchester-2e",
    code: "North West - Greater Manchester, Lancashire and South Cumbria - Gt Manchester - CT1 - Feb - 2E",
    region: "North West",
    title: "Greater Manchester Anaesthesia Scheme (2E)",
    places: "2",
    isPool: true,
    hubs: {
      driver: { name: "Sale / Altrincham / M60 J6-8", coords: [53.425, -2.315], desc: "M60 orbital motorway access: 15m to Wythenshawe, 18m to Salford Royal, 20m to MRI.", alert: "M60 ring road provides rapid connections across Greater Manchester." },
      transit: { name: "Manchester Piccadilly / Metrolink", coords: [53.477, -2.231], desc: "Extensive Metrolink tram network and local rail connecting all Manchester hospitals.", alert: "Metrolink connects directly to Salford Royal and Wythenshawe." }
    },
    stages: [
      { stage: "CT1 - CT3", hosp: "Manchester Royal Infirmary", desc: "Central Manchester Teaching Hospitals" },
      { stage: "CT1 - CT3", hosp: "Salford Royal Hospital", desc: "Regional Major Trauma & Neuro Centre" },
      { stage: "CT1 - CT3", hosp: "Wythenshawe Hospital, Manchester", desc: "Regional Cardiothoracics & Burns" },
      { stage: "CT1 - CT3", hosp: "Royal Bolton Hospital", desc: "Acute DGH Base" },
      { stage: "CT1 - CT3", hosp: "Stepping Hill Hospital, Stockport", desc: "Stockport Acute Base" },
    ]
  },
  {
    id: "ct1-north-west-cheshire-merseyside-11",
    code: "North West - Cheshire and Merseyside - Cheshire & Merseyside - CT1 - Feb - 11",
    region: "North West",
    title: "Warrington (12m), Royal Liverpool (9m) & LWH (3m)",
    places: "1",
    hubs: {
      driver: { name: "Widnes / Rainhill (M62 J7)", coords: [53.435, -2.765], desc: "M62 corridor midway. 15m east to Warrington; 20m west to Liverpool hospitals.", alert: "M62 motorway provides fast dual-direction commutes." },
      transit: { name: "Liverpool Lime Street / Warrington Central", coords: [53.407, -2.977], desc: "Direct fast rail between Liverpool Lime St and Warrington (25m).", alert: "Trains run frequently between Liverpool and Warrington." }
    },
    stages: [
      { stage: "CT1 (12m)", hosp: "Warrington Hospital", desc: "Warrington general acute base" },
      { stage: "CT2 (9m)", hosp: "Royal Liverpool University Hospital", desc: "Tertiary adult acute anaesthesia" },
      { stage: "CT3 (3m)", hosp: "Liverpool Women's Hospital (LWH)", desc: "Obstetric anaesthesia module" },
    ]
  },
  {
    id: "ct1-north-west-cheshire-merseyside-10",
    code: "North West - Cheshire and Merseyside - Cheshire & Merseyside - CT1 - Feb - 10",
    region: "North West",
    title: "Whiston (12m) & Warrington (12m)",
    places: "1",
    hubs: {
      driver: { name: "Rainhill / St Helens South (M62 J7)", coords: [53.415, -2.755], desc: "8m west to Whiston Hospital; 12m east to Warrington Hospital.", alert: "Short, easy commutes between adjacent trusts." },
      transit: { name: "Rainhill Station", coords: [53.418, -2.755], desc: "Direct rail on the historic Liverpool-Manchester line to Whiston and Warrington.", alert: "Local rail links are very convenient along this corridor." }
    },
    stages: [
      { stage: "CT1 (12m)", hosp: "Whiston Hospital, Prescot", desc: "Whiston acute general base" },
      { stage: "CT2 (6m)", hosp: "Warrington Hospital", desc: "Intensive Care Medicine placement" },
      { stage: "CT2 (6m)", hosp: "Warrington Hospital", desc: "Theatres anaesthesia placement" },
    ]
  },
  {
    id: "ct1-north-west-cheshire-merseyside-4",
    code: "North West - Cheshire and Merseyside - Cheshire & Merseyside - CT1 - Feb - 4",
    region: "North West",
    title: "Southport (12m) & Royal Liverpool (12m)",
    places: "1",
    hubs: {
      driver: { name: "Formby / Crosby (A565)", coords: [53.535, -3.065], desc: "Coastal corridor midway. 15m north to Southport; 22m south to central Liverpool.", alert: "A565 connects Southport straight into Liverpool city centre." },
      transit: { name: "Merseyrail Northern Line (Formby)", coords: [53.555, -3.072], desc: "Direct Merseyrail trains running every 15m north to Southport and south to Liverpool Central.", alert: "Merseyrail provides frequent 15-minute train services." }
    },
    stages: [
      { stage: "CT1 (12m)", hosp: "Southport and Formby District General Hospital", desc: "Southport general acute base" },
      { stage: "CT2 (6m)", hosp: "Royal Liverpool University Hospital", desc: "Intensive Care Medicine module" },
      { stage: "CT2 (6m)", hosp: "Royal Liverpool University Hospital", desc: "General theatres anaesthesia" },
    ]
  },
  {
    id: "ct1-north-west-cheshire-merseyside-1",
    code: "North West - Cheshire and Merseyside - Cheshire & Merseyside - CT1 - Feb - 1",
    region: "North West",
    title: "Chester (18m) & Aintree (6m)",
    places: "1",
    hubs: {
      driver: { name: "Ellesmere Port / Chester North (M53)", coords: [53.285, -2.895], desc: "M53/M57 corridor. 10m south to Countess of Chester; 25m north to Aintree via Kingsway Tunnel/M57.", alert: "M53 motorway links Chester directly to Merseyside." },
      transit: { name: "Chester Station / Merseyrail", coords: [53.197, -2.879], desc: "Merseyrail Wirral line to Liverpool Central; connecting Northern line to Aintree.", alert: "Direct Merseyrail network links Chester into Liverpool." }
    },
    stages: [
      { stage: "CT1 (12m)", hosp: "Countess of Chester Hospital", desc: "General anaesthesia base" },
      { stage: "CT2 (6m)", hosp: "Countess of Chester Hospital", desc: "Intensive Care Medicine module" },
      { stage: "CT2 (6m)", hosp: "Aintree University Hospital, Liverpool", desc: "Specialist surgery & MTC module" },
    ]
  },
  {
    id: "ct1-north-west-cheshire-merseyside-8",
    code: "North West - Cheshire and Merseyside - Cheshire & Merseyside - CT1 - Feb - 8",
    region: "North West",
    title: "Whiston (12m), LWH (3m) & Aintree (9m)",
    places: "1",
    hubs: {
      driver: { name: "Broadgreen / West Derby (M62/Queens Drive)", coords: [53.425, -2.895], desc: "Central Merseyside location. 12m east to Whiston, 15m north to Aintree, 10m to LWH.", alert: "Queens Drive ring road makes reaching all three sites fast." },
      transit: { name: "Broadgreen Station / Liverpool", coords: [53.408, -2.905], desc: "Local city buses and City Line rail services.", alert: "City buses connect central Liverpool, Whiston and Aintree." }
    },
    stages: [
      { stage: "CT1 (12m)", hosp: "Whiston Hospital, Prescot", desc: "Whiston general acute base" },
      { stage: "CT2 (3m)", hosp: "Liverpool Women's Hospital (LWH)", desc: "Obstetric anaesthesia placement" },
      { stage: "CT2 (9m)", hosp: "Aintree University Hospital, Liverpool", desc: "Major Trauma & general theatres" },
    ]
  },
  {
    id: "ct1-north-west-cheshire-merseyside-2",
    code: "North West - Cheshire and Merseyside - Cheshire & Merseyside - CT1 - Feb - 2",
    region: "North West",
    title: "Crewe (Leighton 18m) & Aintree (6m)",
    places: "1",
    hubs: {
      driver: { name: "Northwich / Knutsford (M6 J19)", coords: [53.265, -2.515], desc: "Mid Cheshire. 18m south to Leighton Hospital; 38m north-west to Aintree via M56/M57.", alert: "Aintree placement in Year 2 involves an M56/M57 motorway commute." },
      transit: { name: "Crewe Station", coords: [53.089, -2.433], desc: "Major rail hub with direct trains to Liverpool Lime Street (38m).", alert: "Local buses connect from Crewe station to Leighton Hospital." }
    },
    stages: [
      { stage: "CT1 (12m)", hosp: "Leighton Hospital, Crewe", desc: "General anaesthesia base" },
      { stage: "CT2 (6m)", hosp: "Leighton Hospital, Crewe", desc: "Intensive Care Medicine module" },
      { stage: "CT2 (6m)", hosp: "Aintree University Hospital, Liverpool", desc: "Major Trauma & specialist theatres" },
    ]
  },
  {
    id: "ct1-north-west-cheshire-merseyside-5",
    code: "North West - Cheshire and Merseyside - Cheshire & Merseyside - CT1 - Feb - 5",
    region: "North West",
    title: "Southport (12m) & Royal Liverpool (12m) (Post 5)",
    places: "1",
    hubs: {
      driver: { name: "Formby / Crosby (A565)", coords: [53.535, -3.065], desc: "Coastal corridor midway. 15m north to Southport; 22m south to central Liverpool.", alert: "A565 connects Southport straight into Liverpool city centre." },
      transit: { name: "Merseyrail Northern Line (Formby)", coords: [53.555, -3.072], desc: "Direct Merseyrail trains running every 15m north to Southport and south to Liverpool Central.", alert: "Merseyrail provides frequent 15-minute train services." }
    },
    stages: [
      { stage: "CT1 (12m)", hosp: "Southport and Formby District General Hospital", desc: "Southport general acute base" },
      { stage: "CT2 (6m)", hosp: "Royal Liverpool University Hospital", desc: "General theatres anaesthesia" },
      { stage: "CT2 (6m)", hosp: "Royal Liverpool University Hospital", desc: "Intensive Care Medicine module" },
    ]
  },
  {
    id: "ct1-north-west-cheshire-merseyside-6",
    code: "North West - Cheshire and Merseyside - Cheshire & Merseyside - CT1 - Feb - 6",
    region: "North West",
    title: "Southport (12m) & Aintree (12m)",
    places: "1",
    hubs: {
      driver: { name: "Maghull / Ormskirk (A59)", coords: [53.535, -2.935], desc: "A59 corridor midway. 15m north-west to Southport; 12m south to Aintree.", alert: "Excellent midway position along the A59/A570 corridor." },
      transit: { name: "Merseyrail Northern Line (Maghull)", coords: [53.515, -2.935], desc: "Direct Merseyrail trains south to Aintree station (8m) and connecting bus to Southport.", alert: "Aintree Hospital is easily reached from Merseyrail station." }
    },
    stages: [
      { stage: "CT1 (12m)", hosp: "Southport and Formby District General Hospital", desc: "Southport general acute base" },
      { stage: "CT2 (6m)", hosp: "Aintree University Hospital, Liverpool", desc: "General theatres anaesthesia" },
      { stage: "CT2 (6m)", hosp: "Aintree University Hospital, Liverpool", desc: "Intensive Care Medicine module" },
    ]
  },
  {
    id: "ct1-north-west-cheshire-merseyside-7",
    code: "North West - Cheshire and Merseyside - Cheshire & Merseyside - CT1 - Feb - 7",
    region: "North West",
    title: "Wirral (12m), LWH (3m) & Crewe (Leighton 9m)",
    places: "1",
    hubs: {
      driver: { name: "Chester / Ellesmere Port (M53)", coords: [53.255, -2.915], desc: "Central pivot: 18m north to Arrowe Park Wirral, 20m north to LWH, 28m south-east to Leighton.", alert: "Central Cheshire/Wirral nexus off M53 J10/12." },
      transit: { name: "Chester / Hooton", coords: [53.305, -2.965], desc: "Merseyrail Wirral Line links into Liverpool and Birkenhead.", alert: "Leighton placement is easier by car from Cheshire." }
    },
    stages: [
      { stage: "CT1 (12m)", hosp: "Arrowe Park Hospital (Wirral)", desc: "Wirral University Teaching Hospital base" },
      { stage: "CT2 (3m)", hosp: "Liverpool Women's Hospital (LWH)", desc: "Obstetric anaesthesia placement" },
      { stage: "CT2 (9m)", hosp: "Leighton Hospital, Crewe", desc: "Cheshire acute placement" },
    ]
  },
  {
    id: "ct1-north-west-cheshire-merseyside-3",
    code: "North West - Cheshire and Merseyside - Cheshire & Merseyside - CT1 - Feb - 3",
    region: "North West",
    title: "Crewe (Leighton 12m) & Wirral (Arrowe Park 12m)",
    places: "1",
    hubs: {
      driver: { name: "Chester / Tarporley (A51 / A55)", coords: [53.185, -2.715], desc: "A51/A55 corridor. 16m east to Leighton Hospital; 25m north-west to Arrowe Park.", alert: "Scenic Cheshire base connecting both hospital sites." },
      transit: { name: "Chester Station", coords: [53.197, -2.879], desc: "Merseyrail line to Wirral; direct trains east towards Crewe.", alert: "Direct rail links between Chester and both catchment areas." }
    },
    stages: [
      { stage: "CT1 (12m)", hosp: "Leighton Hospital, Crewe", desc: "General anaesthesia base" },
      { stage: "CT2 (6m)", hosp: "Arrowe Park Hospital (Wirral)", desc: "General theatres anaesthesia" },
      { stage: "CT2 (6m)", hosp: "Arrowe Park Hospital (Wirral)", desc: "Intensive Care Medicine module" },
    ]
  },
  {
    id: "ct1-north-west-cheshire-merseyside-1e",
    code: "North West - Cheshire and Merseyside - CT1 - Feb - 1E",
    region: "North West",
    title: "Whiston (18m) & Chester (6m)",
    places: "1",
    hubs: {
      driver: { name: "Runcorn / Widnes (Mersey Gateway)", coords: [53.335, -2.725], desc: "Mersey Gateway bridge corridor. 16m north to Whiston; 18m south to Chester via M56/A56.", alert: "Mersey Gateway bridge makes commuting between Halton, Prescot and Chester very fast." },
      transit: { name: "Runcorn Station", coords: [53.341, -2.741], desc: "Mainline rail to Liverpool and connecting services to Chester.", alert: "Car is very efficient across the Mersey Gateway." }
    },
    stages: [
      { stage: "CT1 - CT2 (18m)", hosp: "Whiston Hospital, Prescot", desc: "Whiston acute general base" },
      { stage: "CT2 (6m)", hosp: "Countess of Chester Hospital", desc: "Countess of Chester acute placement" },
    ]
  },
  // ==================== EAST MIDLANDS ====================
  {
    id: "ct1-east-midlands-north-1",
    code: "East Midlands - North - CT1 - Feb - 1",
    region: "East Midlands",
    title: "Lincolnshire (L14F27): Lincoln, Boston & Nottingham",
    places: "1",
    hubs: {
      driver: { name: "Newark-on-Trent (A46 / A17 / A1)", coords: [53.075, -0.815], desc: "Strategic crossroad. 22m northeast to Lincoln, 32m to Boston via A17, 28m southwest to Nottingham via A46.", alert: "Newark is the best central base bridging Lincolnshire and Nottinghamshire." },
      transit: { name: "Newark Northgate / Lincoln", coords: [53.082, -0.803], desc: "Direct rail on Castle line to Lincoln (25m) and Nottingham (30m).", alert: "Trains run directly from Newark to both Lincoln and Nottingham." }
    },
    stages: [
      { stage: "Feb 27 - Aug 27 (6m)", hosp: "Lincoln County Hospital", desc: "Lincoln acute base - Stage 1 initial" },
      { stage: "Aug 27 - Feb 28 (6m)", hosp: "Lincoln County Hospital", desc: "Lincoln acute base - IAC completion" },
      { stage: "Feb 28 - Aug 28 (6m)", hosp: "Boston Pilgrim Hospital", desc: "Pilgrim Hospital acute placement" },
      { stage: "Aug 28 - Feb 29 (6m)", hosp: "Nottingham City Hospital", desc: "Elective & specialist surgery" },
      { stage: "Feb 29 - Aug 29 (6m)", hosp: "Nottingham City Hospital", desc: "Specialist modules & ITU" },
      { stage: "Aug 29 - Feb 30 (6m)", hosp: "Queen's Medical Centre (QMC), Nottingham", desc: "Major Trauma Centre placement" },
    ]
  },
  {
    id: "ct1-east-midlands-north-1e",
    code: "East Midlands - North - CT1 - Feb - 1E",
    region: "East Midlands",
    title: "Lincoln County Hospital Starting Post (1E)",
    places: "1",
    hubs: {
      driver: { name: "Lincoln North / Greetwell", coords: [53.235, -0.515], desc: "5m drive to Lincoln County Hospital.", alert: "On-site hospital parking available." },
      transit: { name: "Lincoln Central Station", coords: [53.226, -0.542], desc: "Frequent city buses (4, 17, 18) connect Lincoln station to the hospital.", alert: "Bus ride is approx 10m up to the hospital site." }
    },
    stages: [
      { stage: "CT1 (12m)", hosp: "Lincoln County Hospital", desc: "Starting site - Lincoln County Hospital" },
    ]
  },
  {
    id: "ct1-east-midlands-north-2",
    code: "East Midlands - North - CT1 - Feb - 2",
    region: "East Midlands",
    title: "Lincolnshire (L20F27): Boston, Lincoln & Nottingham",
    places: "1",
    hubs: {
      driver: { name: "Newark-on-Trent (A46 / A17 / A1)", coords: [53.075, -0.815], desc: "Strategic crossroad. 22m northeast to Lincoln, 32m to Boston via A17, 28m southwest to Nottingham via A46.", alert: "Newark is the best central base bridging Lincolnshire and Nottinghamshire." },
      transit: { name: "Newark Northgate / Lincoln", coords: [53.082, -0.803], desc: "Direct rail on Castle line to Lincoln (25m) and Nottingham (30m).", alert: "Trains run directly from Newark to both Lincoln and Nottingham." }
    },
    stages: [
      { stage: "Feb 27 - Aug 27 (6m)", hosp: "Boston Pilgrim Hospital", desc: "Pilgrim Hospital acute base" },
      { stage: "Aug 27 - Feb 28 (6m)", hosp: "Boston Pilgrim Hospital", desc: "Pilgrim Hospital - IAC completion" },
      { stage: "Feb 28 - Aug 28 (6m)", hosp: "Lincoln County Hospital", desc: "Lincoln acute placement" },
      { stage: "Aug 28 - Feb 29 (6m)", hosp: "Queen's Medical Centre (QMC), Nottingham", desc: "Major Trauma Centre placement" },
      { stage: "Feb 29 - Aug 29 (6m)", hosp: "Queen's Medical Centre (QMC), Nottingham", desc: "MTC & specialist surgery" },
      { stage: "Aug 29 - Feb 30 (6m)", hosp: "Nottingham City Hospital", desc: "Elective & specialist modules" },
    ]
  },
  {
    id: "ct1-east-midlands-north-2e",
    code: "East Midlands - North - CT1 - Feb - 2E",
    region: "East Midlands",
    title: "Boston Pilgrim Hospital Starting Post (2E)",
    places: "1",
    hubs: {
      driver: { name: "Boston / Sibsey", coords: [52.995, -0.015], desc: "5m drive to Boston Pilgrim Hospital.", alert: "Direct parking on the Pilgrim Hospital campus." },
      transit: { name: "Boston Station (Lincs)", coords: [52.978, -0.028], desc: "Buses connect Boston rail station to Pilgrim Hospital.", alert: "Short bus ride or cycle from Boston town centre." }
    },
    stages: [
      { stage: "CT1 (12m)", hosp: "Boston Pilgrim Hospital", desc: "Starting site - Boston Pilgrim Hospital" },
    ]
  },
  {
    id: "ct1-east-midlands-north-3",
    code: "East Midlands - North - CT1 - Feb - 3",
    region: "East Midlands",
    title: "Notts (N1F27): King's Mill, QMC & Nottingham City",
    places: "1",
    hubs: {
      driver: { name: "Hucknall / Ravenshead (A60 / A611)", coords: [53.035, -1.185], desc: "Corridor midway. 15m north to King's Mill; 18m south to Nottingham hospitals.", alert: "Easy driving links north and south via the A60/A611." },
      transit: { name: "Hucknall Tram / Robin Hood Line", coords: [53.035, -1.205], desc: "Robin Hood Line train to Mansfield/Sutton Parkway; NET Tram direct to QMC.", alert: "NET Tram connects directly from Hucknall into the QMC campus." }
    },
    stages: [
      { stage: "Feb 27 - Aug 27 (6m)", hosp: "Kings Mill Hospital, Mansfield", desc: "King's Mill acute base" },
      { stage: "Aug 27 - Feb 28 (6m)", hosp: "Kings Mill Hospital, Mansfield", desc: "King's Mill - IAC completion" },
      { stage: "Feb 28 - Aug 28 (6m)", hosp: "Queen's Medical Centre (QMC), Nottingham", desc: "Major Trauma Centre placement" },
      { stage: "Aug 28 - Feb 29 (6m)", hosp: "Queen's Medical Centre (QMC), Nottingham", desc: "MTC & specialist anaesthesia" },
      { stage: "Feb 29 - Aug 29 (6m)", hosp: "Nottingham City Hospital", desc: "Elective & specialist modules" },
      { stage: "Aug 29 - Feb 30 (6m)", hosp: "Kings Mill Hospital, Mansfield", desc: "King's Mill Stage 1 completion" },
    ]
  },
  {
    id: "ct1-east-midlands-north-3e",
    code: "East Midlands - North - CT1 - Feb - 3E",
    region: "East Midlands",
    title: "Nottingham University Hospitals Starting Post (3E)",
    places: "1",
    hubs: {
      driver: { name: "Wollaton / Beeston", coords: [52.935, -1.215], desc: "5-10m drive to QMC; 15m to City Hospital via ring road.", alert: "QMC has a dedicated NET tram stop on campus." },
      transit: { name: "Nottingham Station / NET Tram", coords: [52.947, -1.146], desc: "NET Tram connects Nottingham station directly to QMC in 12m.", alert: "Tram stops right inside Queen's Medical Centre." }
    },
    stages: [
      { stage: "CT1 (12m)", hosp: "Queen's Medical Centre (QMC), Nottingham", desc: "Starting trust - Nottingham University Hospitals (QMC & City)" },
      { stage: "CT1 (12m)", hosp: "Nottingham City Hospital", desc: "NUH Trust campus alternative" },
    ]
  },
  {
    id: "ct1-east-midlands-north-8",
    code: "East Midlands - North - CT1 - Feb - 8",
    region: "East Midlands",
    title: "Derbyshire (D3 F27): Derby, Burton & Chesterfield",
    places: "1",
    hubs: {
      driver: { name: "Derby North / Ripley (A38)", coords: [52.975, -1.455], desc: "A38 corridor. 12m south to Royal Derby, 22m to Burton; 22m north to Chesterfield via A38/A61.", alert: "A38 dual carriageway provides direct links across Derbyshire." },
      transit: { name: "Derby Midland Station", coords: [52.916, -1.463], desc: "Direct rail south to Burton (10m) and north to Chesterfield (18m).", alert: "Frequent fast trains connect Derby, Burton and Chesterfield." }
    },
    stages: [
      { stage: "Feb 27 - Aug 27 (6m)", hosp: "Royal Derby Hospital", desc: "Royal Derby acute base" },
      { stage: "Aug 27 - Feb 28 (6m)", hosp: "Royal Derby Hospital", desc: "Royal Derby - IAC completion" },
      { stage: "Feb 28 - Aug 28 (6m)", hosp: "Queen's Hospital, Burton", desc: "Queen's Hospital Burton placement" },
      { stage: "Aug 28 - Feb 29 (6m)", hosp: "Queen's Hospital, Burton", desc: "Burton acute & general placement" },
      { stage: "Feb 29 - Aug 29 (6m)", hosp: "Chesterfield Royal Hospital", desc: "Chesterfield acute placement" },
      { stage: "Aug 29 - Feb 30 (6m)", hosp: "Chesterfield Royal Hospital", desc: "Chesterfield Stage 1 completion" },
    ]
  },
  {
    id: "ct1-east-midlands-north-9",
    code: "East Midlands - North - CT1 - Feb - 9",
    region: "East Midlands",
    title: "Derbyshire (D19 F27): Chesterfield, Derby & Burton",
    places: "1",
    hubs: {
      driver: { name: "Derby North / Ripley (A38)", coords: [52.975, -1.455], desc: "A38 corridor. 12m south to Royal Derby, 22m to Burton; 22m north to Chesterfield via A38/A61.", alert: "A38 dual carriageway provides direct links across Derbyshire." },
      transit: { name: "Derby Midland Station", coords: [52.916, -1.463], desc: "Direct rail south to Burton (10m) and north to Chesterfield (18m).", alert: "Frequent fast trains connect Derby, Burton and Chesterfield." }
    },
    stages: [
      { stage: "Feb 27 - Aug 27 (6m)", hosp: "Chesterfield Royal Hospital", desc: "Chesterfield acute base" },
      { stage: "Aug 27 - Feb 28 (6m)", hosp: "Chesterfield Royal Hospital", desc: "Chesterfield - IAC completion" },
      { stage: "Feb 28 - Aug 28 (6m)", hosp: "Royal Derby Hospital", desc: "Royal Derby acute placement" },
      { stage: "Aug 28 - Feb 29 (6m)", hosp: "Royal Derby Hospital", desc: "Royal Derby general anaesthesia" },
      { stage: "Feb 29 - Aug 29 (6m)", hosp: "Queen's Hospital, Burton", desc: "Queen's Hospital Burton placement" },
      { stage: "Aug 29 - Feb 30 (6m)", hosp: "Queen's Hospital, Burton", desc: "Burton Stage 1 completion" },
    ]
  },
  {
    id: "ct1-east-midlands-south-4",
    code: "East Midlands - South - CT1 - Feb - 4",
    region: "East Midlands",
    title: "East Midlands South (27R): Leicester & Northampton",
    places: "1",
    hubs: {
      driver: { name: "Market Harborough (A6)", coords: [52.475, -0.925], desc: "A6 / A508 corridor midway. 22m north to Leicester Royal Infirmary; 22m south to Northampton General.", alert: "Market Harborough is the premier equidistant base between Leicester and Northampton." },
      transit: { name: "Market Harborough Station", coords: [52.481, -0.916], desc: "Midland Main Line rail north to Leicester (15m); connecting bus/drive to Northampton.", alert: "Fast direct trains run north into Leicester in 15 mins." }
    },
    stages: [
      { stage: "Feb 27 - Aug 27 (6m)", hosp: "Leicester Royal Infirmary", desc: "LRI acute base - Stage 1 initial" },
      { stage: "Aug 27 - Feb 28 (6m)", hosp: "Leicester Royal Infirmary", desc: "LRI - IAC completion" },
      { stage: "Feb 28 - Aug 28 (6m)", hosp: "Northampton General Hospital", desc: "Northampton General acute placement" },
      { stage: "Aug 28 - Feb 29 (6m)", hosp: "Northampton General Hospital", desc: "Northampton General acute placement" },
      { stage: "Feb 29 - Aug 29 (6m)", hosp: "Leicester Royal Infirmary", desc: "LRI specialist anaesthesia modules" },
      { stage: "Aug 29 - Feb 30 (6m)", hosp: "Leicester Royal Infirmary", desc: "LRI Stage 1 completion" },
    ]
  },
  {
    id: "ct1-east-midlands-south-5",
    code: "East Midlands - South - CT1 - Feb - 5",
    region: "East Midlands",
    title: "East Midlands South (27S): Leicester & Northampton",
    places: "1",
    hubs: {
      driver: { name: "Market Harborough (A6)", coords: [52.475, -0.925], desc: "A6 / A508 corridor midway. 22m north to Leicester Royal Infirmary; 22m south to Northampton General.", alert: "Market Harborough is the premier equidistant base between Leicester and Northampton." },
      transit: { name: "Market Harborough Station", coords: [52.481, -0.916], desc: "Midland Main Line rail north to Leicester (15m); connecting bus/drive to Northampton.", alert: "Fast direct trains run north into Leicester in 15 mins." }
    },
    stages: [
      { stage: "Feb 27 - Aug 27 (6m)", hosp: "Leicester Royal Infirmary", desc: "LRI acute base - Stage 1 initial" },
      { stage: "Aug 27 - Feb 28 (6m)", hosp: "Leicester Royal Infirmary", desc: "LRI - IAC completion" },
      { stage: "Feb 28 - Aug 28 (6m)", hosp: "Northampton General Hospital", desc: "Northampton General acute placement" },
      { stage: "Aug 28 - Feb 29 (6m)", hosp: "Northampton General Hospital", desc: "Northampton General acute placement" },
      { stage: "Feb 29 - Aug 29 (6m)", hosp: "Leicester Royal Infirmary", desc: "LRI specialist anaesthesia modules" },
      { stage: "Aug 29 - Feb 30 (6m)", hosp: "Leicester Royal Infirmary", desc: "LRI Stage 1 completion" },
    ]
  },
  {
    id: "ct1-east-midlands-south-6",
    code: "East Midlands - South - CT1 - Feb - 6",
    region: "East Midlands",
    title: "East Midlands South (27T): Leicester & Northampton",
    places: "1",
    hubs: {
      driver: { name: "Market Harborough (A6)", coords: [52.475, -0.925], desc: "A6 / A508 corridor midway. 22m north to Leicester Royal Infirmary; 22m south to Northampton General.", alert: "Market Harborough is the premier equidistant base between Leicester and Northampton." },
      transit: { name: "Market Harborough Station", coords: [52.481, -0.916], desc: "Midland Main Line rail north to Leicester (15m); connecting bus/drive to Northampton.", alert: "Fast direct trains run north into Leicester in 15 mins." }
    },
    stages: [
      { stage: "Feb 27 - Aug 27 (6m)", hosp: "Leicester Royal Infirmary", desc: "LRI acute base - Stage 1 initial" },
      { stage: "Aug 27 - Feb 28 (6m)", hosp: "Leicester Royal Infirmary", desc: "LRI - IAC completion" },
      { stage: "Feb 28 - Aug 28 (6m)", hosp: "Northampton General Hospital", desc: "Northampton General acute placement" },
      { stage: "Aug 28 - Feb 29 (6m)", hosp: "Northampton General Hospital", desc: "Northampton General acute placement" },
      { stage: "Feb 29 - Aug 29 (6m)", hosp: "Leicester Royal Infirmary", desc: "LRI specialist anaesthesia modules" },
      { stage: "Aug 29 - Feb 30 (6m)", hosp: "Leicester Royal Infirmary", desc: "LRI Stage 1 completion" },
    ]
  },
  {
    id: "ct1-east-midlands-south-7",
    code: "East Midlands - South - CT1 - Feb - 7",
    region: "East Midlands",
    title: "East Midlands South (27U): Northampton & Leicester",
    places: "1",
    hubs: {
      driver: { name: "Market Harborough (A6)", coords: [52.475, -0.925], desc: "A6 / A508 corridor midway. 22m north to Leicester Royal Infirmary; 22m south to Northampton General.", alert: "Market Harborough is the premier equidistant base between Leicester and Northampton." },
      transit: { name: "Market Harborough Station", coords: [52.481, -0.916], desc: "Midland Main Line rail north to Leicester (15m); connecting bus/drive to Northampton.", alert: "Fast direct trains run north into Leicester in 15 mins." }
    },
    stages: [
      { stage: "Feb 27 - Aug 27 (6m)", hosp: "Northampton General Hospital", desc: "Northampton General acute base - Initial" },
      { stage: "Aug 27 - Feb 28 (6m)", hosp: "Northampton General Hospital", desc: "Northampton General - IAC completion" },
      { stage: "Feb 28 - Aug 28 (6m)", hosp: "Leicester Royal Infirmary", desc: "Leicester Royal Infirmary placement" },
      { stage: "Aug 28 - Feb 29 (6m)", hosp: "Leicester Royal Infirmary", desc: "LRI acute & ITU placement" },
      { stage: "Feb 29 - Aug 29 (6m)", hosp: "Leicester Royal Infirmary", desc: "LRI specialist anaesthesia modules" },
      { stage: "Aug 29 - Feb 30 (6m)", hosp: "Leicester Royal Infirmary", desc: "LRI Stage 1 completion" },
    ]
  }
];

const REGION_COLORS = {
  "East Midlands": "#16a34a",
  "East of England": "#ea580c",
  "Kent, Surrey and Sussex": "#059669",
  "London": "#dc2626",
  "North East": "#6366f1",
  "North West": "#0284c7",
  "South West - Peninsula": "#0d9488",
  "South West - Severn": "#0891b2",
  "Thames Valley": "#8b5cf6",
  "Wales": "#c026d3",
  "Wessex": "#2563eb",
  "West Midlands": "#d97706",
  "Yorkshire and the Humber": "#4f46e5"
};

window.PROGRAMME_DATASETS = window.PROGRAMME_DATASETS || {};
window.PROGRAMME_DATASETS.ct1 = {
  id: "ct1",
  shortLabel: "CT1",
  badgeLabel: "CT1 – CT3",
  levelTitle: "Core / ACCS Anaesthetics",
  appTitle: "CT1 Anaesthetics National Rotation & Commute Explorer",
  headerTitle: "CT1 Core",
  headerSubtitle: "National Oriel CT1–CT3 Rotations & Commute Analysis",
  referenceNote: "Regional Anaesthesia Training Hospital (reference site — no CT1 starting posts in this round).",
  storagePrefix: "ct1_",
  cycleName: APP_CONFIG.cycleName,
  defaultCenter: APP_CONFIG.defaultCenter,
  defaultZoom: APP_CONFIG.defaultZoom,
  hospitals: HOSPITALS,
  rotations: ROTATIONS_DATA,
  regionColors: REGION_COLORS
};
})();
