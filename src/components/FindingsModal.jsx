import { useEffect, useMemo, useRef } from 'react';
import { X } from 'lucide-react';

import PillarScatter from './PillarScatter.jsx';

/** Countries whose profiles make the point without any explanation. */
const HIGHLIGHTED = ['RUS', 'GRC', 'CHN', 'USA'];

function CorrelationRow({ check }) {
  const strength = Math.abs(check.rho ?? 0);
  const colour = strength >= 0.7 ? '#10b981' : strength >= 0.3 ? '#eab308' : '#71717a';
  return (
    <li className="flex items-center gap-3 py-1.5">
      <span className="min-w-0 flex-1 truncate text-sm text-neutral-200">{check.label}</span>
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
            What the data shows
          </h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-neutral-400 transition hover:bg-white/10 hover:text-white">
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-5 py-5 text-sm leading-relaxed text-neutral-300">
          <section>
            <h3 className="mb-2 text-base font-semibold text-white">
              Political risk and economic risk are not the same thing
            </h3>
            <p>
              They are spoken about as one — a country is &ldquo;risky&rdquo; and that covers everything. Across the{' '}
              {meta?.countryCount ?? 200} countries scored here the two pillars correlate at{' '}
              <strong className="font-mono text-white">r&nbsp;{betweenPillars}</strong>. Knowing how a country scores on
              institutions tells you close to nothing about how it scores on its macroeconomy.
            </p>
            <p className="mt-2">
              If they measured the same underlying thing, the cloud below would be a diagonal line. It is a blob.
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
              One dot per country, coloured by composite band. Click a dot to open it.
            </p>
          </section>

          {mirrors.length === 2 && (
            <section>
              <h3 className="mb-2 text-base font-semibold text-white">Why one number hides things</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {mirrors.map((country) => (
                  <div key={country.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-medium text-white">{country.name}</span>
                      <span className="font-mono text-lg text-white">{Math.round(country.score)}</span>
                    </div>
                    <dl className="mt-2 space-y-1 text-[12px]">
                      <div className="flex justify-between">
                        <dt className="text-neutral-400">Economic</dt>
                        <dd className="font-mono text-sky-300">{Math.round(country.economic.score)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-neutral-400">Governance</dt>
                        <dd className="font-mono text-violet-300">{Math.round(country.governance.score)}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
              <p className="mt-2">
                Near-identical composites, opposite profiles. {mirrors[0].name} carries institutional risk with a
                comparatively steady macroeconomy; {mirrors[1].name} is the reverse. Collapsing that into a single
                number throws away the only part a reader could act on — which is why the pillars stay visible, and why
                the blend between them is a slider rather than a decision made on the reader&rsquo;s behalf.
              </p>
            </section>
          )}

          {validation && (
            <section>
              <h3 className="mb-1 text-base font-semibold text-white">Does the score survive an outside check?</h3>
              <p className="mb-4 text-neutral-400">
                A composite can be internally tidy and still measure nothing. Two tests run on every build, both against
                sources this project does not control. {validation.method}
              </p>

              <h4 className="mb-1 text-sm font-semibold text-white">Against expert-coded institutions (V-Dem)</h4>
              <p className="mb-2 text-[12px] text-neutral-500">
                The governance data here comes from perception-based surveys. V-Dem is built the other way round —
                country experts coding against explicit definitions — so agreement is not guaranteed by construction.
              </p>
              <ul className="mb-5 divide-y divide-white/5 rounded-lg border border-white/10 px-3">
                {validation.convergent.map((check) => (
                  <CorrelationRow key={check.label} check={check} />
                ))}
              </ul>

              <h4 className="mb-1 text-sm font-semibold text-white">Against an outcome (conflict deaths, UCDP)</h4>
              <p className="mb-2 text-[12px] text-neutral-500">
                The standing objection to perception-based governance data is that it may capture what informed
                observers believe rather than what happens. Deaths per 100,000 in ongoing armed conflict is not a
                perception.
              </p>
              <ul className="divide-y divide-white/5 rounded-lg border border-white/10 px-3">
                {validation.criterion.map((check) => (
                  <CorrelationRow key={check.label} check={check} />
                ))}
              </ul>

              <p className="mt-3">
                The political stability component tracks actual conflict deaths, and the economic pillar does not —
                which is the two-pillar argument again, this time confirmed against something outside the model
                entirely. It is also a warning: the composite predicts violence far less well than its stability
                component alone, so a single risk number is the wrong tool for that question.
              </p>
            </section>
          )}
        </div>

        <footer className="border-t border-white/10 px-5 py-3 text-[11px] text-neutral-500">
          Recomputed on every data refresh — these figures are read from the published dataset, not written by hand.
        </footer>
      </div>
    </div>
  );
}
