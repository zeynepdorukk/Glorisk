/**
 * On-demand GDELT lookup for countries the daily harvest did not cover.
 *
 * The public API answers rate-limit problems with plain text rather than an
 * error status, and allows only one request every few seconds per IP, so calls
 * are serialised and every failure is reported as a plain message instead of
 * being thrown at the UI.
 */

const ENDPOINT = 'https://api.gdeltproject.org/api/v2/doc/doc';
const MIN_INTERVAL_MS = 6000;

const cache = new Map();
let queue = Promise.resolve();
let lastCall = 0;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function throttled(task) {
  const run = queue.then(async () => {
    const wait = MIN_INTERVAL_MS - (Date.now() - lastCall);
    if (wait > 0) await sleep(wait);
    try {
      return await task();
    } finally {
      lastCall = Date.now();
    }
  });
  queue = run.catch(() => {});
  return run;
}

function parseSeenDate(raw) {
  if (!raw || raw.length < 15) return null;
  const iso = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T${raw.slice(9, 11)}:${raw.slice(11, 13)}:${raw.slice(13, 15)}Z`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function fetchLiveNews(countryName, iso3) {
  if (cache.has(iso3)) return cache.get(iso3);

  const query = `"${countryName}" (economy OR inflation OR protest OR election OR conflict OR sanctions OR unrest) sourcelang:eng`;
  const params = new URLSearchParams({
    query,
    mode: 'artlist',
    maxrecords: '8',
    format: 'json',
    sort: 'datedesc',
    timespan: '3d',
  });

  const result = await throttled(async () => {
    const res = await fetch(`${ENDPOINT}?${params}`, { signal: AbortSignal.timeout(20000) });
    const text = await res.text();
    if (!text.trimStart().startsWith('{')) {
      throw new Error('GDELT is rate limiting right now — try again in a few seconds.');
    }
    const json = JSON.parse(text);
    return {
      articles: (json.articles ?? [])
        .filter((article) => article.url && article.title)
        .map((article) => ({
          title: article.title.trim(),
          url: article.url,
          domain: article.domain,
          seenAt: parseSeenDate(article.seendate),
        })),
      tone: null,
      live: true,
    };
  });

  cache.set(iso3, result);
  return result;
}
