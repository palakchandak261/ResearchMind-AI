'use client';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import PaperCard from '@/components/papers/PaperCard';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { api } from '@/lib/api';
import { FileText } from 'lucide-react';

export default function PapersPage() {
  const { data: papers, isLoading } = useQuery({ queryKey: ['papers'], queryFn: () => api.getPapers(25) });

  return (
    <AppLayout title="Paper Repository">
      <div className="mb-4 text-sm text-slate-500">{papers?.length ?? 0} indexed papers in local corpus</div>
      {isLoading ? (
        <div className="space-y-4">{Array.from({length:5}).map((_,i)=><CardSkeleton key={i}/>)}</div>
      ) : !papers?.length ? (
        <EmptyState icon={FileText} title="No papers indexed" description="Trigger a search to begin populating the corpus." />
      ) : (
        <div className="space-y-4">{papers.map(p => <PaperCard key={p.id} paper={p} />)}</div>
      )}
    </AppLayout>
  );
}
