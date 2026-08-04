import { describe, expect, it } from 'vitest';

import {
  ECONOMIC_INDICATORS,
  GOVERNANCE_INDICATORS,
  RISK_BANDS,
  bandFor,
  bandThresholds,
  confidenceLevel,
  percentileOf,
  pillarScore,
  quantile,
  referenceDistribution,
  scoreIndicator,
  totalRisk,
} from './riskModel.js';

const uniform = referenceDistribution(Array.from({ length: 1001 }, (_, i) => i / 10));

describe('referenceDistribution', () => {
  it('condenses a sample into one breakpoint per percentile', () => {
    expect(uniform.breakpoints).toHaveLength(101);
    expect(uniform.count).toBe(1001);
    expect(uniform.breakpoints[0]).toBe(0);
    expect(uniform.breakpoints[100]).toBe(100);
  });

  it('ignores non-numeric observations', () => {
    expect(referenceDistribution([1, Number.NaN, 3]).count).toBe(2);
    expect(referenceDistribution([])).toBeNull();
  });
});

describe('percentileOf', () => {
  it('places a value at its rank in the distribution', () => {
    expect(percentileOf(uniform.breakpoints, 50)).toBeCloseTo(50, 1);
    expect(percentileOf(uniform.breakpoints, 25)).toBeCloseTo(25, 1);
  });

  it('clamps values outside the observed range', () => {
    expect(percentileOf(uniform.breakpoints, -1000)).toBe(0);
    expect(percentileOf(uniform.breakpoints, 1000)).toBe(100);
  });

  it('resolves a flat stretch to its midpoint instead of an edge', () => {
    const flat = referenceDistribution([...Array(80).fill(5), ...Array(20).fill(9)]);
    const position = percentileOf(flat.breakpoints, 5);
    expect(position).toBeGreaterThan(0);
    expect(position).toBeLessThan(80);
  });

  it('is monotonic over a skewed sample', () => {
    // Long right tail: the kind of distribution that breaks min-max anchoring.
    const skewed = referenceDistribution([...Array(95).fill(2), 40, 90, 300, 1200, 9000]);
    const low = percentileOf(skewed.breakpoints, 3);
    const mid = percentileOf(skewed.breakpoints, 90);
    const high = percentileOf(skewed.breakpoints, 5000);
    expect(low).toBeLessThan(mid);
    expect(mid).toBeLessThan(high);
    expect(high).toBeLessThanOrEqual(100);
  });
});

describe('scoreIndicator', () => {
  it('inverts the percentile when lower values are riskier', () => {
    expect(scoreIndicator(90, uniform, 'higher-is-riskier')).toBeCloseTo(90, 1);
    expect(scoreIndicator(90, uniform, 'lower-is-riskier')).toBeCloseTo(10, 1);
  });

  it('returns null when there is nothing to score', () => {
    expect(scoreIndicator(null, uniform, 'higher-is-riskier')).toBeNull();
    expect(scoreIndicator(Number.NaN, uniform, 'higher-is-riskier')).toBeNull();
    expect(scoreIndicator(5, null, 'higher-is-riskier')).toBeNull();
  });
});

describe('pillarScore', () => {
  it('averages the indicators that have data and reports the coverage', () => {
    const result = pillarScore([100, 0, null, null]);
    expect(result.score).toBe(50);
    expect(result.coverage).toBe(0.5);
  });

  it('weights every indicator equally', () => {
    expect(pillarScore([0, 0, 0, 60]).score).toBe(15);
  });

  it('reports no score when every indicator is missing', () => {
    expect(pillarScore([null, null])).toEqual({ score: null, coverage: 0 });
  });
});

describe('totalRisk', () => {
  it('blends the two pillars with the supplied weights', () => {
    expect(totalRisk(40, 80, { economic: 0.5, governance: 0.5 })).toBe(60);
    expect(totalRisk(40, 80, { economic: 0.75, governance: 0.25 })).toBe(50);
  });

  it('falls back to the single available pillar', () => {
    expect(totalRisk(null, 80)).toBe(80);
    expect(totalRisk(40, null)).toBe(40);
    expect(totalRisk(null, null)).toBeNull();
  });
});

describe('bandThresholds and bandFor', () => {
  it('splits a sample into five roughly equal bands', () => {
    const scores = Array.from({ length: 100 }, (_, index) => index + 1);
    const thresholds = bandThresholds(scores);
    const counts = new Map(RISK_BANDS.map((band) => [band.id, 0]));
    for (const score of scores) {
      const id = bandFor(score, thresholds).id;
      counts.set(id, counts.get(id) + 1);
    }
    for (const count of counts.values()) expect(count).toBeGreaterThanOrEqual(19);
  });

  it('falls back to fixed cut-offs when the sample is too small', () => {
    expect(bandThresholds([50, 60])).toEqual([20, 40, 60, 80]);
  });

  it('ignores missing scores', () => {
    expect(bandFor(null, [20, 40, 60, 80])).toBeNull();
  });
});

describe('confidenceLevel', () => {
  const pillar = (coverage, usable = true) => ({ coverage, usable });

  it('drops to low confidence when a pillar failed its gate', () => {
    expect(confidenceLevel(pillar(0.2, false), pillar(1))).toBe('low');
    expect(confidenceLevel(pillar(1), pillar(0.2, false))).toBe('low');
  });

  it('separates full coverage from partial coverage', () => {
    expect(confidenceLevel(pillar(1), pillar(1))).toBe('high');
    expect(confidenceLevel(pillar(0.5), pillar(1))).toBe('medium');
  });
});

describe('quantile', () => {
  it('interpolates between neighbouring samples', () => {
    expect(quantile([0, 10, 20, 30], 0.5)).toBeCloseTo(15, 5);
    expect(quantile([7], 0.9)).toBe(7);
    expect(quantile([], 0.5)).toBeNull();
  });
});

describe('model definitions', () => {
  it('uses unique keys so lookups cannot collide', () => {
    const keys = [...ECONOMIC_INDICATORS, ...GOVERNANCE_INDICATORS].map((i) => i.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('declares a direction for every indicator', () => {
    for (const definition of [...ECONOMIC_INDICATORS, ...GOVERNANCE_INDICATORS]) {
      expect(['higher-is-riskier', 'lower-is-riskier']).toContain(definition.direction);
    }
  });

  it('carries no hand-set weights, since weighting is equal by design', () => {
    for (const definition of [...ECONOMIC_INDICATORS, ...GOVERNANCE_INDICATORS]) {
      expect(definition.weight).toBeUndefined();
    }
  });
});
