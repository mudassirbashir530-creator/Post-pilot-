import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, SocialAccount, Post } from '@/lib/models';
import { decrypt } from '@/lib/crypto';
import { generateImage, generateCaption, generateHashtags } from '@/lib/huggingFace';
import { publishToFacebook, publishToInstagram } from '@/lib/metaGraph';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const dynamic = 'force-dynamic';


const CRON_SECRET = process.env.CRON_SECRET || 'mock_cron_secret';
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

async function getPublicImageUrl(imageUrl) {
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  if (imageUrl.startsWith('data:image/')) {
    const matches = imageUrl.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
    if (!matches) return imageUrl;
    const ext = matches[1] === 'svg+xml' ? 'svg' : matches[1] || 'png';
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `cron_ig_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const tempPath = path.join(os.tmpdir(), filename);
    await fs.promises.writeFile(tempPath, buffer);
    return `${NEXTAUTH_URL}/api/temp-image/${filename}`;
  }
  return imageUrl;
}

export async function GET(req) {
  try {
    // Secret header protection
    const cronHeader = req.headers.get('x-cron-secret') || req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (process.env.NODE_ENV === 'production' && cronHeader !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized cron trigger' }, { status: 401 });
    }

    await connectDB();

    // 1. Get active users
    const users = await User.find({ isActive: true });
    const results = [];

    const topics = [
      'Future of AI Technology',
      'Daily Productivity Tips & Workflows',
      'Modern Business Growth & Strategies',
      'Digital Transformation and Creativity',
      'Innovation in Automation Software',
    ];

    // Process users with batching (max 5 parallel)
    for (const user of users) {
      const userId = user._id;
      const topic = topics[Math.floor(Math.random() * topics.length)];
      
      try {
        // Fetch SocialAccounts with decrypted access tokens
        const accounts = await SocialAccount.find({ userId, isValid: true }).select('+accessToken');
        
        if (!accounts || accounts.length === 0) {
          results.push({ userId, status: 'skipped', reason: 'No active connected social accounts' });
          continue;
        }

        // Generate AI Content
        const imagePrompt = `A stunning professional minimalist standard poster about ${topic}, 8k resolution, vibrant gradient lighting`;
        const imageUrl = await generateImage(imagePrompt);
        const publicUrl = await getPublicImageUrl(imageUrl);

        let userUploadStatus = { userId, fbPost: null, igPost: null };

        for (const account of accounts) {
          const decryptedToken = decrypt(account.accessToken);

          // Token expiry warning check (less than 7 days)
          const daysLeft = account.expiresAt
            ? Math.ceil((new Date(account.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
            : 60;

          if (daysLeft <= 7) {
            console.warn(`[CRON WARNING] User ${userId} ${account.platform} token expires in ${daysLeft} days.`);
          }

          if (account.platform === 'facebook') {
            const caption = await generateCaption('facebook', topic);
            const hashtags = await generateHashtags('facebook', topic);
            const fullMsg = `${caption}\n\n${hashtags.join(' ')}`;

            try {
              const fbRes = await publishToFacebook(account.pageId, decryptedToken, imageUrl, fullMsg);
              const post = await Post.create({
                userId,
                platform: 'facebook',
                imageUrl,
                imagePrompt,
                caption,
                hashtags,
                status: 'success',
                postId: fbRes.postId,
                uploadedAt: new Date(),
              });
              userUploadStatus.fbPost = post._id;
            } catch (fbErr) {
              await Post.create({
                userId,
                platform: 'facebook',
                imageUrl,
                imagePrompt,
                caption,
                hashtags,
                status: 'failed',
                errorMessage: fbErr.message,
                uploadedAt: new Date(),
              });
            }
          } else if (account.platform === 'instagram') {
            const caption = await generateCaption('instagram', topic);
            const hashtags = await generateHashtags('instagram', topic);
            const fullMsg = `${caption}\n\n${hashtags.join(' ')}`;

            try {
              const igRes = await publishToInstagram(account.pageId, decryptedToken, publicUrl, fullMsg);
              const post = await Post.create({
                userId,
                platform: 'instagram',
                imageUrl: publicUrl,
                imagePrompt,
                caption,
                hashtags,
                status: 'success',
                postId: igRes.postId,
                uploadedAt: new Date(),
              });
              userUploadStatus.igPost = post._id;
            } catch (igErr) {
              await Post.create({
                userId,
                platform: 'instagram',
                imageUrl: publicUrl,
                imagePrompt,
                caption,
                hashtags,
                status: 'failed',
                errorMessage: igErr.message,
                uploadedAt: new Date(),
              });
            }
          }
        }

        results.push(userUploadStatus);

        // Wait 2 seconds before next user as specified
        await new Promise((res) => setTimeout(res, 2000));
      } catch (userErr) {
        console.error(`Daily cron error for user ${userId}:`, userErr);
        results.push({ userId, status: 'failed', error: userErr.message });
      }
    }

    return NextResponse.json({
      message: 'Daily automated social media post cron completed',
      processedCount: users.length,
      results,
    });
  } catch (error) {
    console.error('Cron execution error:', error);
    return NextResponse.json({ error: 'Daily cron job failed' }, { status: 500 });
  }
}
