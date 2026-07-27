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
  
  if (HF_API_KEY) {
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
  return await queryHuggingFace(MODELS.STABLE_DIFFUSION, { inputs: prompt }, true);
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

  const response = await queryHuggingFace(MODELS.MISTRAL, {
    inputs: systemPrompt,
    parameters: { max_new_tokens: 200, temperature: 0.7, return_full_text: false },
  });

  let generatedText = Array.isArray(response) ? response[0]?.generated_text : response?.generated_text;
  
  if (!generatedText || typeof generatedText !== 'string') {
    throw new Error('AI failed to generate caption text');
  }

  generatedText = generatedText.trim();
  if (isFacebook) {
    generatedText = generatedText.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  }

  return generatedText;
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

  const prompt = `List ${targetCount} trending hashtag keywords separated by spaces (e.g. #marketing #ai #social) related to: "${topic}".`;
  const response = await queryHuggingFace(MODELS.MISTRAL, {
    inputs: prompt,
    parameters: { max_new_tokens: 150, temperature: 0.5, return_full_text: false },
  });

  const text = Array.isArray(response) ? response[0]?.generated_text : response?.generated_text;
  if (!text) throw new Error('AI failed to generate hashtags');

  const matches = text.match(/#[a-zA-Z0-9_]+/g);
  if (matches && matches.length > 0) {
    const limit = isFacebook ? 10 : 30;
    return [...new Set(matches)].slice(0, limit);
  }

  throw new Error('No valid hashtags found in AI response');
}

/**
 * Toxicity check for incoming Facebook comments
 * @param {string} text 
 * @returns {Promise<{ score: number, isToxic: boolean }>}
 */
export async function checkToxicity(text) {
  if (!text) return { score: 0, isToxic: false };

  const result = await queryHuggingFace(MODELS.TOXIC_BERT, { inputs: text });
  
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
}
