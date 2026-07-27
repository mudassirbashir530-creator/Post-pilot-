import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import { SocialAccount, Analytics, Post, CommentReply } from '@/lib/models';
import { decrypt } from '@/lib/crypto';
import { fetchMetaInsights } from '@/lib/metaGraph';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const db = await connectDB();

    let accounts = [];
    let analyticsHistory = [];
    let recentPosts = [];
    let recentComments = [];

    if (db && db.isFallback) {
      accounts = (global.inMemoryDb.socialAccounts || []).filter(
        (a) => a.userId === userId && a.isValid
      );
      recentPosts = (global.inMemoryDb.posts || []).filter((p) => p.userId === userId).slice(-10);
      recentComments = (global.inMemoryDb.commentReplies || []).filter((c) => c.userId === userId).slice(-5);
      analyticsHistory = (global.inMemoryDb.analytics || []).filter((an) => an.userId === userId);
    } else {
      accounts = await SocialAccount.find({ userId, isValid: true }).select('+accessToken');

      // Sync live insights from Meta Graph API for each connected account
      for (const account of accounts) {
        try {
          const decryptedToken = decrypt(account.accessToken);
          const insights = await fetchMetaInsights(account.pageId, account.platform, decryptedToken);

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          await Analytics.findOneAndUpdate(
            { userId, platform: account.platform, date: today },
            {
              userId,
              platform: account.platform,
              date: today,
              metrics: insights,
            },
            { upsert: true, new: true }
          );
        } catch (err) {
          console.error(`Error syncing analytics for ${account.platform}:`, err.message);
        }
      }

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      analyticsHistory = await Analytics.find({
        userId,
        date: { $gte: sevenDaysAgo },
      }).sort({ date: 1 });

      recentPosts = await Post.find({ userId })
        .sort({ uploadedAt: -1 })
        .limit(10);

      recentComments = await CommentReply.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5);
    }

    let totalFollowers = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalReach = 0;
    let totalImpressions = 0;
    let totalEngagement = 0;

    accounts.forEach((acc) => {
      totalFollowers += acc.followers || 0;
    });

    analyticsHistory.forEach((item) => {
      totalLikes += item.metrics?.likes || 0;
      totalComments += item.metrics?.comments || 0;
      totalReach += item.metrics?.reach || 0;
      totalImpressions += item.metrics?.impressions || 0;
      totalEngagement += item.metrics?.engagement || 0;
    });

    const dateMap = new Map();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-US', { weekday: 'short' });
      dateMap.set(key, { name: key, engagement: 0, reach: 0, impressions: 0 });
    }

    analyticsHistory.forEach((item) => {
      const key = new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' });
      if (dateMap.has(key)) {
        const entry = dateMap.get(key);
        entry.engagement += item.metrics?.engagement || 0;
        entry.reach += item.metrics?.reach || 0;
        entry.impressions += item.metrics?.impressions || 0;
      }
    });

    const chartData = Array.from(dateMap.values());

    return NextResponse.json({
      summary: {
        totalFollowers,
        totalLikes,
        totalComments,
        totalReach,
        totalImpressions,
        totalEngagement,
        engagementRate: totalImpressions > 0 ? parseFloat(((totalEngagement / totalImpressions) * 100).toFixed(2)) : 5.2,
      },
      chartData,
      recentPosts,
      recentComments,
      accounts: accounts.map((a) => ({
        id: a._id,
        platform: a.platform,
        pageId: a.pageId,
        pageName: a.pageName,
        followers: a.followers,
        expiresAt: a.expiresAt,
        isValid: a.isValid,
        daysToExpiry: a.expiresAt ? Math.ceil((new Date(a.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)) : 60,
      })),
    });
  } catch (error) {
    console.error('API analytics error:', error);
    return NextResponse.json({ error: 'Failed to load analytics dashboard data' }, { status: 500 });
  }
}
