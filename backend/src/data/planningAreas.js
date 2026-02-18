/**
 * All 55 URA planning areas in Singapore with approximate centre coordinates
 * for label placement on the map.
 *
 * Source: Urban Redevelopment Authority (URA) Master Plan planning area boundaries.
 * Coordinates are in [longitude, latitude] (WGS84).
 */
export const PLANNING_AREAS = {
  'ANG MO KIO': { name: 'Ang Mo Kio', center: [103.8490, 1.3691] },
  'BEDOK': { name: 'Bedok', center: [103.9273, 1.3236] },
  'BISHAN': { name: 'Bishan', center: [103.8352, 1.3526] },
  'BOON LAY': { name: 'Boon Lay', center: [103.7100, 1.3187] },
  'BUKIT BATOK': { name: 'Bukit Batok', center: [103.7637, 1.3590] },
  'BUKIT MERAH': { name: 'Bukit Merah', center: [103.8239, 1.2819] },
  'BUKIT PANJANG': { name: 'Bukit Panjang', center: [103.7716, 1.3774] },
  'BUKIT TIMAH': { name: 'Bukit Timah', center: [103.7764, 1.3294] },
  'CENTRAL WATER CATCHMENT': { name: 'Central Water Catchment', center: [103.8052, 1.4020] },
  'CHANGI': { name: 'Changi', center: [103.9893, 1.3517] },
  'CHANGI BAY': { name: 'Changi Bay', center: [104.0053, 1.3217] },
  'CHOA CHU KANG': { name: 'Choa Chu Kang', center: [103.7468, 1.3840] },
  'CLEMENTI': { name: 'Clementi', center: [103.7649, 1.3150] },
  'DOWNTOWN CORE': { name: 'Downtown Core', center: [103.8536, 1.2873] },
  'GEYLANG': { name: 'Geylang', center: [103.8884, 1.3201] },
  'HOUGANG': { name: 'Hougang', center: [103.8863, 1.3612] },
  'JURONG EAST': { name: 'Jurong East', center: [103.7427, 1.3329] },
  'JURONG WEST': { name: 'Jurong West', center: [103.6940, 1.3404] },
  'KALLANG': { name: 'Kallang', center: [103.8666, 1.3100] },
  'LIM CHU KANG': { name: 'Lim Chu Kang', center: [103.7174, 1.4253] },
  'MANDAI': { name: 'Mandai', center: [103.8084, 1.4190] },
  'MARINA EAST': { name: 'Marina East', center: [103.8700, 1.3050] },
  'MARINA SOUTH': { name: 'Marina South', center: [103.8600, 1.2730] },
  'MARINE PARADE': { name: 'Marine Parade', center: [103.9000, 1.3030] },
  'MUSEUM': { name: 'Museum', center: [103.8490, 1.2970] },
  'NEWTON': { name: 'Newton', center: [103.8380, 1.3120] },
  'NORTH-EASTERN ISLANDS': { name: 'North-Eastern Islands', center: [103.9600, 1.3900] },
  'NOVENA': { name: 'Novena', center: [103.8400, 1.3200] },
  'ORCHARD': { name: 'Orchard', center: [103.8321, 1.3048] },
  'OUTRAM': { name: 'Outram', center: [103.8400, 1.2800] },
  'PASIR RIS': { name: 'Pasir Ris', center: [103.9494, 1.3721] },
  'PAYA LEBAR': { name: 'Paya Lebar', center: [103.8930, 1.3510] },
  'PIONEER': { name: 'Pioneer', center: [103.6900, 1.3200] },
  'PUNGGOL': { name: 'Punggol', center: [103.9093, 1.3984] },
  'QUEENSTOWN': { name: 'Queenstown', center: [103.7985, 1.2942] },
  'RIVER VALLEY': { name: 'River Valley', center: [103.8340, 1.2930] },
  'ROCHOR': { name: 'Rochor', center: [103.8562, 1.3040] },
  'SELETAR': { name: 'Seletar', center: [103.8690, 1.4100] },
  'SEMBAWANG': { name: 'Sembawang', center: [103.8200, 1.4491] },
  'SENGKANG': { name: 'Sengkang', center: [103.8935, 1.3868] },
  'SERANGOON': { name: 'Serangoon', center: [103.8715, 1.3554] },
  'SIMPANG': { name: 'Simpang', center: [103.9620, 1.4050] },
  'SINGAPORE RIVER': { name: 'Singapore River', center: [103.8468, 1.2880] },
  'SOUTHERN ISLANDS': { name: 'Southern Islands', center: [103.8350, 1.2300] },
  'STRAITS VIEW': { name: 'Straits View', center: [103.8550, 1.2700] },
  'SUNGEI KADUT': { name: 'Sungei Kadut', center: [103.7560, 1.4130] },
  'TAMPINES': { name: 'Tampines', center: [103.9456, 1.3496] },
  'TANGLIN': { name: 'Tanglin', center: [103.8133, 1.3050] },
  'TENGAH': { name: 'Tengah', center: [103.7400, 1.3640] },
  'TOA PAYOH': { name: 'Toa Payoh', center: [103.8486, 1.3343] },
  'TUAS': { name: 'Tuas', center: [103.6500, 1.3150] },
  'WESTERN ISLANDS': { name: 'Western Islands', center: [103.7200, 1.2600] },
  'WESTERN WATER CATCHMENT': { name: 'Western Water Catchment', center: [103.6950, 1.3900] },
  'WOODLANDS': { name: 'Woodlands', center: [103.7867, 1.4382] },
  'YISHUN': { name: 'Yishun', center: [103.8354, 1.4304] },
};

/**
 * Return a list of planning area names suitable for dropdowns.
 */
export function getPlanningAreaNames() {
  return Object.keys(PLANNING_AREAS).sort();
}
