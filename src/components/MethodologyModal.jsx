import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

import { RISK_BANDS, ECONOMIC_INDICATORS, GOVERNANCE_INDICATORS } from '../lib/riskModel.js';
import { LITERATURE, doiUrl } from '../lib/literature.js';
import { formatDate } from '../lib/format.js';
import { useI18n } from '../i18n.jsx';

function IndicatorList({ title, definitions, note }) {
  const { copy, indicator } = useI18n();
  return (
    <div>
      <h4 className="mb-1 text-sm font-semibold text-white">{title}</h4>
      <p className="mb-2 text-xs text-neutral-500">{note}</p>
      <ul className="divide-y divide-white/5 rounded-lg border border-white/10">
        {definitions.map((definition) => {
          const text = indicator(definition);
          return <li key={definition.key} className="flex items-baseline justify-between gap-4 px-3 py-2">
            <span className="text-sm text-neutral-200">
              {text.label}
              <span className="block text-[11px] text-neutral-500">{text.description}</span>
            </span>
            <span className="shrink-0 whitespace-nowrap text-[11px] text-neutral-500">
              {definition.direction === 'higher-is-riskier' ? copy.methodology.higher : copy.methodology.lower}
            </span>
          </li>;
        })}
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
  const { copy, bandLabel, literatureRole, sourceDescription, locale } = useI18n();
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
            {copy.methodology.title}
          </h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label={copy.methodology.close} className="rounded-full p-1.5 text-neutral-400 transition hover:bg-white/10 hover:text-white">
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 text-sm leading-relaxed text-neutral-300">
          <section>
            <p>
              {copy.methodology.introBefore}{' '}<strong className="text-white">{copy.methodology.percentile}</strong>{' '}
              {copy.methodology.introAfter}
            </p>
          </section>

          <section>
            <h4 className="mb-2 text-sm font-semibold text-white">{copy.methodology.whyPercentiles}</h4>
            <p>{copy.methodology.percentilesBody}</p>
          </section>

          <section>
            <h4 className="mb-2 text-sm font-semibold text-white">{copy.methodology.whyWeights}</h4>
            <p>{copy.methodology.weightsBody}</p>
            {diagnostics && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {sensitivity && (
                  <Diagnostic label={copy.methodology.rankStability} value={`ρ ${sensitivity.median}`}>
                    {copy.methodology.rankBody(sensitivity.draws, sensitivity.minimum)}
                  </Diagnostic>
                )}
                <Diagnostic label={copy.methodology.pillarsOverlap} value={`r ${diagnostics.betweenPillars}`}>
                  {copy.methodology.overlapBody}
                </Diagnostic>
                <Diagnostic label={copy.methodology.governanceRedundancy} value={`r ${diagnostics.governance.meanCorrelation}`}>
                  {copy.methodology.governanceBody}
                </Diagnostic>
                <Diagnostic label={copy.methodology.economicRedundancy} value={`r ${diagnostics.economic.meanCorrelation}`}>
                  {copy.methodology.economicBody}
                </Diagnostic>
              </div>
            )}
          </section>

          <IndicatorList
            title={copy.methodology.economicPillar}
            definitions={ECONOMIC_INDICATORS}
            note={copy.methodology.economicNote}
          />

          <IndicatorList
            title={copy.methodology.governancePillar}
            definitions={GOVERNANCE_INDICATORS}
            note={copy.methodology.governanceNote}
          />

          <section>
            <h4 className="mb-2 text-sm font-semibold text-white">{copy.methodology.missing}</h4>
            <p>{copy.methodology.missingBody}</p>
          </section>

          <section>
            <h4 className="mb-2 text-sm font-semibold text-white">{copy.methodology.bands}</h4>
            <p className="mb-2 text-xs text-neutral-500">
              {copy.methodology.bandsBody}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {RISK_BANDS.map((band, index) => (
                <div key={band.id} className="rounded-lg border border-white/10 p-2">
                  <span className="block h-1.5 w-full rounded-full" style={{ backgroundColor: band.color }} />
                  <span className="mt-1.5 block text-xs text-white">{bandLabel(band)}</span>
                  <span className="font-mono text-[10px] text-neutral-500">
                    {index === 0 ? 0 : Math.round(thresholds[index - 1])}-
                    {index === RISK_BANDS.length - 1 ? 100 : Math.round(thresholds[index])}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h4 className="mb-2 text-sm font-semibold text-white">{copy.methodology.literature}</h4>
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
                  <span className="mt-0.5 block text-[12px] text-neutral-400">{literatureRole(work)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h4 className="mb-2 text-sm font-semibold text-white">{copy.methodology.literature}</h4>
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
                  <span className="mt-0.5 block text-[12px] text-neutral-400">{literatureRole(work)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h4 className="mb-2 text-sm font-semibold text-white">{copy.methodology.sources}</h4>
            <ul className="space-y-1">
              {(meta?.sources ?? []).map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300">
                    {source.name}
                  </a>
                  <span className="text-neutral-500"> — {sourceDescription(source.description)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200/90">
            <strong className="text-amber-200">{copy.methodology.limitations}</strong>{' '}{copy.methodology.limitationsBody}
          </section>
        </div>

        <footer className="border-t border-white/10 px-5 py-3 text-[11px] text-neutral-500">
          {copy.methodology.footer(formatDate(generatedAt, locale), meta?.countryCount ?? 0, meta?.yearRange?.join('–'))}
        </footer>
      </div>
    </div>
  );
}
