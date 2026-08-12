import { useCallback, useEffect, useMemo, useState } from 'react';
import { Info, Layers, List, Loader2, Search, TriangleAlert } from 'lucide-react';

import CountryPanel from './components/CountryPanel.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import FindingsModal from './components/FindingsModal.jsx';
import Legend from './components/Legend.jsx';
import Logo from './components/Logo.jsx';
import MapView from './components/MapView.jsx';
import MethodologyModal from './components/MethodologyModal.jsx';
import RankingPanel from './components/RankingPanel.jsx';
import SearchPalette from './components/SearchPalette.jsx';
import WeightControl from './components/WeightControl.jsx';
import { useRiskData } from './lib/useRiskData.js';
import { useUrlState } from './lib/useUrlState.js';
import { useMediaQuery } from './lib/useMediaQuery.js';
import { formatDate } from './lib/format.js';
import { useI18n } from './i18n.jsx';

function LoadingScreen() {
  const { copy } = useI18n();
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-neutral-950 text-neutral-400">
      <Loader2 className="animate-spin text-sky-400" size={28} />
      <p className="text-sm">{copy.app.loading}</p>
    </div>
  );
}

function ErrorScreen({ error }) {
  const { copy } = useI18n();
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-neutral-950 p-6 text-center">
      <TriangleAlert className="text-rose-400" size={28} />
      <p className="text-sm text-neutral-200">{copy.app.loadError}</p>
      <p className="max-w-md font-mono text-xs text-neutral-500">{error?.message}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-2 rounded-lg border border-white/15 px-4 py-2 text-sm text-neutral-200 transition hover:bg-white/10"
      >
        {copy.app.reload}
      </button>
    </div>
  );
}

export default function App() {
  const { copy, locale, countryName } = useI18n();
  const [urlState, setUrlState] = useUrlState();
  const [searchOpen, setSearchOpen] = useState(false);
  const [rankingOpen, setRankingOpen] = useState(false);
  const [basemap, setBasemap] = useState('dark');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const methodologyOpen = urlState.view === 'method';
  const findingsOpen = urlState.view === 'findings';
  // Addressable so a view can be linked, but replaced rather than pushed: Back
  // should leave the site, not reopen a dialog.
  const openView = useCallback((view) => setUrlState({ view }, { replace: true }), [setUrlState]);
  const closeView = useCallback(() => setUrlState({ view: null }, { replace: true }), [setUrlState]);

  const weights = useMemo(
    () => ({ economic: urlState.economicWeight / 100, governance: 1 - urlState.economicWeight / 100 }),
    [urlState.economicWeight],
  );

  const { status, countries, byId, geometry, meta, generatedAt, error, scoredCount, thresholds } = useRiskData(weights);
  const selected = urlState.countryId ? byId.get(urlState.countryId) : null;

  const selectCountry = useCallback(
    (id) => {
      setUrlState({ countryId: id, view: null });
      setRankingOpen(false);
    },
    [setUrlState],
  );

  const clearSelection = useCallback(() => setUrlState({ countryId: null }), [setUrlState]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target?.tagName);
      if ((event.key === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !typing)) {
        event.preventDefault();
        setSearchOpen(true);
      } else if (event.key === 'Escape' && !searchOpen && !methodologyOpen && !findingsOpen) {
        if (rankingOpen) setRankingOpen(false);
        else if (urlState.countryId) clearSelection();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [searchOpen, methodologyOpen, findingsOpen, rankingOpen, urlState.countryId, clearSelection]);

  if (status === 'loading') return <LoadingScreen />;
  if (status === 'error') return <ErrorScreen error={error} />;

  const ranking = (
    <RankingPanel
      countries={countries}
      selectedId={urlState.countryId}
      bandFilter={urlState.band}
      onSelect={selectCountry}
      onOpenSearch={() => setSearchOpen(true)}
      onOpenFindings={() => openView('findings')}
      pillarCorrelation={meta?.diagnostics?.betweenPillars}
    />
  );

  const detail = selected && (
    <ErrorBoundary>
      <CountryPanel
        key={selected.id}
        country={selected}
        countries={countries}
        onSelect={selectCountry}
        onClose={clearSelection}
      />
    </ErrorBoundary>
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-neutral-950 text-neutral-100">
      <header className="z-[1500] flex h-14 shrink-0 items-center gap-3 border-b border-white/10 bg-neutral-950/90 px-3 backdrop-blur-md sm:px-4">
        <div className="flex items-center gap-2.5">
          <Logo size={30} />
          <span className="text-lg font-semibold tracking-tight text-white">Glorisk</span>
          <span className="hidden text-[11px] text-neutral-500 md:block">{copy.app.tagline}</span>
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-3">
          <div className="hidden sm:block">
            <WeightControl
              value={urlState.economicWeight}
              onChange={(value) => setUrlState({ economicWeight: value }, { replace: true })}
            />
          </div>

          <button
            type="button"
            onClick={() => openView('findings')}
            className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-neutral-300 transition hover:border-white/25 hover:bg-white/5 hover:text-white"
          >
            {copy.app.findings}
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label={copy.app.searchCountries}
            className="rounded-lg p-2 text-neutral-400 transition hover:bg-white/10 hover:text-white"
          >
            <Search size={18} />
          </button>
          <button
            type="button"
            onClick={() => setBasemap((current) => (current === 'dark' ? 'satellite' : 'dark'))}
            aria-label={copy.app.switchBasemap(basemap === 'dark' ? copy.app.satellite : copy.app.dark)}
            title={copy.app.basemap(basemap === 'dark' ? copy.app.dark : copy.app.satellite)}
            className="rounded-lg p-2 text-neutral-400 transition hover:bg-white/10 hover:text-white"
          >
            <Layers size={18} />
          </button>
          <button
            type="button"
            onClick={() => setRankingOpen(true)}
            aria-label={copy.app.openRanking}
            className="rounded-lg p-2 text-neutral-400 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <List size={18} />
          </button>
          <button
            type="button"
            onClick={() => openView('method')}
            aria-label={copy.app.methodology}
            className="rounded-lg p-2 text-neutral-400 transition hover:bg-white/10 hover:text-white"
          >
            <Info size={18} />
          </button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {isDesktop && (
          <aside className="w-80 shrink-0 border-r border-white/10 bg-neutral-950">
            <ErrorBoundary>{ranking}</ErrorBoundary>
          </aside>
        )}

        <main className="relative min-w-0 flex-1">
          <MapView
            geometry={geometry}
            byId={byId}
            selectedId={urlState.countryId}
            bandFilter={urlState.band}
            basemap={basemap}
            onSelect={selectCountry}
          />
          <div className="pointer-events-none absolute bottom-4 left-3 z-[900] sm:left-4">
            <Legend
              activeBand={urlState.band}
              thresholds={thresholds}
              onSelect={(band) => setUrlState({ band }, { replace: true })}
              scoredCount={scoredCount}
              totalCount={countries.length}
            />
          </div>
        </main>

        {isDesktop && detail && <div className="w-[26rem] shrink-0 border-l border-white/10">{detail}</div>}
      </div>

      {!isDesktop && detail && (
        <div className="fixed inset-x-0 bottom-0 z-[2000] h-[68dvh] overflow-hidden rounded-t-2xl border-t border-white/15 shadow-2xl">
          {detail}
        </div>
      )}

      {rankingOpen && !isDesktop && (
        <div className="fixed inset-0 z-[2500] flex" onMouseDown={() => setRankingOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative flex h-full w-80 max-w-[85vw] flex-col bg-neutral-950"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <ErrorBoundary>{ranking}</ErrorBoundary>
          </div>
        </div>
      )}

      {searchOpen && (
        <SearchPalette countries={countries} onSelect={selectCountry} onClose={() => setSearchOpen(false)} />
      )}
      <MethodologyModal
        open={methodologyOpen}
        meta={meta}
        generatedAt={generatedAt}
        thresholds={thresholds}
        onClose={closeView}
      />
      <FindingsModal
        open={findingsOpen}
        countries={countries}
        meta={meta}
        selectedId={urlState.countryId}
        onSelect={selectCountry}
        onClose={closeView}
      />

      <p className="sr-only" aria-live="polite">
        {selected && selected.score !== null
          ? copy.app.selectedRisk(countryName(selected), Math.round(selected.score))
          : copy.app.noCountry}
      </p>
        <span className="sr-only">{copy.app.generated} {formatDate(generatedAt, locale)}</span>
    </div>
  );
}
