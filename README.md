# Glorisk

An interactive world map of country risk, scored from public data.

**Live: https://zeynepdorukk.github.io/Glorisk/**

Every score is derived by an automated pipeline from World Bank macro-economic
statistics and the Worldwide Governance Indicators — nothing is hand-tuned, and
the exact weights are published in the app.

## What it does

- **Choropleth world map** — 200+ countries coloured by composite risk, with a
  dark or satellite basemap and place labels above the fill.
- **Adjustable model** — a slider re-blends the economic and governance pillars
  and the map, ranking and bands recolour live.
- **Ranking panel** — sortable and filterable by region and risk band.
- **Country detail** — pillar breakdown, every underlying indicator with its
  value, year and 10-year sparkline, a risk trajectory, a data-confidence badge
  and where the country sits within its region, income group and nearest peers.
- **Search palette** — `Ctrl`/`Cmd` + `K` or `/`.
- **Shareable state** — the selected country, band filter and pillar blend all
  live in the URL, e.g. `?c=TUR&w=70`.

## The score

| Pillar | Source | Indicators |
| --- | --- | --- |
| Economic | World Bank Open Data | inflation (25%), GDP growth (20%), unemployment (15%), government debt (15%), current account (15%), reserves cover (10%) |
| Governance | Worldwide Governance Indicators | political stability (35%), rule of law (20%), control of corruption (15%), government effectiveness (15%), voice and accountability (10%), regulatory quality (5%) |

Each indicator is mapped onto a 0-100 risk scale between a best and a worst
anchor value. Missing indicators — or observations older than six years — have
their weight redistributed across whatever remains, and the surviving share is
reported as coverage. A pillar only enters the headline score once enough of it
is covered; countries left with a single pillar are still shown, flagged as
*limited data*, because the places with the weakest statistics are often the
ones with the highest risk.

Map colours are **global quintiles** of the current blend rather than fixed
cut-offs: composite scores cluster in a narrow range, so fixed thresholds would
paint most of the world one colour.

## Architecture

There is no server. A Node pipeline fetches the data, does all of the scoring,
and writes static JSON that the site loads straight from disk — so the browser
never talks to a rate-limited third-party API at page load.

```
scripts/etl/
  worldbank.mjs   paginated World Bank client with retries
  build.mjs       scores every country, writes public/data/*
  verify.mjs      sanity checks the output before it is committed
src/lib/
  riskModel.js    indicator definitions, weights, scoring (shared with the ETL)
  useRiskData.js  loads the datasets, re-blends on weight changes, bands
public/data/
  countries.json  latest values, pillar scores, trajectory, confidence
  history/<ISO3>  10-year series per indicator, loaded on demand
```

A scheduled GitHub Actions job rebuilds the datasets daily, verifies them,
commits them only if something changed, and redeploys the site.

## Development

```bash
npm install
npm run dev        # dev server
npm test           # risk model unit tests
npm run lint
npm run build

npm run etl        # rebuild public/data from the World Bank API
npm run etl:verify # sanity check the generated datasets
```

## Limitations

This is an open-data project, not an investment or travel advisory. Governance
indicators are published annually and lag reality, macro statistics are revised,
and a single composite number can never capture why a country is risky.

A live news layer was prototyped on top of GDELT and removed: the API refuses
shared addresses, omits CORS headers on throttled responses, and its topical
queries returned articles unrelated to the country being viewed. Showing
plausible-looking but wrong headlines next to a risk score is worse than showing
none.

Data: [World Bank Open Data](https://data.worldbank.org),
[Worldwide Governance Indicators](https://www.worldbank.org/en/publication/worldwide-governance-indicators).
Basemap tiles © OpenStreetMap contributors, © CARTO.
