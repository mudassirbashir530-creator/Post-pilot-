import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { SocialAccount } from '@/lib/models';
import { encrypt } from '@/lib/crypto';
import {
  exchangeCodeForLongLivedToken,
  getUserFacebookPages,
  getInstagramBusinessAccount,
} from '@/lib/metaGraph';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams, origin, host } = new URL(req.url);
    const baseUrl = origin && origin !== 'null' ? origin : `https://${host}`;

    const code = searchParams.get('code');
    const state = searchParams.get('state'); // e.g. "facebook_65d0a1b2c3..."
    const errorParam = searchParams.get('error_description');

    if (errorParam) {
      console.error('Meta OAuth callback error:', errorParam);
      return NextResponse.redirect(`${baseUrl}/dashboard?error=${encodeURIComponent(errorParam)}`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${baseUrl}/dashboard?error=invalid_callback_params`);
    }

    const [platform, userId] = state.split('_');

    if (!userId) {
      return NextResponse.redirect(`${baseUrl}/dashboard?error=missing_user_context`);
    }

    // 1. Exchange code for long-lived token (60 days)
    const { accessToken, expiresAt } = await exchangeCodeForLongLivedToken(code, baseUrl);

    // 2. Encrypt token before DB storage
    const encryptedToken = encrypt(accessToken);

    await connectDB();

    // 3. Fetch Facebook pages
    const pages = await getUserFacebookPages(accessToken);

    if (!pages || pages.length === 0) {
      return NextResponse.redirect(`${baseUrl}/dashboard?error=no_facebook_pages_found`);
    }

    const primaryPage = pages[0];

    if (platform === 'facebook') {
      await SocialAccount.findOneAndUpdate(
        { userId, platform: 'facebook', pageId: primaryPage.id },
        {
          userId,
          platform: 'facebook',
          pageId: primaryPage.id,
          pageName: primaryPage.name,
          accessToken: encryptedToken,
          expiresAt,
          followers: primaryPage.followers_count || 0,
          isValid: true,
          connectedAt: new Date(),
        },
        { upsert: true, new: true }
      );
    } else if (platform === 'instagram') {
      const igDetails = await getInstagramBusinessAccount(primaryPage.id, primaryPage.access_token || accessToken);

      if (!igDetails.igId) {
        return NextResponse.redirect(
          `${baseUrl}/dashboard?error=no_instagram_business_account_linked`
        );
      }

      await SocialAccount.findOneAndUpdate(
        { userId, platform: 'instagram', pageId: igDetails.igId },
        {
          userId,
          platform: 'instagram',
          pageId: igDetails.igId,
          pageName: igDetails.igUsername || `${primaryPage.name}_ig`,
          accessToken: encryptedToken,
          expiresAt,
          followers: igDetails.followers || 0,
          isValid: true,
          connectedAt: new Date(),
        },
        { upsert: true, new: true }
      );
    }

    return NextResponse.redirect(`${baseUrl}/dashboard?connected=true&platform=${platform}`);
  } catch (error) {
    console.error('Meta OAuth callback exception:', error);
    const host = req.headers.get('host') || 'localhost:3000';
    return NextResponse.redirect(`https://${host}/dashboard?error=${encodeURIComponent(error.message)}`);
  }
}
