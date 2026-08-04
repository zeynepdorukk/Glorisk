/**
 * GDELT DOC 2.0 client. The public API throttles hard - roughly one request
 * every few seconds per IP, and it answers with a plain-text warning rather
 * than a status code - so every call goes through a serialised queue and
 * failures are non-fatal: news is an optional enrichment layer on top of the
 * risk model.
 */

const ENDPOINT = 'https://api.gdeltproject.org/api/v2/doc/doc';
const MIN_INTERVAL_MS = Number(process.env.GDELT_INTERVAL_MS ?? 12000);
const RATE_LIMIT_BACKOFF_MS = 20000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let queue = Promise.resolve();
let lastCall = 0;

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

function buildQuery(countryName) {
  const terms = '(economy OR inflation OR protest OR election OR conflict OR sanctions OR unrest)';
  return `"${countryName}" ${terms} sourcelang:eng`;
}

/** GDELT timestamps look like 20260804T181500Z. */
function parseSeenDate(raw) {
  if (!raw || raw.length < 15) return null;
  const iso = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T${raw.slice(9, 11)}:${raw.slice(11, 13)}:${raw.slice(13, 15)}Z`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function request(params, { attempts = 2 } = {}) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const res = await throttled(() => fetch(`${ENDPOINT}?${params}`, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
      }));
      const text = await res.text();
      if (!text.trimStart().startsWith('{')) throw new Error(text.slice(0, 80).replace(/\s+/g, ' '));
      return JSON.parse(text);
    } catch (error) {
      if (attempt === attempts) throw error;
      await sleep(RATE_LIMIT_BACKOFF_MS);
    }
  }
  return null;
}

/** Recent English-language coverage mentioning the country. */
export async function fetchArticles(countryName, { maxRecords = 8, timespan = '3d' } = {}) {
  const params = new URLSearchParams({
    query: buildQuery(countryName),
    mode: 'artlist',
    maxrecords: String(maxRecords),
    format: 'json',
    sort: 'datedesc',
    timespan,
  });
  const json = await request(params);
  return (json?.articles ?? [])
    .filter((article) => article.url && article.title)
    .map((article) => ({
      title: article.title.trim(),
      url: article.url,
      domain: article.domain,
      seenAt: parseSeenDate(article.seendate),
      language: article.language ?? null,
    }));
}

/**
 * Average article tone over the last 30 days. GDELT tone runs roughly from -10
 * (very negative coverage) to +10; most countries sit between -5 and +2.
 */
export async function fetchToneTimeline(countryName, { timespan = '30d' } = {}) {
  const params = new URLSearchParams({
    query: buildQuery(countryName),
    mode: 'timelinetone',
    format: 'json',
    timespan,
  });
  const json = await request(params);
  const data = json?.timeline?.[0]?.data ?? [];
  const points = data
    .map((point) => ({ date: point.date?.slice(0, 8) ?? null, tone: Number(point.value) }))
    .filter((point) => point.date && Number.isFinite(point.tone));
  if (points.length === 0) return null;
  const average = points.reduce((sum, point) => sum + point.tone, 0) / points.length;
  return { average, points };
}
