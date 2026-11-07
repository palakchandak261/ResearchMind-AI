'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import PaperCard from '@/components/papers/PaperCard';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { api, SearchResult } from '@/lib/api';
import { Search, Filter, ChevronDown, Clock, BookOpen, TrendingUp, X, Zap } from 'lucide-react';

function SearchPageInner() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQ);
  const [submitted, setSubmitted] = useState(initialQ);
  const [searchType, setSearchType] = useState<'hybrid' | 'semantic' | 'keyword'>('hybrid');
  const [sortBy, setSortBy] = useState<'relevance' | 'citations' | 'recent'>('relevance');
  const [yearMin, setYearMin] = useState('');
  const [yearMax, setYearMax] = useState('');
  const [domain, setDomain] = useState('');
  const [openAccess, setOpenAccess] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await api.searchHybrid({
        query: q,
        limit: 15,
        filter_year_min: yearMin ? parseInt(yearMin) : undefined,
        filter_domain: domain || undefined,
      });
      (res as any).search_type = searchType;
      setResult(res);
    } catch {
      setError('Search failed. Please ensure the backend is running on port 8000.');
    } finally { setLoading(false); }
  }, [searchType, yearMin, domain]);

  useEffect(() => { if (initialQ) doSearch(initialQ); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(query);
    doSearch(query);
  };

  const handleInputChange = async (val: string) => {
    setQuery(val);
    if (val.length > 1) {
      const s = await api.getAutocomplete(val);
      setSuggestions(s);
      setShowSuggestions(true);
    } else { setShowSuggestions(false); }
  };

  const domains = ['Artificial Intelligence', 'Graph Machine Learning', 'Healthcare AI', 'Systems & Machine Learning', 'NLP'];

  return (
    <AppLayout title="Semantic Search">
      <div className="max-w-4xl mx-auto">
        {/* Search Bar */}
        <div className="relative mb-6">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  value={query}
                  onChange={e => handleInputChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="Search academic papers by topic, method, author…"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                    {suggestions.slice(0, 6).map((s, i) => (
                      <button key={i} type="button" onMouseDown={() => { setQuery(s.text); setShowSuggestions(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 flex items-center gap-2">
                        <Search className="w-3.5 h-3.5 text-slate-400" /> {s.text}
                        <span className="ml-auto text-xs text-slate-400 capitalize">{s.type}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button type="submit" className="px-6 py-3.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors">
                Search
              </button>
              <button type="button" onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3.5 rounded-xl border text-sm flex items-center gap-2 transition-colors ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                <Filter className="w-4 h-4" /> Filters
              </button>
            </div>
          </form>

          {/* Filters panel */}
          {showFilters && (
            <div className="mt-3 bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 shadow-sm">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Search Type</label>
                <select value={searchType} onChange={e => setSearchType(e.target.value as any)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="hybrid">Hybrid (RRF)</option>
                  <option value="semantic">Semantic</option>
                  <option value="keyword">Keyword (BM25)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Sort By</label>
                <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="relevance">Relevance</option>
                  <option value="citations">Citation Count</option>
                  <option value="recent">Most Recent</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Domain</label>
                <select value={domain} onChange={e => setDomain(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="">All Domains</option>
                  {domains.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Year Range</label>
                <div className="flex items-center gap-1">
                  <input value={yearMin} onChange={e => setYearMin(e.target.value)} placeholder="From"
                    className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none" />
                  <span className="text-slate-400">–</span>
                  <input value={yearMax} onChange={e => setYearMax(e.target.value)} placeholder="To"
                    className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Result metadata */}
        {result && !loading && (
          <div className="flex items-center gap-4 mb-4 text-sm text-slate-500">
            <span className="font-medium text-slate-700">{result.total} papers</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" />{result.execution_time_ms.toFixed(0)}ms</span>
            <span>·</span>
            <span className="capitalize">{result.search_type} search</span>
            {result.query_expansion?.length > 0 && (
              <>
                <span>·</span>
                <span>Expanded: {result.query_expansion.join(', ')}</span>
              </>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700">{error}</div>
        )}

        {/* Results */}
        {loading ? (
          <div className="space-y-4">{Array.from({length:5}).map((_,i)=><CardSkeleton key={i}/>)}</div>
        ) : !result ? (
          <EmptyState icon={Search} title="Search academic literature" description="Enter a research topic, methodology, author name, or paper title to get started." />
        ) : result.results.length === 0 ? (
          <EmptyState icon={Search} title="No results found" description={`No papers matched "${submitted}". Try a broader query or different search type.`} />
        ) : (
          <div className="space-y-4">
            {result.results.map(p => <PaperCard key={p.id} paper={p} showRelevance />)}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<AppLayout title="Search"><div className="space-y-4">{Array.from({length:5}).map((_,i)=><CardSkeleton key={i}/>)}</div></AppLayout>}>
      <SearchPageInner />
    </Suspense>
  );
}
