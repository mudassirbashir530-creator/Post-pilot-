import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import { SocialAccount, Post } from '@/lib/models';
import { decrypt } from '@/lib/crypto';
import { publishToFacebook } from '@/lib/metaGraph';
import { uploadPostSchema } from '@/lib/utils';

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
    const fullMessage = `${caption}\n\n${(hashtags || []).join(' ')}`.trim();

    const db = await connectDB();

    let socialAccount;
    if (db && db.isFallback) {
      socialAccount = (global.inMemoryDb.socialAccounts || []).find(
        (a) => a.userId === userId && a.platform === 'facebook' && a.isValid
      );
    } else {
      socialAccount = await SocialAccount.findOne({
        userId,
        platform: 'facebook',
        isValid: true,
      }).select('+accessToken');
    }

    if (!socialAccount) {
      return NextResponse.json(
        { error: 'No active Facebook page connected. Please connect your Facebook page first.' },
        { status: 400 }
      );
    }

    // 3. Decrypt token in server memory
    const decryptedToken = decrypt(socialAccount.accessToken);

    // 4. Publish to Facebook Graph API
    let publishResult;
    try {
      publishResult = await publishToFacebook(
        socialAccount.pageId,
        decryptedToken,
        imageUrl,
        fullMessage
      );

      if (db && db.isFallback) {
        const newPost = {
          _id: 'post_fb_' + Date.now(),
          userId,
          platform: 'facebook',
          imageUrl,
          imagePrompt: imagePrompt || '',
          caption,
          hashtags: hashtags || [],
          status: 'success',
          postId: publishResult.postId,
          uploadedAt: new Date(),
        };
        global.inMemoryDb.posts.push(newPost);
        return NextResponse.json({ message: 'Post published to Facebook successfully!', post: newPost });
      }

      const newPost = await Post.create({
        userId,
        platform: 'facebook',
        imageUrl,
        imagePrompt: imagePrompt || '',
        caption,
        hashtags: hashtags || [],
        status: 'success',
        postId: publishResult.postId,
        uploadedAt: new Date(),
      });

      return NextResponse.json({ message: 'Post published to Facebook successfully!', post: newPost });
    } catch (fbError) {
      console.error('Facebook publish error:', fbError);

      if (db && db.isFallback) {
        const failedPost = {
          _id: 'post_fb_' + Date.now(),
          userId,
          platform: 'facebook',
          imageUrl,
          imagePrompt: imagePrompt || '',
          caption,
          hashtags: hashtags || [],
          status: 'failed',
          errorMessage: fbError.message || 'Facebook API upload failed',
          uploadedAt: new Date(),
        };
        global.inMemoryDb.posts.push(failedPost);
        return NextResponse.json(
          { error: `Facebook upload failed: ${fbError.message}`, post: failedPost },
          { status: 500 }
        );
      }

      const failedPost = await Post.create({
        userId,
        platform: 'facebook',
        imageUrl,
        imagePrompt: imagePrompt || '',
        caption,
        hashtags: hashtags || [],
        status: 'failed',
        errorMessage: fbError.message || 'Facebook API upload failed',
        uploadedAt: new Date(),
      });

      return NextResponse.json(
        { error: `Facebook upload failed: ${fbError.message}`, post: failedPost },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API upload-facebook error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during Facebook upload' },
      { status: 500 }
    );
  }
}
