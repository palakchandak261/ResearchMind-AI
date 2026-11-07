'use client';
import { useState } from 'react';
import { Search, Bell, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TopBar({ title }: { title?: string }) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('rg_token');
    router.push('/');
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-4 flex-shrink-0">
      {title && <h1 className="text-base font-semibold text-slate-900 mr-auto">{title}</h1>}
      {!title && <div className="mr-auto" />}

      <div className="relative flex items-center bg-slate-100 rounded-lg px-3 py-1.5 gap-2 w-48 lg:w-64">
        <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <input
          className="bg-transparent text-sm outline-none w-full text-slate-700 placeholder:text-slate-400"
          placeholder="Quick search…"
          onFocus={() => router.push('/search')}
        />
      </div>

      <button className="relative text-slate-500 hover:text-slate-700">
        <Bell className="w-5 h-5" />
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full" />
      </button>

      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold hover:bg-blue-700"
        >
          R
        </button>
        {showMenu && (
          <div className="absolute right-0 top-10 bg-white border border-slate-200 rounded-xl shadow-lg py-1 w-44 z-50">
            <div className="px-3 py-2 border-b border-slate-100">
              <div className="text-sm font-medium text-slate-900">Researcher</div>
              <div className="text-xs text-slate-400">researcher@rg.ai</div>
            </div>
            <Link href="/library" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <User className="w-4 h-4" /> My Library
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-slate-50 w-full">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
