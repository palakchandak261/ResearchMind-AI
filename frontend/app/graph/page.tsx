import dynamic from 'next/dynamic';
import AppLayout from '@/components/layout/AppLayout';

const GraphCanvas = dynamic(() => import('@/components/graph/GraphCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex gap-4 h-[calc(100vh-7rem)]">
      <div className="w-56 flex-shrink-0 space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 h-24 animate-pulse" />
        <div className="bg-white rounded-xl border border-slate-200 p-4 h-48 animate-pulse" />
      </div>
      <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-700 flex items-center justify-center">
        <div className="text-white text-sm flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Initializing graph engine…
        </div>
      </div>
    </div>
  ),
});

export default function GraphPage() {
  return (
    <AppLayout title="Research Knowledge Graph">
      <div className="h-[calc(100vh-7rem)]">
        <GraphCanvas />
      </div>
    </AppLayout>
  );
}
