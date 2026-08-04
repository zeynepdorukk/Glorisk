const compactNumber = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

export function formatValue(value, unit) {
  if (value === null || value === undefined) return '—';
  const rounded = Math.abs(value) >= 1000 ? compactNumber.format(value) : value.toFixed(1);
  if (!unit) return rounded;
  return unit === '%' ? `${rounded}%` : `${rounded} ${unit}`;
}

export function formatDate(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Removes diacritics so that "Turkiye" also matches "Türkiye". */
export function normalise(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
