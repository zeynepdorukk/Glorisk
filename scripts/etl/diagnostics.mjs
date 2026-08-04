/**
 * Diagnostics that keep the model honest. Composite indicators are easy to
 * build and hard to defend, so the pipeline measures the two things a reader
 * should be suspicious about - whether the indicators are really independent,
 * and whether the equal weighting is load-bearing - and publishes the answers
 * alongside the data.
 */

export function pearson(xs, ys) {
  const n = xs.length;
  if (n < 3) return null;
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

/** Spearman rank correlation between two id -> rank maps covering the same ids. */
export function spearman(ranksA, ranksB) {
  const ids = [...ranksA.keys()].filter((id) => ranksB.has(id));
  const n = ids.length;
  if (n < 3) return null;
  let sumSquaredDiff = 0;
  for (const id of ids) sumSquaredDiff += (ranksA.get(id) - ranksB.get(id)) ** 2;
  return 1 - (6 * sumSquaredDiff) / (n * (n * n - 1));
}

function ranksOf(entries) {
  const sorted = [...entries].sort((a, b) => b.score - a.score);
  return new Map(sorted.map((entry, index) => [entry.id, index + 1]));
}

/** Mean pairwise correlation between the indicators inside one pillar. */
function pillarRedundancy(countries, pillar, definitions) {
  const complete = countries.filter((country) =>
    definitions.every((definition) => country[pillar]?.components?.[definition.key]?.score != null),
  );
  const pairs = [];
  for (let i = 0; i < definitions.length; i += 1) {
    for (let j = i + 1; j < definitions.length; j += 1) {
      const xs = complete.map((country) => country[pillar].components[definitions[i].key].score);
      const ys = complete.map((country) => country[pillar].components[definitions[j].key].score);
      const r = pearson(xs, ys);
      if (r !== null) pairs.push({ pair: `${definitions[i].key}~${definitions[j].key}`, r: Number(r.toFixed(3)) });
    }
  }
  pairs.sort((a, b) => b.r - a.r);
  return {
    sampleSize: complete.length,
    meanCorrelation: pairs.length ? Number((pairs.reduce((sum, p) => sum + p.r, 0) / pairs.length).toFixed(3)) : null,
    strongestPair: pairs[0] ?? null,
    weakestPair: pairs[pairs.length - 1] ?? null,
  };
}

/**
 * Re-scores every country with random weights - each indicator's weight drawn
 * from U(0.5, 1.5) and the pillar blend from U(0.35, 0.65) - and reports how
 * far the ranking moves. A high correlation means the equal weighting is not
 * quietly doing the work.
 */
function weightSensitivity(countries, economicDefs, governanceDefs, draws = 500) {
  const usable = countries.filter((country) => country.economic?.usable && country.governance?.usable);
  if (usable.length < 10) return null;

  const baseline = ranksOf(usable.map((country) => ({ id: country.id, score: country.total })));

  const randomWeights = (definitions) => {
    const weights = definitions.map(() => 0.5 + Math.random());
    const total = weights.reduce((a, b) => a + b, 0);
    return weights.map((weight) => weight / total);
  };

  const reweight = (country, pillar, definitions, weights) => {
    let weighted = 0;
    let covered = 0;
    definitions.forEach((definition, index) => {
      const score = country[pillar].components[definition.key]?.score;
      if (score == null) return;
      weighted += score * weights[index];
      covered += weights[index];
    });
    return covered === 0 ? null : weighted / covered;
  };

  const correlations = [];
  for (let draw = 0; draw < draws; draw += 1) {
    const economicWeights = randomWeights(economicDefs);
    const governanceWeights = randomWeights(governanceDefs);
    const blend = 0.35 + Math.random() * 0.3;
    const perturbed = usable.map((country) => ({
      id: country.id,
      score:
        reweight(country, 'economic', economicDefs, economicWeights) * blend +
        reweight(country, 'governance', governanceDefs, governanceWeights) * (1 - blend),
    }));
    const rho = spearman(baseline, ranksOf(perturbed));
    if (rho !== null) correlations.push(rho);
  }
  correlations.sort((a, b) => a - b);
  return {
    draws: correlations.length,
    minimum: Number(correlations[0].toFixed(3)),
    median: Number(correlations[Math.floor(correlations.length / 2)].toFixed(3)),
  };
}

export function buildDiagnostics(countries, economicDefs, governanceDefs) {
  const bothPillars = countries.filter(
    (country) => country.economic?.score != null && country.governance?.score != null,
  );
  const betweenPillars = pearson(
    bothPillars.map((country) => country.economic.score),
    bothPillars.map((country) => country.governance.score),
  );

  return {
    economic: pillarRedundancy(countries, 'economic', economicDefs),
    governance: pillarRedundancy(countries, 'governance', governanceDefs),
    betweenPillars: betweenPillars === null ? null : Number(betweenPillars.toFixed(3)),
    weightSensitivity: weightSensitivity(countries, economicDefs, governanceDefs),
  };
}
