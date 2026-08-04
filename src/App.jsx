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

function LoadingScreen() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-neutral-950 text-neutral-400">
      <Loader2 className="animate-spin text-sky-400" size={28} />
      <p className="text-sm">Loading country risk data…</p>
    </div>
  );
}

function ErrorScreen({ error }) {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-neutral-950 p-6 text-center">
      <TriangleAlert className="text-rose-400" size={28} />
      <p className="text-sm text-neutral-200">The risk dataset could not be loaded.</p>
      <p className="max-w-md font-mono text-xs text-neutral-500">{error?.message}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-2 rounded-lg border border-white/15 px-4 py-2 text-sm text-neutral-200 transition hover:bg-white/10"
      >
        Reload
      </button>
    </div>
  );
}

export default function App() {
  const [urlState, setUrlState] = useUrlState();
  const [searchOpen, setSearchOpen] = useState(false);
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const [findingsOpen, setFindingsOpen] = useState(false);
  const [rankingOpen, setRankingOpen] = useState(false);
  const [basemap, setBasemap] = useState('dark');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const weights = useMemo(
    () => ({ economic: urlState.economicWeight / 100, governance: 1 - urlState.economicWeight / 100 }),
    [urlState.economicWeight],
  );

  const { status, countries, byId, geometry, meta, generatedAt, error, scoredCount, thresholds } = useRiskData(weights);
  const selected = urlState.countryId ? byId.get(urlState.countryId) : null;

  const selectCountry = useCallback(
    (id) => {
      setUrlState({ countryId: id });
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
      onOpenFindings={() => setFindingsOpen(true)}
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
          <span className="hidden text-[11px] text-neutral-500 md:block">country risk from open data</span>
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
            onClick={() => setFindingsOpen(true)}
            className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-neutral-300 transition hover:border-white/25 hover:bg-white/5 hover:text-white"
          >
            Findings
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search countries"
            className="rounded-lg p-2 text-neutral-400 transition hover:bg-white/10 hover:text-white"
          >
            <Search size={18} />
          </button>
          <button
            type="button"
            onClick={() => setBasemap((current) => (current === 'dark' ? 'satellite' : 'dark'))}
            aria-label={`Switch to ${basemap === 'dark' ? 'satellite' : 'dark'} basemap`}
            title={`Basemap: ${basemap}`}
            className="rounded-lg p-2 text-neutral-400 transition hover:bg-white/10 hover:text-white"
          >
            <Layers size={18} />
          </button>
          <button
            type="button"
            onClick={() => setRankingOpen(true)}
            aria-label="Open ranking"
            className="rounded-lg p-2 text-neutral-400 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <List size={18} />
          </button>
          <button
            type="button"
            onClick={() => setMethodologyOpen(true)}
            aria-label="How the score is built"
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
        onClose={() => setMethodologyOpen(false)}
      />
      <FindingsModal
        open={findingsOpen}
        countries={countries}
        meta={meta}
        selectedId={urlState.countryId}
        onSelect={selectCountry}
        onClose={() => setFindingsOpen(false)}
      />

      <p className="sr-only" aria-live="polite">
        {selected && selected.score !== null
          ? `${selected.name}, composite risk ${Math.round(selected.score)} out of 100`
          : 'No country selected'}
      </p>
      <span className="sr-only">Data generated {formatDate(generatedAt)}</span>
    </div>
  );
}
