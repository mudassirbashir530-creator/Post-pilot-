'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/dashboard/Header';
import ConnectSocial from '@/components/dashboard/ConnectSocial';
import ContentPreview from '@/components/dashboard/ContentPreview';
import AnalyticsSection from '@/components/dashboard/AnalyticsSection';
import RecentPosts from '@/components/dashboard/RecentPosts';
import AutoReplyLog from '@/components/dashboard/AutoReplyLog';
import {
  LayoutDashboard,
  Sparkles,
  Share2,
  BarChart2,
  MessageSquare,
  RefreshCw,
  Zap,
} from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    summary: {},
    chartData: [],
    recentPosts: [],
    accounts: [],
    recentComments: [],
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, replyRes] = await Promise.all([
        fetch('/api/analytics'),
        fetch('/api/auto-reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'list' }),
        }),
      ]);

      const analytics = await analyticsRes.json();
      const replies = await replyRes.json();

      setDashboardData({
        summary: analytics.summary || {},
        chartData: analytics.chartData || [],
        recentPosts: analytics.recentPosts || [],
        accounts: analytics.accounts || [],
        recentComments: replies.logs || analytics.recentComments || [],
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const navItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'studio', label: 'AI Content Studio', icon: Sparkles },
    { id: 'accounts', label: 'Meta Connections', icon: Share2 },
    { id: 'analytics', label: 'Analytics Insights', icon: BarChart2 },
    { id: 'comments', label: 'Comment Toxicity', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col text-slate-100">
      <Header />

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 bg-slate-900/60 border-r border-slate-800 p-4 space-y-2">
          <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Navigation Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-6">
            <div className="p-4 rounded-xl glass-card border border-indigo-500/20 text-xs">
              <div className="flex items-center gap-2 text-indigo-300 font-bold mb-1">
                <Zap className="w-4 h-4 text-purple-400" />
                <span>Daily Cron Job</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Scheduled daily at 06:00 AM UTC. Automated AI post generation is enabled for all connected accounts.
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 space-y-8 overflow-y-auto">
          {loading ? (
            <div className="h-96 flex items-center justify-center text-slate-400 text-xs gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
              <span>Loading PostPilot Engine Data...</span>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <ConnectSocial accounts={dashboardData.accounts} onRefresh={fetchDashboardData} />
                  <ContentPreview onPostSuccess={fetchDashboardData} />
                  <AnalyticsSection summary={dashboardData.summary} chartData={dashboardData.chartData} />
                  <RecentPosts posts={dashboardData.recentPosts} />
                  <AutoReplyLog logs={dashboardData.recentComments} />
                </div>
              )}

              {activeTab === 'studio' && (
                <ContentPreview onPostSuccess={fetchDashboardData} />
              )}

              {activeTab === 'accounts' && (
                <ConnectSocial accounts={dashboardData.accounts} onRefresh={fetchDashboardData} />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsSection summary={dashboardData.summary} chartData={dashboardData.chartData} />
              )}

              {activeTab === 'comments' && (
                <AutoReplyLog logs={dashboardData.recentComments} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
