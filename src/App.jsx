import React, { useState, useEffect } from 'react';
import Map from './components/Map';
import AboutModal from './components/AboutModal';
import ReportsPanel from './components/ReportsPanel';
import { AlertTriangle, TrendingUp, ShieldAlert, X, Info, Newspaper, Loader2, Briefcase } from 'lucide-react';
import { calculateTotalRisk, getRiskLabel, getRiskColor } from './utils/risk';
import { fetchCountryNews, analyzeRiskFromNews } from './services/newsService';

function App() {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [filterRisk, setFilterRisk] = useState('all');

  // News & Live Analysis State
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [liveRiskModifier, setLiveRiskModifier] = useState(0);
  const [newsAnalysis, setNewsAnalysis] = useState("");

  useEffect(() => {
    if (selectedCountry) {
      setLoadingNews(true);
      setNews([]);
      setLiveRiskModifier(0);
      setNewsAnalysis("");

      fetchCountryNews(selectedCountry.name).then(fetchedNews => {
        setNews(fetchedNews);
        const { scoreModifier, analysis } = analyzeRiskFromNews(fetchedNews);
        setLiveRiskModifier(scoreModifier);
        setNewsAnalysis(analysis);
        setLoadingNews(false);
      });
    }
  }, [selectedCountry]);

  const handleFilterClick = (riskType) => {
    setFilterRisk(prev => prev === riskType ? 'all' : riskType);
  };

  const getAdjustedRisk = (baseRisk) => {
    let newRisk = baseRisk + liveRiskModifier;
    return Math.min(100, Math.max(0, newRisk));
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-neutral-900 text-white overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-white/10 flex items-center px-6 bg-neutral-900/50 backdrop-blur-md z-10 absolute top-0 w-full justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <AlertTriangle size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-500">
            Glorisk
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 text-sm text-neutral-400 bg-white/5 p-1 rounded-full border border-white/5">
            <button
              onClick={() => handleFilterClick('low')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${filterRisk === 'low' ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50' : 'hover:bg-white/5'}`}
            >
              <span className={`w-2 h-2 rounded-full bg-emerald-500 ${filterRisk === 'low' ? 'shadow-[0_0_8px_rgba(16,185,129,0.8)]' : ''}`}></span> Low
            </button>
            <button
              onClick={() => handleFilterClick('medium')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${filterRisk === 'medium' ? 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/50' : 'hover:bg-white/5'}`}
            >
              <span className={`w-2 h-2 rounded-full bg-yellow-500 ${filterRisk === 'medium' ? 'shadow-[0_0_8px_rgba(234,179,8,0.8)]' : ''}`}></span> Medium
            </button>
            <button
              onClick={() => handleFilterClick('high')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${filterRisk === 'high' ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/50' : 'hover:bg-white/5'}`}
            >
              <span className={`w-2 h-2 rounded-full bg-red-500 ${filterRisk === 'high' ? 'shadow-[0_0_8px_rgba(239,68,68,0.8)]' : ''}`}></span> High
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsReportsOpen(!isReportsOpen)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all border ${isReportsOpen ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300'}`}
            >
              <Briefcase size={18} />
              <span className="hidden sm:inline font-medium">Analyst Hub</span>
            </button>

            <button
              onClick={() => setIsAboutOpen(true)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-neutral-400 hover:text-white"
              title="About Methodology"
            >
              <Info size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative pt-16">
        <Map
          onCountrySelect={setSelectedCountry}
          filterRisk={filterRisk}
          selectedCountry={selectedCountry}
        />

        <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
        <ReportsPanel isOpen={isReportsOpen} onClose={() => setIsReportsOpen(false)} />

        {/* Sidebar / Overlay */}
        {selectedCountry && (
          <div className="absolute right-0 top-16 bottom-0 w-96 bg-neutral-900/90 backdrop-blur-xl border-l border-white/10 p-6 transform transition-transform duration-300 ease-in-out z-[1000] overflow-y-auto">
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  {selectedCountry.code && (
                    <img
                      src={`https://flagcdn.com/w80/${selectedCountry.code.toLowerCase()}.png`}
                      alt={`${selectedCountry.name} flag`}
                      className="h-6 w-auto rounded shadow-sm"
                    />
                  )}
                  <h2 className="text-3xl font-bold text-white">{selectedCountry.name}</h2>
                </div>
                <span className="text-neutral-400 text-sm font-mono">{selectedCountry.id}</span>
              </div>
              <button
                onClick={() => setSelectedCountry(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Overall Score */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-center mb-2 relative z-10">
                  <span className="text-neutral-400">Overall Risk Score</span>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold text-neutral-900 shadow-lg transition-colors duration-500"
                    style={{ backgroundColor: getRiskColor(getAdjustedRisk(calculateTotalRisk(selectedCountry.economicRisk, selectedCountry.politicalRisk))) }}
                  >
                    {getRiskLabel(getAdjustedRisk(calculateTotalRisk(selectedCountry.economicRisk, selectedCountry.politicalRisk)))}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 relative z-10">
                  <div className="text-4xl font-bold">
                    {getAdjustedRisk(calculateTotalRisk(selectedCountry.economicRisk, selectedCountry.politicalRisk))}
                    <span className="text-lg text-neutral-500 font-normal">/100</span>
                  </div>
                  {liveRiskModifier !== 0 && (
                    <span className={`text-sm font-bold ${liveRiskModifier > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {liveRiskModifier > 0 ? '+' : ''}{liveRiskModifier} (Live)
                    </span>
                  )}
                </div>
              </div>

              {/* Risk Breakdown */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <ShieldAlert size={18} className="text-blue-400" />
                  Risk Analysis
                </h3>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-300">Economic Risk</span>
                    <span className="font-mono">{selectedCountry.economicRisk}/100</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                      style={{ width: `${selectedCountry.economicRisk}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-300">Political Risk</span>
                    <span className="font-mono">{selectedCountry.politicalRisk}/100</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 transition-all duration-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                      style={{ width: `${selectedCountry.politicalRisk}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Live News Section */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Newspaper size={18} className="text-orange-400" />
                  Live News & Sentiment
                </h3>

                {loadingNews ? (
                  <div className="flex items-center justify-center py-8 text-neutral-400">
                    <Loader2 className="animate-spin mr-2" /> Analyzing live feeds...
                  </div>
                ) : (
                  <>
                    {newsAnalysis && (
                      <div className={`p-3 rounded-lg text-sm border ${liveRiskModifier > 0 ? 'bg-red-500/10 border-red-500/20 text-red-200' : liveRiskModifier < 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200' : 'bg-white/5 border-white/10 text-neutral-300'}`}>
                        {newsAnalysis}
                      </div>
                    )}

                    <div className="space-y-3">
                      {news.map((item, index) => (
                        <a
                          key={index}
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5 group"
                        >
                          <h4 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                            {item.title}
                          </h4>
                          <div className="flex justify-between mt-2 text-xs text-neutral-500">
                            <span>{item.source}</span>
                            <span>{new Date(item.pubDate).toLocaleDateString()}</span>
                          </div>
                        </a>
                      ))}
                      {news.length === 0 && (
                        <div className="text-sm text-neutral-500 text-center py-4">
                          No recent news found for this region.
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Details */}
              <div className="mt-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-emerald-400">
                  <TrendingUp size={18} />
                  Insight
                </h3>
                <p className="text-neutral-300 leading-relaxed text-sm">
                  {selectedCountry.details}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
