'use client';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { api, AnalyticsData } from '@/lib/api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { FileText, Users, Tag, TrendingUp, BarChart2, Database, AlertTriangle } from 'lucide-react';

function StatCard({ label, value, icon: Icon, color, sub }: { label: string; value: string | number; icon: any; color: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-2xl font-bold text-slate-900">{value}</div>
          <div className="text-sm text-slate-500 mt-0.5">{label}</div>
          {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
        </div>
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    emerging: 'bg-green-100 text-green-700',
    steady: 'bg-blue-100 text-blue-700',
    declining: 'bg-slate-100 text-slate-500',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] ?? styles.steady}`}>
      {status}
    </span>
  );
}

export default function AnalyticsPage() {
  const { data, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ['analytics'],
    queryFn: api.getAnalytics,
  });

  return (
    <AppLayout title="Analytics & Research Trends">
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : error || !data ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-3 text-red-700">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          Failed to load analytics. Please try refreshing the page.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Indexed Papers" value={data.total_indexed_papers} icon={FileText} color="bg-blue-600" />
            <StatCard label="Tracked Authors" value={data.total_authors} icon={Users} color="bg-teal-500" />
            <StatCard label="Research Topics" value={data.total_topics} icon={Tag} color="bg-purple-500" />
            <StatCard
              label="Avg. Citations"
              value={data.average_citations_per_paper.toLocaleString()}
              icon={TrendingUp}
              color="bg-amber-500"
              sub={`Contradiction rate: ${(data.contradiction_rate * 100).toFixed(0)}%`}
            />
          </div>

          {/* Publication Trends */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-1">Publication Year Distribution</h3>
            <p className="text-sm text-slate-500 mb-5">Number of indexed papers by year of publication</p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.publication_year_distribution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ fontWeight: 600, color: '#0f172a' }}
                />
                <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2.5} dot={{ fill: '#2563eb', r: 4 }} activeDot={{ r: 6 }} name="Papers" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Methodologies */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-teal-500" />
                Top Methodologies
              </h3>
              <p className="text-sm text-slate-500 mb-5">Most frequently used methods across indexed papers</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.top_methodologies} layout="vertical" margin={{ left: 40, right: 20, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <YAxis type="category" dataKey="method" tick={{ fontSize: 11, fill: '#475569' }} width={100} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="count" fill="#0d9488" radius={[0, 4, 4, 0]} name="Papers" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Datasets */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-500" />
                Top Datasets
              </h3>
              <p className="text-sm text-slate-500 mb-5">Most commonly used datasets in indexed research</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.top_datasets} layout="vertical" margin={{ left: 40, right: 20, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <YAxis type="category" dataKey="dataset" tick={{ fontSize: 11, fill: '#475569' }} width={100} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="#7c3aed" radius={[0, 4, 4, 0]} name="Papers" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Topic Growth Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Topic Growth Trends
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">Research topic activity and momentum signals</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Topic</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Growth Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Recent Papers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.top_topics.map((t) => {
                    const recentCount = t.points?.[t.points.length - 1]?.paper_count ?? 0;
                    return (
                      <tr key={t.topic} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3.5 font-medium text-slate-800">{t.topic}</td>
                        <td className="px-6 py-3.5">
                          <StatusBadge status={t.status} />
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`font-medium ${t.growth_rate > 1 ? 'text-green-600' : t.growth_rate < 1 ? 'text-red-500' : 'text-slate-500'}`}>
                            {t.growth_rate > 1 ? '+' : ''}{((t.growth_rate - 1) * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-slate-600">{recentCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
