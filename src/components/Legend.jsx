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
    <div className="pointer-events-auto rounded-lg border border-white/10 bg-neutral-950/80 p-2 shadow-2xl backdrop-blur-md sm:rounded-xl sm:p-3">
      <div className="mb-1 flex items-baseline justify-between gap-2 sm:mb-2 sm:gap-4">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-neutral-400 sm:text-[11px]">{copy.legend.score}</span>
        <span className="text-[9px] text-neutral-500 sm:text-[11px]">
          {copy.legend.scored(scoredCount, totalCount)}
        </span>
      </div>
      <div className="flex gap-0.5 sm:gap-1" role="group" aria-label={copy.legend.filter}>
        {RISK_BANDS.map((band, index) => {
          const isActive = activeBand === band.id;
          return (
            <button
              key={band.id}
              type="button"
              onClick={() => onSelect(isActive ? 'all' : band.id)}
              aria-pressed={isActive}
              title={copy.legend.title(bandLabel(band), rangeFor(index))}
              className={`group flex min-h-9 w-11 flex-col justify-center gap-0.5 rounded-md px-0.5 py-0.5 text-left transition sm:min-h-0 sm:w-14 sm:gap-1 sm:rounded-lg sm:px-1 sm:py-1 ${
                isActive ? 'bg-white/10 ring-1 ring-white/30' : 'hover:bg-white/5'
              }`}
            >
              <span className="block h-1 w-full rounded-full sm:h-1.5" style={{ backgroundColor: band.color }} />
              <span className="text-[8px] leading-none text-neutral-400 group-hover:text-neutral-200 sm:hidden">{copy.legend.shortBands[band.id]}</span>
              <span className="hidden text-[10px] leading-tight text-neutral-400 group-hover:text-neutral-200 sm:block">{bandLabel(band)}</span>
              <span className="font-mono text-[8px] leading-none text-neutral-600 sm:text-[10px] sm:leading-normal">{rangeFor(index)}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 hidden text-[10px] text-neutral-600 sm:block">{copy.legend.note}</p>
      {activeBand !== 'all' && (
        <button type="button" onClick={() => onSelect('all')} className="mt-1 text-[9px] text-sky-400 hover:text-sky-300 sm:text-[11px]">
          {copy.legend.clear}
        </button>
      )}
    </div>
  );
}
