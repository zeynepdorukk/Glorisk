import { useMemo } from 'react';
import { Users } from 'lucide-react';
import { useI18n } from '../i18n.jsx';

/**
 * Puts a score in context: how the country ranks inside its World Bank region
 * and income group, and which countries sit immediately either side of it.
 * Derived from data that is always present, unlike any live feed.
 */
export default function RegionalContext({ country, countries, onSelect }) {
  const { copy, regionLabel, incomeLabel, countryName } = useI18n();
  const context = useMemo(() => {
    if (country.score === null) return null;

    const rankWithin = (pool) => {
      const sorted = pool.filter((entry) => entry.score !== null).sort((a, b) => b.score - a.score);
      const position = sorted.findIndex((entry) => entry.id === country.id);
      return position === -1 ? null : { position: position + 1, total: sorted.length, sorted };
    };

    const region = rankWithin(countries.filter((entry) => entry.region === country.region));
    const income = country.incomeLevel
      ? rankWithin(countries.filter((entry) => entry.incomeLevel === country.incomeLevel))
      : null;

    const global = countries
      .filter((entry) => entry.score !== null)
      .sort((a, b) => Math.abs(a.score - country.score) - Math.abs(b.score - country.score))
      .filter((entry) => entry.id !== country.id)
      .slice(0, 3);

    return { region, income, neighbours: global };
  }, [country, countries]);

  if (!context) return null;

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
        <Users size={15} className="text-sky-400" />
        {copy.context.title}
      </h3>

      <dl className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-white/5 p-3">
          <dt className="text-[11px] text-neutral-500">{copy.context.inRegion(regionLabel(country.region))}</dt>
          <dd className="mt-0.5 text-sm text-white">
            {context.region ? (
              <>
                <span className="text-neutral-500">{copy.context.riskiest(context.region.position, context.region.total)}</span>
              </>
            ) : (
              '—'
            )}
          </dd>
        </div>
        <div className="rounded-lg bg-white/5 p-3">
          <dt className="truncate text-[11px] text-neutral-500">{country.incomeLevel ? incomeLabel(country.incomeLevel) : copy.context.incomeGroup}</dt>
          <dd className="mt-0.5 text-sm text-white">
            {context.income ? (
              <>
                <span className="text-neutral-500">{copy.context.ofTotal(context.income.position, context.income.total)}</span>
              </>
            ) : (
              '—'
            )}
          </dd>
        </div>
      </dl>

      <p className="mb-2 text-[11px] uppercase tracking-wider text-neutral-500">{copy.context.closest}</p>
      <ul className="space-y-1.5">
        {context.neighbours.map((peer) => (
          <li key={peer.id}>
            <button
              type="button"
              onClick={() => onSelect(peer.id)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-white/5"
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: peer.band.color }} />
              <span className="min-w-0 flex-1 truncate text-sm text-neutral-200">{countryName(peer)}</span>
              <span className="truncate text-[11px] text-neutral-600">{regionLabel(peer.region)}</span>
              <span className="w-8 shrink-0 text-right font-mono text-xs text-neutral-300">{Math.round(peer.score)}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
