import { useCallback, useEffect, useState } from 'react';

const KEYS = { country: 'c', weight: 'w', band: 'band' };

function readFromLocation() {
  const params = new URLSearchParams(window.location.search);
  const rawWeight = params.get(KEYS.weight);
  const weight = rawWeight === null ? Number.NaN : Number(rawWeight);
  return {
    countryId: params.get(KEYS.country)?.toUpperCase() || null,
    economicWeight: Number.isFinite(weight) && weight >= 0 && weight <= 100 ? weight : 50,
    band: params.get(KEYS.band) || 'all',
  };
}

function writeToLocation(state, { replace = false } = {}) {
  const params = new URLSearchParams(window.location.search);
  if (state.countryId) params.set(KEYS.country, state.countryId);
  else params.delete(KEYS.country);
  if (state.economicWeight !== 50) params.set(KEYS.weight, String(state.economicWeight));
  else params.delete(KEYS.weight);
  if (state.band !== 'all') params.set(KEYS.band, state.band);
  else params.delete(KEYS.band);

  const query = params.toString();
  const url = `${window.location.pathname}${query ? `?${query}` : ''}`;
  if (replace) window.history.replaceState(null, '', url);
  else window.history.pushState(null, '', url);
}

/**
 * Keeps the selected country, pillar weighting and band filter in the URL so
 * that any view of the map can be shared or bookmarked.
 */
export function useUrlState() {
  const [state, setState] = useState(readFromLocation);

  useEffect(() => {
    const onPopState = () => setState(readFromLocation());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const update = useCallback((patch, options) => {
    setState((previous) => {
      const next = { ...previous, ...patch };
      writeToLocation(next, options);
      return next;
    });
  }, []);

  return [state, update];
}
