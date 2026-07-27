'use client';

import Link from 'next/link';
import { Send, Shield, Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-navy-900 border-t border-slate-800 text-slate-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
              P
            </div>
            <span className="text-xl font-bold text-white tracking-tight">PostPilot</span>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="/signup" className="hover:text-white transition-colors">Register</Link>
          </div>

          <div className="text-xs text-slate-500 text-center md:text-right">
            © {new Date().getFullYear()} PostPilot. All rights reserved. Encrypted & Secured.
          </div>
        </div>
      </div>
    </footer>
  );
}
