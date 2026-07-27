'use client';

import { useSession, signOut } from 'next-auth/react';
import { LogOut, User as UserIcon, Bell, Sparkles } from 'lucide-react';

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20">
          P
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            PostPilot Dashboard
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              v1.0 Production
            </span>
          </h1>
          <p className="text-xs text-slate-400">Multi-User Social Automation Engine</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* User Info */}
        <div className="flex items-center gap-3 glass-card px-3 py-1.5 rounded-xl border border-slate-800">
          <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-semibold text-xs">
            {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-white">{session?.user?.name || 'User'}</p>
            <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{session?.user?.email}</p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700 transition-colors flex items-center gap-2 text-xs font-semibold"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
