/**
 * External validation.
 *
 * The Worldwide Governance Indicators aggregate perception-based sources, and
 * the standing critique of them is exactly that: they may measure what
 * well-informed observers believe about a country rather than what is happening
 * in it (Arndt and Oman 2006; Thomas 2010). A composite built on top of the WGI
 * inherits that objection, so it should not be graded only against itself.
 *
 * Two independent checks run on every build:
 *
 *   Convergent validity - do the governance components agree with V-Dem, which
 *   is expert-coded against explicit definitions rather than assembled from
 *   perception surveys?
 *
 *   Criterion validity - does the political stability component line up with an
 *   *outcome* nobody had to form an opinion about, namely the rate at which
 *   people are killed in armed conflict?
 *
 * Both reference series are pulled from Our World in Data, which republishes
 * V-Dem and UCDP with harmonised ISO3 codes.
 */

const OWID = 'https://ourworldindata.org/grapher';

const SERIES = {
  vdemCorruption: { slug: 'political-corruption-index', label: 'V-Dem political corruption', higherIsWorse: true },
  vdemRuleOfLaw: { slug: 'rule-of-law-index', label: 'V-Dem rule of law', higherIsWorse: false },
  vdemDemocracy: { slug: 'liberal-democracy-index', label: 'V-Dem liberal democracy', higherIsWorse: false },
  conflictDeaths: { slug: 'death-rate-in-armed-conflicts', label: 'Conflict death rate (UCDP)', higherIsWorse: true },
};

/** Splits one CSV line, honouring the quotes OWID puts around names with commas. */
export function splitCsvLine(line) {
  const cells = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      cells.push(cell);
      cell = '';
    } else cell += char;
  }
  cells.push(cell);
  return cells;
}

/** Latest observation per ISO3, ignoring OWID's aggregate rows. */
async function fetchLatestByCountry(slug, { maxYear }) {
  const res = await fetch(`${OWID}/${slug}.csv`, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`${slug}: ${res.status} ${res.statusText}`);
  const lines = (await res.text()).trim().split('\n');

  const latest = new Map();
  for (let i = 1; i < lines.length; i += 1) {
    const cells = splitCsvLine(lines[i]);
    const code = cells[1];
    if (!/^[A-Z]{3}$/.test(code)) continue;
    const year = Number(cells[2]);
    const value = Number(cells[3]);
    if (!Number.isFinite(year) || !Number.isFinite(value) || year > maxYear) continue;
    const current = latest.get(code);
    if (!current || year > current.year) latest.set(code, { year, value });
  }
  return latest;
}

function pearson(xs, ys) {
  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let numerator = 0;
  let varX = 0;
  let varY = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    numerator += dx * dy;
    varX += dx * dx;
    varY += dy * dy;
  }
  if (varX === 0 || varY === 0) return null;
  return numerator / Math.sqrt(varX * varY);
}

/** Fractional ranks, averaging ties - conflict death rates are mostly zero. */
export function ranks(values) {
  const order = values.map((value, index) => [value, index]).sort((a, b) => a[0] - b[0]);
  const result = new Array(values.length);
  let i = 0;
  while (i < order.length) {
    let j = i;
    while (j + 1 < order.length && order[j + 1][0] === order[i][0]) j += 1;
    const average = (i + j) / 2 + 1;
    for (let k = i; k <= j; k += 1) result[order[k][1]] = average;
    i = j + 1;
  }
  return result;
}

export function spearman(xs, ys) {
  if (xs.length < 10) return null;
  return pearson(ranks(xs), ranks(ys));
}

/**
 * Correlates one of our 0-100 risk scores with an external series, flipping the
 * external one where needed so a positive result always means "they agree".
 */
function compare({ label, reference, series, countries, pick }) {
  const ours = [];
  const theirs = [];
  for (const country of countries) {
    const value = pick(country);
    const external = reference.get(country.id);
    if (value == null || !external) continue;
    ours.push(value);
    theirs.push(series.higherIsWorse ? external.value : -external.value);
  }
  const rho = spearman(ours, theirs);
  return {
    label,
    against: series.label,
    countries: ours.length,
    rho: rho === null ? null : Number(rho.toFixed(3)),
  };
}

export async function buildValidation(countries, { maxYear }) {
  const references = {};
  for (const [key, series] of Object.entries(SERIES)) {
    references[key] = await fetchLatestByCountry(series.slug, { maxYear });
  }

  const component = (pillar, key) => (country) => country[pillar]?.components?.[key]?.score ?? null;

  const convergent = [
    compare({
      label: 'Control of corruption',
      reference: references.vdemCorruption,
      series: SERIES.vdemCorruption,
      countries,
      pick: component('governance', 'corruption'),
    }),
    compare({
      label: 'Rule of law',
      reference: references.vdemRuleOfLaw,
      series: SERIES.vdemRuleOfLaw,
      countries,
      pick: component('governance', 'ruleOfLaw'),
    }),
    compare({
      label: 'Voice and accountability',
      reference: references.vdemDemocracy,
      series: SERIES.vdemDemocracy,
      countries,
      pick: component('governance', 'voice'),
    }),
    compare({
      label: 'Governance pillar',
      reference: references.vdemRuleOfLaw,
      series: SERIES.vdemRuleOfLaw,
      countries,
      pick: (country) => (country.governance?.usable ? country.governance.score : null),
    }),
  ];

  const criterion = [
    compare({
      label: 'Political stability',
      reference: references.conflictDeaths,
      series: SERIES.conflictDeaths,
      countries,
      pick: component('governance', 'stability'),
    }),
    compare({
      label: 'Composite risk',
      reference: references.conflictDeaths,
      series: SERIES.conflictDeaths,
      countries,
      pick: (country) => country.total,
    }),
    compare({
      label: 'Economic pillar',
      reference: references.conflictDeaths,
      series: SERIES.conflictDeaths,
      countries,
      pick: (country) => (country.economic?.usable ? country.economic.score : null),
    }),
  ];

  return {
    method: 'Spearman rank correlation against the latest available observation per country.',
    convergent,
    criterion,
    sources: [
      {
        name: 'V-Dem, via Our World in Data',
        url: 'https://ourworldindata.org/grapher/rule-of-law-index',
        description: 'Expert-coded institutional indices, used as an independent check on the governance pillar.',
      },
      {
        name: 'UCDP, via Our World in Data',
        url: 'https://ourworldindata.org/grapher/death-rate-in-armed-conflicts',
        description: 'Deaths per 100,000 in ongoing armed conflicts, used as an outcome measure.',
      },
    ],
  };
}
