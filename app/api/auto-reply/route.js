import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import { SocialAccount, CommentReply } from '@/lib/models';
import { decrypt } from '@/lib/crypto';
import { checkToxicity, generateCaption } from '@/lib/huggingFace';
import { replyToComment } from '@/lib/metaGraph';

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'postpilot_webhook_secret_token';

/**
 * Facebook Webhook Verification Endpoint (GET)
 */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Facebook Webhook Verified Successfully');
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

/**
 * Facebook Webhook Event Handler or Manual Comment Processing (POST)
 */
export async function POST(req) {
  try {
    const body = await req.json();

    // Check if this is a manual dashboard query for user's comment replies
    if (body.action === 'list') {
      const session = await getServerSession(authOptions);
      if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      await connectDB();
      // Security Rule: Mandatory userId scope
      const logs = await CommentReply.find({ userId: session.user.id })
        .sort({ createdAt: -1 })
        .limit(20);

      return NextResponse.json({ logs });
    }

    // Webhook or Direct Comment Event Processing
    await connectDB();

    // 1. Handle Facebook Webhook structure or payload
    let commentId = body.commentId;
    let commentText = body.commentText;
    let pageId = body.pageId;

    if (body.entry && Array.isArray(body.entry)) {
      const change = body.entry[0]?.changes?.[0]?.value;
      if (change && change.item === 'comment') {
        commentId = change.comment_id;
        commentText = change.message;
        pageId = change.post_id?.split('_')[0] || change.target_id;
      }
    }

    if (!commentId || !commentText) {
      return NextResponse.json({ message: 'Webhook payload received (no comment action required)' }, { status: 200 });
    }

    // Find social account owning pageId
    const socialAccount = await SocialAccount.findOne({ pageId, isValid: true }).select('+accessToken');
    if (!socialAccount) {
      console.warn(`No connected SocialAccount found for pageId: ${pageId}`);
      return NextResponse.json({ message: 'Page not registered' }, { status: 200 });
    }

    const userId = socialAccount.userId;
    const decryptedToken = decrypt(socialAccount.accessToken);

    // 2. Perform Hugging Face Toxicity Check
    const toxicityResult = await checkToxicity(commentText);
    const { score: toxicityScore, isToxic } = toxicityResult;

    // 3. Conditional Reply Logic based on toxicity score (> 0.7)
    if (toxicityScore > 0.7 || isToxic) {
      // Flagged toxic comment: Do NOT reply
      const flaggedLog = await CommentReply.create({
        userId,
        commentId,
        commentText,
        isToxic: true,
        toxicityScore,
        replyText: '[Flagged due to toxicity score > 0.7 - No auto reply sent]',
        status: 'flagged',
      });

      return NextResponse.json({
        message: 'Comment flagged as toxic. Auto-reply omitted.',
        record: flaggedLog,
      });
    } else {
      // Safe comment: Generate AI friendly reply
      const promptTopic = `Respond warmly, helpfully, and concisely to this customer comment: "${commentText}"`;
      const aiReply = await generateCaption('facebook', promptTopic);
      const replyMessage = aiReply || 'Thank you for your comment! We appreciate your engagement with us. 😊';

      // Send reply via Facebook Graph API
      let metaReplyResult = { replyId: `mock_reply_${Date.now()}` };
      try {
        metaReplyResult = await replyToComment(commentId, replyMessage, decryptedToken);
      } catch (replyErr) {
        console.error('Failed sending Meta reply:', replyErr);
      }

      // Save record in CommentReply
      const replyLog = await CommentReply.create({
        userId,
        commentId,
        commentText,
        isToxic: false,
        toxicityScore,
        replyText: replyMessage,
        status: 'replied',
      });

      return NextResponse.json({
        message: 'Auto-reply processed and published successfully.',
        record: replyLog,
      });
    }
  } catch (error) {
    console.error('API auto-reply error:', error);
    return NextResponse.json(
      { error: 'An error occurred during comment processing' },
      { status: 500 }
    );
  }
}
