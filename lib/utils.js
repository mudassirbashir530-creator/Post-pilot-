import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { z } from 'zod';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Zod Validation Schemas
export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const generateContentSchema = z.object({
  topic: z.string().min(2, 'Topic must be at least 2 characters'),
  platform: z.enum(['facebook', 'instagram', 'both']).default('both'),
  generateImage: z.boolean().default(true),
});

export const uploadPostSchema = z.object({
  platform: z.enum(['facebook', 'instagram', 'both']),
  caption: z.string().min(1, 'Caption is required'),
  hashtags: z.array(z.string()).default([]),
  imageUrl: z.string().min(1, 'Image URL is required'),
  imagePrompt: z.string().optional(),
});

export const renewTokenSchema = z.object({
  socialAccountId: z.string().min(1, 'Social Account ID is required'),
});

// Simple In-Memory Rate Limiter for AI Generation Endpoints
const rateLimitMap = new Map();

/**
 * Checks rate limit for a user ID
 * @param {string} userId 
 * @param {number} limit Max requests allowed per window
 * @param {number} windowMs Window in milliseconds (e.g. 60000 = 1 minute)
 * @returns {{ allowed: boolean, remaining: number }}
 */
export function checkRateLimit(userId, limit = 10, windowMs = 60000) {
  const now = Date.now();
  const userData = rateLimitMap.get(userId) || { count: 0, resetAt: now + windowMs };

  if (now > userData.resetAt) {
    userData.count = 0;
    userData.resetAt = now + windowMs;
  }

  if (userData.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  userData.count += 1;
  rateLimitMap.set(userId, userData);

  return { allowed: true, remaining: limit - userData.count };
}

/**
 * Format currency or number values
 */
export function formatNumber(num) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(num || 0);
}

/**
 * Format date for social display
 */
export function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
