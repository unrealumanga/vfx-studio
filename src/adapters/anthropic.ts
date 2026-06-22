import type { BaseAdapter, GenerationRequest, GenerationResult } from './_base';

const MODEL = 'claude-sonnet-4-6';
const BASE_URL = 'https://api.anthropic.com/v1/messages';

export const anthropicAdapter: BaseAdapter = {
  provider: 'anthropic',
  displayName: 'Anthropic (Claude)',

  capabilities: {
    tasks: ['prompt-assist'],
    maxImageWidth: 0,
    maxImageHeight: 0,
    supportsVideo: false,
    supportsInpainting: false,
    supportsStyleTransfer: false,
    supportsStreaming: true,
    typicalLatencyMs: 3000,
  },

  async generate(req: GenerationRequest, apiKey: string): Promise<GenerationResult> {
    const start = Date.now();

    const systemPrompt = `You are an elite creative director and prompt engineer specializing in
AI-generated imagery, cinematic VFX, and architectural visualization. When given a rough concept,
transform it into a precise, evocative generation prompt. Include: composition and framing,
lighting setup (direction, color temperature, quality), camera details (focal length, depth of field,
angle), materials and textures, atmospheric conditions, color palette, and emotional tone.
Optimize for photorealism. Return only the refined prompt — no preamble, no explanation, under 250 words.`;

    const messages: Array<{ role: string; content: unknown }> = [];

    if (req.referenceImage) {
      const b64 = await blobToBase64(req.referenceImage);
      messages.push({
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/png', data: b64 },
          },
          {
            type: 'text',
            text: `Reference image provided. Expand this concept into a detailed generation prompt: ${req.prompt}`,
          },
        ],
      });
    } else {
      messages.push({ role: 'user', content: req.prompt });
    }

    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        system: systemPrompt,
        messages,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Anthropic error: ${err?.error?.message ?? res.statusText}`);
    }

    const data = await res.json();
    const refined = data.content?.[0]?.text ?? req.prompt;

    return {
      type: 'image',
      model: MODEL,
      provider: 'anthropic',
      durationMs: Date.now() - start,
      metadata: { refinedPrompt: refined },
    };
  },

  async validateKey(apiKey: string): Promise<boolean> {
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'hi' }],
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
