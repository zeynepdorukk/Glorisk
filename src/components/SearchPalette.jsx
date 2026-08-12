import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

import { normalise } from '../lib/format.js';
import { useI18n } from '../i18n.jsx';

/** Command-palette style country search. Mounted only while open. */
export default function SearchPalette({ countries, onSelect, onClose }) {
  const { copy, countryName } = useI18n();
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    const term = normalise(query.trim());
    if (!term) {
      return [...countries]
        .filter((country) => country.score !== null)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
    }
    // Prefix matches win over matches buried in the middle of a name.
    return countries
      .filter((country) => country.searchKey.includes(term) || normalise(countryName(country)).includes(term))
      .map((country) => ({ country, rank: country.searchKey.startsWith(term) || normalise(countryName(country)).startsWith(term) ? 0 : 1 }))
      .sort((a, b) => a.rank - b.rank || (b.country.score ?? 0) - (a.country.score ?? 0))
      .slice(0, 8)
      .map((entry) => entry.country);
  }, [countries, query, countryName]);

  useEffect(() => {
    listRef.current?.querySelector('[data-highlighted="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [highlighted, results]);

  const commit = (country) => {
    if (!country) return;
    onSelect(country.id);
    onClose();
  };

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlighted((index) => (index + 1) % Math.max(results.length, 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlighted((index) => (index - 1 + results.length) % Math.max(results.length, 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      commit(results[highlighted]);
    } else if (event.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-start justify-center bg-black/70 p-4 pt-[12vh] backdrop-blur-sm" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={copy.search.dialog}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4">
          <Search size={18} className="shrink-0 text-neutral-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setHighlighted(0);
            }}
            onKeyDown={onKeyDown}
            placeholder={copy.search.placeholder}
            aria-label={copy.search.input}
            className="w-full bg-transparent py-4 text-base text-white outline-none placeholder:text-neutral-600"
          />
          <button type="button" onClick={onClose} aria-label={copy.search.close} className="rounded-full p-1.5 text-neutral-500 hover:bg-white/10 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <ul ref={listRef} className="max-h-80 overflow-y-auto py-2" role="listbox" aria-label={copy.search.results}>
          {results.length === 0 && <li className="px-4 py-6 text-center text-sm text-neutral-500">{copy.search.empty(query)}</li>}
          {results.map((country, index) => (
            <li key={country.id}>
              <button
                type="button"
                role="option"
                aria-selected={index === highlighted}
                data-highlighted={index === highlighted}
                onMouseEnter={() => setHighlighted(index)}
                onClick={() => commit(country)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition ${
                  index === highlighted ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: country.band?.color ?? '#52525b' }} />
                  <span className="text-sm text-white">{countryName(country)}</span>
                  <span className="font-mono text-[11px] text-neutral-600">{country.id}</span>
                </span>
                <span className="font-mono text-sm text-neutral-400">{country.score === null ? '—' : Math.round(country.score)}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4 border-t border-white/10 px-4 py-2 text-[11px] text-neutral-600">
          <span><kbd className="rounded bg-white/10 px-1">↑</kbd> <kbd className="rounded bg-white/10 px-1">↓</kbd> {copy.search.navigate}</span>
          <span><kbd className="rounded bg-white/10 px-1">↵</kbd> {copy.search.select}</span>
          <span><kbd className="rounded bg-white/10 px-1">esc</kbd> {copy.search.closeShort}</span>
        </div>
      </div>
    </div>
  );
}
