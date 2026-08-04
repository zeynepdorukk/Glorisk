import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

import { RISK_BANDS, ECONOMIC_INDICATORS, GOVERNANCE_INDICATORS } from '../lib/riskModel.js';
import { LITERATURE, doiUrl } from '../lib/literature.js';
import { formatDate } from '../lib/format.js';

function IndicatorList({ title, definitions, note }) {
  return (
    <div>
      <h4 className="mb-1 text-sm font-semibold text-white">{title}</h4>
      <p className="mb-2 text-xs text-neutral-500">{note}</p>
      <ul className="divide-y divide-white/5 rounded-lg border border-white/10">
        {definitions.map((definition) => (
          <li key={definition.key} className="flex items-baseline justify-between gap-4 px-3 py-2">
            <span className="text-sm text-neutral-200">
              {definition.label}
              <span className="block text-[11px] text-neutral-500">{definition.description}</span>
            </span>
            <span className="shrink-0 whitespace-nowrap text-[11px] text-neutral-500">
              {definition.direction === 'higher-is-riskier' ? 'higher = riskier' : 'lower = riskier'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Diagnostic({ label, value, children }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs text-neutral-400">{label}</span>
        <span className="font-mono text-base text-white">{value}</span>
      </div>
      <p className="mt-1 text-[11px] leading-snug text-neutral-500">{children}</p>
    </div>
  );
}

export default function MethodologyModal({ open, meta, generatedAt, thresholds = [20, 40, 60, 80], onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    closeRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const diagnostics = meta?.diagnostics;
  const sensitivity = diagnostics?.weightSensitivity;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="methodology-title"
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 id="methodology-title" className="text-lg font-semibold text-white">
            How the score is built
          </h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-neutral-400 transition hover:bg-white/10 hover:text-white">
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 text-sm leading-relaxed text-neutral-300">
          <section>
            <p>
              Twelve published indicators, recomputed from scratch by an automated pipeline. Every value is converted
              into a <strong className="text-white">percentile rank</strong> against a reference distribution pooled
              over every country and every year in the dataset, the ranks are averaged into two pillars, and the pillars
              are blended into the composite. The blend is the only number you can change — and the only one that
              meaningfully moves the ranking.
            </p>
          </section>

          <section>
            <h4 className="mb-2 text-sm font-semibold text-white">Why percentiles rather than thresholds</h4>
            <p>
              Deciding that 2% inflation scores zero and 50% scores a hundred would be an opinion dressed as a
              measurement, and several of these indicators have long tails — a handful of hyperinflation years would
              otherwise compress everyone else into the bottom of the scale. A percentile rank asks a question the data
              can answer on its own: how does this country compare with the roughly two thousand country-years on
              record? It also puts every indicator on the same footing, which is what makes averaging them defensible.
            </p>
          </section>

          <section>
            <h4 className="mb-2 text-sm font-semibold text-white">Why equal weights</h4>
            <p>
              Nothing in the literature says political stability deserves 35% and regulatory quality 5%. Where there is
              no theoretical or statistical basis for differential weights, the standard practice for composite
              indicators is to weight equally and publish a sensitivity analysis instead of inventing numbers. So that
              is what happens here — and the pipeline measures how much it matters:
            </p>
            {diagnostics && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {sensitivity && (
                  <Diagnostic label="Rank stability" value={`ρ ${sensitivity.median}`}>
                    Median Spearman correlation with the published ranking across {sensitivity.draws} random
                    weightings (every indicator weight drawn from ±50%, blend from 35-65%). Worst draw:{' '}
                    {sensitivity.minimum}. The weights are not doing the work.
                  </Diagnostic>
                )}
                <Diagnostic label="Pillars overlap" value={`r ${diagnostics.betweenPillars}`}>
                  Correlation between the economic and governance pillars. Near zero, so the two carry genuinely
                  independent information and both are worth keeping.
                </Diagnostic>
                <Diagnostic label="Governance redundancy" value={`r ${diagnostics.governance.meanCorrelation}`}>
                  Mean pairwise correlation inside the governance pillar — {diagnostics.governance.strongestPair?.pair}{' '}
                  alone reaches {diagnostics.governance.strongestPair?.r}. These six measures largely track one
                  underlying construct; averaging them estimates it more reliably, but it is not six independent
                  readings.
                </Diagnostic>
                <Diagnostic label="Economic redundancy" value={`r ${diagnostics.economic.meanCorrelation}`}>
                  The same figure for the economic pillar. Near zero: these six really are separate signals.
                </Diagnostic>
              </div>
            )}
          </section>

          <IndicatorList
            title="Economic pillar"
            definitions={ECONOMIC_INDICATORS}
            note="World Bank Open Data. Six indicators, equally weighted."
          />

          <IndicatorList
            title="Governance pillar"
            definitions={GOVERNANCE_INDICATORS}
            note="Worldwide Governance Indicators, published as a 0-100 score where higher means better governed."
          />

          <section>
            <h4 className="mb-2 text-sm font-semibold text-white">Missing data</h4>
            <p>
              Indicators are not published for every country, and statistics are thinnest exactly where risk is highest.
              An observation older than six years counts as missing; the remaining indicators are averaged and the share
              that survived is reported as coverage. A pillar needs a third of its economic indicators, or half of its
              governance indicators, to count toward the headline score. Countries left with one usable pillar are still
              scored and ranked but flagged <em>limited data</em> — dropping them would blank out much of the map's
              worst quarter.
            </p>
          </section>

          <section>
            <h4 className="mb-2 text-sm font-semibold text-white">Bands</h4>
            <p className="mb-2 text-xs text-neutral-500">
              Colours are global quintiles of the current blend, so each band always holds a fifth of the scored
              countries.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {RISK_BANDS.map((band, index) => (
                <div key={band.id} className="rounded-lg border border-white/10 p-2">
                  <span className="block h-1.5 w-full rounded-full" style={{ backgroundColor: band.color }} />
                  <span className="mt-1.5 block text-xs text-white">{band.label}</span>
                  <span className="font-mono text-[10px] text-neutral-500">
                    {index === 0 ? 0 : Math.round(thresholds[index - 1])}-
                    {index === RISK_BANDS.length - 1 ? 100 : Math.round(thresholds[index])}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h4 className="mb-2 text-sm font-semibold text-white">Literature</h4>
            <ul className="space-y-3">
              {LITERATURE.map((work) => (
                <li key={work.id}>
                  <a
                    href={doiUrl(work.doi)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:text-sky-300"
                  >
                    {work.authors} ({work.year}). {work.title}
                  </a>
                  <span className="text-neutral-500">. {work.venue}.</span>
                  <span className="mt-0.5 block text-[12px] text-neutral-400">{work.role}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h4 className="mb-2 text-sm font-semibold text-white">Literature</h4>
            <ul className="space-y-3">
              {LITERATURE.map((work) => (
                <li key={work.id}>
                  <a
                    href={doiUrl(work.doi)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:text-sky-300"
                  >
                    {work.authors} ({work.year}). {work.title}
                  </a>
                  <span className="text-neutral-500">. {work.venue}.</span>
                  <span className="mt-0.5 block text-[12px] text-neutral-400">{work.role}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h4 className="mb-2 text-sm font-semibold text-white">Sources</h4>
            <ul className="space-y-1">
              {(meta?.sources ?? []).map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300">
                    {source.name}
                  </a>
                  <span className="text-neutral-500"> — {source.description}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200/90">
            <strong className="text-amber-200">Limitations.</strong> This is an open-data project, not an investment or
            travel advisory. Governance indicators are published once a year and lag reality. Percentile ranks are
            robust but ordinal: they say a country is in the worst 5% for inflation, not by how much. Averaging the two
            pillars is fully compensatory — strong institutions can offset a failing economy in the arithmetic, which
            is exactly why the components stay visible in the country panel.
          </section>
        </div>

        <footer className="border-t border-white/10 px-5 py-3 text-[11px] text-neutral-500">
          Data generated {formatDate(generatedAt)} · {meta?.countryCount ?? 0} countries · indicator years{' '}
          {meta?.yearRange?.join('–')}
        </footer>
      </div>
    </div>
  );
}
