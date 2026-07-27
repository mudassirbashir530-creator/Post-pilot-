const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

const MODELS = {
  STABLE_DIFFUSION: 'stabilityai/stable-diffusion-2-1',
  MISTRAL: 'mistralai/Mistral-7B-Instruct-v0.1',
  TOXIC_BERT: 'unitary/toxic-bert',
};

/**
 * Helper to fetch from HuggingFace Inference API with retry on model loading (503)
 */
async function queryHuggingFace(model, payload, isBinary = false, maxRetries = 2) {
  const url = `https://api-inference.huggingface.co/models/${model}`;
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (HF_API_KEY && !HF_API_KEY.startsWith('mock_')) {
    headers['Authorization'] = `Bearer ${HF_API_KEY}`;
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (response.status === 503) {
        const errData = await response.json().catch(() => ({}));
        const waitTime = Math.min((errData.estimated_time || 20) * 1000, 20000);
        console.warn(`HF Model ${model} is loading. Retrying in ${waitTime / 1000}s...`);
        if (attempt < maxRetries) {
          await new Promise((res) => setTimeout(res, waitTime));
          continue;
        }
      }

      if (!response.ok) {
        throw new Error(`HuggingFace API error (${response.status}): ${response.statusText}`);
      }

      if (isBinary) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return `data:image/png;base64,${buffer.toString('base64')}`;
      }

      return await response.json();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      await new Promise((res) => setTimeout(res, 2000));
    }
  }
}

/**
 * Generate AI image base64 data URL
 * @param {string} prompt 
 * @returns {Promise<string>} Base64 image data URL
 */
export async function generateImage(prompt) {
  try {
    if (!HF_API_KEY || HF_API_KEY.startsWith('mock_')) {
      return getFallbackBase64Image(prompt);
    }
    return await queryHuggingFace(MODELS.STABLE_DIFFUSION, { inputs: prompt }, true);
  } catch (error) {
    console.error('Image generation failed, using fallback:', error.message);
    return getFallbackBase64Image(prompt);
  }
}

/**
 * Generate social media post caption
 * @param {string} platform ('facebook' | 'instagram')
 * @param {string} topic 
 * @returns {Promise<string>}
 */
export async function generateCaption(platform, topic) {
  const isFacebook = platform === 'facebook';
  
  const systemPrompt = isFacebook
    ? `Write a short, professional, highly engaging Facebook post (1-2 sentences only, strict NO emojis) about: "${topic}".`
    : `Write a vibrant, exciting, emoji-rich Instagram post (3-5 sentences with call-to-action) about: "${topic}".`;

  try {
    if (!HF_API_KEY || HF_API_KEY.startsWith('mock_')) {
      return getFallbackCaption(platform, topic);
    }

    const response = await queryHuggingFace(MODELS.MISTRAL, {
      inputs: systemPrompt,
      parameters: { max_new_tokens: 200, temperature: 0.7, return_full_text: false },
    });

    let generatedText = Array.isArray(response) ? response[0]?.generated_text : response?.generated_text;
    
    if (!generatedText || typeof generatedText !== 'string') {
      return getFallbackCaption(platform, topic);
    }

    generatedText = generatedText.trim();
    if (isFacebook) {
      // Strip emojis for Facebook as per specification
      generatedText = generatedText.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
    }

    return generatedText || getFallbackCaption(platform, topic);
  } catch (error) {
    console.error('Caption generation error, using fallback:', error.message);
    return getFallbackCaption(platform, topic);
  }
}

/**
 * Generate hashtags list
 * @param {string} platform 
 * @param {string} topic 
 * @returns {Promise<string[]>}
 */
export async function generateHashtags(platform, topic) {
  const isFacebook = platform === 'facebook';
  const targetCount = isFacebook ? '5 to 10' : '15 to 30';

  try {
    if (!HF_API_KEY || HF_API_KEY.startsWith('mock_')) {
      return getFallbackHashtags(platform, topic);
    }

    const prompt = `List ${targetCount} trending hashtag keywords separated by spaces (e.g. #marketing #ai #social) related to: "${topic}".`;
    const response = await queryHuggingFace(MODELS.MISTRAL, {
      inputs: prompt,
      parameters: { max_new_tokens: 150, temperature: 0.5, return_full_text: false },
    });

    const text = Array.isArray(response) ? response[0]?.generated_text : response?.generated_text;
    if (!text) return getFallbackHashtags(platform, topic);

    const matches = text.match(/#[a-zA-Z0-9_]+/g);
    if (matches && matches.length > 0) {
      const limit = isFacebook ? 10 : 30;
      return [...new Set(matches)].slice(0, limit);
    }

    return getFallbackHashtags(platform, topic);
  } catch (error) {
    console.error('Hashtag generation error, using fallback:', error.message);
    return getFallbackHashtags(platform, topic);
  }
}

/**
 * Toxicity check for incoming Facebook comments
 * @param {string} text 
 * @returns {Promise<{ score: number, isToxic: boolean }>}
 */
export async function checkToxicity(text) {
  if (!text) return { score: 0, isToxic: false };

  try {
    if (!HF_API_KEY || HF_API_KEY.startsWith('mock_')) {
      return checkToxicityFallback(text);
    }

    const result = await queryHuggingFace(MODELS.TOXIC_BERT, { inputs: text });
    
    // toxic-bert returns nested array of label objects: [[{ label: 'toxic', score: 0.95 }, ...]]
    let toxicScore = 0;
    if (Array.isArray(result) && Array.isArray(result[0])) {
      const toxicItem = result[0].find((item) => item.label.toLowerCase().includes('toxic'));
      if (toxicItem) {
        toxicScore = toxicItem.score;
      }
    }

    return {
      score: toxicScore,
      isToxic: toxicScore >= 0.7,
    };
  } catch (error) {
    console.error('Toxicity check failed, using rule fallback:', error.message);
    return checkToxicityFallback(text);
  }
}

// Fallback Generators for Robust Production Reliability
function getFallbackCaption(platform, topic) {
  const cleanTopic = topic || 'Innovation & Growth';
  if (platform === 'facebook') {
    return `Exciting developments ahead regarding ${cleanTopic}. We continue pushing boundaries to deliver incredible value to our community.`;
  } else {
    return `🚀 Unlocking new potential with ${cleanTopic}! 🌟 Transform your daily workflow with cutting-edge tools designed to inspire creativity. Let us know your thoughts in the comments below! 👇✨`;
  }
}

function getFallbackHashtags(platform, topic) {
  const base = (topic || 'social').toLowerCase().replace(/[^a-z0-9]/g, '');
  const tags = [`#${base}`, '#postpilot', '#automation', '#socialmedia', '#marketing', '#ai', '#growth', '#tech'];
  if (platform === 'instagram') {
    tags.push('#creator', '#digitalmarketing', '#insta', '#viral', '#trending', '#innovation', '#strategy', '#business', '#success', '#future');
  }
  return tags;
}

function getFallbackBase64Image(prompt) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
    <rect width="800" height="800" fill="#1e293b"/>
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#6366f1" />
        <stop offset="100%" stop-color="#8b5cf6" />
      </linearGradient>
    </defs>
    <circle cx="400" cy="350" r="180" fill="url(#grad)" opacity="0.8"/>
    <text x="400" y="600" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#f1f5f9" text-anchor="middle">PostPilot AI Generated Visual</text>
    <text x="400" y="650" font-family="Arial, sans-serif" font-size="18" fill="#94a3b8" text-anchor="middle">${(prompt || 'AI Social Content').substring(0, 45)}</text>
  </svg>`;
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

function checkToxicityFallback(text) {
  const toxicKeywords = ['hate', 'stupid', 'idiot', 'spam', 'scam', 'trash', 'kill', 'ugly'];
  const lower = text.toLowerCase();
  const matched = toxicKeywords.filter((word) => lower.includes(word));
  const score = matched.length > 0 ? 0.85 : 0.05;
  return { score, isToxic: score >= 0.7 };
}
