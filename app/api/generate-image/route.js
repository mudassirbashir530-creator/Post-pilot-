import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateImage } from '@/lib/huggingFace';
import { checkRateLimit } from '@/lib/utils';
import { z } from 'zod';

const requestSchema = z.object({
  prompt: z.string().min(2, 'Prompt is required'),
});

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Rate Limiting Check
    const rateCheck = checkRateLimit(userId, 10, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a minute before generating more images.' },
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

    const imageUrl = await generateImage(validation.data.prompt);

    return NextResponse.json({ imageUrl, remaining: rateCheck.remaining });
  } catch (error) {
    console.error('API generate-image error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image. Please try again later.' },
      { status: 500 }
    );
  }
}
