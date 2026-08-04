/** Compact inline chart used for risk trajectories and indicator history. */
export default function Sparkline({ points, color = '#38bdf8', width = 96, height = 28, ariaLabel }) {
  if (!points || points.length < 2) {
    return <div className="text-xs text-neutral-600" style={{ width, height }} aria-hidden="true" />;
  }

  const values = points.map(([, value]) => value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = width / (points.length - 1);

  const path = points
    .map(([, value], index) => {
      const x = index * step;
      const y = height - ((value - min) / span) * (height - 4) - 2;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const last = points[points.length - 1];
  const lastX = width;
  const lastY = height - ((last[1] - min) / span) * (height - 4) - 2;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel} className="overflow-visible">
      <path d={path} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="2.5" fill={color} />
    </svg>
  );
}
