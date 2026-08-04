/**
 * Glorisk data pipeline.
 *
 * Pulls the macro-economic and governance indicators that back the risk model,
 * derives the scores once (so the browser never has to), and writes static JSON
 * that the site loads straight from disk. Run locally with `npm run etl`, or on
 * a schedule from CI.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { fetchCountries, fetchIndicator } from './worldbank.mjs';
import { displayName } from './displayNames.mjs';
import { buildDiagnostics } from './diagnostics.mjs';
import {
  ECONOMIC_INDICATORS,
  GOVERNANCE_INDICATORS,
  MAX_OBSERVATION_AGE_YEARS,
  MIN_ECONOMIC_COVERAGE,
  MIN_GOVERNANCE_COVERAGE,
  confidenceLevel,
  pillarScore,
  referenceDistribution,
  scoreIndicator,
  totalRisk,
} from '../../src/lib/riskModel.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT_DIR = path.join(ROOT, 'public', 'data');
const HISTORY_DIR = path.join(OUT_DIR, 'history');

const CURRENT_YEAR = new Date().getUTCFullYear();
const FROM_YEAR = CURRENT_YEAR - 11;

const log = (...parts) => console.log('[etl]', ...parts);

const ALL_INDICATORS = [...ECONOMIC_INDICATORS, ...GOVERNANCE_INDICATORS];

function latestPoint(points) {
  if (!points || points.length === 0) return null;
  const point = points[points.length - 1];
  return CURRENT_YEAR - point.year > MAX_OBSERVATION_AGE_YEARS ? null : point;
}

function valueAtYear(points, year) {
  if (!points) return null;
  for (let i = points.length - 1; i >= 0; i -= 1) {
    if (points[i].year === year) return points[i].value;
  }
  return null;
}

/**
 * One reference distribution per indicator, pooled over every country and every
 * year in range. Pooling rather than scoring against each year's cross-section
 * keeps the trajectories comparable: a country only moves because it changed,
 * not because its peers did.
 */
function buildReferences(seriesByCode) {
  const references = {};
  for (const definition of ALL_INDICATORS) {
    const values = [];
    for (const points of seriesByCode.get(definition.code)?.values() ?? []) {
      for (const point of points) values.push(point.value);
    }
    references[definition.key] = referenceDistribution(values);
  }
  return references;
}

function buildPillar(definitions, seriesByCode, references, iso3, minCoverage) {
  const components = {};
  const scores = [];
  let latestYear = null;

  for (const definition of definitions) {
    const points = seriesByCode.get(definition.code)?.get(iso3) ?? null;
    const latest = latestPoint(points);
    const score = latest ? scoreIndicator(latest.value, references[definition.key], definition.direction) : null;
    components[definition.key] = latest
      ? { value: Number(latest.value.toFixed(2)), year: latest.year, score: Number(score.toFixed(1)) }
      : null;
    scores.push(score);
    if (latest && (latestYear === null || latest.year > latestYear)) latestYear = latest.year;
  }

  const { score, coverage } = pillarScore(scores);
  return {
    score: score === null ? null : Number(score.toFixed(1)),
    coverage: Number(coverage.toFixed(2)),
    // Gated on the exact ratio: two of six indicators must not fail on rounding.
    usable: score !== null && coverage >= minCoverage,
    year: latestYear,
    components,
  };
}

/** Recomputes a pillar for one year so the trajectory can be charted. */
function pillarScoreForYear(definitions, seriesByCode, references, iso3, year) {
  const scores = definitions.map((definition) => {
    const value = valueAtYear(seriesByCode.get(definition.code)?.get(iso3), year);
    return value === null ? null : scoreIndicator(value, references[definition.key], definition.direction);
  });
  const { score, coverage } = pillarScore(scores);
  // Years with barely any data produce misleading jumps.
  return coverage >= 0.5 ? score : null;
}

async function fetchAllSeries(definitions, source) {
  const entries = new Map();
  for (const definition of definitions) {
    const series = await fetchIndicator(definition.code, { from: FROM_YEAR, to: CURRENT_YEAR, source });
    entries.set(definition.code, series);
    log(`fetched ${definition.code} (${series.size} countries)`);
  }
  return entries;
}

function percentileRanks(countries) {
  const scored = countries.filter((country) => country.total !== null).sort((a, b) => a.total - b.total);
  scored.forEach((country, index) => {
    country.percentile = scored.length < 2 ? 50 : Math.round((index / (scored.length - 1)) * 100);
  });
}

async function main() {
  log(`building data for ${FROM_YEAR}-${CURRENT_YEAR}`);

  const countryMeta = await fetchCountries();
  const economicSeries = await fetchAllSeries(ECONOMIC_INDICATORS, undefined);
  const governanceSeries = await fetchAllSeries(GOVERNANCE_INDICATORS, 3);
  log(`${countryMeta.length} countries in scope`);

  const allSeries = new Map([...economicSeries, ...governanceSeries]);
  const references = buildReferences(allSeries);
  log(
    'reference distributions: ' +
      ALL_INDICATORS.map((d) => `${d.key}=${references[d.key]?.count ?? 0}`).join(' '),
  );

  const years = Array.from({ length: CURRENT_YEAR - FROM_YEAR + 1 }, (_, i) => FROM_YEAR + i);
  const countries = [];
  const histories = new Map();

  for (const meta of countryMeta) {
    const economic = buildPillar(ECONOMIC_INDICATORS, economicSeries, references, meta.id, MIN_ECONOMIC_COVERAGE);
    const governance = buildPillar(GOVERNANCE_INDICATORS, governanceSeries, references, meta.id, MIN_GOVERNANCE_COVERAGE);
    if (!economic.usable && !governance.usable) continue;

    const total = totalRisk(
      economic.usable ? economic.score : null,
      governance.usable ? governance.score : null,
    );
    const confidence = confidenceLevel(economic, governance);

    const trajectory = years
      .map((year) => {
        const value = totalRisk(
          pillarScoreForYear(ECONOMIC_INDICATORS, economicSeries, references, meta.id, year),
          pillarScoreForYear(GOVERNANCE_INDICATORS, governanceSeries, references, meta.id, year),
        );
        return value === null ? null : [year, Number(value.toFixed(1))];
      })
      .filter(Boolean);

    countries.push({
      ...meta,
      name: displayName(meta.id, meta.name),
      sourceName: meta.name,
      economic,
      governance,
      total: total === null ? null : Number(total.toFixed(1)),
      confidence,
      trajectory,
      percentile: null,
    });

    const history = {};
    for (const definition of ALL_INDICATORS) {
      const points = allSeries.get(definition.code)?.get(meta.id);
      if (points?.length) history[definition.key] = points.map((point) => [point.year, Number(point.value.toFixed(2))]);
    }
    histories.set(meta.id, history);
  }

  percentileRanks(countries);
  countries.sort((a, b) => a.name.localeCompare(b.name));
  log(`scored ${countries.length} countries`);

  const diagnostics = buildDiagnostics(countries, ECONOMIC_INDICATORS, GOVERNANCE_INDICATORS);
  log(
    `diagnostics: governance mean r=${diagnostics.governance.meanCorrelation}, ` +
      `economic mean r=${diagnostics.economic.meanCorrelation}, ` +
      `between pillars r=${diagnostics.betweenPillars}, ` +
      `weight sensitivity median rho=${diagnostics.weightSensitivity?.median}`,
  );

  await fs.mkdir(HISTORY_DIR, { recursive: true });
  await fs.writeFile(
    path.join(OUT_DIR, 'countries.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), countries }),
  );
  await fs.writeFile(
    path.join(OUT_DIR, 'meta.json'),
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      yearRange: [FROM_YEAR, CURRENT_YEAR],
      countryCount: countries.length,
      economicIndicators: ECONOMIC_INDICATORS,
      governanceIndicators: GOVERNANCE_INDICATORS,
      references,
      diagnostics,
      sources: [
        { name: 'World Bank Open Data', url: 'https://data.worldbank.org', description: 'Macro-economic indicators.' },
        { name: 'Worldwide Governance Indicators', url: 'https://www.worldbank.org/en/publication/worldwide-governance-indicators', description: 'Governance scores, regions and income groups.' },
      ],
    }),
  );

  await Promise.all(
    [...histories].map(([iso3, history]) => fs.writeFile(path.join(HISTORY_DIR, `${iso3}.json`), JSON.stringify(history))),
  );

  log(`wrote ${countries.length} country records to public/data`);
}

await main();
