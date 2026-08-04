/**
 * Glorisk data pipeline.
 *
 * Pulls the macro-economic and governance indicators that back the risk model,
 * derives the scores once (so the browser never has to), and writes static JSON
 * that the site loads straight from disk. Run locally with `npm run etl`, or on
 * a schedule from CI.
 *
 * Flags:
 *   --skip-news        do not touch GDELT at all
 *   --news-limit=N     only fetch news for the N riskiest countries
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { fetchCountries, fetchIndicator } from './worldbank.mjs';
import { fetchArticles, fetchToneTimeline } from './gdelt.mjs';
import { displayName } from './displayNames.mjs';
import {
  ECONOMIC_INDICATORS,
  GOVERNANCE_INDICATORS,
  MAX_OBSERVATION_AGE_YEARS,
  MIN_ECONOMIC_COVERAGE,
  MIN_GOVERNANCE_COVERAGE,
  confidenceLevel,
  scoreIndicator,
  weightedScore,
  totalRisk,
} from '../../src/lib/riskModel.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT_DIR = path.join(ROOT, 'public', 'data');
const HISTORY_DIR = path.join(OUT_DIR, 'history');

const CURRENT_YEAR = new Date().getUTCFullYear();
const FROM_YEAR = CURRENT_YEAR - 11;

const args = process.argv.slice(2);
const SKIP_NEWS = args.includes('--skip-news');
const NEWS_LIMIT = Number(args.find((a) => a.startsWith('--news-limit='))?.split('=')[1] ?? 40);
/** GDELT throttling is unpredictable, so the harvest gets a hard time budget. */
const NEWS_BUDGET_MS = Number(args.find((a) => a.startsWith('--news-budget='))?.split('=')[1] ?? 15) * 60_000;

const log = (...parts) => console.log('[etl]', ...parts);

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

/** Builds one pillar (economic or governance) for a single country. */
function buildPillar(definitions, seriesByCode, iso3, toScore) {
  const components = {};
  const parts = [];
  let latestYear = null;

  for (const definition of definitions) {
    const points = seriesByCode.get(definition.code)?.get(iso3) ?? null;
    const latest = latestPoint(points);
    const score = latest ? toScore(latest.value, definition) : null;
    components[definition.key] = latest
      ? { value: Number(latest.value.toFixed(2)), year: latest.year, score: Number(score.toFixed(1)) }
      : null;
    parts.push({ score, weight: definition.weight });
    if (latest && (latestYear === null || latest.year > latestYear)) latestYear = latest.year;
  }

  const { score, coverage } = weightedScore(parts);
  return {
    score: score === null ? null : Number(score.toFixed(1)),
    coverage: Number(coverage.toFixed(2)),
    year: latestYear,
    components,
  };
}

/** Recomputes both pillars for a specific year so we can chart the trajectory. */
function pillarScoreForYear(definitions, seriesByCode, iso3, year, toScore) {
  const parts = definitions.map((definition) => {
    const value = valueAtYear(seriesByCode.get(definition.code)?.get(iso3), year);
    return { score: value === null ? null : toScore(value, definition), weight: definition.weight };
  });
  const { score, coverage } = weightedScore(parts);
  // Ignore years where we barely have any data - they produce misleading jumps.
  return coverage >= 0.5 ? score : null;
}

const economicScorer = (value, definition) => scoreIndicator(value, definition.scale);
// Governance percentiles are 0-100 where higher means better governed.
const governanceScorer = (value) => 100 - Math.min(100, Math.max(0, value));

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

async function readExistingNews() {
  try {
    const raw = await fs.readFile(path.join(OUT_DIR, 'news.json'), 'utf8');
    return JSON.parse(raw).news ?? {};
  } catch {
    return {};
  }
}

async function collectNews(countries) {
  const existing = await readExistingNews();
  if (SKIP_NEWS) {
    log('news collection skipped, keeping the previous payload');
    return existing;
  }
  const targets = [...countries]
    .filter((country) => country.total !== null)
    .sort((a, b) => b.total - a.total)
    .slice(0, NEWS_LIMIT);

  log(`collecting news for ${targets.length} countries`);
  // A partial harvest must not wipe out coverage collected on earlier runs.
  const news = { ...existing };
  const deadline = Date.now() + NEWS_BUDGET_MS;
  let failures = 0;
  let collected = 0;

  for (const country of targets) {
    if (Date.now() > deadline) {
      log('news time budget exhausted, stopping');
      break;
    }
    try {
      const articles = await fetchArticles(country.name);
      const tone = await fetchToneTimeline(country.name);
      if (articles.length === 0 && !tone) continue;
      news[country.id] = {
        articles,
        tone: tone ? { average: Number(tone.average.toFixed(2)), points: tone.points } : null,
        fetchedAt: new Date().toISOString(),
      };
      collected += 1;
    } catch (error) {
      failures += 1;
      log(`news failed for ${country.id}: ${error.message}`);
      if (failures >= 8) {
        log('too many news failures, stopping news collection');
        break;
      }
    }
  }
  log(`news refreshed for ${collected} countries, ${Object.keys(news).length} in the payload`);
  return news;
}

async function main() {
  log(`building data for ${FROM_YEAR}-${CURRENT_YEAR}`);

  const [countryMeta, economicSeries, governanceSeries] = [
    await fetchCountries(),
    await fetchAllSeries(ECONOMIC_INDICATORS, undefined),
    await fetchAllSeries(GOVERNANCE_INDICATORS, 3),
  ];
  log(`${countryMeta.length} countries in scope`);

  const years = Array.from({ length: CURRENT_YEAR - FROM_YEAR + 1 }, (_, i) => FROM_YEAR + i);
  const countries = [];
  const histories = new Map();

  for (const meta of countryMeta) {
    const economic = buildPillar(ECONOMIC_INDICATORS, economicSeries, meta.id, economicScorer);
    const governance = buildPillar(GOVERNANCE_INDICATORS, governanceSeries, meta.id, governanceScorer);

    economic.usable = economic.score !== null && economic.coverage >= MIN_ECONOMIC_COVERAGE;
    governance.usable = governance.score !== null && governance.coverage >= MIN_GOVERNANCE_COVERAGE;
    if (!economic.usable && !governance.usable) continue;

    const total = totalRisk(
      economic.usable ? economic.score : null,
      governance.usable ? governance.score : null,
    );
    const confidence = confidenceLevel(economic.coverage, governance.coverage);
    const trajectory = years
      .map((year) => {
        const economicYear = pillarScoreForYear(ECONOMIC_INDICATORS, economicSeries, meta.id, year, economicScorer);
        const governanceYear = pillarScoreForYear(GOVERNANCE_INDICATORS, governanceSeries, meta.id, year, governanceScorer);
        const value = totalRisk(economicYear, governanceYear);
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
    for (const definition of [...ECONOMIC_INDICATORS, ...GOVERNANCE_INDICATORS]) {
      const seriesMap = ECONOMIC_INDICATORS.includes(definition) ? economicSeries : governanceSeries;
      const points = seriesMap.get(definition.code)?.get(meta.id);
      if (points?.length) history[definition.key] = points.map((point) => [point.year, Number(point.value.toFixed(2))]);
    }
    histories.set(meta.id, history);
  }

  percentileRanks(countries);
  countries.sort((a, b) => a.name.localeCompare(b.name));
  log(`scored ${countries.length} countries`);

  const news = await collectNews(countries);

  await fs.mkdir(HISTORY_DIR, { recursive: true });
  await fs.writeFile(
    path.join(OUT_DIR, 'countries.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), countries }),
  );
  await fs.writeFile(path.join(OUT_DIR, 'news.json'), JSON.stringify({ generatedAt: new Date().toISOString(), news }));
  await fs.writeFile(
    path.join(OUT_DIR, 'meta.json'),
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      yearRange: [FROM_YEAR, CURRENT_YEAR],
      countryCount: countries.length,
      newsCountryCount: Object.keys(news).length,
      economicIndicators: ECONOMIC_INDICATORS,
      governanceIndicators: GOVERNANCE_INDICATORS,
      sources: [
        { name: 'World Bank Open Data', url: 'https://data.worldbank.org', description: 'Macro-economic indicators.' },
        { name: 'Worldwide Governance Indicators', url: 'https://www.worldbank.org/en/publication/worldwide-governance-indicators', description: 'Governance percentile scores.' },
        { name: 'GDELT Project', url: 'https://www.gdeltproject.org', description: 'English-language news coverage and tone.' },
      ],
    }),
  );

  await Promise.all(
    [...histories].map(([iso3, history]) => fs.writeFile(path.join(HISTORY_DIR, `${iso3}.json`), JSON.stringify(history))),
  );

  log(`wrote ${countries.length} country records to public/data`);
}

await main();
