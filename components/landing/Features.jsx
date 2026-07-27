'use client';

import { Sparkles, Calendar, MessageSquare, BarChart3, ShieldAlert, Cpu } from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'AI Content Generation',
    description: 'Instant Stable Diffusion 2.1 visual creation paired with Mistral-7B generated captions tailored specifically for FB and Instagram formats.',
    color: 'text-indigo-400',
  },
  {
    icon: Calendar,
    title: '6 AM Automated Daily Uploads',
    description: 'Scheduled Vercel Cron jobs trigger daily content workflows, publishing posts automatically to connected Meta Pages without human intervention.',
    color: 'text-purple-400',
  },
  {
    icon: ShieldAlert,
    title: 'AI Toxicity Comment Guard',
    description: 'Facebook Webhooks analyze incoming comments using toxic-bert. Comments with toxicity score > 0.7 are flagged safely while friendly comments get AI responses.',
    color: 'text-rose-400',
  },
  {
    icon: BarChart3,
    title: 'Isolated User Analytics',
    description: 'Track reach, impressions, engagement rates, and follower growth with interactive Recharts diagrams completely isolated per account.',
    color: 'text-emerald-400',
  },
];

const steps = [
  {
    number: '01',
    title: 'Connect Meta Accounts',
    description: 'Authorize Facebook Page and Instagram Business Account via Meta OAuth 2.0 with AES-256 encrypted tokens.',
  },
  {
    number: '02',
    title: 'Set AI Content Preferences',
    description: 'Input your target niche or let our daily automated cron job generate images, captions, and hashtags.',
  },
  {
    number: '03',
    title: 'Sit Back & Monitor',
    description: 'PostPilot posts automatically, replies to comments safely, and aggregates live performance analytics.',
  },
];

export default function Features() {
  return (
    <div className="py-20 bg-navy-900/60 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Powerful Capabilities</h2>
          <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
            Everything You Need for Hands-Free Social Dominance
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-all group hover:-translate-y-1"
              >
                <div className="p-3 w-12 h-12 rounded-xl bg-slate-800/80 mb-5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* How It Works Section */}
        <div className="mt-28">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-extrabold text-white">How PostPilot Works</h2>
            <p className="mt-2 text-slate-400 text-sm">3 simple steps to complete social media automation</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="relative glass-card p-8 rounded-2xl border border-slate-800">
                <span className="text-5xl font-black text-indigo-500/20 absolute top-4 right-6">{step.number}</span>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
