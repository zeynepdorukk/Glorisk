import { useMemo } from 'react';
import { useI18n } from '../i18n.jsx';

const SIZE = { width: 460, height: 460, pad: 44 };
const TICKS = [0, 25, 50, 75, 100];

/**
 * Economic risk against governance risk, one dot per country. The shape of the
 * cloud is the argument: if the two pillars measured the same thing it would be
 * a diagonal line.
 */
export default function PillarScatter({ countries, highlighted = [], selectedId, onSelect }) {
  const { copy, countryName } = useI18n();
  const { width, height, pad } = SIZE;
  const plotted = useMemo(
    () =>
      countries.filter(
        (country) => country.economic?.usable && country.governance?.usable && country.band,
      ),
    [countries],
  );

  const x = (value) => pad + (value / 100) * (width - pad * 2);
  const y = (value) => height - pad - (value / 100) * (height - pad * 2);

  const labelled = plotted.filter((country) => highlighted.includes(country.id));

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label={copy.scatter.aria(plotted.length)}
      >
        <rect x={pad} y={pad} width={width - pad * 2} height={height - pad * 2} fill="rgba(255,255,255,0.02)" rx="6" />

        {TICKS.map((tick) => (
          <g key={tick}>
            <line x1={x(tick)} y1={pad} x2={x(tick)} y2={height - pad} stroke="rgba(255,255,255,0.06)" />
            <line x1={pad} y1={y(tick)} x2={width - pad} y2={y(tick)} stroke="rgba(255,255,255,0.06)" />
            <text x={x(tick)} y={height - pad + 16} textAnchor="middle" className="fill-neutral-600 text-[10px]">
              {tick}
            </text>
            <text x={pad - 8} y={y(tick) + 3} textAnchor="end" className="fill-neutral-600 text-[10px]">
              {tick}
            </text>
          </g>
        ))}

        {plotted.map((country) => {
          const isHighlighted = highlighted.includes(country.id);
          const isSelected = country.id === selectedId;
          return (
            <circle
              key={country.id}
              cx={x(country.economic.score)}
              cy={y(country.governance.score)}
              r={isSelected ? 6 : isHighlighted ? 5 : 3.4}
              fill={country.band.color}
              fillOpacity={isHighlighted || isSelected ? 1 : 0.55}
              stroke={isSelected ? '#ffffff' : isHighlighted ? 'rgba(255,255,255,0.8)' : 'none'}
              strokeWidth={isSelected ? 2 : 1.25}
              className="cursor-pointer transition-[r]"
              onClick={() => onSelect?.(country.id)}
            >
              <title>{copy.scatter.point(countryName(country), Math.round(country.economic.score), Math.round(country.governance.score))}</title>
            </circle>
          );
        })}

        {labelled.map((country) => (
          <text
            key={`label-${country.id}`}
            x={x(country.economic.score) + 9}
            y={y(country.governance.score) + 4}
            className="fill-neutral-200 text-[11px] font-medium"
          >
            {countryName(country)}
          </text>
        ))}

        <text x={width / 2} y={height - 6} textAnchor="middle" className="fill-neutral-400 text-[11px]">
          {copy.scatter.economic}
        </text>
        <text
          x={-height / 2}
          y={13}
          textAnchor="middle"
          transform="rotate(-90)"
          className="fill-neutral-400 text-[11px]"
        >
          {copy.scatter.governance}
        </text>
      </svg>
    </figure>
  );
}
