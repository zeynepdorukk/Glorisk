import { useEffect, useState } from 'react';
import { Info, X } from 'lucide-react';

import Sparkline from './Sparkline.jsx';
import RegionalContext from './RegionalContext.jsx';
import { loadHistory } from '../lib/dataClient.js';
import { formatValue } from '../lib/format.js';
import { CONFIDENCE_LEVELS, ECONOMIC_INDICATORS, GOVERNANCE_INDICATORS } from '../lib/riskModel.js';

const CONFIDENCE_STYLE = {
  high: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  medium: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  low: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
};

function IndicatorRow({ definition, component, history, isGovernance }) {
  const score = component?.score ?? null;
  return (
    <li className="py-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-1.5 text-sm text-neutral-200" title={definition.description}>
          {definition.label}
          <Info size={11} className="text-neutral-600" />
        </span>
        <span className="flex items-baseline gap-2">
          <span className="font-mono text-sm text-white">
            {isGovernance
              ? component?.value === undefined || component?.value === null
                ? '—'
                : `${component.value.toFixed(1)}/100`
              : formatValue(component?.value, definition.unit)}
          </span>
          <span className="font-mono text-[10px] text-neutral-600">{component?.year ?? 'n/a'}</span>
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-rose-500 transition-[width] duration-500"
            style={{ width: `${score ?? 0}%`, opacity: score === null ? 0.15 : 1 }}
          />
        </div>
        <Sparkline points={history} color="#71717a" width={40} height={14} ariaLabel={`${definition.label} history`} />
        <span className="w-8 text-right font-mono text-[11px] text-neutral-500">{score === null ? '—' : Math.round(score)}</span>
      </div>
    </li>
  );
}

function Pillar({ title, pillar, definitions, history, isGovernance }) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <header className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <span className="font-mono text-lg text-white">
          {pillar?.usable && pillar.score !== null ? Math.round(pillar.score) : '—'}
          <span className="text-xs text-neutral-600">/100</span>
        </span>
      </header>
      <p className="mb-1 text-[11px] text-neutral-500">
        {Math.round((pillar?.coverage ?? 0) * 100)}% of the model weight is backed by data
        {!pillar?.usable && ' — excluded from the headline score'}
      </p>
      <ul className="divide-y divide-white/5">
        {definitions.map((definition) => (
          <IndicatorRow
            key={definition.key}
            definition={definition}
            component={pillar?.components?.[definition.key]}
            history={history?.[definition.key]}
            isGovernance={isGovernance}
          />
        ))}
      </ul>
    </section>
  );
}

/** Remounted per country by the parent, so the loader starts from a clean slate. */
export default function CountryPanel({ country, countries, onSelect, onClose }) {
  const [history, setHistory] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadHistory(country.id)
      .then((data) => !cancelled && setHistory(data))
      .catch(() => !cancelled && setHistory({}));
    return () => {
      cancelled = true;
    };
  }, [country.id]);

  const confidence = CONFIDENCE_LEVELS[country.confidence];
  const trend = country.trajectory?.length > 1
    ? country.trajectory[country.trajectory.length - 1][1] - country.trajectory[0][1]
    : null;

  return (
    <aside className="flex h-full flex-col bg-neutral-950/95 backdrop-blur-xl" aria-label={`${country.name} risk detail`}>
      <header className="flex items-start justify-between gap-3 border-b border-white/10 p-4">
        <div className="flex min-w-0 items-center gap-3">
          {country.iso2 && (
            <img
              src={`https://flagcdn.com/w40/${country.iso2.toLowerCase()}.png`}
              alt=""
              width={32}
              height={24}
              loading="lazy"
              className="h-6 w-8 shrink-0 rounded object-cover ring-1 ring-white/10"
            />
          )}
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-white">{country.name}</h2>
            <p className="truncate text-[11px] text-neutral-500">
              {country.region}
              {country.incomeLevel ? ` · ${country.incomeLevel}` : ''}
            </p>
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close country detail" className="rounded-full p-1.5 text-neutral-500 transition hover:bg-white/10 hover:text-white">
          <X size={18} />
        </button>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-neutral-500">Composite risk</p>
              <p className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">{country.score === null ? '—' : Math.round(country.score)}</span>
                <span className="text-sm text-neutral-600">/100</span>
              </p>
            </div>
            <div className="text-right">
              <span
                className="inline-block rounded-full px-2.5 py-1 text-xs font-semibold text-neutral-950"
                style={{ backgroundColor: country.band?.color ?? '#52525b' }}
              >
                {country.band?.label ?? 'No data'}
              </span>
              <p className="mt-1.5 text-[11px] text-neutral-500">
                #{country.rank} riskiest · {country.percentileNow}th percentile
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 border-t border-white/5 pt-3">
            <Sparkline points={country.trajectory} color={country.band?.color} width={140} height={32} ariaLabel="Risk trajectory" />
            <div className="text-[11px] leading-tight text-neutral-500">
              {trend === null ? (
                'No trajectory available'
              ) : (
                <>
                  <span className={trend > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                    {trend > 0 ? '+' : ''}
                    {trend.toFixed(1)} pts
                  </span>{' '}
                  since {country.trajectory[0][0]}
                </>
              )}
            </div>
          </div>

          <p className={`mt-3 rounded-lg border px-2.5 py-1.5 text-[11px] ${CONFIDENCE_STYLE[country.confidence]}`}>
            <strong>{confidence?.label}</strong> — {confidence?.description}
          </p>
        </section>

        <Pillar title="Economic risk" pillar={country.economic} definitions={ECONOMIC_INDICATORS} history={history} />
        <Pillar title="Governance risk" pillar={country.governance} definitions={GOVERNANCE_INDICATORS} history={history} isGovernance />

        <RegionalContext country={country} countries={countries} onSelect={onSelect} />
      </div>
    </aside>
  );
}
