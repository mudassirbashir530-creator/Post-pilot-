'use client';

import { useState } from 'react';
import { Facebook, Instagram, AlertTriangle, RefreshCw, CheckCircle2, Plus, ExternalLink } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function ConnectSocial({ accounts = [], onRefresh }) {
  const [loadingPlatform, setLoadingPlatform] = useState(null);
  const [renewingId, setRenewingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleConnect = async (platform) => {
    try {
      setLoadingPlatform(platform);
      setErrorMsg(null);

      const res = await fetch(`/api/connect-social?platform=${platform}`);
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to initiate connection');
      setLoadingPlatform(null);
    }
  };

  const handleRenewToken = async (accountId) => {
    try {
      setRenewingId(accountId);
      setErrorMsg(null);

      const res = await fetch('/api/renew-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ socialAccountId: accountId }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to renew token');
      }

      if (onRefresh) onRefresh();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setRenewingId(null);
    }
  };

  const fbAccount = accounts.find((a) => a.platform === 'facebook');
  const igAccount = accounts.find((a) => a.platform === 'instagram');

  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-800">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Social Account Connections
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Connect Facebook Page & Instagram Business Account via Meta OAuth 2.0
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Facebook Connection Card */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-600/20 text-blue-400">
                  <Facebook className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Facebook Page</h3>
                  <p className="text-[11px] text-slate-400">
                    {fbAccount ? fbAccount.pageName : 'Not Connected'}
                  </p>
                </div>
              </div>

              {fbAccount?.isValid ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-medium">
                  Disconnected
                </span>
              )}
            </div>

            {fbAccount && (
              <div className="space-y-1.5 text-xs text-slate-400 mb-4 bg-slate-950/40 p-3 rounded-lg border border-slate-850">
                <div className="flex justify-between">
                  <span>Page ID:</span>
                  <span className="font-mono text-slate-200">{fbAccount.pageId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Followers:</span>
                  <span className="font-semibold text-slate-200">{fbAccount.followers || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Token Status:</span>
                  <span className={fbAccount.daysToExpiry <= 7 ? 'text-amber-400 font-bold' : 'text-slate-200'}>
                    Expires in {fbAccount.daysToExpiry} days
                  </span>
                </div>
              </div>
            )}

            {/* Token Expiry Warning (7 days rule) */}
            {fbAccount && fbAccount.daysToExpiry <= 7 && (
              <div className="mb-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Token expires soon (&lt; 7 days left)</span>
                </div>
                <button
                  onClick={() => handleRenewToken(fbAccount.id)}
                  disabled={renewingId === fbAccount.id}
                  className="px-2 py-1 rounded bg-amber-500 text-slate-950 font-bold text-[10px] hover:bg-amber-400"
                >
                  {renewingId === fbAccount.id ? 'Renewing...' : 'Renew Token'}
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => handleConnect('facebook')}
            disabled={loadingPlatform === 'facebook'}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loadingPlatform === 'facebook' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : fbAccount ? (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Reconnect Facebook Page</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Connect Facebook Page</span>
              </>
            )}
          </button>
        </div>

        {/* Instagram Connection Card */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white">
                  <Instagram className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Instagram Business</h3>
                  <p className="text-[11px] text-slate-400">
                    {igAccount ? `@${igAccount.pageName}` : 'Not Connected'}
                  </p>
                </div>
              </div>

              {igAccount?.isValid ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-medium">
                  Disconnected
                </span>
              )}
            </div>

            {igAccount && (
              <div className="space-y-1.5 text-xs text-slate-400 mb-4 bg-slate-950/40 p-3 rounded-lg border border-slate-850">
                <div className="flex justify-between">
                  <span>Business ID:</span>
                  <span className="font-mono text-slate-200">{igAccount.pageId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Followers:</span>
                  <span className="font-semibold text-slate-200">{igAccount.followers || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Token Status:</span>
                  <span className={igAccount.daysToExpiry <= 7 ? 'text-amber-400 font-bold' : 'text-slate-200'}>
                    Expires in {igAccount.daysToExpiry} days
                  </span>
                </div>
              </div>
            )}

            {/* Token Expiry Warning */}
            {igAccount && igAccount.daysToExpiry <= 7 && (
              <div className="mb-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Token expires soon (&lt; 7 days left)</span>
                </div>
                <button
                  onClick={() => handleRenewToken(igAccount.id)}
                  disabled={renewingId === igAccount.id}
                  className="px-2 py-1 rounded bg-amber-500 text-slate-950 font-bold text-[10px] hover:bg-amber-400"
                >
                  {renewingId === igAccount.id ? 'Renewing...' : 'Renew Token'}
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => handleConnect('instagram')}
            disabled={loadingPlatform === 'instagram'}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loadingPlatform === 'instagram' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : igAccount ? (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Reconnect Instagram Business</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Connect Instagram Business</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
