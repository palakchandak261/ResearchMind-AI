'use client';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import PaperCard from '@/components/papers/PaperCard';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { useState } from 'react';
import { ExternalLink, Bookmark, Users, Calendar, Building, BookOpen, Wrench, Database, CheckCircle, XCircle, HelpCircle } from 'lucide-react';

const tabs = ['Overview', 'Methodology', 'Findings', 'Limitations', 'Future Work', 'Reproducibility'];

function ReproducibilityItem({ label, value }: { label: string; value: string }) {
  const reported = value && !value.toLowerCase().includes('not report') && !value.toLowerCase().includes('not available');
  const Icon = reported ? CheckCircle : value.toLowerCase().includes('partial') ? HelpCircle : XCircle;
  const color = reported ? 'text-green-600' : value.toLowerCase().includes('partial') ? 'text-amber-500' : 'text-slate-400';
  return (
    <div className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${color}`} />
      <div>
        <div className="text-xs font-medium text-slate-700">{label}</div>
        <div className="text-xs text-slate-500 mt-0.5">{value}</div>
      </div>
    </div>
  );
}

export default function PaperDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState('Overview');
  const [saved, setSaved] = useState(false);

  const { data: paper, isLoading } = useQuery({ queryKey: ['paper', id], queryFn: () => api.getPaper(id) });
  const { data: related } = useQuery({ queryKey: ['related', id], queryFn: () => api.getRelatedPapers(id), enabled: !!id });

  if (isLoading) return <AppLayout><div className="max-w-4xl mx-auto"><LoadingSkeleton lines={8} /></div></AppLayout>;
  if (!paper) return <AppLayout><div className="p-8 text-slate-500">Paper not found.</div></AppLayout>;

  const handleSave = async () => { await api.savePaper(paper.id); setSaved(true); };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-5">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900 leading-snug mb-3">{paper.title}</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 mb-4">
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{paper.authors?.map(a=>a.name).join(', ') || 'Authors not listed'}</span>
                {paper.publication_year && <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{paper.publication_year}</span>}
                {paper.venue && <span className="flex items-center gap-1.5"><Building className="w-4 h-4" />{paper.venue}</span>}
                {paper.citation_count > 0 && <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" />{paper.citation_count.toLocaleString()} citations</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {paper.research_domain && <Badge label={paper.research_domain} color="blue" />}
                {paper.open_access && <Badge label="Open Access" color="green" />}
                <Badge label={paper.source} color="gray" />
                {paper.doi && <span className="text-xs text-slate-400 font-mono">DOI: {paper.doi}</span>}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {paper.pdf_url && <a href={paper.pdf_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"><ExternalLink className="w-4 h-4"/>PDF</a>}
              <button onClick={handleSave} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${saved ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                <Bookmark className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-white rounded-xl border border-slate-200 p-1 overflow-x-auto">
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-2 text-sm rounded-lg whitespace-nowrap transition-colors ${activeTab === t ? 'bg-blue-600 text-white font-medium' : 'text-slate-600 hover:bg-slate-100'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {/* Overview */}
            {activeTab === 'Overview' && (
              <>
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h2 className="font-semibold text-slate-900 mb-3">Abstract</h2>
                  <p className="text-sm text-slate-700 leading-relaxed">{paper.abstract || 'Abstract not available.'}</p>
                </div>
                {paper.objective && (
                  <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <h2 className="font-semibold text-slate-900 mb-2">Research Objective</h2>
                    <p className="text-sm text-slate-700">{paper.objective}</p>
                  </div>
                )}
                {paper.topics && paper.topics.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <h2 className="font-semibold text-slate-900 mb-3">Topics & Keywords</h2>
                    <div className="flex flex-wrap gap-2">{paper.topics.map(t=><Badge key={t.id||t.name} label={t.name} color="blue" />)}</div>
                  </div>
                )}
              </>
            )}

            {/* Methodology */}
            {activeTab === 'Methodology' && (
              <div className="space-y-4">
                {paper.methodologies && paper.methodologies.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Wrench className="w-4 h-4 text-slate-400"/>Methodologies</h2>
                    <div className="space-y-2">{paper.methodologies.map(m=>(
                      <div key={m.id||m.name} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span className="text-sm font-medium text-slate-800">{m.name}</span>
                        {m.category && <Badge label={m.category} color="gray" />}
                      </div>
                    ))}</div>
                  </div>
                )}
                {paper.datasets && paper.datasets.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Database className="w-4 h-4 text-slate-400"/>Datasets</h2>
                    <div className="space-y-2">{paper.datasets.map(d=>(
                      <div key={d.id||d.name} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50">
                        <div className="w-2 h-2 bg-teal-500 rounded-full" />
                        <span className="text-sm font-medium text-slate-800">{d.name}</span>
                        {d.modality && <Badge label={d.modality} color="teal" />}
                      </div>
                    ))}</div>
                  </div>
                )}
                {paper.evaluation_metrics && paper.evaluation_metrics.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <h2 className="font-semibold text-slate-900 mb-3">Evaluation Metrics</h2>
                    <div className="flex flex-wrap gap-2">{paper.evaluation_metrics.map(m=><Badge key={m} label={m} color="purple" />)}</div>
                  </div>
                )}
              </div>
            )}

            {/* Findings */}
            {activeTab === 'Findings' && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="font-semibold text-slate-900 mb-4">Empirical Findings</h2>
                {paper.findings?.length ? (
                  <ul className="space-y-3">{paper.findings.map((f,i)=>(
                    <li key={i} className="flex gap-3 text-sm text-slate-700">
                      <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i+1}</span>
                      {f}
                    </li>
                  ))}</ul>
                ) : <p className="text-sm text-slate-500">Findings not extracted for this paper.</p>}
              </div>
            )}

            {/* Limitations */}
            {activeTab === 'Limitations' && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="font-semibold text-slate-900 mb-4">Documented Limitations</h2>
                {paper.limitations_list?.length ? (
                  <ul className="space-y-3">{paper.limitations_list.map((l,i)=>(
                    <li key={i} className="flex gap-3 text-sm text-slate-700">
                      <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">!</span>
                      {l}
                    </li>
                  ))}</ul>
                ) : <p className="text-sm text-slate-500">No limitations extracted.</p>}
              </div>
            )}

            {/* Future Work */}
            {activeTab === 'Future Work' && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="font-semibold text-slate-900 mb-4">Future Research Directions</h2>
                {paper.future_work_list?.length ? (
                  <ul className="space-y-3">{paper.future_work_list.map((fw,i)=>(
                    <li key={i} className="flex gap-3 text-sm text-slate-700">
                      <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">→</span>
                      {fw}
                    </li>
                  ))}</ul>
                ) : <p className="text-sm text-slate-500">Future work not extracted.</p>}
              </div>
            )}

            {/* Reproducibility */}
            {activeTab === 'Reproducibility' && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="font-semibold text-slate-900 mb-4">Reproducibility Checklist</h2>
                {paper.reproducibility_checklist && Object.keys(paper.reproducibility_checklist).length > 0 ? (
                  <div>{Object.entries(paper.reproducibility_checklist).map(([k,v])=>(
                    <ReproducibilityItem key={k} label={k.replace(/_/g,' ')} value={String(v)} />
                  ))}</div>
                ) : <p className="text-sm text-slate-500">Reproducibility data not extracted for this paper.</p>}
              </div>
            )}
          </div>

          {/* Related Papers Sidebar */}
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-900 mb-4">Related Papers</h2>
              <div className="space-y-3">
                {related?.slice(0,4).map(rp=>(
                  <a key={rp.id} href={`/papers/${rp.id}`} className="block p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="text-xs font-medium text-slate-800 line-clamp-2 mb-1">{rp.title}</div>
                    <div className="text-xs text-slate-400">{rp.publication_year} · {rp.citation_count} citations</div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
