/**
 * All 28 Singapore postal districts with names and postal code prefixes.
 *
 * The postal code prefixes are the first two digits of the six-digit Singapore
 * postal code. Each district maps to one or more two-digit prefixes.
 *
 * Source: URA / Singapore Post.
 */
export const POSTAL_DISTRICTS = {
  D01: {
    name: "Raffles Place, Cecil, Marina, People's Park",
    postalCodes: ['01', '02', '03', '04', '05', '06'],
  },
  D02: {
    name: 'Anson, Tanjong Pagar',
    postalCodes: ['07', '08'],
  },
  D03: {
    name: 'Queenstown, Tiong Bahru',
    postalCodes: ['14', '15', '16'],
  },
  D04: {
    name: 'Telok Blangah, Harbourfront',
    postalCodes: ['09', '10'],
  },
  D05: {
    name: 'Pasir Panjang, Hong Leong Garden, Clementi New Town',
    postalCodes: ['11', '12', '13'],
  },
  D06: {
    name: 'High Street, Beach Road (City Hall area)',
    postalCodes: ['17'],
  },
  D07: {
    name: 'Middle Road, Golden Mile',
    postalCodes: ['18', '19'],
  },
  D08: {
    name: 'Little India',
    postalCodes: ['20', '21'],
  },
  D09: {
    name: 'Orchard, Cairnhill, River Valley',
    postalCodes: ['22', '23'],
  },
  D10: {
    name: 'Ardmore, Bukit Timah, Holland Road, Tanglin',
    postalCodes: ['24', '25', '26', '27'],
  },
  D11: {
    name: 'Watten Estate, Novena, Thomson',
    postalCodes: ['28', '29', '30'],
  },
  D12: {
    name: 'Balestier, Toa Payoh, Serangoon',
    postalCodes: ['31', '32', '33'],
  },
  D13: {
    name: 'Macpherson, Braddell',
    postalCodes: ['34', '35', '36', '37'],
  },
  D14: {
    name: 'Geylang, Eunos',
    postalCodes: ['38', '39', '40', '41'],
  },
  D15: {
    name: 'Katong, Joo Chiat, Amber Road',
    postalCodes: ['42', '43', '44', '45'],
  },
  D16: {
    name: 'Bedok, Upper East Coast, Eastwood, Kew Drive',
    postalCodes: ['46', '47', '48'],
  },
  D17: {
    name: 'Loyang, Changi',
    postalCodes: ['49', '50', '81'],
  },
  D18: {
    name: 'Tampines, Pasir Ris',
    postalCodes: ['51', '52'],
  },
  D19: {
    name: 'Serangoon Garden, Hougang, Punggol',
    postalCodes: ['53', '54', '55', '82'],
  },
  D20: {
    name: 'Bishan, Ang Mo Kio',
    postalCodes: ['56', '57'],
  },
  D21: {
    name: 'Upper Bukit Timah, Clementi Park, Ulu Pandan',
    postalCodes: ['58', '59'],
  },
  D22: {
    name: 'Jurong',
    postalCodes: ['60', '61', '62', '63', '64'],
  },
  D23: {
    name: 'Hillview, Dairy Farm, Bukit Panjang, Choa Chu Kang',
    postalCodes: ['65', '66', '67', '68'],
  },
  D24: {
    name: 'Lim Chu Kang, Tengah',
    postalCodes: ['69', '70', '71'],
  },
  D25: {
    name: 'Kranji, Woodgrove',
    postalCodes: ['72', '73'],
  },
  D26: {
    name: 'Upper Thomson, Springleaf',
    postalCodes: ['77', '78'],
  },
  D27: {
    name: 'Yishun, Sembawang',
    postalCodes: ['75', '76'],
  },
  D28: {
    name: 'Seletar',
    postalCodes: ['79', '80'],
  },
};

/**
 * Mapping of HDB towns (planning areas) to their approximate postal district.
 * This is used to group transactions from the data.gov.sg API (which use town
 * names) into postal districts.
 */
const TOWN_TO_DISTRICT = {
  'ANG MO KIO': 'D20',
  'BEDOK': 'D16',
  'BISHAN': 'D20',
  'BUKIT BATOK': 'D23',
  'BUKIT MERAH': 'D03',
  'BUKIT PANJANG': 'D23',
  'BUKIT TIMAH': 'D21',
  'CENTRAL AREA': 'D01',
  'CHOA CHU KANG': 'D23',
  'CLEMENTI': 'D05',
  'GEYLANG': 'D14',
  'HOUGANG': 'D19',
  'JURONG EAST': 'D22',
  'JURONG WEST': 'D22',
  'KALLANG/WHAMPOA': 'D12',
  'KALLANG': 'D12',
  'WHAMPOA': 'D12',
  'LIM CHU KANG': 'D24',
  'MARINE PARADE': 'D15',
  'MOUNTBATTEN': 'D15',
  'PASIR RIS': 'D18',
  'PUNGGOL': 'D19',
  'QUEENSTOWN': 'D03',
  'SEMBAWANG': 'D27',
  'SENGKANG': 'D19',
  'SERANGOON': 'D19',
  'TAMPINES': 'D18',
  'TENGAH': 'D24',
  'TOA PAYOH': 'D12',
  'WOODLANDS': 'D25',
  'YISHUN': 'D27',
};

/**
 * Map an HDB town name (from data.gov.sg) to its postal district code.
 * Returns null if no mapping is found.
 */
export function townToDistrict(town) {
  if (!town) return null;
  return TOWN_TO_DISTRICT[town.toUpperCase().trim()] || null;
}

/**
 * Return all district names suitable for dropdowns.
 */
export function getDistrictNames() {
  return Object.entries(POSTAL_DISTRICTS)
    .map(([code, info]) => ({ code, name: info.name }))
    .sort((a, b) => a.code.localeCompare(b.code));
}
