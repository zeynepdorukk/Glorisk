import { useMemo, useState } from 'react';
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Lightbulb, Search } from 'lucide-react';

import Sparkline from './Sparkline.jsx';

const SORTS = {
  riskiest: { label: 'Riskiest first', compare: (a, b) => b.score - a.score, icon: ArrowDownWideNarrow },
  safest: { label: 'Safest first', compare: (a, b) => a.score - b.score, icon: ArrowUpNarrowWide },
};

export default function RankingPanel({
  countries,
  selectedId,
  bandFilter,
  onSelect,
  onOpenSearch,
  onOpenFindings,
  pillarCorrelation,
}) {
  const [sort, setSort] = useState('riskiest');
  const [region, setRegion] = useState('all');

  const regions = useMemo(
    () => [...new Set(countries.map((country) => country.region).filter(Boolean))].sort(),
    [countries],
  );

  const rows = useMemo(() => {
    return countries
      .filter((country) => country.score !== null)
      .filter((country) => region === 'all' || country.region === region)
      .filter((country) => bandFilter === 'all' || country.band?.id === bandFilter)
      .sort(SORTS[sort].compare);
  }, [countries, region, bandFilter, sort]);

  const SortIcon = SORTS[sort].icon;

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-3 border-b border-white/10 p-4">
        <button
          type="button"
          onClick={onOpenFindings}
          className="group flex w-full items-start gap-2.5 rounded-lg border border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-violet-500/10 px-3 py-2.5 text-left transition hover:border-sky-500/40"
        >
          <Lightbulb size={15} className="mt-0.5 shrink-0 text-amber-400" />
          <span className="min-w-0">
            <span className="block text-[12px] font-medium leading-snug text-white">
              Political and economic risk barely overlap
              {pillarCorrelation !== undefined && pillarCorrelation !== null && (
                <span className="font-mono text-sky-300"> (r {pillarCorrelation})</span>
              )}
            </span>
            <span className="mt-0.5 block text-[11px] text-neutral-400 group-hover:text-neutral-300">
              See what the data shows →
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenSearch}
          className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-400 transition hover:border-white/20 hover:text-neutral-200"
        >
          <Search size={15} />
          <span className="flex-1 text-left">Search countries</span>
          <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-sans text-[10px] text-neutral-400">Ctrl K</kbd>
        </button>

        <div className="flex gap-2">
          <select
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            aria-label="Filter by region"
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-neutral-900 px-2 py-1.5 text-xs text-neutral-300 outline-none focus:border-sky-500"
          >
            <option value="all">All regions</option>
            {regions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setSort(sort === 'riskiest' ? 'safest' : 'riskiest')}
            title={SORTS[sort].label}
            aria-label={`Sorted by ${SORTS[sort].label}. Click to reverse.`}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-neutral-300 transition hover:border-white/20 hover:text-white"
          >
            <SortIcon size={14} />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto" role="listbox" aria-label="Country risk ranking">
        {rows.length === 0 && <p className="p-6 text-center text-sm text-neutral-500">No country matches these filters.</p>}
        {rows.map((country) => {
          const isSelected = country.id === selectedId;
          return (
            <button
              key={country.id}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => onSelect(country.id)}
              className={`flex w-full items-center gap-3 border-l-2 px-4 py-2.5 text-left transition ${
                isSelected ? 'border-l-white bg-white/10' : 'border-l-transparent hover:bg-white/5'
              }`}
            >
              <span className="w-7 shrink-0 font-mono text-[11px] text-neutral-600">#{country.rank}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-sm text-white">{country.name}</span>
                  {country.confidence === 'low' && (
                    <span title="Limited data — scored from a single pillar" className="shrink-0 text-[10px] text-amber-400">
                      ●
                    </span>
                  )}
                </span>
                <span className="block truncate text-[11px] text-neutral-500">{country.region}</span>
              </span>
              <Sparkline
                points={country.trajectory}
                color={country.band.color}
                width={48}
                height={18}
                ariaLabel={`${country.name} risk trend`}
              />
              <span
                className="w-9 shrink-0 rounded-md px-1.5 py-1 text-center font-mono text-xs font-semibold text-neutral-950"
                style={{ backgroundColor: country.band.color }}
              >
                {Math.round(country.score)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
