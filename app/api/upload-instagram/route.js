import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import { SocialAccount, Post } from '@/lib/models';
import { decrypt } from '@/lib/crypto';
import { publishToInstagram } from '@/lib/metaGraph';
import { uploadPostSchema } from '@/lib/utils';
import fs from 'fs';
import path from 'path';
import os from 'os';

const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

/**
 * Ensures image is accessible via public URL as required by Instagram Graph API
 */
async function getPublicImageUrl(imageUrl) {
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Handle base64 image data
  if (imageUrl.startsWith('data:image/')) {
    const matches = imageUrl.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
    if (!matches) throw new Error('Invalid base64 image data');

    const ext = matches[1] === 'svg+xml' ? 'svg' : matches[1] || 'png';
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `ig_upload_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const tempPath = path.join(os.tmpdir(), filename);

    await fs.promises.writeFile(tempPath, buffer);
    return `${NEXTAUTH_URL}/api/temp-image/${filename}`;
  }

  return imageUrl;
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();

    // 1. Zod Validation
    const validation = uploadPostSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { caption, hashtags, imageUrl, imagePrompt } = validation.data;
    const fullCaption = `${caption}\n\n${(hashtags || []).join(' ')}`.trim();

    await connectDB();

    // 2. Query MongoDB with mandatory { userId } rule
    const socialAccount = await SocialAccount.findOne({
      userId,
      platform: 'instagram',
      isValid: true,
    }).select('+accessToken');

    if (!socialAccount) {
      return NextResponse.json(
        { error: 'No active Instagram Business account connected. Please connect Instagram first.' },
        { status: 400 }
      );
    }

    // 3. Decrypt token in memory
    const decryptedToken = decrypt(socialAccount.accessToken);

    // 4. Ensure public URL for Instagram API
    const publicUrl = await getPublicImageUrl(imageUrl);

    // 5. Publish to Instagram Graph API
    let publishResult;
    try {
      publishResult = await publishToInstagram(
        socialAccount.pageId, // pageId stores Instagram Business Account ID
        decryptedToken,
        publicUrl,
        fullCaption
      );

      const newPost = await Post.create({
        userId,
        platform: 'instagram',
        imageUrl: publicUrl,
        imagePrompt: imagePrompt || '',
        caption,
        hashtags: hashtags || [],
        status: 'success',
        postId: publishResult.postId,
        uploadedAt: new Date(),
      });

      return NextResponse.json({ message: 'Post published to Instagram successfully!', post: newPost });
    } catch (igError) {
      console.error('Instagram publish error:', igError);

      const failedPost = await Post.create({
        userId,
        platform: 'instagram',
        imageUrl: publicUrl,
        imagePrompt: imagePrompt || '',
        caption,
        hashtags: hashtags || [],
        status: 'failed',
        errorMessage: igError.message || 'Instagram API upload failed',
        uploadedAt: new Date(),
      });

      return NextResponse.json(
        { error: `Instagram upload failed: ${igError.message}`, post: failedPost },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API upload-instagram error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during Instagram upload' },
      { status: 500 }
    );
  }
}
