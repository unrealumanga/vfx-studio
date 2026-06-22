import type { BaseAdapter, GenerationRequest, GenerationResult } from './_base';

const DALLE3_MODEL = 'dall-e-3';
const GPT4O_MODEL = 'gpt-4o';
const BASE_URL = 'https://api.openai.com/v1';

export const openaiAdapter: BaseAdapter = {
  provider: 'openai',
  displayName: 'OpenAI (DALL·E 3 · GPT-4o)',

  capabilities: {
    tasks: ['image-gen', 'image-edit', 'prompt-assist', 'style-transfer'],
    maxImageWidth: 1792,
    maxImageHeight: 1792,
    supportsVideo: false,
    supportsInpainting: true,
    supportsStyleTransfer: false,
    supportsStreaming: false,
    typicalLatencyMs: 12000,
  },

  async generate(req: GenerationRequest, apiKey: string): Promise<GenerationResult> {
    const start = Date.now();

    if (req.task === 'prompt-assist') {
      return refinePrompt(req, apiKey, start);
    }
    if (req.task === 'image-edit' && req.referenceImage) {
      return editImage(req, apiKey, start);
    }
    return generateImage(req, apiKey, start);
  },

  async validateKey(apiKey: string): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};

async function generateImage(
  req: GenerationRequest,
  apiKey: string,
  start: number
): Promise<GenerationResult> {
  const sizeMap: Record<string, string> = {
    '1:1': '1024x1024',
    '16:9': '1792x1024',
    '9:16': '1024x1792',
  };
  const size = sizeMap[req.aspectRatio ?? '1:1'] ?? '1024x1024';

  const body = {
    model: DALLE3_MODEL,
    prompt: req.prompt,
    n: 1,
    size,
    quality: req.quality === 'ultra' ? 'hd' : 'standard',
    response_format: 'b64_json',
    style: 'vivid',
  };

  const res = await fetch(`${BASE_URL}/images/generations`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`OpenAI DALL·E error: ${err?.error?.message ?? res.statusText}`);
  }

  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error('OpenAI: no image in response');

  const blob = base64ToBlob(b64, 'image/png');
  return {
    type: 'image',
    blob,
    model: DALLE3_MODEL,
    provider: 'openai',
    durationMs: Date.now() - start,
  };
}

async function editImage(
  req: GenerationRequest,
  apiKey: string,
  start: number
): Promise<GenerationResult> {
  const formData = new FormData();
  formData.append('model', 'dall-e-2');
  formData.append('prompt', req.prompt);
  formData.append('n', '1');
  formData.append('size', '1024x1024');
  formData.append('response_format', 'b64_json');

  const imageFile = new File([req.referenceImage!], 'image.png', { type: 'image/png' });
  formData.append('image', imageFile);

  if (req.maskImage) {
    const maskFile = new File([req.maskImage], 'mask.png', { type: 'image/png' });
    formData.append('mask', maskFile);
  }

  const res = await fetch(`${BASE_URL}/images/edits`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!res.ok) throw new Error(`OpenAI edit error: ${res.statusText}`);
  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error('OpenAI edit: no image in response');

  return {
    type: 'image',
    blob: base64ToBlob(b64, 'image/png'),
    model: 'dall-e-2',
    provider: 'openai',
    durationMs: Date.now() - start,
  };
}

async function refinePrompt(
  req: GenerationRequest,
  apiKey: string,
  start: number
): Promise<GenerationResult> {
  const systemPrompt = `You are a world-class prompt engineer for AI image and video generation.
When given a short or rough prompt, expand it into a highly detailed, cinematic prompt optimized for
photorealistic image generation. Include: lighting conditions, camera angle, lens type, time of day,
atmosphere, material details, color palette, and mood. Keep it under 200 words. Return only the
expanded prompt, no explanation.`;

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: GPT4O_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: req.prompt },
      ],
      max_tokens: 300,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI prompt assist error: ${res.statusText}`);
  const data = await res.json();
  const refined = data.choices?.[0]?.message?.content ?? req.prompt;

  return {
    type: 'image',
    model: 'prompt-assist',
    provider: 'openai',
    durationMs: Date.now() - start,
    metadata: { refinedPrompt: refined },
  };
}

function base64ToBlob(b64: string, mimeType: string): Blob {
  const bytes = atob(b64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mimeType });
}
