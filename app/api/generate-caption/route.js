import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateCaption } from '@/lib/huggingFace';
import { checkRateLimit } from '@/lib/utils';
import { z } from 'zod';

const requestSchema = z.object({
  topic: z.string().min(2, 'Topic must be at least 2 characters'),
  platform: z.enum(['facebook', 'instagram', 'both']).default('facebook'),
});

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Rate Limiting Check
    const rateCheck = checkRateLimit(userId, 15, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a minute.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { topic, platform } = validation.data;
    
    // If 'both' platform selected, return formatted captions for both
    if (platform === 'both') {
      const [fbCaption, igCaption] = await Promise.all([
        generateCaption('facebook', topic),
        generateCaption('instagram', topic),
      ]);
      return NextResponse.json({ facebookCaption: fbCaption, instagramCaption: igCaption });
    }

    const caption = await generateCaption(platform, topic);
    return NextResponse.json({ caption });
  } catch (error) {
    console.error('API generate-caption error:', error);
    return NextResponse.json(
      { error: 'Failed to generate caption. Please try again.' },
      { status: 500 }
    );
  }
}
