'use client';

import { ShieldAlert, CheckCircle2, MessageSquare, AlertOctagon } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function AutoReplyLog({ logs = [] }) {
  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-800">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            AI Comment Toxicity & Auto-Reply Log
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Facebook Webhook comment events with Hugging Face toxic-bert scoring (&gt; 0.7 score gets flagged)
          </p>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-xs">
          No Facebook comment webhook events processed yet.
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const isToxic = log.isToxic || log.toxicityScore > 0.7;
            return (
              <div
                key={log._id}
                className={`p-4 rounded-xl border text-xs transition-colors ${
                  isToxic
                    ? 'bg-rose-500/10 border-rose-500/30'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isToxic ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold text-[10px] border border-rose-500/30">
                        <AlertOctagon className="w-3 h-3 text-rose-400" />
                        TOXIC FLAGGED (Score: {(log.toxicityScore || 0.85).toFixed(2)})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        SAFE (Score: {(log.toxicityScore || 0.05).toFixed(2)})
                      </span>
                    )}
                    <span className="text-slate-400 text-[10px] font-mono">ID: {log.commentId}</span>
                  </div>

                  <span className="text-slate-400 text-[10px]">{formatDate(log.createdAt)}</span>
                </div>

                <p className="text-slate-200 font-semibold mb-2">"{log.commentText}"</p>

                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-850 text-[11px]">
                  <span className="text-slate-400 font-semibold">AI Action / Reply: </span>
                  <span className={isToxic ? 'text-rose-300 italic' : 'text-indigo-300'}>
                    {log.replyText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
