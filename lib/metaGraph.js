const GRAPH_API_VERSION = 'v18.0';
const BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

function getAppId() {
  return process.env.META_APP_ID;
}

function getAppSecret() {
  return process.env.META_APP_SECRET;
}

function getBaseUrl(customOrigin) {
  return customOrigin || process.env.NEXTAUTH_URL || 'http://localhost:3000';
}

/**
 * Generates Meta OAuth Authorization URL
 * @param {string} userId 
 * @param {string} platform ('facebook' | 'instagram')
 * @param {string} customOrigin
 * @returns {string}
 */
export function getMetaOAuthUrl(userId, platform = 'facebook', customOrigin) {
  const origin = getBaseUrl(customOrigin);
  const redirectUri = encodeURIComponent(`${origin}/api/connect-social/callback`);
  const scope = encodeURIComponent('pages_manage_posts,pages_read_engagement,pages_manage_metadata,instagram_basic,instagram_content_publish');
  const state = `${platform}_${userId}`;
  const appId = getAppId();

  if (!appId) {
    throw new Error('META_APP_ID environment variable is missing');
  }

  return `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
}

/**
 * Exchange code for long-lived access token
 * @param {string} code 
 * @param {string} customOrigin
 * @returns {Promise<{ accessToken: string, expiresAt: Date }>}
 */
export async function exchangeCodeForLongLivedToken(code, customOrigin) {
  const origin = getBaseUrl(customOrigin);
  const appId = getAppId();
  const appSecret = getAppSecret();
  const redirectUri = `${origin}/api/connect-social/callback`;

  if (!appId || !appSecret) {
    throw new Error('META_APP_ID or META_APP_SECRET environment variable is missing');
  }

  // 1. Get short-lived token
  const tokenUrl = `${BASE_URL}/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`;
  const tokenRes = await fetch(tokenUrl);
  const tokenData = await tokenRes.json();

  if (!tokenRes.ok || tokenData.error) {
    throw new Error(tokenData.error?.message || 'Failed to exchange Meta OAuth authorization code');
  }

  const shortLivedToken = tokenData.access_token;

  // 2. Exchange for 60-day long-lived token
  const longLivedUrl = `${BASE_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;
  const longLivedRes = await fetch(longLivedUrl);
  const longLivedData = await longLivedRes.json();

  if (!longLivedRes.ok || longLivedData.error) {
    throw new Error(longLivedData.error?.message || 'Failed to obtain long-lived Meta token');
  }

  const expiresAt = new Date();
  const expiresInSeconds = longLivedData.expires_in || 60 * 24 * 60 * 60; // 60 days fallback
  expiresAt.setSeconds(expiresAt.getSeconds() + expiresInSeconds);

  return {
    accessToken: longLivedData.access_token,
    expiresAt,
  };
}

/**
 * Fetch connected Facebook Pages for token
 * @param {string} accessToken 
 * @returns {Promise<Array<{ id: string, name: string, access_token: string, followers_count?: number }>>}
 */
export async function getUserFacebookPages(accessToken) {
  const url = `${BASE_URL}/me/accounts?fields=id,name,access_token,followers_count&access_token=${accessToken}`;
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || 'Failed to fetch Facebook pages');
  }

  return data.data || [];
}

/**
 * Fetch Instagram Business Account ID attached to a Facebook Page
 * @param {string} pageId 
 * @param {string} pageAccessToken 
 * @returns {Promise<{ igId: string | null, igUsername?: string }>}
 */
export async function getInstagramBusinessAccount(pageId, pageAccessToken) {
  const url = `${BASE_URL}/${pageId}?fields=instagram_business_account{id,username,followers_count}&access_token=${pageAccessToken}`;
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || 'Failed to fetch Instagram Business Account');
  }

  const igAccount = data.instagram_business_account;
  return {
    igId: igAccount ? igAccount.id : null,
    igUsername: igAccount ? igAccount.username : undefined,
    followers: igAccount ? igAccount.followers_count : 0,
  };
}

/**
 * Publish photo post to Facebook Page
 * @param {string} pageId 
 * @param {string} pageAccessToken 
 * @param {string} imageUrl 
 * @param {string} caption 
 * @returns {Promise<{ postId: string }>}
 */
export async function publishToFacebook(pageId, pageAccessToken, imageUrl, caption) {
  const url = `${BASE_URL}/${pageId}/photos`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: imageUrl,
      message: caption,
      access_token: pageAccessToken,
    }),
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error?.message || 'Failed to publish post to Facebook');
  }

  return { postId: data.post_id || data.id };
}

/**
 * Publish photo post to Instagram Business Account
 * Note: Requires valid public HTTPS URL for image_url
 * @param {string} igId 
 * @param {string} pageAccessToken 
 * @param {string} publicImageUrl 
 * @param {string} caption 
 * @returns {Promise<{ postId: string }>}
 */
export async function publishToInstagram(igId, pageAccessToken, publicImageUrl, caption) {
  // Step 1: Create media container
  const createMediaUrl = `${BASE_URL}/${igId}/media`;
  const createRes = await fetch(createMediaUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: publicImageUrl,
      caption: caption,
      access_token: pageAccessToken,
    }),
  });

  const createData = await createRes.json();
  if (!createRes.ok || createData.error) {
    throw new Error(createData.error?.message || 'Failed to create Instagram media container');
  }

  const creationId = createData.id;

  // Wait 3 seconds for Instagram to process the container
  await new Promise((res) => setTimeout(res, 3000));

  // Step 2: Publish media container
  const publishUrl = `${BASE_URL}/${igId}/media_publish`;
  const publishRes = await fetch(publishUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: creationId,
      access_token: pageAccessToken,
    }),
  });

  const publishData = await publishRes.json();
  if (!publishRes.ok || publishData.error) {
    throw new Error(publishData.error?.message || 'Failed to publish Instagram media');
  }

  return { postId: publishData.id };
}

/**
 * Post reply to a Facebook comment
 * @param {string} commentId 
 * @param {string} replyMessage 
 * @param {string} pageAccessToken 
 * @returns {Promise<{ replyId: string }>}
 */
export async function replyToComment(commentId, replyMessage, pageAccessToken) {
  const url = `${BASE_URL}/${commentId}/comments`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: replyMessage,
      access_token: pageAccessToken,
    }),
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error?.message || 'Failed to reply to Facebook comment');
  }

  return { replyId: data.id };
}

/**
 * Fetch insights data for Facebook Page or Instagram Account
 * @param {string} targetId (pageId or igId)
 * @param {string} platform ('facebook' | 'instagram')
 * @param {string} pageAccessToken 
 */
export async function fetchMetaInsights(targetId, platform, pageAccessToken) {
  try {
    const metric = platform === 'facebook'
      ? 'page_impressions,page_engaged_users,page_post_engagements'
      : 'impressions,reach,profile_views';

    const url = `${BASE_URL}/${targetId}/insights?metric=${metric}&period=day&access_token=${pageAccessToken}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.error) {
      console.warn(`Meta insights fetch warning for ${platform}:`, data.error?.message);
      return getEmptyMetrics();
    }

    const metricsObj = getEmptyMetrics();
    if (Array.isArray(data.data)) {
      data.data.forEach((item) => {
        const val = item.values?.[0]?.value || 0;
        if (item.name.includes('impression')) metricsObj.impressions = val;
        if (item.name.includes('engaged') || item.name.includes('engagement')) metricsObj.engagement = val;
        if (item.name.includes('reach')) metricsObj.reach = val;
      });
    }

    metricsObj.engagementRate = metricsObj.impressions > 0
      ? parseFloat(((metricsObj.engagement / metricsObj.impressions) * 100).toFixed(2))
      : 0;

    return metricsObj;
  } catch (error) {
    console.error('Error fetching Meta insights:', error.message);
    return getEmptyMetrics();
  }
}

function getEmptyMetrics() {
  return {
    engagement: 0,
    reach: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    followers: 0,
    impressions: 0,
    engagementRate: 0,
  };
}
