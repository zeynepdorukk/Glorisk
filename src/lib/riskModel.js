/**
 * Shared definitions for the Glorisk risk model, imported by both the ETL
 * pipeline (Node) and the frontend (browser).
 *
 * Two decisions are worth stating up front, because composite indicators live
 * or die on them:
 *
 * Normalisation is by percentile rank against a fixed reference distribution
 * pooled over every country and year in the dataset. Several inputs are heavily
 * skewed - inflation and government debt have long right tails - and min-max
 * normalisation against hand-picked anchors would let a handful of extreme
 * country-years dictate everyone else's score. Percentile ranks are robust to
 * that, put every indicator on the same scale without further assumptions, and
 * remove the arbitrary "what counts as bad inflation" judgement entirely.
 *
 * Weighting is equal within each pillar. There is no theory that says political
 * stability deserves 35% and regulatory quality 5%, and the OECD/JRC handbook's
 * default in the absence of one is equal weighting reported alongside a
 * sensitivity analysis - which the pipeline computes and the app publishes.
 * Averaging six correlated governance measures is not double counting so much
 * as a more reliable estimate of the single construct they all track.
 */

/** Macro-economic indicators from the World Bank Indicators API (source 2). */
export const ECONOMIC_INDICATORS = [
  {
    code: 'FP.CPI.TOTL.ZG',
    key: 'inflation',
    label: 'Inflation',
    unit: '%',
    direction: 'higher-is-riskier',
    description: 'Consumer price inflation, annual %.',
  },
  {
    code: 'NY.GDP.MKTP.KD.ZG',
    key: 'growth',
    label: 'GDP growth',
    unit: '%',
    direction: 'lower-is-riskier',
    description: 'Real GDP growth, annual %.',
  },
  {
    code: 'SL.UEM.TOTL.ZS',
    key: 'unemployment',
    label: 'Unemployment',
    unit: '%',
    direction: 'higher-is-riskier',
    description: 'Unemployment, % of total labour force (ILO estimate).',
  },
  {
    code: 'GC.DOD.TOTL.GD.ZS',
    key: 'debt',
    label: 'Government debt',
    unit: '% of GDP',
    direction: 'higher-is-riskier',
    description: 'Central government debt, total, % of GDP.',
  },
  {
    code: 'BN.CAB.XOKA.GD.ZS',
    key: 'currentAccount',
    label: 'Current account',
    unit: '% of GDP',
    direction: 'lower-is-riskier',
    description: 'Current account balance, % of GDP.',
  },
  {
    code: 'FI.RES.TOTL.MO',
    key: 'reserves',
    label: 'Reserves cover',
    unit: 'months of imports',
    direction: 'lower-is-riskier',
    description: 'Total reserves in months of imports.',
  },
];

/**
 * Worldwide Governance Indicators, published by the World Bank as a 0-100
 * governance score where higher means better governed.
 */
export const GOVERNANCE_INDICATORS = [
  { code: 'GOV_WGI_PV.SC', key: 'stability', label: 'Political stability', direction: 'lower-is-riskier', description: 'Political stability and absence of violence/terrorism.' },
  { code: 'GOV_WGI_RL.SC', key: 'ruleOfLaw', label: 'Rule of law', direction: 'lower-is-riskier', description: 'Confidence in and compliance with the rules of society.' },
  { code: 'GOV_WGI_CC.SC', key: 'corruption', label: 'Control of corruption', direction: 'lower-is-riskier', description: 'Extent to which public power is exercised for private gain.' },
  { code: 'GOV_WGI_GE.SC', key: 'effectiveness', label: 'Government effectiveness', direction: 'lower-is-riskier', description: 'Quality of public services and policy implementation.' },
  { code: 'GOV_WGI_VA.SC', key: 'voice', label: 'Voice and accountability', direction: 'lower-is-riskier', description: 'Freedom of expression, association and a free media.' },
  { code: 'GOV_WGI_RQ.SC', key: 'regulation', label: 'Regulatory quality', direction: 'lower-is-riskier', description: 'Ability to formulate sound policies and regulations.' },
];

/**
 * Quality gates, expressed as the share of a pillar's indicators that must be
 * present. Countries left with a single usable pillar are still scored but
 * flagged, because the places with the weakest statistics are often the ones
 * carrying the highest risk.
 */
export const MIN_ECONOMIC_COVERAGE = 1 / 3;
export const MIN_GOVERNANCE_COVERAGE = 1 / 2;
/** Observations older than this are treated as missing. */
export const MAX_OBSERVATION_AGE_YEARS = 6;

export const CONFIDENCE_LEVELS = {
  high: { label: 'High confidence', description: 'Both pillars are backed by recent data.' },
  medium: { label: 'Medium confidence', description: 'Some indicators are missing or a few years old.' },
  low: { label: 'Limited data', description: 'Only one pillar could be scored; treat the number as indicative.' },
};

/** Confidence follows from whether both pillars survived their coverage gate. */
export function confidenceLevel(economic, governance) {
  if (!economic?.usable || !governance?.usable) return 'low';
  return Math.min(economic.coverage, governance.coverage) >= 0.7 ? 'high' : 'medium';
}

/**
 * Bands are global quintiles rather than fixed cut-offs, so each band always
 * holds a fifth of the countries and the map stays legible.
 */
export const RISK_BANDS = [
  { id: 'very-low', label: 'Lowest 20%', color: '#10b981' },
  { id: 'low', label: 'Low', color: '#84cc16' },
  { id: 'medium', label: 'Medium', color: '#eab308' },
  { id: 'high', label: 'High', color: '#f97316' },
  { id: 'critical', label: 'Highest 20%', color: '#ef4444' },
];

/** Linearly interpolated quantile of a sorted numeric sample. */
export function quantile(sortedValues, fraction) {
  if (sortedValues.length === 0) return null;
  if (sortedValues.length === 1) return sortedValues[0];
  const position = (sortedValues.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sortedValues[lower] + (sortedValues[upper] - sortedValues[lower]) * (position - lower);
}

/** Condenses a sample into 101 breakpoints, one per percentile. */
export function referenceDistribution(values) {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  return {
    count: sorted.length,
    breakpoints: Array.from({ length: 101 }, (_, index) => Number(quantile(sorted, index / 100).toFixed(4))),
  };
}

/**
 * Where `value` falls in the reference distribution, 0-100. A run of identical
 * breakpoints resolves to the middle of that run, so a mass of countries
 * sitting on the same value share a percentile instead of all collapsing onto
 * the end of the scale.
 */
export function percentileOf(breakpoints, value) {
  const last = breakpoints.length - 1;
  if (value < breakpoints[0]) return 0;
  if (value > breakpoints[last]) return 100;

  let low = 0;
  let high = last;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (breakpoints[mid] < value) low = mid + 1;
    else high = mid;
  }

  if (breakpoints[low] === value) {
    let end = low;
    while (end < last && breakpoints[end + 1] === value) end += 1;
    return (low + end) / 2;
  }

  const previous = low - 1;
  return previous + (value - breakpoints[previous]) / (breakpoints[low] - breakpoints[previous]);
}

/** Maps a raw observation onto a 0-100 risk score. */
export function scoreIndicator(value, reference, direction) {
  if (value === null || value === undefined || Number.isNaN(value) || !reference) return null;
  const percentile = percentileOf(reference.breakpoints, value);
  return direction === 'higher-is-riskier' ? percentile : 100 - percentile;
}

/**
 * Mean of the indicators that have data, plus the share of the pillar that was
 * actually covered. Every indicator carries the same weight.
 */
export function pillarScore(scores) {
  const present = scores.filter((score) => score !== null && score !== undefined);
  if (present.length === 0) return { score: null, coverage: 0 };
  return {
    score: present.reduce((sum, score) => sum + score, 0) / present.length,
    coverage: present.length / scores.length,
  };
}

export const DEFAULT_WEIGHTS = { economic: 0.5, governance: 0.5 };

/** Blends the two pillars, falling back to whichever one is available. */
export function totalRisk(economic, governance, weights = DEFAULT_WEIGHTS) {
  const parts = [
    { score: economic, weight: weights.economic },
    { score: governance, weight: weights.governance },
  ];
  let weighted = 0;
  let covered = 0;
  for (const { score, weight } of parts) {
    if (score === null || score === undefined) continue;
    weighted += score * weight;
    covered += weight;
  }
  return covered === 0 ? null : weighted / covered;
}

/** The four score cut-offs that separate the five bands. */
export function bandThresholds(scores) {
  const sorted = scores.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (sorted.length < RISK_BANDS.length) return [20, 40, 60, 80];
  return [0.2, 0.4, 0.6, 0.8].map((fraction) => quantile(sorted, fraction));
}

export function bandFor(score, thresholds) {
  if (score === null || score === undefined) return null;
  const index = thresholds.findIndex((threshold) => score <= threshold);
  return index === -1 ? RISK_BANDS[RISK_BANDS.length - 1] : RISK_BANDS[index];
}
