'use client';
import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { api, NoveltyResult, Paper } from '@/lib/api';
import { Shield, AlertTriangle, CheckCircle, Loader2, Upload, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

function OverlapMeter({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 70 ? 'bg-red-500' : pct >= 40 ? 'bg-amber-500' : 'bg-green-500';
  const textColor = pct >= 70 ? 'text-red-700' : pct >= 40 ? 'text-amber-700' : 'text-green-700';
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-700">{label} Overlap</span>
        <span className={`text-sm font-bold ${textColor}`}>{pct}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-2 ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1.5 text-xs text-slate-400">
        {pct >= 70 ? 'High overlap — closely mirrors existing work' : pct >= 40 ? 'Moderate overlap — partial similarities found' : 'Low overlap — potentially distinct from indexed literature'}
      </div>
    </div>
  );
}

export default function NoveltyPage() {
  const [form, setForm] = useState({ abstract: '', problem: '', proposed_method: '', proposed_dataset: '', expected_contribution: '' });
  const [result, setResult] = useState<NoveltyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.abstract.trim()) { setError('Abstract is required.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await api.auditNovelty(form);
      setResult(r);
    } catch { setError('Novelty audit failed. Ensure the backend is running.'); }
    finally { setLoading(false); }
  };

  const riskPct = result ? Math.round(result.overall_novelty_risk_score * 100) : 0;

  return (
    <AppLayout title="Research Novelty Auditor">
      <div className="max-w-5xl mx-auto">
        {/* Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <strong>Disclaimer:</strong> This tool measures conceptual and methodological overlap against indexed publications.
            It does <strong>not</strong> prove originality, patentability, or scientific novelty. Always consult domain experts and conduct a thorough manual literature review.
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input form */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-blue-600" />Research Proposal</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Research Abstract <span className="text-red-500">*</span></label>
                <textarea value={form.abstract} onChange={e => handleChange('abstract', e.target.value)} rows={5}
                  placeholder="Paste your research abstract here…"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Research Problem / Question</label>
                <input value={form.problem} onChange={e => handleChange('problem', e.target.value)}
                  placeholder="What problem are you solving?"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Proposed Methodology</label>
                <input value={form.proposed_method} onChange={e => handleChange('proposed_method', e.target.value)}
                  placeholder="e.g., Graph Transformer + LoRA fine-tuning"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Dataset / Benchmark</label>
                <input value={form.proposed_dataset} onChange={e => handleChange('proposed_dataset', e.target.value)}
                  placeholder="e.g., MIMIC-III, PubMed, GLUE"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Expected Contribution</label>
                <textarea value={form.expected_contribution} onChange={e => handleChange('expected_contribution', e.target.value)} rows={2}
                  placeholder="State your claimed novel contribution…"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>

              {error && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-60 transition-colors">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                {loading ? 'Analyzing Proposal…' : 'Run Novelty Audit'}
              </button>
            </form>
          </div>

          {/* Results */}
          <div className="space-y-4">
            {!result && !loading && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-10 text-center text-slate-400">
                <Shield className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                <p className="text-sm">Fill in your research proposal and click &ldquo;Run Novelty Audit&rdquo;</p>
              </div>
            )}

            {loading && (
              <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Running multi-dimensional overlap analysis…</p>
              </div>
            )}

            {result && (
              <>
                {/* Overall risk */}
                <div className={`rounded-xl border p-5 ${riskPct >= 70 ? 'bg-red-50 border-red-200' : riskPct >= 40 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-sm font-bold ${riskPct >= 70 ? 'text-red-700' : riskPct >= 40 ? 'text-amber-700' : 'text-green-700'}`}>
                      Similarity Risk Score
                    </h3>
                    <span className={`text-2xl font-bold ${riskPct >= 70 ? 'text-red-600' : riskPct >= 40 ? 'text-amber-600' : 'text-green-600'}`}>{riskPct}%</span>
                  </div>
                  <div className="h-2 bg-white/70 rounded-full">
                    <div className={`h-2 rounded-full ${riskPct >= 70 ? 'bg-red-500' : riskPct >= 40 ? 'bg-amber-500' : 'bg-green-500'}`}
                      style={{ width: `${riskPct}%` }} />
                  </div>
                  <p className="text-xs mt-2 opacity-70">Higher score = greater overlap with existing indexed literature</p>
                </div>

                {/* Dimension overlap */}
                <div className="grid grid-cols-3 gap-3">
                  <OverlapMeter label="Problem" value={result.problem_overlap_score} />
                  <OverlapMeter label="Method" value={result.methodology_overlap_score} />
                  <OverlapMeter label="Dataset" value={result.dataset_overlap_score} />
                </div>

                {/* Extracted concepts */}
                {result.extracted_concepts.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <h3 className="text-xs font-semibold text-slate-700 mb-2">Extracted Concepts</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {result.extracted_concepts.map(c => <Badge key={c} label={c} color="blue" />)}
                    </div>
                  </div>
                )}

                {/* Similar papers */}
                {result.similar_papers.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <h3 className="text-xs font-semibold text-slate-700 mb-2">Most Similar Indexed Papers</h3>
                    {result.similar_papers.slice(0, 4).map(p => (
                      <a key={p.id} href={`/papers/${p.id}`}
                        className="flex items-start gap-2 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-medium text-slate-800 line-clamp-1">{p.title}</div>
                          <div className="text-xs text-slate-400">{p.publication_year} · {((p.relevance_score || 0.5) * 100).toFixed(0)}% match</div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}

                {/* Distinctive aspects */}
                {result.potentially_distinctive_aspects.length > 0 && (
                  <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-green-800 mb-2 flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" />Potentially Distinctive Aspects</h3>
                    <ul className="space-y-1">
                      {result.potentially_distinctive_aspects.map((a, i) => (
                        <li key={i} className="text-xs text-green-700 flex gap-2"><span>•</span>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {result.recommendations.length > 0 && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-blue-800 mb-2">Recommendations</h3>
                    <ul className="space-y-1">
                      {result.recommendations.map((r, i) => (
                        <li key={i} className="text-xs text-blue-700 flex gap-2"><span>{i + 1}.</span>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
