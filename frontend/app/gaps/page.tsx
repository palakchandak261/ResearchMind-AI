'use client';
import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { ScoreBar } from '@/components/ui/ScoreBar';
import { Badge } from '@/components/ui/Badge';
import { api, ResearchGap } from '@/lib/api';
import { Lightbulb, ChevronDown, ChevronUp, AlertTriangle, BookOpen, TrendingUp, ArrowRight, Loader2 } from 'lucide-react';

const DOMAINS = [
  'Artificial Intelligence',
  'Graph Machine Learning',
  'Healthcare AI / Clinical Informatics',
  'Systems & Machine Learning / GPU Computing',
  'Natural Language Processing',
];

function GapCard({ gap }: { gap: ResearchGap }) {
  const [expanded, setExpanded] = useState(false);
  const scoreColor = gap.ewrgs_score >= 0.7 ? 'text-red-600' : gap.ewrgs_score >= 0.4 ? 'text-amber-600' : 'text-green-600';
  const scoreBg = gap.ewrgs_score >= 0.7 ? 'bg-red-50 border-red-200' : gap.ewrgs_score >= 0.4 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={`px-3 py-1.5 rounded-lg border text-center min-w-[64px] ${scoreBg}`}>
          <div className={`text-lg font-bold ${scoreColor}`}>{gap.ewrgs_score.toFixed(2)}</div>
          <div className="text-xs text-slate-500">EWRGS</div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-slate-900 leading-snug mb-1">{gap.title}</h3>
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge label={gap.domain} color="blue" />
            {gap.methodology && <Badge label={gap.methodology} color="purple" />}
            {gap.dataset && <Badge label={gap.dataset} color="teal" />}
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${gap.confidence >= 0.8 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {Math.round(gap.confidence * 100)}% confidence
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{gap.description}</p>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="p-1.5 text-slate-400 hover:text-slate-700 flex-shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Score breakdown */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
        <ScoreBar label="Underexploration" value={gap.score_underexploration} />
        <ScoreBar label="Trend Velocity" value={gap.score_trend} />
        <ScoreBar label="Diversity Deficit" value={gap.score_diversity_deficit} />
        <ScoreBar label="Limitation Evidence" value={gap.score_limitation} />
        <ScoreBar label="Conflict Score" value={gap.score_conflict} />
      </div>

      {/* Corpus warning */}
      {gap.corpus_coverage_warning && (
        <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>{gap.corpus_coverage_warning}</span>
        </div>
      )}

      {/* Expanded */}
      {expanded && (
        <div className="mt-5 space-y-4 border-t border-slate-100 pt-4">
          {gap.supporting_papers?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-green-600" />Supporting Evidence</h4>
              {gap.supporting_papers.map((sp, i) => (
                <div key={i} className="bg-green-50 border border-green-100 rounded-lg p-3 mb-2">
                  <div className="text-xs font-medium text-slate-800 mb-1">{sp.paper_title}</div>
                  {sp.quote && <blockquote className="text-xs text-slate-600 italic border-l-2 border-green-400 pl-2">&ldquo;{sp.quote.slice(0, 200)}&hellip;&rdquo;</blockquote>}
                </div>
              ))}
            </div>
          )}

          {gap.counterevidence_papers?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-600" />Counterevidence — Already Investigated</h4>
              {gap.counterevidence_papers.map((cp, i) => (
                <div key={i} className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-2">
                  <div className="text-xs font-medium text-slate-800">{cp.paper_title} {cp.paper_year ? `(${cp.paper_year})` : ''}</div>
                  <div className="text-xs text-slate-600 mt-1">{cp.explanation}</div>
                </div>
              ))}
            </div>
          )}

          {gap.future_directions?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-blue-600" />Suggested Future Directions</h4>
              <ul className="space-y-1.5">
                {gap.future_directions.map((fd, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-700">
                    <ArrowRight className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />{fd}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function GapsPage() {
  const [domain, setDomain] = useState('Artificial Intelligence');
  const [gaps, setGaps] = useState<ResearchGap[]>([]);
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);

  const runAnalysis = async () => {
    setLoading(true); setRan(false);
    try {
      const res = await api.analyzeGaps(domain);
      setGaps(res);
      setRan(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Research Gap Analysis (EWRGS)">
      {/* Config panel */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Research Domain</label>
            <select value={domain} onChange={e => setDomain(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              {DOMAINS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <button onClick={runAnalysis} disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
              {loading ? 'Analyzing…' : 'Analyze Research Gaps'}
            </button>
          </div>
        </div>
        <div className="mt-3 text-xs text-slate-500">
          EWRGS Formula: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">score = w₁·U + w₂·T + w₃·D + w₄·L + w₅·C</code>
          &nbsp;— Underexploration · Trend Velocity · Diversity Deficit · Limitation Evidence · Conflict Score
        </div>
      </div>

      {/* Results */}
      {!ran && !loading && (
        <div className="text-center py-20 text-slate-400">
          <Lightbulb className="w-12 h-12 mx-auto mb-4 text-slate-200" />
          <p className="text-sm">Select a domain and click &ldquo;Analyze Research Gaps&rdquo; to run the EWRGS algorithm.</p>
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-16 h-14 bg-slate-100 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {ran && gaps.length > 0 && (
        <>
          <div className="text-sm text-slate-500 mb-4">
            {gaps.length} research gap candidates identified · Sorted by EWRGS score (descending)
          </div>
          <div className="space-y-4">
            {gaps.map(g => <GapCard key={g.id} gap={g} />)}
          </div>
        </>
      )}
    </AppLayout>
  );
}
