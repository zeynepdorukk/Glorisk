import { describe, expect, it } from 'vitest';

import {
  ECONOMIC_INDICATORS,
  GOVERNANCE_INDICATORS,
  RISK_BANDS,
  bandFor,
  bandThresholds,
  confidenceLevel,
  quantile,
  scoreIndicator,
  totalRisk,
  weightedScore,
} from './riskModel.js';

describe('scoreIndicator', () => {
  const inflation = ECONOMIC_INDICATORS.find((i) => i.key === 'inflation').scale;
  const growth = ECONOMIC_INDICATORS.find((i) => i.key === 'growth').scale;

  it('maps the best anchor to zero risk and the worst anchor to full risk', () => {
    expect(scoreIndicator(2, inflation)).toBe(0);
    expect(scoreIndicator(50, inflation)).toBe(100);
  });

  it('handles indicators where lower values are riskier', () => {
    expect(scoreIndicator(6, growth)).toBe(0);
    expect(scoreIndicator(-5, growth)).toBe(100);
    expect(scoreIndicator(0.5, growth)).toBeCloseTo(50, 5);
  });

  it('clamps values beyond the anchors', () => {
    expect(scoreIndicator(500, inflation)).toBe(100);
    expect(scoreIndicator(-10, inflation)).toBe(0);
  });

  it('returns null for missing observations', () => {
    expect(scoreIndicator(null, inflation)).toBeNull();
    expect(scoreIndicator(undefined, inflation)).toBeNull();
    expect(scoreIndicator(Number.NaN, inflation)).toBeNull();
  });
});

describe('weightedScore', () => {
  it('renormalises the weights over the components that have data', () => {
    const result = weightedScore([
      { score: 100, weight: 0.5 },
      { score: 0, weight: 0.25 },
      { score: null, weight: 0.25 },
    ]);
    expect(result.score).toBeCloseTo(66.6667, 3);
    expect(result.coverage).toBeCloseTo(0.75, 5);
  });

  it('reports no score when every component is missing', () => {
    expect(weightedScore([{ score: null, weight: 1 }])).toEqual({ score: null, coverage: 0 });
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

describe('quantile', () => {
  it('interpolates between neighbouring samples', () => {
    expect(quantile([0, 10, 20, 30], 0.5)).toBeCloseTo(15, 5);
    expect(quantile([0, 10, 20, 30], 0)).toBe(0);
    expect(quantile([0, 10, 20, 30], 1)).toBe(30);
  });

  it('handles degenerate samples', () => {
    expect(quantile([], 0.5)).toBeNull();
    expect(quantile([7], 0.9)).toBe(7);
  });
});

describe('bandThresholds and bandFor', () => {
  it('splits a sample into five equally sized bands', () => {
    const scores = Array.from({ length: 100 }, (_, index) => index + 1);
    const thresholds = bandThresholds(scores);
    const counts = new Map(RISK_BANDS.map((band) => [band.id, 0]));
    for (const score of scores) counts.set(bandFor(score, thresholds).id, counts.get(bandFor(score, thresholds).id) + 1);
    for (const count of counts.values()) expect(count).toBeGreaterThanOrEqual(19);
  });

  it('falls back to fixed cut-offs when the sample is too small', () => {
    expect(bandThresholds([50, 60])).toEqual([20, 40, 60, 80]);
  });

  it('puts the highest scores in the top band and ignores missing scores', () => {
    const thresholds = bandThresholds([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
    expect(bandFor(100, thresholds).id).toBe('critical');
    expect(bandFor(10, thresholds).id).toBe('very-low');
    expect(bandFor(null, thresholds)).toBeNull();
  });
});

describe('confidenceLevel', () => {
  it('requires both pillars for anything above low confidence', () => {
    expect(confidenceLevel(0.2, 1)).toBe('low');
    expect(confidenceLevel(1, 0.2)).toBe('low');
  });

  it('separates full coverage from partial coverage', () => {
    expect(confidenceLevel(1, 1)).toBe('high');
    expect(confidenceLevel(0.5, 1)).toBe('medium');
  });
});

describe('model definitions', () => {
  it('keeps each pillar normalised to a total weight of one', () => {
    const sum = (list) => list.reduce((acc, item) => acc + item.weight, 0);
    expect(sum(ECONOMIC_INDICATORS)).toBeCloseTo(1, 5);
    expect(sum(GOVERNANCE_INDICATORS)).toBeCloseTo(1, 5);
  });

  it('uses unique keys so lookups cannot collide', () => {
    const keys = [...ECONOMIC_INDICATORS, ...GOVERNANCE_INDICATORS].map((i) => i.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
