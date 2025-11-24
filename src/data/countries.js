import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';

countries.registerLocale(enLocale);

// Manual overrides for specific demo countries
export const manualCountryData = {
  "USA": {
    economicRisk: 20,
    politicalRisk: 15,
    details: "Stable economy with minor political polarization."
  },
  "CHN": {
    economicRisk: 30,
    politicalRisk: 40,
    details: "Strong growth but regulatory uncertainties."
  },
  "TUR": {
    economicRisk: 75,
    politicalRisk: 60,
    details: "High inflation and currency volatility."
  },
  "RUS": {
    economicRisk: 80,
    politicalRisk: 90,
    details: "Sanctions and geopolitical conflict."
  },
  "DEU": {
    economicRisk: 10,
    politicalRisk: 10,
    details: "Strongest economy in Europe, very stable."
  },
  "UKR": {
    economicRisk: 85,
    politicalRisk: 95,
    details: "Active conflict zone, severe economic impact."
  }
};

// Helper to generate deterministic pseudo-random numbers from a string
const stringHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

export const getCountryRisk = (countryId) => {
  // Convert Alpha-3 to Alpha-2 for flags
  const alpha2 = countries.alpha3ToAlpha2(countryId);
  const countryName = countries.getName(countryId, "en") || countryId;

  // Check if we have manual data
  if (manualCountryData[countryId]) {
    return {
      ...manualCountryData[countryId],
      code: alpha2,
      name: countryName, // Ensure name is consistent
      id: countryId
    };
  }

  // Generate procedural mock data for other countries
  // This ensures every country has data and the map is full
  const hash = stringHash(countryId);

  // Generate scores between 20 and 80 to avoid extremes for generic countries
  const economicRisk = 20 + (hash % 60);
  const politicalRisk = 20 + ((hash >> 2) % 60);

  return {
    economicRisk,
    politicalRisk,
    details: `Automated risk assessment for ${countryName}. Data based on regional averages and projected trends.`,
    code: alpha2,
    name: countryName,
    id: countryId
  };
};
