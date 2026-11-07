'use client';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { api, Paper, ComparisonMatrix } from '@/lib/api';
import { GitCompare, Plus, X, Search, AlertTriangle, CheckCircle, Lightbulb, ChevronDown } from 'lucide-react';

function PaperTag({ paper, onRemove }: { paper: Paper; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-blue-900 line-clamp-1">{paper.title}</div>
        <div className="text-blue-600 text-xs">{paper.publication_year} · {paper.authors?.[0]?.name ?? 'Unknown'}</div>
      </div>
      <button onClick={onRemove} className="text-blue-400 hover:text-blue-600 flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function MatrixCell({ value }: { value: any }) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-slate-300 text-xs">—</span>;
  }
  if (Array.isArray(value)) {
    return (
      <ul className="list-disc list-inside space-y-0.5">
        {value.slice(0, 3).map((v: string, i: number) => (
          <li key={i} className="text-xs text-slate-600">{v}</li>
        ))}
        {value.length > 3 && <li className="text-xs text-slate-400">+{value.length - 3} more</li>}
      </ul>
    );
  }
  return <span className="text-sm text-slate-700">{String(value)}</span>;
}

export default function ComparePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPapers, setSelectedPapers] = useState<Paper[]>([]);
  const [result, setResult] = useState<ComparisonMatrix | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ['compare-search', searchQuery],
    queryFn: () => api.searchHybrid({ query: searchQuery, limit: 6 }),
    enabled: searchQuery.length > 2,
  });

  const compareMutation = useMutation({
    mutationFn: (ids: string[]) => api.comparePapers(ids),
    onSuccess: (data) => setResult(data),
  });

  const addPaper = (paper: Paper) => {
    if (selectedPapers.length >= 10) return;
    if (selectedPapers.find(p => p.id === paper.id)) return;
    setSelectedPapers(prev => [...prev, paper]);
    setShowSearch(false);
    setSearchQuery('');
  };

  const removePaper = (id: string) => {
    setSelectedPapers(prev => prev.filter(p => p.id !== id));
    setResult(null);
  };

  const handleCompare = () => {
    if (selectedPapers.length < 2) return;
    compareMutation.mutate(selectedPapers.map(p => p.id));
  };

  const dimensionRows = result?.matrix ?? [];

  return (
    <AppLayout title="Paper Comparison">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Paper Selector */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Select Papers to Compare</h2>
              <p className="text-sm text-slate-500 mt-0.5">Choose 2–10 papers for a structured side-by-side comparison</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">{selectedPapers.length}/10 selected</span>
              {selectedPapers.length >= 2 && (
                <button
                  onClick={handleCompare}
                  disabled={compareMutation.isPending}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
                >
                  <GitCompare className="w-4 h-4" />
                  {compareMutation.isPending ? 'Comparing…' : 'Compare'}
                </button>
              )}
            </div>
          </div>

          {/* Selected papers */}
          {selectedPapers.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
              {selectedPapers.map(p => (
                <PaperTag key={p.id} paper={p} onRemove={() => removePaper(p.id)} />
              ))}
            </div>
          )}

          {/* Add more */}
          {selectedPapers.length < 10 && (
            <div>
              <button
                onClick={() => setShowSearch(s => !s)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 border border-dashed border-blue-300 hover:border-blue-400 rounded-lg px-4 py-2.5 w-full justify-center transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add a paper
                <ChevronDown className={`w-4 h-4 transition-transform ${showSearch ? 'rotate-180' : ''}`} />
              </button>

              {showSearch && (
                <div className="mt-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      autoFocus
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search papers by title, author, topic…"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  {searching && <div className="text-xs text-slate-400 mt-2 px-1">Searching…</div>}
                  {searchResults && (
                    <div className="mt-2 border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-64 overflow-y-auto">
                      {searchResults.results.map(p => (
                        <button
                          key={p.id}
                          onClick={() => addPaper(p)}
                          disabled={!!selectedPapers.find(sp => sp.id === p.id)}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <div className="text-sm font-medium text-slate-900 line-clamp-1">{p.title}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{p.authors?.[0]?.name ?? ''} · {p.publication_year}</div>
                        </button>
                      ))}
                      {searchResults.results.length === 0 && (
                        <div className="px-4 py-3 text-sm text-slate-400">No results for "{searchQuery}"</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {selectedPapers.length === 0 && (
            <EmptyState
              icon={GitCompare}
              title="No papers selected"
              description="Search and add 2 to 10 papers to begin comparing them side by side."
            />
          )}
        </div>

        {/* Comparison Result */}
        {compareMutation.isPending && (
          <div className="space-y-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}

        {compareMutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-3 text-red-700">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>Comparison failed. Please try again.</span>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            {/* Main Matrix */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">Comparison Matrix</h3>
                <p className="text-sm text-slate-500 mt-0.5">Structured comparison across {result.headers.length - 1} papers and {dimensionRows.length} dimensions</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {result.headers.map((h, i) => (
                        <th key={i} className={`px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide ${i === 0 ? 'w-40 sticky left-0 bg-slate-50' : 'min-w-56'}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dimensionRows.map((row: Record<string, any>, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        {result.headers.map((h, j) => (
                          <td key={j} className={`px-4 py-3 align-top ${j === 0 ? 'font-medium text-slate-700 sticky left-0 bg-white hover:bg-slate-50 w-40' : ''}`}>
                            <MatrixCell value={row[h]} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Methodology Comparison */}
            {result.methodology_comparison.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Methodology Coverage</h3>
                <div className="space-y-3">
                  {result.methodology_comparison.map((m, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="w-3 h-3 text-teal-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-800">{m.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">Used in: {m.papers.join(', ')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dataset Comparison */}
            {result.dataset_comparison.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Dataset Coverage</h3>
                <div className="space-y-3">
                  {result.dataset_comparison.map((d, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="w-3 h-3 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-800">{d.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">Used in: {d.papers.join(', ')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conflicting Findings */}
            {result.conflicting_findings.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <h3 className="font-semibold text-amber-900 flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Potentially Conflicting Findings
                </h3>
                <div className="space-y-3">
                  {result.conflicting_findings.map((c: any, i: number) => (
                    <div key={i} className="bg-white rounded-lg p-4 border border-amber-100 text-sm text-slate-700">
                      {typeof c === 'string' ? c : JSON.stringify(c)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Underexplored Combinations */}
            {result.underexplored_combinations.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="font-semibold text-blue-900 flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-blue-500" />
                  Potentially Underexplored Combinations
                </h3>
                <ul className="space-y-2">
                  {result.underexplored_combinations.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-blue-800">
                      <span className="text-blue-400 mt-0.5">•</span> {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
