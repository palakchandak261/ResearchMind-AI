'use client';
import { useState, useRef, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { api, AssistantResponse, Paper } from '@/lib/api';
import { Bot, Send, User, BookOpen, X, Search, Loader2, Quote, ChevronRight } from 'lucide-react';

function CitationBubble({ c }: { c: AssistantResponse['citations'][0] }) {
  return (
    <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Quote className="w-3 h-3 text-blue-600" />
        <span className="text-xs font-semibold text-blue-700">{c.paper_title}</span>
        <span className="text-xs text-blue-500">· {c.section}</span>
      </div>
      <p className="text-xs text-slate-600 italic leading-relaxed">&ldquo;{c.quote}&rdquo;</p>
    </div>
  );
}

type Message = { role: 'user' | 'assistant'; content: string; citations?: AssistantResponse['citations'] };

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I\'m the ResearchGraph AI Assistant. Ask me anything about the indexed papers — objectives, methodologies, limitations, comparisons. All answers are grounded in source passages with citations.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [paperSearch, setPaperSearch] = useState('');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [contextPapers, setContextPapers] = useState<Paper[]>([]);
  const [searching, setSearching] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const searchPapers = async () => {
    if (!paperSearch.trim()) return;
    setSearching(true);
    try {
      const r = await api.searchHybrid({ query: paperSearch, limit: 5 });
      setPapers(r.results);
    } catch { } finally { setSearching(false); }
  };

  const addContext = (p: Paper) => {
    if (!contextPapers.find(cp => cp.id === p.id)) setContextPapers(prev => [...prev, p]);
  };

  const removeContext = (id: string) => setContextPapers(prev => prev.filter(p => p.id !== id));

  const send = async () => {
    if (!input.trim() || loading) return;
    const q = input.trim();
    setInput('');
    setMessages(m => [...m, { role: 'user', content: q }]);
    setLoading(true);
    try {
      const r = await api.askAssistant(q, contextPapers.map(p => p.id));
      setMessages(m => [...m, { role: 'assistant', content: r.answer, citations: r.citations }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Failed to get a response. Please check the backend connection.' }]);
    } finally { setLoading(false); }
  };

  const SUGGESTIONS = [
    'What is the main contribution of BERT?',
    'How does FlashAttention improve transformer efficiency?',
    'What limitations does RAG have?',
    'Compare LoRA vs full fine-tuning',
  ];

  return (
    <AppLayout title="AI Research Assistant">
      <div className="flex gap-5 h-[calc(100vh-7rem)]">
        {/* Context panel */}
        <div className="w-60 flex-shrink-0 flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex-shrink-0">
            <h3 className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">Paper Context</h3>
            <div className="flex gap-2 mb-2">
              <input value={paperSearch} onChange={e => setPaperSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchPapers()}
                placeholder="Add paper…"
                className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none" />
              <button onClick={searchPapers} className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              </button>
            </div>

            {papers.map(p => (
              <button key={p.id} onClick={() => addContext(p)}
                className="w-full text-left text-xs p-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors mb-1 line-clamp-2 text-slate-600">
                <ChevronRight className="w-3 h-3 inline mr-1" />{p.title.slice(0, 50)}…
              </button>
            ))}
          </div>

          {contextPapers.length > 0 && (
            <div className="bg-white rounded-xl border border-blue-200 p-4">
              <h3 className="text-xs font-semibold text-blue-700 mb-2">Active Context</h3>
              {contextPapers.map(p => (
                <div key={p.id} className="flex items-start gap-1 mb-2">
                  <div className="flex-1 text-xs text-slate-700 line-clamp-2">{p.title.slice(0, 45)}…</div>
                  <button onClick={() => removeContext(p.id)} className="text-slate-400 hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'assistant' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {m.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div className={`max-w-[75%] ${m.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-slate-100 text-slate-800 rounded-tl-sm'}`}>
                    {m.content}
                  </div>
                  {m.citations?.map((c, ci) => <CitationBubble key={ci} c={c} />)}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center"><Bot className="w-4 h-4 text-white" /></div>
                <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1"><div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} /><div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} /><div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} /></div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length === 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => setInput(s)}
                  className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-slate-100 p-4 flex gap-3">
            <textarea
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask about paper objectives, methods, limitations, comparisons…"
              rows={2}
              className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <button onClick={send} disabled={loading || !input.trim()}
              className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 self-end transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
