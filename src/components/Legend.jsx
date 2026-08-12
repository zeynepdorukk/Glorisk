import { RISK_BANDS } from '../lib/riskModel.js';
import { useI18n } from '../i18n.jsx';

/**
 * Map legend that doubles as the band filter. Selecting a band dims every
 * country outside it instead of hiding the geometry, so the world stays legible.
 */
export default function Legend({ activeBand, thresholds, onSelect, scoredCount, totalCount }) {
  const { copy, bandLabel } = useI18n();
  const rangeFor = (index) => {
    const lower = index === 0 ? 0 : Math.round(thresholds[index - 1]);
    const upper = index === RISK_BANDS.length - 1 ? 100 : Math.round(thresholds[index]);
    return `${lower}-${upper}`;
  };

  return (
    <div className="pointer-events-auto rounded-xl border border-white/10 bg-neutral-950/80 p-3 shadow-2xl backdrop-blur-md">
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">{copy.legend.score}</span>
        <span className="text-[11px] text-neutral-500">
          {copy.legend.scored(scoredCount, totalCount)}
        </span>
      </div>
      <div className="flex gap-1" role="group" aria-label={copy.legend.filter}>
        {RISK_BANDS.map((band, index) => {
          const isActive = activeBand === band.id;
          return (
            <button
              key={band.id}
              type="button"
              onClick={() => onSelect(isActive ? 'all' : band.id)}
              aria-pressed={isActive}
              title={copy.legend.title(bandLabel(band), rangeFor(index))}
              className={`group flex w-14 flex-col gap-1 rounded-lg px-1 py-1 text-left transition ${
                isActive ? 'bg-white/10 ring-1 ring-white/30' : 'hover:bg-white/5'
              }`}
            >
              <span className="block h-1.5 w-full rounded-full" style={{ backgroundColor: band.color }} />
              <span className="text-[10px] leading-tight text-neutral-400 group-hover:text-neutral-200">{bandLabel(band)}</span>
              <span className="font-mono text-[10px] text-neutral-600">{rangeFor(index)}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[10px] text-neutral-600">{copy.legend.note}</p>
      {activeBand !== 'all' && (
        <button type="button" onClick={() => onSelect('all')} className="mt-1 text-[11px] text-sky-400 hover:text-sky-300">
          {copy.legend.clear}
        </button>
      )}
    </div>
  );
}
