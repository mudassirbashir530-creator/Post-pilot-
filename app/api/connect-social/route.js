import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getMetaOAuthUrl } from '@/lib/metaGraph';
import connectDB from '@/lib/db';
import { SocialAccount } from '@/lib/models';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const platform = searchParams.get('platform') || 'facebook';

    const userId = session.user.id;
    const authUrl = getMetaOAuthUrl(userId, platform);

    return NextResponse.json({ url: authUrl });
  } catch (error) {
    console.error('API connect-social error:', error);
    return NextResponse.json({ error: 'Failed to initiate social connection' }, { status: 500 });
  }
}

// GET list of user's connected social accounts
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const db = await connectDB();
    
    let accounts = [];

    if (db && db.isFallback) {
      accounts = (global.inMemoryDb.socialAccounts || []).filter((a) => a.userId === userId);
    } else {
      accounts = await SocialAccount.find({ userId })
        .select('-accessToken')
        .sort({ connectedAt: -1 });
    }

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('API get social accounts error:', error);
    return NextResponse.json({ error: 'Failed to fetch connected accounts' }, { status: 500 });
  }
}
