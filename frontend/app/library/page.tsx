'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { api, Paper } from '@/lib/api';
import Link from 'next/link';
import {
  BookOpen, Bookmark, CheckCircle, Clock, Layers, Plus, X,
  FileText, ChevronDown, ExternalLink, AlertCircle
} from 'lucide-react';

type ReadingStatus = 'to_read' | 'reading' | 'completed' | 'all';

const STATUS_LABELS: Record<string, string> = {
  to_read: 'To Read',
  reading: 'Reading',
  completed: 'Completed',
};

const STATUS_COLORS: Record<string, 'gray' | 'blue' | 'green'> = {
  to_read: 'gray',
  reading: 'blue',
  completed: 'green',
};

function StatusDropdown({ current, onChange }: { current: string; onChange: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-50 transition-colors text-slate-600"
      >
        {STATUS_LABELS[current] ?? 'Set status'}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 w-36">
          {(['to_read', 'reading', 'completed'] as const).map(s => (
            <button
              key={s}
              onClick={() => { onChange(s); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${current === s ? 'text-blue-600 font-medium' : 'text-slate-700'}`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PaperRow({ paper, onStatusChange }: { paper: Paper; onStatusChange: (id: string, status: string) => void }) {
  return (
    <div className="flex items-start gap-4 p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
      <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
        <FileText className="w-4 h-4 text-blue-500" />
      </div>
      <div className="flex-1 min-w-0">
        <Link href={`/papers/${paper.id}`} className="text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors line-clamp-1">
          {paper.title}
        </Link>
        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
          <span>{paper.authors?.[0]?.name ?? 'Unknown'}</span>
          {paper.publication_year && <span>· {paper.publication_year}</span>}
          {paper.venue && <span>· {paper.venue}</span>}
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge label={paper.reading_status ? STATUS_LABELS[paper.reading_status] ?? paper.reading_status : 'To Read'} color={paper.reading_status ? STATUS_COLORS[paper.reading_status] ?? 'gray' : 'gray'} />
          {paper.research_domain && <Badge label={paper.research_domain} color="gray" />}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <StatusDropdown
          current={paper.reading_status ?? 'to_read'}
          onChange={(s) => onStatusChange(paper.id, s)}
        />
        {paper.pdf_url && (
          <a href={paper.pdf_url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}

export default function LibraryPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<ReadingStatus>('all');
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');

  const { data: saved, isLoading: loadingSaved } = useQuery<Paper[]>({
    queryKey: ['saved'],
    queryFn: api.getSavedPapers,
  });

  const { data: collections, isLoading: loadingCollections } = useQuery({
    queryKey: ['collections'],
    queryFn: api.getCollections,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.savePaper(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved'] }),
  });

  const createCollectionMutation = useMutation({
    mutationFn: () => api.createCollection(newCollectionName, newCollectionDesc),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collections'] });
      setNewCollectionName('');
      setNewCollectionDesc('');
      setShowCreateCollection(false);
    },
  });

  const filteredPapers = (saved ?? []).filter(p => {
    if (activeTab === 'all') return true;
    return (p.reading_status ?? 'to_read') === activeTab;
  });

  const tabs: { key: ReadingStatus; label: string; icon: any }[] = [
    { key: 'all', label: 'All', icon: Bookmark },
    { key: 'to_read', label: 'To Read', icon: Clock },
    { key: 'reading', label: 'Reading', icon: BookOpen },
    { key: 'completed', label: 'Completed', icon: CheckCircle },
  ];

  return (
    <AppLayout title="My Research Library">
      <div className="flex gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 mb-5 w-fit">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.key !== 'all' && (
                  <span className="text-xs bg-slate-200 text-slate-600 rounded-full px-1.5 py-0.5 ml-0.5">
                    {(saved ?? []).filter(p => (p.reading_status ?? 'to_read') === tab.key).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Papers */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {loadingSaved ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : filteredPapers.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  icon={Bookmark}
                  title={activeTab === 'all' ? 'No saved papers yet' : `No ${STATUS_LABELS[activeTab]?.toLowerCase() ?? activeTab} papers`}
                  description={activeTab === 'all' ? 'Save papers from search results or paper details to build your library.' : `Papers you mark as "${STATUS_LABELS[activeTab]}" will appear here.`}
                  action={{ label: 'Search Papers', href: '/search' }}
                />
              </div>
            ) : (
              filteredPapers.map(p => (
                <PaperRow
                  key={p.id}
                  paper={p}
                  onStatusChange={(id, status) => updateStatusMutation.mutate({ id, status })}
                />
              ))
            )}
          </div>
        </div>

        {/* Collections sidebar */}
        <div className="w-64 flex-shrink-0 hidden lg:block">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                <Layers className="w-4 h-4 text-slate-400" />
                Collections
              </h3>
              <button
                onClick={() => setShowCreateCollection(o => !o)}
                className="text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {showCreateCollection && (
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <input
                  value={newCollectionName}
                  onChange={e => setNewCollectionName(e.target.value)}
                  placeholder="Collection name"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  value={newCollectionDesc}
                  onChange={e => setNewCollectionDesc(e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => createCollectionMutation.mutate()}
                    disabled={!newCollectionName.trim() || createCollectionMutation.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 rounded-lg transition-colors disabled:opacity-60"
                  >
                    {createCollectionMutation.isPending ? 'Creating…' : 'Create'}
                  </button>
                  <button
                    onClick={() => setShowCreateCollection(false)}
                    className="text-slate-400 hover:text-slate-600 p-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {loadingCollections ? (
              <div className="p-4"><CardSkeleton /></div>
            ) : (
              <div className="p-2">
                {((collections as any[]) ?? []).length === 0 ? (
                  <div className="text-xs text-slate-400 text-center py-6 px-4">
                    No collections yet. Create one to organize your papers.
                  </div>
                ) : (
                  ((collections as any[]) ?? []).map((c: any) => (
                    <div key={c.id} className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                      <Layers className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm text-slate-700 line-clamp-1">{c.name}</div>
                        {c.description && <div className="text-xs text-slate-400 line-clamp-1">{c.description}</div>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Stats card */}
          {!loadingSaved && saved && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 mt-4">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Library Stats</h4>
              <div className="space-y-2">
                {(['to_read', 'reading', 'completed'] as const).map(s => {
                  const count = saved.filter(p => (p.reading_status ?? 'to_read') === s).length;
                  const pct = saved.length > 0 ? Math.round((count / saved.length) * 100) : 0;
                  return (
                    <div key={s}>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>{STATUS_LABELS[s]}</span>
                        <span>{count}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${s === 'completed' ? 'bg-green-500' : s === 'reading' ? 'bg-blue-500' : 'bg-slate-300'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
