/**
 * Lets the reader decide how much the economic and governance pillars matter.
 * The value is the share (0-100) given to the economic pillar.
 */
export default function WeightControl({ value, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <label htmlFor="pillar-weight" className="hidden text-[11px] uppercase tracking-wider text-neutral-500 lg:block">
        Blend
      </label>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] text-sky-400">{value}% eco</span>
        <input
          id="pillar-weight"
          type="range"
          min={0}
          max={100}
          step={5}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label="Weight given to the economic pillar versus governance"
          aria-valuetext={`${value}% economic, ${100 - value}% governance`}
          className="h-1 w-28 cursor-pointer appearance-none rounded-full bg-gradient-to-r from-sky-500 to-violet-500 accent-white"
        />
        <span className="font-mono text-[11px] text-violet-400">{100 - value}% gov</span>
      </div>
    </div>
  );
}
