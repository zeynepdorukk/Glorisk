import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

import { RISK_BANDS, ECONOMIC_INDICATORS, GOVERNANCE_INDICATORS } from '../lib/riskModel.js';
import { formatDate } from '../lib/format.js';

function WeightTable({ title, definitions, unitNote }) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-white">{title}</h4>
      <p className="mb-2 text-xs text-neutral-500">{unitNote}</p>
      <ul className="divide-y divide-white/5 rounded-lg border border-white/10">
        {definitions.map((definition) => (
          <li key={definition.key} className="flex items-baseline justify-between gap-4 px-3 py-2">
            <span className="text-sm text-neutral-200">
              {definition.label}
              <span className="block text-[11px] text-neutral-500">{definition.description}</span>
            </span>
            <span className="shrink-0 font-mono text-sm text-sky-300">{Math.round(definition.weight * 100)}%</span>
          </li>
        ))}
      </ul>
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
              Every country score is recomputed from public data by an automated pipeline — nothing is hand-tuned. Each
              indicator is mapped onto a 0-100 risk scale between a &ldquo;good&rdquo; and a &ldquo;bad&rdquo; anchor
              value, the indicators are averaged with the weights below, and the two pillars are blended into the
              composite score. You can change that blend with the slider in the header.
            </p>
          </section>

          <WeightTable
            title="Economic pillar"
            definitions={ECONOMIC_INDICATORS}
            unitNote="World Bank Open Data. Each indicator is clamped between its best and worst anchor before scoring."
          />

          <WeightTable
            title="Governance pillar"
            definitions={GOVERNANCE_INDICATORS}
            unitNote="Worldwide Governance Indicators, published as a 0-100 governance score (higher is better). Risk is 100 minus that score."
          />

          <section>
            <h4 className="mb-2 text-sm font-semibold text-white">Missing data</h4>
            <p>
              Indicators are not published for every country. When a value is missing — or older than six years — its
              weight is redistributed across the indicators that remain, and the share of the model that survived is
              reported as coverage. A pillar is only used in the headline score once enough of its weight is covered,
              which is why some countries are labelled <em>limited data</em>: they are scored from a single pillar and
              should be read as indicative.
            </p>
          </section>

          <section>
            <h4 className="mb-2 text-sm font-semibold text-white">Bands</h4>
            <p className="mb-2 text-xs text-neutral-500">
              Colours are global quintiles of the current blend, so each band always holds a fifth of the scored
              countries. Fixed cut-offs would leave most of the world in one colour, because composite scores cluster in
              a narrow range.
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
            travel advisory. Governance indicators are published annually and lag reality by a year or more, macro
            statistics are revised, and a single composite number can never capture why a country is risky. Treat it as
            a starting point for research, not a verdict.
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
