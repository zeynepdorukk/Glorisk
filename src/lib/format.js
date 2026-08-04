const compactNumber = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

export function formatValue(value, unit) {
  if (value === null || value === undefined) return '—';
  const rounded = Math.abs(value) >= 1000 ? compactNumber.format(value) : value.toFixed(1);
  if (!unit) return rounded;
  return unit === '%' ? `${rounded}%` : `${rounded} ${unit}`;
}

export function formatScore(score) {
  return score === null || score === undefined ? '—' : Math.round(score).toString();
}

export function formatDate(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function relativeTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const diffHours = Math.round((date.getTime() - Date.now()) / 36e5);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  if (Math.abs(diffHours) < 24) return formatter.format(diffHours, 'hour');
  return formatter.format(Math.round(diffHours / 24), 'day');
}

/** Removes diacritics so that "Turkiye" also matches "Türkiye". */
export function normalise(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
