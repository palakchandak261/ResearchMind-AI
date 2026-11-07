'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, Network, Lightbulb, Shield, Bot, BookOpen, TrendingUp, Users, FileText, Zap, ChevronRight, Star } from 'lucide-react';
import { api } from '@/lib/api';

const features = [
  { icon: Search, title: 'Semantic Search', desc: 'Find papers by meaning, not just keywords. Hybrid BM25 + vector retrieval with Reciprocal Rank Fusion.', color: 'bg-blue-500', href: '/search' },
  { icon: Network, title: 'Knowledge Graph', desc: 'Interactive research relationship graph. Explore citations, authors, topics, methods, and datasets.', color: 'bg-purple-500', href: '/graph' },
  { icon: Lightbulb, title: 'Gap Analysis (EWRGS)', desc: 'Evidence-Weighted Research Gap Score identifies underexplored research directions from real indexed literature.', color: 'bg-amber-500', href: '/gaps' },
  { icon: Shield, title: 'Novelty Auditor', desc: 'Compare your research proposal against indexed literature. Detect overlap across problem, methodology, and datasets.', color: 'bg-teal-500', href: '/novelty' },
  { icon: Bot, title: 'AI Research Assistant', desc: 'Ask questions about papers. Source-grounded RAG with passage-level citations and anti-hallucination guardrails.', color: 'bg-rose-500', href: '/assistant' },
  { icon: BookOpen, title: 'Literature Review', desc: 'Generate structured literature review drafts with IEEE, APA, BibTeX references. Human review required.', color: 'bg-indigo-500', href: '/review' },
];

const steps = [
  { n: '01', title: 'Index Papers', desc: 'Connect to OpenAlex, arXiv, Semantic Scholar. Papers are automatically indexed with NLP extraction.' },
  { n: '02', title: 'Semantic Search', desc: 'Ask a research question in natural language. Hybrid retrieval returns ranked, explained results.' },
  { n: '03', title: 'Explore the Graph', desc: 'Navigate citation and similarity networks. Discover foundational papers and emerging connections.' },
  { n: '04', title: 'Identify Gaps', desc: 'The EWRGS algorithm surfaces underexplored research directions backed by evidence from the corpus.' },
];

export default function LandingPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top Nav */}
      <nav className="border-b border-slate-100 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Network className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-900">ResearchGraph AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">Sign In</Link>
          <Link href="/register" className="text-sm text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-lg transition-colors font-medium">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-20 px-6 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6 border border-blue-100">
          <Zap className="w-3.5 h-3.5" />
          Evidence-Weighted Research Gap Discovery · EWRGS Algorithm
        </div>
        <h1 className="text-5xl font-bold text-slate-900 mb-6 leading-tight tracking-tight">
          Discover Connections.<br />
          <span className="text-blue-600">Understand Research.</span><br />
          Find What&apos;s Missing.
        </h1>
        <p className="text-lg text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          An intelligent academic research platform that transforms scientific publications into a connected,
          searchable knowledge network — with AI-powered gap identification, source-grounded answers, and evidence-traced insights.
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex items-center gap-3 max-w-2xl mx-auto mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search: &quot;transformer attention long sequences&quot;…"
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-4 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap"
          >
            Search <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="flex justify-center gap-6 text-sm text-slate-400">
          {['Transformers & Attention', 'RAG Systems', 'Graph Neural Networks', 'Clinical AI'].map(q => (
            <button key={q} onClick={() => router.push(`/search?q=${encodeURIComponent(q)}`)}
              className="hover:text-blue-600 transition-colors">{q}</button>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 bg-slate-50 border-y border-slate-100">
        <div className="max-w-4xl mx-auto grid grid-cols-4 gap-8 text-center px-6">
          {[
            { n: '8+', l: 'Indexed Papers' },
            { n: '124', l: 'Graph Nodes' },
            { n: '5', l: 'Research Gaps Identified' },
            { n: '3', l: 'Academic Sources' },
          ].map(s => (
            <div key={s.l}>
              <div className="text-3xl font-bold text-slate-900">{s.n}</div>
              <div className="text-sm text-slate-500 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Intelligence at Every Layer</h2>
          <p className="text-slate-500 max-w-xl mx-auto">From semantic retrieval to evidence-weighted gap discovery — every feature is backed by real algorithms operating on real academic data.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(f => (
            <Link key={f.href} href={f.href}
              className="group bg-white rounded-2xl border border-slate-200 p-6 hover:border-blue-200 hover:shadow-lg transition-all">
              <div className={`w-10 h-10 ${f.color} rounded-xl flex items-center justify-center mb-4`}>
                <f.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              <div className="flex items-center gap-1 mt-4 text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Open <ChevronRight className="w-3 h-3" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-slate-900 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">How ResearchGraph AI Works</h2>
            <p className="text-slate-400">A multi-stage intelligence pipeline from raw academic publications to actionable insights.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map(s => (
              <div key={s.n} className="text-center">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg">{s.n}</div>
                <h3 className="text-white font-semibold mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center max-w-2xl mx-auto">
        <Star className="w-10 h-10 text-amber-400 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Start Your Research Journey</h2>
        <p className="text-slate-500 mb-8">Join researchers exploring the academic knowledge graph. Free to get started.</p>
        <div className="flex justify-center gap-4">
          <Link href="/register" className="px-8 py-3.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm">
            Create Free Account
          </Link>
          <Link href="/dashboard" className="px-8 py-3.5 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors">
            Explore Dashboard
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 px-6 text-center text-sm text-slate-400">
        <p>ResearchGraph AI · AI-powered academic research intelligence · Built with FastAPI, Next.js, and evidence-weighted algorithms</p>
      </footer>
    </div>
  );
}
