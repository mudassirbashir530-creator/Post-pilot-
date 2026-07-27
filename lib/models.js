import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const SocialAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ['facebook', 'instagram'],
      required: true,
    },
    pageId: {
      type: String,
      required: true,
    },
    pageName: {
      type: String,
      default: '',
    },
    accessToken: {
      type: String,
      required: true,
      select: false, // Critical security rule: select: false
    },
    expiresAt: {
      type: Date,
    },
    followers: {
      type: Number,
      default: 0,
    },
    isValid: {
      type: Boolean,
      default: true,
    },
    connectedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const PostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ['facebook', 'instagram', 'both'],
      required: true,
    },
    imageUrl: {
      type: String,
    },
    imagePrompt: {
      type: String,
    },
    caption: {
      type: String,
    },
    hashtags: {
      type: [String],
      default: [],
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
    },
    postId: {
      type: String,
    },
    errorMessage: {
      type: String,
    },
  },
  { timestamps: true }
);

const AnalyticsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ['facebook', 'instagram'],
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    metrics: {
      engagement: { type: Number, default: 0 },
      reach: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      followers: { type: Number, default: 0 },
      impressions: { type: Number, default: 0 },
      engagementRate: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

const CommentReplySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    commentId: {
      type: String,
      required: true,
    },
    commentText: {
      type: String,
      required: true,
    },
    isToxic: {
      type: Boolean,
      default: false,
    },
    toxicityScore: {
      type: Number,
      default: 0,
    },
    replyText: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'replied', 'flagged'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const SocialAccount = mongoose.models.SocialAccount || mongoose.model('SocialAccount', SocialAccountSchema);
export const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);
export const Analytics = mongoose.models.Analytics || mongoose.model('Analytics', AnalyticsSchema);
export const CommentReply = mongoose.models.CommentReply || mongoose.model('CommentReply', CommentReplySchema);
