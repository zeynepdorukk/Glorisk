/**
 * Shared definitions for the Glorisk risk model.
 * Used by both the ETL pipeline (Node) and the frontend (browser).
 */

/** Macro-economic indicators pulled from the World Bank Indicators API (source 2). */
export const ECONOMIC_INDICATORS = [
  {
    code: 'FP.CPI.TOTL.ZG',
    key: 'inflation',
    label: 'Inflation',
    unit: '%',
    weight: 0.25,
    // Risk rises as the value rises.
    scale: { best: 2, worst: 50, direction: 'higher-is-riskier' },
    description: 'Consumer price inflation, annual %.',
  },
  {
    code: 'NY.GDP.MKTP.KD.ZG',
    key: 'growth',
    label: 'GDP growth',
    unit: '%',
    weight: 0.2,
    scale: { best: 6, worst: -5, direction: 'lower-is-riskier' },
    description: 'Real GDP growth, annual %.',
  },
  {
    code: 'SL.UEM.TOTL.ZS',
    key: 'unemployment',
    label: 'Unemployment',
    unit: '%',
    weight: 0.15,
    scale: { best: 3, worst: 25, direction: 'higher-is-riskier' },
    description: 'Unemployment, % of total labour force (ILO estimate).',
  },
  {
    code: 'GC.DOD.TOTL.GD.ZS',
    key: 'debt',
    label: 'Government debt',
    unit: '% of GDP',
    weight: 0.15,
    scale: { best: 20, worst: 120, direction: 'higher-is-riskier' },
    description: 'Central government debt, total, % of GDP.',
  },
  {
    code: 'BN.CAB.XOKA.GD.ZS',
    key: 'currentAccount',
    label: 'Current account',
    unit: '% of GDP',
    weight: 0.15,
    scale: { best: 5, worst: -10, direction: 'lower-is-riskier' },
    description: 'Current account balance, % of GDP.',
  },
  {
    code: 'FI.RES.TOTL.MO',
    key: 'reserves',
    label: 'Reserves cover',
    unit: 'months of imports',
    weight: 0.1,
    scale: { best: 8, worst: 1, direction: 'lower-is-riskier' },
    description: 'Total reserves in months of imports.',
  },
];

/**
 * Worldwide Governance Indicators, published by the World Bank as a 0-100
 * "governance score" where higher means better governed. The score is a linear
 * rescaling of the underlying estimate, so it is comparable across countries
 * and years but is not a percentile rank.
 */
export const GOVERNANCE_INDICATORS = [
  { code: 'GOV_WGI_PV.SC', key: 'stability', label: 'Political stability', weight: 0.35, description: 'Political stability and absence of violence/terrorism.' },
  { code: 'GOV_WGI_RL.SC', key: 'ruleOfLaw', label: 'Rule of law', weight: 0.2, description: 'Confidence in and compliance with the rules of society.' },
  { code: 'GOV_WGI_CC.SC', key: 'corruption', label: 'Control of corruption', weight: 0.15, description: 'Extent to which public power is exercised for private gain.' },
  { code: 'GOV_WGI_GE.SC', key: 'effectiveness', label: 'Government effectiveness', weight: 0.15, description: 'Quality of public services and policy implementation.' },
  { code: 'GOV_WGI_VA.SC', key: 'voice', label: 'Voice and accountability', weight: 0.1, description: 'Freedom of expression, association and a free media.' },
  { code: 'GOV_WGI_RQ.SC', key: 'regulation', label: 'Regulatory quality', weight: 0.05, description: 'Ability to formulate sound policies and regulations.' },
];

/**
 * Quality gates. Territories with almost no published statistics used to end up
 * at the very top or the very bottom of the ranking purely because a single
 * indicator survived. A pillar therefore only counts once enough of its weight
 * is backed by data; countries that keep just one usable pillar are still
 * scored, but flagged as low confidence rather than silently dropped - the
 * places with the worst statistics are often the ones with the highest risk.
 */
export const MIN_ECONOMIC_COVERAGE = 0.35;
export const MIN_GOVERNANCE_COVERAGE = 0.5;
/** Observations older than this are treated as missing. */
export const MAX_OBSERVATION_AGE_YEARS = 6;

export const CONFIDENCE_LEVELS = {
  high: { label: 'High confidence', description: 'Both pillars are backed by recent data.' },
  medium: { label: 'Medium confidence', description: 'Some indicators are missing or a few years old.' },
  low: { label: 'Limited data', description: 'Only one pillar could be scored; treat the number as indicative.' },
};

/** Derives a confidence label from the two pillar coverage ratios. */
export function confidenceLevel(economic, governance) {
  const economicUsable = economic >= MIN_ECONOMIC_COVERAGE;
  const governanceUsable = governance >= MIN_GOVERNANCE_COVERAGE;
  if (!economicUsable || !governanceUsable) return 'low';
  return Math.min(economic, governance) >= 0.7 ? 'high' : 'medium';
}


/**
 * Bands are global quintiles rather than fixed cut-offs. Composite scores
 * cluster in a fairly narrow range - governance scores in particular are a
 * compressed rescaling - so fixed thresholds would paint most of the world in
 * a single colour. Quintiles keep the map readable and the meaning is easy to
 * state: each band holds a fifth of the countries.
 */
export const RISK_BANDS = [
  { id: 'very-low', label: 'Lowest 20%', color: '#10b981' },
  { id: 'low', label: 'Low', color: '#84cc16' },
  { id: 'medium', label: 'Medium', color: '#eab308' },
  { id: 'high', label: 'High', color: '#f97316' },
  { id: 'critical', label: 'Highest 20%', color: '#ef4444' },
];

/** Linearly interpolated quantile of a numeric sample. */
export function quantile(sortedValues, fraction) {
  if (sortedValues.length === 0) return null;
  if (sortedValues.length === 1) return sortedValues[0];
  const position = (sortedValues.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sortedValues[lower] + (sortedValues[upper] - sortedValues[lower]) * (position - lower);
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

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Maps a raw indicator value onto a 0-100 risk score using the indicator's
 * best/worst anchor points. Values beyond the anchors are clamped.
 */
export function scoreIndicator(value, scale) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  const { best, worst } = scale;
  const ratio = (value - best) / (worst - best);
  return clamp(ratio * 100, 0, 100);
}

/**
 * Weighted mean that ignores missing components and renormalises the weights
 * over whatever is available. Returns the score plus the share of weight that
 * was actually covered by data.
 */
export function weightedScore(parts) {
  let weighted = 0;
  let covered = 0;
  let total = 0;
  for (const { score, weight } of parts) {
    total += weight;
    if (score === null || score === undefined) continue;
    weighted += score * weight;
    covered += weight;
  }
  if (covered === 0) return { score: null, coverage: 0 };
  return { score: weighted / covered, coverage: total === 0 ? 0 : covered / total };
}

export const DEFAULT_WEIGHTS = { economic: 0.5, governance: 0.5 };

/** Blends the two pillars into the headline score. */
export function totalRisk(economic, governance, weights = DEFAULT_WEIGHTS) {
  const parts = [
    { score: economic, weight: weights.economic },
    { score: governance, weight: weights.governance },
  ];
  return weightedScore(parts).score;
}
