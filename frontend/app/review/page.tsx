'use client';
import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { api, ReviewResponse, Paper } from '@/lib/api';
import { BookOpen, Loader2, X, Search, Download, Copy, AlertTriangle, ChevronRight } from 'lucide-react';

export default function ReviewPage() {
  const [paperSearch, setPaperSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Paper[]>([]);
  const [selectedPapers, setSelectedPapers] = useState<Paper[]>([]);
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState('IEEE');
  const [result, setResult] = useState<ReviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [copied, setCopied] = useState(false);

  const searchForPapers = async () => {
    if (!paperSearch.trim()) return;
    setSearching(true);
    try {
      const r = await api.searchHybrid({ query: paperSearch, limit: 6 });
      setSearchResults(r.results);
    } catch { } finally { setSearching(false); }
  };

  const addPaper = (p: Paper) => {
    if (!selectedPapers.find(sp => sp.id === p.id) && selectedPapers.length < 30) {
      setSelectedPapers(prev => [...prev, p]);
    }
  };

  const removePaper = (id: string) => setSelectedPapers(prev => prev.filter(p => p.id !== id));

  const generate = async () => {
    if (selectedPapers.length < 2) return;
    setLoading(true); setResult(null);
    try {
      const r = await api.generateReview(selectedPapers.map(p => p.id), topic || undefined, style);
      setResult(r);
    } catch { } finally { setLoading(false); }
  };

  const reviewText = result
    ? `${result.title}\n\n${result.abstract}\n\n${result.sections.map(s => `${s.title}\n${s.content}`).join('\n\n')}\n\nReferences:\n${result.bibliography.join('\n')}`
    : '';

  const handleCopy = () => { navigator.clipboard.writeText(reviewText); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const handleDownload = () => {
    const blob = new Blob([reviewText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'literature_review.txt'; a.click();
  };

  return (
    <AppLayout title="Literature Review Generator">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Configuration</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Review Topic / Title</label>
                <input value={topic} onChange={e => setTopic(e.target.value)}
                  placeholder="e.g., Efficient Fine-tuning of LLMs"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Citation Style</label>
                <div className="flex gap-2">
                  {['IEEE', 'APA', 'BibTeX'].map(s => (
                    <button key={s} onClick={() => setStyle(s)}
                      className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${style === s ? 'bg-blue-600 border-blue-600 text-white font-medium' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Paper search */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-3">Add Papers <span className="text-xs text-slate-400">(2–30)</span></h2>
            <div className="flex gap-2 mb-3">
              <input value={paperSearch} onChange={e => setPaperSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchForPapers()}
                placeholder="Search papers to include…"
                className="flex-1 text-xs border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none" />
              <button onClick={searchForPapers} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              </button>
            </div>

            {searchResults.map(p => (
              <button key={p.id} onClick={() => addPaper(p)}
                className="w-full text-left p-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors mb-1">
                <div className="text-xs font-medium line-clamp-1">{p.title}</div>
                <div className="text-xs text-slate-400">{p.publication_year}</div>
              </button>
            ))}
          </div>

          {/* Selected papers */}
          {selectedPapers.length > 0 && (
            <div className="bg-white rounded-xl border border-blue-200 p-5">
              <h2 className="font-semibold text-slate-900 mb-3">Selected Papers ({selectedPapers.length})</h2>
              {selectedPapers.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <span className="flex-1 text-xs text-slate-700 line-clamp-1">{p.title}</span>
                  <button onClick={() => removePaper(p.id)} className="text-slate-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              <button onClick={generate} disabled={loading || selectedPapers.length < 2}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                {loading ? 'Generating…' : 'Generate Review'}
              </button>
            </div>
          )}
        </div>

        {/* Result */}
        <div className="lg:col-span-2">
          {!result && !loading && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-16 text-center text-slate-400 h-full flex items-center justify-center">
              <div>
                <BookOpen className="w-14 h-14 mx-auto mb-4 text-slate-200" />
                <p className="text-sm">Select 2–30 papers and click &ldquo;Generate Review&rdquo;</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Synthesizing literature from indexed evidence…</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Human review notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">{result.human_review_notice}</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-slate-900">{result.title}</h2>
                  <div className="flex gap-2">
                    <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <Copy className="w-3.5 h-3.5" />{copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Download className="w-3.5 h-3.5" />Download TXT
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 mb-5">
                  <div className="text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Abstract</div>
                  <p className="text-sm text-slate-700 leading-relaxed">{result.abstract}</p>
                </div>

                {result.sections.map((s, i) => (
                  <div key={i} className="mb-5">
                    <h3 className="text-sm font-bold text-slate-900 mb-2">{s.title}</h3>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{s.content}</p>
                  </div>
                ))}

                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3">References</h3>
                  <div className="space-y-1.5">
                    {result.bibliography.map((ref, i) => (
                      <p key={i} className="text-xs text-slate-600 font-mono leading-relaxed">{ref}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
