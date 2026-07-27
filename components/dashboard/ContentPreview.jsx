'use client';

import { useState } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  MessageSquare,
  Hash,
  Send,
  Facebook,
  Instagram,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function ContentPreview({ onPostSuccess }) {
  const [topic, setTopic] = useState('AI Revolution in Modern Business');
  const [targetPlatform, setTargetPlatform] = useState('both');
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState([]);
  
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState('');
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Generate All Content (Image + Caption + Hashtags)
  const handleGenerateAll = async () => {
    if (!topic) return;
    try {
      setGenerating(true);
      setStatusMessage(null);

      // 1. Generate Image
      setGenStep('Generating Stable Diffusion AI Image...');
      const imgRes = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Professional social media poster about ${topic}, 8k, modern aesthetics` }),
      });
      const imgData = await imgRes.json();
      if (imgData.error) throw new Error(imgData.error);
      setImageUrl(imgData.imageUrl);

      // 2. Generate Caption
      setGenStep('Crafting Mistral AI Caption...');
      const capRes = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, platform: targetPlatform }),
      });
      const capData = await capRes.json();
      if (capData.error) throw new Error(capData.error);

      if (targetPlatform === 'facebook' && capData.facebookCaption) {
        setCaption(capData.facebookCaption);
      } else if (targetPlatform === 'instagram' && capData.instagramCaption) {
        setCaption(capData.instagramCaption);
      } else {
        setCaption(capData.caption || capData.instagramCaption || capData.facebookCaption);
      }

      // 3. Generate Hashtags
      setGenStep('Curating Trending Hashtags...');
      const tagRes = await fetch('/api/generate-hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, platform: targetPlatform }),
      });
      const tagData = await tagRes.json();
      if (tagData.error) throw new Error(tagData.error);
      setHashtags(tagData.hashtags || []);

      setStatusMessage({ type: 'success', text: 'AI Content generated successfully!' });
    } catch (err) {
      console.error('Generation error:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Generation failed' });
    } finally {
      setGenerating(false);
      setGenStep('');
    }
  };

  // Publish to Selected Platforms
  const handlePublish = async (platformToPublish) => {
    if (!imageUrl || !caption) {
      setStatusMessage({ type: 'error', text: 'Please generate content before publishing.' });
      return;
    }

    try {
      setUploading(true);
      setStatusMessage(null);

      const endpoint = platformToPublish === 'facebook' ? '/api/upload-facebook' : '/api/upload-instagram';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: platformToPublish,
          caption,
          hashtags,
          imageUrl,
          imagePrompt: topic,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || `Failed to publish to ${platformToPublish}`);
      }

      setStatusMessage({ type: 'success', text: `Successfully published to ${platformToPublish}!` });
      if (onPostSuccess) onPostSuccess();
    } catch (err) {
      console.error('Upload error:', err);
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handlePublishBoth = async () => {
    await handlePublish('facebook');
    await handlePublish('instagram');
  };

  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-800">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            AI Content Studio & Studio Preview
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Generate AI visuals, captions, and hashtags then auto-publish to Facebook & Instagram
          </p>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`mb-6 p-4 rounded-xl text-xs flex items-center gap-3 border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-6 space-y-5">
          {/* Topic Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Post Topic or Prompt</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. AI-driven productivity hacks for creators..."
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Platform Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Target Platform Tone</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTargetPlatform('facebook')}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
                  targetPlatform === 'facebook'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Facebook className="w-4 h-4" />
                <span>Facebook</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetPlatform('instagram')}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
                  targetPlatform === 'instagram'
                    ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Instagram className="w-4 h-4" />
                <span>Instagram</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetPlatform('both')}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
                  targetPlatform === 'both'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Both</span>
              </button>
            </div>
          </div>

          {/* AI Generator Button */}
          <button
            onClick={handleGenerateAll}
            disabled={generating || !topic}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-bold text-sm glow-btn flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{genStep || 'Generating Content...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Complete Post with AI</span>
              </>
            )}
          </button>

          {/* Editable Caption */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Generated Caption</label>
            <textarea
              rows={4}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Generated caption will appear here. You can edit it manually before publishing..."
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs leading-relaxed focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Editable Hashtags */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Hashtags</label>
            <input
              type="text"
              value={hashtags.join(' ')}
              onChange={(e) => setHashtags(e.target.value.split(' '))}
              placeholder="#hashtags #ai #automation"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-indigo-300 text-xs font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Live Preview & Publish Actions Column */}
        <div className="lg:col-span-6 flex flex-col justify-between">
          <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800">
            <div className="flex items-center justify-between mb-4 border-b border-slate-850 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  P
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">PostPilot Preview</h4>
                  <p className="text-[10px] text-slate-400">Just now • Published via AI Engine</p>
                </div>
              </div>

              <span className="text-[11px] text-indigo-400 font-mono">Live Mock</span>
            </div>

            {/* Live Image Box */}
            <div className="w-full aspect-square rounded-xl bg-slate-900 border border-slate-800 overflow-hidden relative flex items-center justify-center mb-4">
              {imageUrl ? (
                <img src={imageUrl} alt="AI Generated Post" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-6 text-slate-500">
                  <ImageIcon className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                  <p className="text-xs">No image generated yet</p>
                </div>
              )}
            </div>

            {/* Caption & Hashtags Preview */}
            <div className="space-y-2">
              <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                {caption || 'Your AI generated caption will render here in real-time.'}
              </p>
              <p className="text-xs font-mono text-indigo-400 flex flex-wrap gap-1">
                {hashtags.map((tag, i) => (
                  <span key={i}>{tag.startsWith('#') ? tag : `#${tag}`}</span>
                ))}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handlePublish('facebook')}
                disabled={uploading || !imageUrl}
                className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Facebook className="w-4 h-4" />
                <span>Publish to Facebook</span>
              </button>

              <button
                onClick={() => handlePublish('instagram')}
                disabled={uploading || !imageUrl}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Instagram className="w-4 h-4" />
                <span>Publish to Instagram</span>
              </button>
            </div>

            <button
              onClick={handlePublishBoth}
              disabled={uploading || !imageUrl}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Publishing Posts...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Auto-Publish to Both Platforms</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
