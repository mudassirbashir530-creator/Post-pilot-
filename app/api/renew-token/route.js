import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import { SocialAccount } from '@/lib/models';
import { getMetaOAuthUrl } from '@/lib/metaGraph';
import { renewTokenSchema } from '@/lib/utils';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();

    // 1. Zod Validation
    const validation = renewTokenSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { socialAccountId } = validation.data;

    await connectDB();

    // 2. Query MongoDB with mandatory { userId } rule
    const account = await SocialAccount.findOne({
      _id: socialAccountId,
      userId,
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Social account not found or access denied' },
        { status: 404 }
      );
    }

    // Refresh token expiry calculation (extend by 60 days)
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 60);

    account.expiresAt = newExpiresAt;
    account.isValid = true;
    await account.save();

    const authUrl = getMetaOAuthUrl(userId, account.platform);

    return NextResponse.json({
      message: 'Token renewed successfully for 60 days',
      account: {
        id: account._id,
        platform: account.platform,
        expiresAt: account.expiresAt,
        isValid: account.isValid,
      },
      reauthUrl: authUrl,
    });
  } catch (error) {
    console.error('API renew-token error:', error);
    return NextResponse.json(
      { error: 'Failed to renew token' },
      { status: 500 }
    );
  }
}
