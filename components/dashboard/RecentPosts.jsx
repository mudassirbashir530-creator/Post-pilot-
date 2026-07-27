'use client';

import { Facebook, Instagram, CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function RecentPosts({ posts = [] }) {
  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-800">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Recent Published Posts
          </h2>
          <p className="text-xs text-slate-400 mt-1">Activity log of manual and automated daily posts</p>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs">
          No posts created yet. Use the AI Content Studio above to publish your first post!
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="pb-3 px-4">Media</th>
                <th className="pb-3 px-4">Platform</th>
                <th className="pb-3 px-4">Caption Preview</th>
                <th className="pb-3 px-4">Published At</th>
                <th className="pb-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {posts.map((post) => (
                <tr key={post._id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden">
                      {post.imageUrl ? (
                        <img src={post.imageUrl} alt="Post preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold">P</div>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    {post.platform === 'facebook' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                        <Facebook className="w-3.5 h-3.5" />
                        Facebook
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
                        <Instagram className="w-3.5 h-3.5" />
                        Instagram
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 max-w-xs">
                    <p className="truncate text-white font-medium">{post.caption || 'No caption'}</p>
                    {post.errorMessage && (
                      <p className="text-[10px] text-rose-400 truncate mt-0.5">{post.errorMessage}</p>
                    )}
                  </td>

                  <td className="py-3 px-4 text-slate-400">{formatDate(post.uploadedAt)}</td>

                  <td className="py-3 px-4">
                    {post.status === 'success' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Success
                      </span>
                    ) : post.status === 'failed' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 font-medium">
                        <XCircle className="w-3.5 h-3.5" />
                        Failed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
