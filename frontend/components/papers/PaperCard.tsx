'use client';
import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, ExternalLink, Bookmark, Quote, Users, Calendar, Building } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { api, Paper } from '@/lib/api';

function domainColor(domain?: string): 'blue' | 'teal' | 'purple' | 'orange' | 'gray' {
  if (!domain) return 'gray';
  const d = domain.toLowerCase();
  if (d.includes('health') || d.includes('clinical')) return 'teal';
  if (d.includes('graph') || d.includes('network')) return 'purple';
  if (d.includes('system') || d.includes('hardware')) return 'orange';
  return 'blue';
}

export default function PaperCard({ paper, showRelevance = false }: { paper: Paper; showRelevance?: boolean }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    setSaving(true);
    await api.savePaper(paper.id);
    setSaved(true);
    setSaving(false);
  };

  const authors = paper.authors?.slice(0, 3).map(a => a.name).join(', ') || 'Authors not listed';
  const hasMoreAuthors = (paper.authors?.length || 0) > 3;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-md transition-all group">
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <Link href={`/papers/${paper.id}`} className="block">
            <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 leading-snug line-clamp-2 transition-colors">
              {paper.title}
            </h3>
          </Link>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{authors}{hasMoreAuthors ? ' et al.' : ''}</span>
            {paper.publication_year && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{paper.publication_year}</span>}
            {paper.venue && <span className="flex items-center gap-1"><Building className="w-3 h-3" /><span className="truncate max-w-[180px]">{paper.venue}</span></span>}
          </div>

          {/* Abstract */}
          {paper.abstract && (
            <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
              {paper.abstract}
            </p>
          )}

          {/* Relevance explanation */}
          {showRelevance && paper.relevance_explanation && (
            <div className="mt-2 flex items-start gap-1 text-xs text-blue-600 bg-blue-50 rounded-lg px-2 py-1">
              <Quote className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-1">{paper.relevance_explanation}</span>
            </div>
          )}

          {/* Badges + actions */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {paper.research_domain && <Badge label={paper.research_domain} color={domainColor(paper.research_domain)} />}
            {paper.open_access && <Badge label="Open Access" color="green" />}
            <Badge label={paper.source} color="gray" />

            <div className="ml-auto flex items-center gap-2">
              {paper.citation_count > 0 && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <BookOpen className="w-3 h-3" />{paper.citation_count.toLocaleString()} citations
                </span>
              )}
              {showRelevance && paper.relevance_score !== undefined && (
                <span className="text-xs font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                  {(paper.relevance_score * 100).toFixed(0)}% match
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex flex-col gap-2 items-center ml-2 flex-shrink-0">
          <button
            onClick={handleSave}
            disabled={saving}
            title="Save to library"
            className={`p-2 rounded-lg transition-colors ${saved ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600'}`}
          >
            <Bookmark className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} />
          </button>
          {paper.pdf_url && (
            <a href={paper.pdf_url} target="_blank" rel="noopener noreferrer" title="Open PDF"
              className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-teal-50 hover:text-teal-600 transition-colors">
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
