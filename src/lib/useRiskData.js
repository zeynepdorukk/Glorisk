import { useEffect, useMemo, useState } from 'react';

import { loadCountries, loadGeometry, loadMeta } from './dataClient.js';
import { bandFor, bandThresholds, totalRisk } from './riskModel.js';
import { normalise } from './format.js';

/**
 * Loads the datasets once and recomputes the blended score whenever the user
 * changes the pillar weights.
 */
export function useRiskData(weights) {
  const [state, setState] = useState({ status: 'loading', countries: [], geometry: null, meta: null, error: null });

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadCountries(), loadGeometry(), loadMeta()])
      .then(([countries, geometry, meta]) => {
        if (cancelled) return;
        setState({ status: 'ready', countries: countries.countries, generatedAt: countries.generatedAt, geometry, meta, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ status: 'error', countries: [], geometry: null, meta: null, error });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const scored = useMemo(() => {
    const list = state.countries.map((country) => {
      const economic = country.economic?.usable ? country.economic.score : null;
      const governance = country.governance?.usable ? country.governance.score : null;
      const score = totalRisk(economic, governance, weights);
      return {
        ...country,
        score: score === null ? null : Number(score.toFixed(1)),
        searchKey: normalise(`${country.name} ${country.sourceName ?? ''} ${country.id}`),
      };
    });

    const ranked = list.filter((country) => country.score !== null).sort((a, b) => a.score - b.score);
    const thresholds = bandThresholds(ranked.map((country) => country.score));
    ranked.forEach((country, index) => {
      country.rank = ranked.length - index;
      country.percentileNow = ranked.length < 2 ? 50 : Math.round((index / (ranked.length - 1)) * 100);
      country.band = bandFor(country.score, thresholds);
    });
    return { list, thresholds };
  }, [state.countries, weights]);

  const byId = useMemo(() => new Map(scored.list.map((country) => [country.id, country])), [scored]);

  return {
    ...state,
    countries: scored.list,
    thresholds: scored.thresholds,
    byId,
    scoredCount: scored.list.filter((country) => country.score !== null).length,
  };
}
