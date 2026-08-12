import { useEffect, useMemo, useRef } from 'react';
import { X } from 'lucide-react';

import PillarScatter from './PillarScatter.jsx';
import { useI18n } from '../i18n.jsx';

/** Countries whose profiles make the point without any explanation. */
const HIGHLIGHTED = ['RUS', 'GRC', 'CHN', 'USA'];

function CorrelationRow({ check }) {
  const { validationLabel } = useI18n();
  const strength = Math.abs(check.rho ?? 0);
  const colour = strength >= 0.7 ? '#10b981' : strength >= 0.3 ? '#eab308' : '#71717a';
  return (
    <li className="flex items-center gap-3 py-1.5">
      <span className="min-w-0 flex-1 truncate text-sm text-neutral-200">{validationLabel(check.label)}</span>
      <span className="hidden shrink-0 text-[11px] text-neutral-600 sm:block">n={check.countries}</span>
      <span className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-white/10">
        <span
          className="block h-full rounded-full"
          style={{ width: `${Math.min(strength, 1) * 100}%`, backgroundColor: colour }}
        />
      </span>
      <span className="w-12 shrink-0 text-right font-mono text-sm text-white">
        {check.rho === null ? '—' : check.rho.toFixed(2)}
      </span>
    </li>
  );
}

export default function FindingsModal({ open, countries, meta, selectedId, onSelect, onClose }) {
  const { copy, countryName } = useI18n();
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

  const mirrors = useMemo(() => {
    const byId = new Map(countries.map((country) => [country.id, country]));
    return ['RUS', 'GRC'].map((id) => byId.get(id)).filter(Boolean);
  }, [countries]);

  if (!open) return null;

  const validation = meta?.validation;
  const betweenPillars = meta?.diagnostics?.betweenPillars;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="findings-title"
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 id="findings-title" className="text-lg font-semibold text-white">
            {copy.findings.title}
          </h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label={copy.findings.close} className="rounded-full p-1.5 text-neutral-400 transition hover:bg-white/10 hover:text-white">
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-5 py-5 text-sm leading-relaxed text-neutral-300">
          <section>
            <h3 className="mb-2 text-base font-semibold text-white">
              {copy.findings.mainTitle}
            </h3>
            <p>
              {copy.findings.mainBody(meta?.countryCount ?? 200, betweenPillars)}
            </p>
            <p className="mt-2">
              {copy.findings.cloud}
            </p>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <PillarScatter
              countries={countries}
              highlighted={HIGHLIGHTED}
              selectedId={selectedId}
              onSelect={(id) => {
                onSelect(id);
                onClose();
              }}
            />
            <p className="mt-1 text-center text-[11px] text-neutral-500">
              {copy.findings.scatterNote}
            </p>
          </section>

          {mirrors.length === 2 && (
            <section>
              <h3 className="mb-2 text-base font-semibold text-white">{copy.findings.oneNumber}</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {mirrors.map((country) => (
                  <div key={country.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-medium text-white">{countryName(country)}</span>
                      <span className="font-mono text-lg text-white">{Math.round(country.score)}</span>
                    </div>
                    <dl className="mt-2 space-y-1 text-[12px]">
                      <div className="flex justify-between">
                        <dt className="text-neutral-400">{copy.findings.economic}</dt>
                        <dd className="font-mono text-sky-300">{Math.round(country.economic.score)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-neutral-400">{copy.findings.governance}</dt>
                        <dd className="font-mono text-violet-300">{Math.round(country.governance.score)}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
              <p className="mt-2">
                {copy.findings.mirrors(countryName(mirrors[0]), countryName(mirrors[1]))}
              </p>
            </section>
          )}

          {validation && (
            <section>
              <h3 className="mb-1 text-base font-semibold text-white">{copy.findings.outside}</h3>
              <p className="mb-4 text-neutral-400">
                {copy.findings.outsideBody} {copy.findings.validationMethod}
              </p>

              <h4 className="mb-1 text-sm font-semibold text-white">{copy.findings.institutions}</h4>
              <p className="mb-2 text-[12px] text-neutral-500">
                {copy.findings.institutionsBody}
              </p>
              <ul className="mb-5 divide-y divide-white/5 rounded-lg border border-white/10 px-3">
                {validation.convergent.map((check) => (
                  <CorrelationRow key={check.label} check={check} />
                ))}
              </ul>

              <h4 className="mb-1 text-sm font-semibold text-white">{copy.findings.outcome}</h4>
              <p className="mb-2 text-[12px] text-neutral-500">
                {copy.findings.outcomeBody}
              </p>
              <ul className="divide-y divide-white/5 rounded-lg border border-white/10 px-3">
                {validation.criterion.map((check) => (
                  <CorrelationRow key={check.label} check={check} />
                ))}
              </ul>

              <p className="mt-3">
                {copy.findings.conclusion}
              </p>
            </section>
          )}
        </div>

        <footer className="border-t border-white/10 px-5 py-3 text-[11px] text-neutral-500">
          {copy.findings.footer}
        </footer>
      </div>
    </div>
  );
}
