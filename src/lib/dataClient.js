/**
 * Loads the static datasets produced by the ETL pipeline. Every payload is
 * fetched at most once per session and shared between components.
 */

const asset = (file) => `${import.meta.env.BASE_URL}data/${file}`;

const cache = new Map();

async function loadJson(file) {
  if (!cache.has(file)) {
    const promise = fetch(asset(file))
      .then((res) => {
        if (!res.ok) throw new Error(`${file}: ${res.status} ${res.statusText}`);
        return res.json();
      })
      .catch((error) => {
        // A failed fetch must not poison the cache for later retries.
        cache.delete(file);
        throw error;
      });
    cache.set(file, promise);
  }
  return cache.get(file);
}

export const loadCountries = () => loadJson('countries.json');
export const loadGeometry = () => loadJson('world.geo.json');
export const loadMeta = () => loadJson('meta.json');
export const loadNews = () => loadJson('news.json');
export const loadHistory = (iso3) => loadJson(`history/${iso3}.json`);
