/** Brand mark. Three geometric layers: reach, exposure, and the flagged core. */
export default function Logo({ size = 32, className }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label="Glorisk">
      <g fill="none" strokeWidth="5" strokeLinejoin="round">
        <path d="M32 5.5 58.5 32 32 58.5 5.5 32Z" stroke="#0EA5E9" />
        <path d="M32 18 46 32 32 46 18 32Z" stroke="#7C3AED" />
      </g>
      <path d="M32 26.5 37.5 32 32 37.5 26.5 32Z" fill="#F59E0B" />
    </svg>
  );
}
