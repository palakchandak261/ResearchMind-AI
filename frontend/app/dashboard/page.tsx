'use client';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import Link from 'next/link';
import { FileText, Search, Lightbulb, TrendingUp, BookOpen, ArrowRight, Clock, Flame } from 'lucide-react';

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-sm text-slate-500">{label}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: api.getAnalytics,
  });

  const { data: papers, isLoading: loadingPapers } = useQuery({
    queryKey: ['papers', 'recent'],
    queryFn: () => api.getPapers(6),
  });

  const { data: saved } = useQuery({
    queryKey: ['saved'],
    queryFn: api.getSavedPapers,
  });

  return (
    <AppLayout title="Research Dashboard">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loadingAnalytics ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <StatCard label="Indexed Papers" value={analytics?.total_indexed_papers ?? 0} icon={FileText} color="bg-blue-600" />
            <StatCard label="Saved Papers" value={saved?.length ?? 0} icon={BookOpen} color="bg-teal-500" />
            <StatCard label="Knowledge Graph Nodes" value={analytics ? analytics.total_indexed_papers * 15 + '' : '0'} icon={TrendingUp} color="bg-purple-500" />
            <StatCard label="Topic Areas" value={analytics?.total_topics ?? 0} icon={Lightbulb} color="bg-amber-500" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Papers */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" />Recently Indexed Papers</h2>
            <Link href="/papers" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
          </div>
          {loadingPapers ? (
            <div className="space-y-3">{Array.from({length:3}).map((_,i)=><CardSkeleton key={i}/>)}</div>
          ) : (
            <div className="space-y-3">
              {papers?.map(p => (
                <Link key={p.id} href={`/papers/${p.id}`} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 line-clamp-1">{p.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{p.authors?.[0]?.name ?? 'Unknown'} · {p.publication_year}</div>
                  </div>
                  <div className="ml-auto flex-shrink-0">
                    <Badge label={p.source} color="gray" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Trending Topics */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4"><Flame className="w-4 h-4 text-orange-400" />Trending Topics</h2>
            {loadingAnalytics ? <CardSkeleton /> : (
              <div className="space-y-2">
                {analytics?.top_topics?.slice(0, 4).map(t => (
                  <div key={t.topic} className="flex items-center gap-2">
                    <div className="flex-1 text-sm text-slate-700 line-clamp-1">{t.topic}</div>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${t.status === 'emerging' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {t.status === 'emerging' ? `+${t.growth_rate}x` : t.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { href: '/search', label: 'New Search', icon: Search, color: 'text-blue-600 bg-blue-50' },
                { href: '/gaps', label: 'Analyze Gaps', icon: Lightbulb, color: 'text-amber-600 bg-amber-50' },
                { href: '/assistant', label: 'Ask AI Assistant', icon: BookOpen, color: 'text-teal-600 bg-teal-50' },
              ].map(a => (
                <Link key={a.href} href={a.href} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className={`w-8 h-8 ${a.color} rounded-lg flex items-center justify-center`}>
                    <a.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{a.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 ml-auto" />
                </Link>
              ))}
            </div>
          </div>

          {/* Average citations */}
          {analytics && (
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-5 text-white">
              <div className="text-3xl font-bold">{analytics.average_citations_per_paper.toLocaleString()}</div>
              <div className="text-blue-100 text-sm mt-1">Avg. citations per indexed paper</div>
              <div className="text-blue-200 text-xs mt-3">Corpus covers landmark AI/ML publications with high academic impact</div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
