/**
 * The World Bank publishes several names in a statistical style that reads
 * badly on a map. Only entries that are genuinely confusing are overridden;
 * everything else keeps the source name.
 */
export const DISPLAY_NAMES = {
  BHS: 'The Bahamas',
  BRN: 'Brunei',
  CIV: "Côte d'Ivoire",
  COD: 'DR Congo',
  COG: 'Republic of the Congo',
  CPV: 'Cape Verde',
  CZE: 'Czechia',
  EGY: 'Egypt',
  FSM: 'Micronesia',
  GMB: 'The Gambia',
  HKG: 'Hong Kong',
  IRN: 'Iran',
  KGZ: 'Kyrgyzstan',
  KOR: 'South Korea',
  LAO: 'Laos',
  MAC: 'Macao',
  MKD: 'North Macedonia',
  PRK: 'North Korea',
  PSE: 'Palestine',
  RUS: 'Russia',
  SVK: 'Slovakia',
  SOM: 'Somalia',
  SYR: 'Syria',
  TUR: 'Türkiye',
  TWN: 'Taiwan',
  TZA: 'Tanzania',
  VEN: 'Venezuela',
  VNM: 'Vietnam',
  YEM: 'Yemen',
};

export function displayName(iso3, fallback) {
  return DISPLAY_NAMES[iso3] ?? fallback;
}
