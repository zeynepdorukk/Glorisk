import { describe, expect, it } from 'vitest';

import { ranks, spearman, splitCsvLine } from '../../scripts/etl/validation.mjs';

describe('splitCsvLine', () => {
  it('keeps quoted commas inside a field', () => {
    expect(splitCsvLine('"Bahamas, The",BHS,2023,0.5,Americas')).toEqual([
      'Bahamas, The',
      'BHS',
      '2023',
      '0.5',
      'Americas',
    ]);
  });

  it('handles escaped quotes and empty trailing cells', () => {
    expect(splitCsvLine('"a ""b""",XXX,2020,,')).toEqual(['a "b"', 'XXX', '2020', '', '']);
  });

  it('leaves unquoted rows alone', () => {
    expect(splitCsvLine('Turkey,TUR,2024,12.5')).toEqual(['Turkey', 'TUR', '2024', '12.5']);
  });
});

describe('ranks', () => {
  it('averages tied values instead of ordering them arbitrarily', () => {
    // Conflict death rates are zero for most countries, so ties dominate.
    expect(ranks([0, 0, 0, 5])).toEqual([2, 2, 2, 4]);
    expect(ranks([3, 1, 2])).toEqual([3, 1, 2]);
  });
});

describe('spearman', () => {
  const range = (n) => Array.from({ length: n }, (_, i) => i);

  it('is 1 for a monotonic relationship regardless of scale', () => {
    const xs = range(20);
    const ys = xs.map((x) => Math.exp(x / 5));
    expect(spearman(xs, ys)).toBeCloseTo(1, 6);
  });

  it('is -1 when the order is reversed', () => {
    const xs = range(20);
    expect(spearman(xs, [...xs].reverse())).toBeCloseTo(-1, 6);
  });

  it('survives a sample that is mostly ties', () => {
    const xs = [...Array(15).fill(0), 1, 2, 3, 4, 5];
    const ys = [...Array(15).fill(0), 1, 2, 3, 4, 5];
    expect(spearman(xs, ys)).toBeCloseTo(1, 6);
  });

  it('refuses samples too small to mean anything', () => {
    expect(spearman([1, 2, 3], [1, 2, 3])).toBeNull();
  });
});
