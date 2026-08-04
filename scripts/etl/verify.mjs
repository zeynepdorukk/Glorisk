/**
 * Sanity checks for the generated datasets. Runs in CI before anything is
 * committed so that an upstream API outage cannot quietly publish a broken or
 * half-empty map.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ECONOMIC_INDICATORS, GOVERNANCE_INDICATORS } from '../../src/lib/riskModel.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DATA_DIR = path.join(ROOT, 'public', 'data');

const MIN_SCORED_COUNTRIES = 150;
const MIN_GEOMETRY_MATCH = 0.9;

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const readJson = async (file) => JSON.parse(await fs.readFile(path.join(DATA_DIR, file), 'utf8'));

const [countriesFile, meta, geometry] = await Promise.all([
  readJson('countries.json'),
  readJson('meta.json'),
  readJson('world.geo.json'),
]);

const countries = countriesFile.countries ?? [];
const scored = countries.filter((country) => country.total !== null);

check(scored.length >= MIN_SCORED_COUNTRIES, `only ${scored.length} scored countries, expected at least ${MIN_SCORED_COUNTRIES}`);
check(Boolean(countriesFile.generatedAt), 'countries.json is missing generatedAt');

for (const country of countries) {
  const where = `${country.id} (${country.name})`;
  check(/^[A-Z]{3}$/.test(country.id), `${where}: malformed ISO3 code`);
  check(Boolean(country.name), `${where}: missing name`);
  check(['high', 'medium', 'low'].includes(country.confidence), `${where}: unknown confidence "${country.confidence}"`);
  if (country.total !== null) {
    check(country.total >= 0 && country.total <= 100, `${where}: score ${country.total} out of range`);
    check(country.economic.usable || country.governance.usable, `${where}: scored without a usable pillar`);
  }
  for (const point of country.trajectory) {
    check(point[1] >= 0 && point[1] <= 100, `${where}: trajectory value ${point[1]} out of range`);
  }
}

const duplicates = countries.length - new Set(countries.map((country) => country.id)).size;
check(duplicates === 0, `${duplicates} duplicate country ids`);

const scoredIds = new Set(countries.map((country) => country.id));
const matched = geometry.features.filter((feature) => scoredIds.has(feature.id)).length;
const matchRatio = matched / geometry.features.length;
check(
  matchRatio >= MIN_GEOMETRY_MATCH,
  `only ${(matchRatio * 100).toFixed(1)}% of map polygons joined to a country record`,
);

const historyFiles = new Set(await fs.readdir(path.join(DATA_DIR, 'history')));
const missingHistory = countries.filter((country) => !historyFiles.has(`${country.id}.json`));
check(missingHistory.length === 0, `missing history for: ${missingHistory.map((c) => c.id).join(', ')}`);

const definedKeys = [...ECONOMIC_INDICATORS, ...GOVERNANCE_INDICATORS].map((definition) => definition.key).sort();
const metaKeys = [...(meta.economicIndicators ?? []), ...(meta.governanceIndicators ?? [])]
  .map((definition) => definition.key)
  .sort();
check(
  JSON.stringify(definedKeys) === JSON.stringify(metaKeys),
  'meta.json indicator definitions do not match the risk model',
);

if (failures.length > 0) {
  console.error(`[verify] ${failures.length} problem(s) found:`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`[verify] ok: ${scored.length} scored countries, ${(matchRatio * 100).toFixed(1)}% of polygons joined`);
