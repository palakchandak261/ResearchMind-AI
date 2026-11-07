'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Search, FileText, Network, Lightbulb,
  ShieldCheck, Bot, BookOpen, BarChart2, Library, GitCompare,
  ChevronLeft, ChevronRight, Atom
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/papers', label: 'Papers', icon: FileText },
  { href: '/graph', label: 'Graph Explorer', icon: Network },
  { href: '/gaps', label: 'Gap Analysis', icon: Lightbulb },
  { href: '/novelty', label: 'Novelty Auditor', icon: ShieldCheck },
  { href: '/assistant', label: 'AI Assistant', icon: Bot },
  { href: '/review', label: 'Lit. Review', icon: BookOpen },
  { href: '/compare', label: 'Compare Papers', icon: GitCompare },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/library', label: 'My Library', icon: Library },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`flex flex-col bg-slate-900 text-white transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'} min-h-screen flex-shrink-0`}>
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-slate-700">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Atom className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <div className="text-sm font-bold text-white leading-tight">ResearchGraph</div>
            <div className="text-xs text-blue-400 leading-tight">AI Platform</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-slate-700 p-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white text-xs transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
