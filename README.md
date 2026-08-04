<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/logo-wordmark-dark.svg" />
    <img src="public/logo-wordmark.svg" alt="Glorisk" height="56" />
  </picture>
</div>

A world map of country risk, scored from open data. Pick a country and you get
the number, the six economic and six governance indicators behind it, how far
each one is from where you would want it, and how the whole thing has moved over
the last decade.

**→ [zeynepdorukk.github.io/Glorisk](https://zeynepdorukk.github.io/Glorisk/)**

![The map with Türkiye selected](docs/screenshot-map.png)

## The score

Two pillars, twelve indicators, one number between 0 and 100.

| Economic pillar · World Bank | Governance pillar · WGI |
| --- | --- |
| Inflation | Political stability |
| GDP growth | Rule of law |
| Unemployment | Control of corruption |
| Government debt | Government effectiveness |
| Current account | Voice and accountability |
| Reserves cover | Regulatory quality |

Every observation becomes a **percentile rank** against a reference distribution
pooled over every country and every year in the dataset — roughly two thousand
country-years per indicator. The ranks are averaged into the two pillars, and the
pillars are blended 50/50 into the composite. That last ratio is the one real
judgement call, so it is a slider in the header rather than a constant: drag it
and the map, the ranking and the colour bands all recompute.

The whole model lives in [`src/lib/riskModel.js`](src/lib/riskModel.js), which
both the pipeline and the browser import, so the numbers can never drift apart.

### Percentiles, not hand-picked thresholds

An earlier version normalised each indicator between anchors I chose: 2%
inflation scores zero, 50% scores a hundred. That is an opinion dressed as a
measurement, and it behaves badly on skewed data — a handful of hyperinflation
years drags everyone else into the bottom of the scale, and every country above
the upper anchor collapses to the same value.

Percentile ranks ask a question the data can answer on its own: where does this
sit among the two thousand country-years on record? They are robust to outliers,
they need no thresholds, and they put all twelve indicators on the same footing,
which is what makes averaging them defensible in the first place. The reference
distribution is pooled across years rather than recomputed per year, so a
country's trajectory only moves when *it* changes, not when its peers do.

### Equal weights, and the evidence for them

Nothing says political stability deserves 35% and regulatory quality 5%. Where
there is no theoretical or statistical basis for differential weights, the
standard practice for composite indicators is equal weighting published together
with a sensitivity analysis — so the pipeline computes one on every run and the
app shows it:

| Diagnostic | Value | Reading |
| --- | ---: | --- |
| Rank stability under 500 random weightings | ρ 0.98 | Perturbing every weight by ±50% and the blend between 35-65% barely moves the ranking. The weights are not doing the work. |
| Correlation between the two pillars | r 0.02 | The economic and governance pillars carry independent information; both earn their place. |
| Mean pairwise correlation inside the governance pillar | r 0.82 | The six WGI measures largely track one construct — rule of law and control of corruption correlate at 0.95. Averaging them estimates that construct more reliably, but it is not six independent readings, and the app says so. |
| Mean pairwise correlation inside the economic pillar | r 0.05 | These six really are separate signals. |

### Missing data is the hard part

Statistics are thinnest exactly where risk is highest. Three rules keep that from
quietly corrupting the ranking:

- **Stale observations are dropped.** Anything older than six years counts as
  missing, so a 2018 debt figure cannot drive a 2026 score.
- **The loss is reported, not hidden.** A pillar is the mean of whichever
  indicators exist, and the share that survived is published as *coverage*.
- **A thin pillar is dropped, not the country.** A pillar needs a third of its
  economic indicators, or half of its governance indicators, to count toward the
  headline score. If only one pillar survives, the country is still scored and
  ranked but flagged *limited data* — an amber dot in the ranking and a badge in
  the panel. North Korea and Eritrea are in that group; silently dropping them
  would blank out part of the map's worst quarter.

An earlier version simply excluded any country that failed the gates. It removed
Yemen, Syria, Venezuela, Myanmar and North Korea — which is a strange thing for a
risk map to do.

### Why the colours are quintiles

Composite scores cluster toward the middle: averaging twelve percentile ranks
pulls countries in, and with fixed cut-offs at 20/40/60/80 most of the world came
out one shade. So the five bands are **global quintiles of the current blend** —
each band always holds a fifth of the scored countries, and the legend shows the
score range each one currently spans. Move the pillar slider and the thresholds
move with it.

![Filtering to the riskiest fifth](docs/screenshot-world.png)

## Architecture

There is no server. A Node pipeline pulls the data, does every bit of scoring,
and writes static JSON; the browser fetches those files and never talks to a
third-party API at page load. That is what makes the site fast, offline-friendly
for the CDN, and immune to someone else's rate limit.

```
scripts/etl/
  worldbank.mjs   paginated API client with retries
  build.mjs       scores 210 countries, writes public/data/*
  diagnostics.mjs redundancy and weight-sensitivity analysis
  verify.mjs      refuses to publish a broken dataset
scripts/branding/
  build-icons.mjs renders the favicon and PNG icons from public/logo.svg
src/lib/
  riskModel.js    indicators, weights, scoring, bands (shared with the ETL)
  useRiskData.js  loads the data, re-blends on weight change, ranks, bands
public/data/
  countries.json  latest values, pillar scores, trajectory, confidence  (230 kB)
  history/<ISO3>  ten-year series per indicator, fetched only when a country
                  is opened
  world.geo.json  country geometry, kept out of the JS bundle
```

A scheduled Action rebuilds the datasets every morning, runs `verify.mjs`,
commits **only if something actually changed**, and redeploys. `verify.mjs` is
the interesting half: it checks that at least 150 countries scored, that every
score is in range, that no ISO3 code is duplicated, that at least 90% of the map
polygons joined to a record, and that the indicator definitions in `meta.json`
still match the model. A World Bank outage fails the job instead of publishing a
half-empty map.

## Interface notes

- Selection, band filter and pillar blend all live in the URL:
  [`?c=TUR&w=70`](https://zeynepdorukk.github.io/Glorisk/?c=TUR&w=70) is a
  shareable view.
- `Ctrl`/`Cmd` + `K` or `/` opens a command palette; prefix matches rank above
  substring matches, so "turk" finds Türkiye before Turkmenistan.
- The choropleth sits on a CARTO dark basemap with place labels in a **pane above
  the fill**, so country names stay readable at 75% opacity.
- The GeoJSON layer is created once and restyled in place. Re-mounting 180
  polygons on every hover, as the first version did, is why it used to stutter.
- One layout is mounted at a time, chosen by a media query rather than by
  `hidden lg:block` — otherwise both the desktop panel and the mobile sheet exist
  in the DOM, fetch the same data twice, and hand screen readers two copies of
  every heading.

<img src="docs/screenshot-mobile.png" alt="The mobile layout" width="300" />

## Development

```bash
npm install
npm run dev         # Vite dev server
npm test            # unit tests for the scoring model
npm run lint
npm run build

npm run etl         # rebuild public/data from the World Bank API (~3 min)
npm run etl:verify  # sanity check the generated datasets
npm run icons       # regenerate favicon.ico and the PNG icons from the logo
```

The tests cover the parts where a silent mistake would be invisible on screen:
percentile placement against a skewed reference, ties resolving to the middle of
a flat stretch rather than to the end of the scale, coverage arithmetic when
indicators are missing, and quantile interpolation for the band cut-offs.

## Brand

Three nested geometric layers — reach, exposure, and the flagged core — in three
colours that carry through the interface.

| | Hex | Used for |
| --- | --- | --- |
| Sky | `#0EA5E9` | Outer layer, economic pillar, links |
| Violet | `#7C3AED` | Middle layer, governance pillar |
| Amber | `#F59E0B` | Core, limited-data flags, warnings |

`public/logo.svg` is the source; `npm run icons` renders `favicon.ico` (16-64),
`icon-192.png`, `icon-512.png` and `apple-touch-icon.png` from it. Icons at 32px
and below drop the middle layer, which turns to mush at that size, and the touch
icon ships on the dark tile because iOS ignores transparency. The wordmark comes
in two files rather than one adaptive file, because GitHub strips `<style>` from
proxied SVGs and a media query would leave the text invisible on one theme.

## Limitations

This is an open-data project, not an investment or travel advisory.

Governance indicators are published once a year and lag reality — the WGI figures
for a country at war can look surprisingly unremarkable. Macro statistics get
revised. Percentile ranks are robust but ordinal: they say a country is in the
worst 5% for inflation, not by how much, so the panel keeps the raw value and its
year next to every score. And averaging the two pillars is fully compensatory —
strong institutions offset a failing economy in the arithmetic, which is the main
reason the components stay visible rather than hidden behind one number.

A live news layer was built on GDELT and then removed. The API refuses shared
addresses, so the scheduled harvest returned almost nothing; it omits CORS headers
on throttled responses, so the in-browser fallback failed opaquely; and its
topical queries returned articles about other countries entirely — Argentina's
panel once listed a concert in Chile. Headlines that look plausible but belong
somewhere else are worse next to a risk score than no headlines at all. What
replaced it is the *In context* block: rank within region, rank within income
group, and the three closest scores worldwide, all derived from data that is
always there.

## Sources

- [World Bank Open Data](https://data.worldbank.org) — macro-economic indicators
- [Worldwide Governance Indicators](https://www.worldbank.org/en/publication/worldwide-governance-indicators) — governance scores, regions, income groups
- Basemap tiles © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, © [CARTO](https://carto.com/attributions)
- Flags from [flagcdn.com](https://flagcdn.com)
