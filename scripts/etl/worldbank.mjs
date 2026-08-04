/** Minimal World Bank Indicators API client with pagination and retries. */

const BASE = 'https://api.worldbank.org/v2';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson(url, { attempts = 4 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { accept: 'application/json' } });
      const text = await res.text();
      if (!text.trimStart().startsWith('[') && !text.trimStart().startsWith('{')) {
        throw new Error(`non-JSON response (${res.status})`);
      }
      const json = JSON.parse(text);
      if (json[0]?.message) {
        throw new Error(json[0].message.map((m) => m.value).join('; '));
      }
      return json;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(500 * 2 ** attempt);
    }
  }
  throw new Error(`World Bank request failed: ${url}\n  ${lastError.message}`);
}

/** Fetches every page of an endpoint and concatenates the data rows. */
async function getAllPages(path, params, { perPage = 500 } = {}) {
  const rows = [];
  let page = 1;
  let totalPages = 1;
  do {
    const query = new URLSearchParams({ format: 'json', per_page: String(perPage), page: String(page), ...params });
    const json = await getJson(`${BASE}${path}?${query}`);
    totalPages = json[0]?.pages ?? 1;
    rows.push(...(json[1] ?? []));
    page += 1;
  } while (page <= totalPages);
  return rows;
}

/** Country metadata: ISO codes, region and income classification. */
export async function fetchCountries() {
  const rows = await getAllPages('/country', {}, { perPage: 300 });
  return rows
    // Aggregates such as "World" or "Euro area" carry no region id.
    .filter((row) => row.region?.id && row.region.id !== 'NA' && row.id)
    .map((row) => ({
      id: row.id,
      iso2: row.iso2Code,
      name: row.name.trim(),
      region: row.region.value.trim(),
      incomeLevel: row.incomeLevel?.value?.trim() ?? null,
      capital: row.capitalCity?.trim() || null,
      latitude: row.latitude ? Number(row.latitude) : null,
      longitude: row.longitude ? Number(row.longitude) : null,
    }));
}

/**
 * Fetches one indicator for every country over a year range.
 * Returns a Map of ISO3 -> [{ year, value }] sorted ascending by year.
 */
export async function fetchIndicator(code, { from, to, source }) {
  const params = { date: `${from}:${to}` };
  if (source) params.source = String(source);
  // Source 3 (governance) rejects large page sizes.
  const perPage = source ? 200 : 1000;
  const rows = await getAllPages(`/country/all/indicator/${code}`, params, { perPage });

  const series = new Map();
  for (const row of rows) {
    const iso3 = row.countryiso3code;
    if (!iso3 || row.value === null) continue;
    const year = Number(row.date);
    if (!Number.isFinite(year)) continue;
    if (!series.has(iso3)) series.set(iso3, []);
    series.get(iso3).push({ year, value: Number(row.value) });
  }
  for (const points of series.values()) points.sort((a, b) => a.year - b.year);
  return series;
}
