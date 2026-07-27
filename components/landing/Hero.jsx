'use client';

import Link from 'next/link';
import { Sparkles, Facebook, Instagram, Zap, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Hero() {
  return (
    <div className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-800">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Platform Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-xs font-semibold text-indigo-300 mb-8 border border-indigo-500/30">
          <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
          <span>Next-Gen AI Social Automation for Facebook & Instagram</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Automate Social Growth with <span className="gradient-text">PostPilot AI</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal">
          Generate high-converting images, engaging captions, and trending hashtags daily. Auto-upload to Facebook Pages & Instagram Business with AI toxicity filtering auto-reply.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold text-base glow-btn flex items-center justify-center gap-2 hover:opacity-95 transition-all"
          >
            <span>Start Free Automation</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 rounded-xl glass-card text-slate-200 font-semibold text-base hover:bg-slate-800/80 transition-all border border-slate-700 text-center"
          >
            Sign In to Dashboard
          </Link>
        </div>

        {/* Platform Integration Badges */}
        <div className="mt-14 pt-8 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-8 text-slate-400 text-sm font-medium">
          <div className="flex items-center gap-2">
            <Facebook className="w-5 h-5 text-blue-500" />
            <span>Facebook Page Graph API</span>
          </div>
          <div className="flex items-center gap-2">
            <Instagram className="w-5 h-5 text-pink-500" />
            <span>Instagram Business Graph API</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span>Hugging Face AI Inference</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>AES-256 Token Encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
}
