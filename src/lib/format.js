export function formatValue(value, unit, locale = 'en-US') {
  if (value === null || value === undefined) return '—';
  const compactNumber = new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 });
  const rounded = Math.abs(value) >= 1000 ? compactNumber.format(value) : new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
  if (!unit) return rounded;
  return unit === '%' ? `${rounded}%` : `${rounded} ${unit}`;
}

export function formatDate(iso, locale) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Removes diacritics so that "Turkiye" also matches "Türkiye". */
export function normalise(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
