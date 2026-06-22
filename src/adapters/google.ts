// src/adapters/google.ts — Full replacement

import type { BaseAdapter, GenerationRequest, GenerationResult } from './_base';

// ── Model roster ──────────────────────────────────────────────
export const GOOGLE_IMAGE_MODELS = {
  'nano-banana':     'gemini-2.5-flash-image',          // fast, economical
  'nano-banana-2':   'gemini-3.1-flash-image-preview',  // default, best balance
  'nano-banana-pro': 'gemini-3-pro-image-preview',      // studio quality
} as const;

export type GoogleImageModel = keyof typeof GOOGLE_IMAGE_MODELS;

// Model used when quality is not overridden
const DEFAULT_IMAGE_MODEL: GoogleImageModel = 'nano-banana-2';

// Veo video model (current GA)
const VEO_MODEL     = 'veo-2.0-generate-001';

const GEMINI_BASE   = 'https://generativelanguage.googleapis.com/v1beta/models';

// ── Quality → model mapping ───────────────────────────────────
function pickImageModel(req: GenerationRequest): string {
  // Explicit override via metadata (set by model picker UI)
  const override = req.metadata?.googleModel as GoogleImageModel | undefined;
  if (override && GOOGLE_IMAGE_MODELS[override]) {
    return GOOGLE_IMAGE_MODELS[override];
  }
  // Quality mapping
  if (req.quality === 'ultra') return GOOGLE_IMAGE_MODELS['nano-banana-pro'];
  if (req.quality === 'draft') return GOOGLE_IMAGE_MODELS['nano-banana'];
  return GOOGLE_IMAGE_MODELS[DEFAULT_IMAGE_MODEL];
}

export const googleAdapter: BaseAdapter = {
  provider: 'google',
  displayName: 'Google AI (Nano Banana)',

  capabilities: {
    tasks: ['image-gen', 'image-edit', 'video-gen', 'archviz',
            'style-transfer', 'upscale', 'prompt-assist'],
    maxImageWidth: 4096,
    maxImageHeight: 4096,
    supportsVideo: true,
    supportsInpainting: true,
    supportsStyleTransfer: true,
    supportsStreaming: false,
    typicalLatencyMs: 8000,
  },

  async generate(req: GenerationRequest, apiKey: string): Promise<GenerationResult> {
    const start = Date.now();
    if (req.task === 'video-gen')   return generateVideo(req, apiKey, start);
    if (req.task === 'prompt-assist') return assistWithGemini(req, apiKey, start);
    if (req.task === 'upscale')     return upscaleWithGemini(req, apiKey, start);
    if (req.task === 'image-edit' && req.referenceImage) {
      return editImage(req, apiKey, start);
    }
    return generateImage(req, apiKey, start);
  },

  async validateKey(apiKey: string): Promise<boolean> {
    try {
      const res = await fetch(
        `${GEMINI_BASE}/${GOOGLE_IMAGE_MODELS['nano-banana-2']}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'hi' }] }],
            generationConfig: { maxOutputTokens: 1 },
          }),
        }
      );
      return res.ok;
    } catch { return false; }
  },
};

// ── Image Generation ──────────────────────────────────────────
async function generateImage(
  req: GenerationRequest, apiKey: string, start: number
): Promise<GenerationResult> {
  const model = pickImageModel(req);

  // Append aspect ratio description to prompt for reliable layout across all models
  let enhancedPrompt = req.prompt;
  if (req.aspectRatio) {
    enhancedPrompt += `. Aspect ratio: ${req.aspectRatio}.`;
  }
  if (req.negativePrompt) {
    enhancedPrompt += ` Avoid: ${req.negativePrompt}`;
  }

  const body = {
    contents: [{
      parts: [{
        text: enhancedPrompt,
      }],
    }],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
    },
  };

  const res = await fetch(`${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Google (${model}) error: ${(err as any)?.error?.message ?? res.statusText}`);
  }

  return extractImageResult(await res.json(), model, start);
}

// ── Image Editing ─────────────────────────────────────────────
async function editImage(
  req: GenerationRequest, apiKey: string, start: number
): Promise<GenerationResult> {
  const model = pickImageModel(req);
  const imageB64  = await blobToBase64(req.referenceImage!);
  const imageMime = req.referenceImage!.type || 'image/png';

  const parts: unknown[] = [
    { inline_data: { mime_type: imageMime, data: imageB64 } },
  ];

  if (req.maskImage) {
    const maskB64 = await blobToBase64(req.maskImage);
    parts.push({ inline_data: { mime_type: 'image/png', data: maskB64 } });
    parts.push({
      text: `Edit only the masked area: ${req.prompt}. Preserve everything outside the mask.`,
    });
  } else {
    parts.push({
      text: `Edit this image: ${req.prompt}. Maintain overall composition and style.`,
    });
  }

  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: { responseModalities: ['IMAGE', 'TEXT'], temperature: 0.4 },
  };

  const res = await fetch(`${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Google edit error: ${(err as any)?.error?.message ?? res.statusText}`);
  }

  return extractImageResult(await res.json(), model, start);
}

// ── Upscale (via Nano Banana img2img) ────────────────────────
async function upscaleWithGemini(
  req: GenerationRequest, apiKey: string, start: number
): Promise<GenerationResult> {
  if (!req.referenceImage) throw new Error('Upscale requires an input image.');
  const model = GOOGLE_IMAGE_MODELS['nano-banana-pro'];

  const imageB64  = await blobToBase64(req.referenceImage);
  const imageMime = req.referenceImage.type || 'image/png';

  const body = {
    contents: [{
      role: 'user',
      parts: [
        { inline_data: { mime_type: imageMime, data: imageB64 } },
        {
          text: req.prompt
            ? `Enhance and upscale this image with higher detail and resolution: ${req.prompt}`
            : 'Enhance and upscale this image. Increase detail, sharpness, and resolution. Preserve the original composition and style exactly.',
        },
      ],
    }],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
      temperature: 0.2,
    },
  };

  const res = await fetch(`${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Google upscale error: ${(err as any)?.error?.message ?? res.statusText}`);
  }

  return extractImageResult(await res.json(), model, start);
}

// ── Video Generation (Direct Browser Calls — No Proxy Required) ──
async function generateVideo(
  req: GenerationRequest, apiKey: string, start: number
): Promise<GenerationResult> {
  const veoBase  = 'https://generativelanguage.googleapis.com/v1beta';

  const instances: Record<string, unknown> = {
    prompt: req.prompt,
  };

  if (req.referenceImage) {
    instances['image'] = {
      bytesBase64Encoded: await blobToBase64(req.referenceImage),
      mimeType: req.referenceImage.type || 'image/png',
    };
  }

  if (req.styleImage) {
    instances['lastFrame'] = {
      bytesBase64Encoded: await blobToBase64(req.styleImage),
      mimeType: req.styleImage.type || 'image/png',
    };
  }

  const body = {
    instances: [instances],
    parameters: {
      durationSeconds: req.duration ?? 8,
      aspectRatio: req.aspectRatio ?? '16:9',
      sampleCount: 1,
    },
  };

  try {
    const initRes = await fetch(
      `${veoBase}/models/${VEO_MODEL}:predictLongRunning?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!initRes.ok) {
      const err = await initRes.json().catch(() => ({}));
      throw new Error(`Veo init error: ${(err as any)?.error?.message ?? initRes.statusText}`);
    }

    const operation = await initRes.json();
    const operationName: string = operation.name;

    for (let i = 0; i < 60; i++) {
      await sleep(5000);
      const pollRes = await fetch(`${veoBase}/${operationName}?key=${apiKey}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const op = await pollRes.json();
      if (op.done) {
        const videoUri =
          op?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri
          ?? op?.response?.videos?.[0]?.uri;
        if (!videoUri) throw new Error('Veo: no video URI in response');
        return {
          type: 'video',
          url: videoUri,
          model: VEO_MODEL,
          provider: 'google',
          durationMs: Date.now() - start,
        };
      }
      if (op.error) throw new Error(`Veo generation failed: ${op.error.message}`);
    }

    throw new Error('Veo: timed out after 5 minutes');
  } catch (e: any) {
    if (e instanceof TypeError || String(e).includes('fetch') || String(e).includes('NetworkError')) {
      throw new Error(`Veo video generation failed to connect to Google API: ${e.message || e}. Ensure your internet connection is active and your API key has access to the Veo model in AI Studio.`);
    }
    throw e;
  }
}

// ── Prompt Assist ─────────────────────────────────────────────
async function assistWithGemini(
  req: GenerationRequest, apiKey: string, start: number
): Promise<GenerationResult> {
  const body = {
    system_instruction: {
      parts: [{
        text: `You are an elite prompt engineer for AI image generation.
Expand the given concept into a precise, cinematic generation prompt.
Include: composition, lighting, camera details, materials, atmosphere, color palette.
Return only the expanded prompt — no preamble, under 200 words.`,
      }],
    },
    contents: [{ role: 'user', parts: [{ text: req.prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
  };

  const res = await fetch(
    `${GEMINI_BASE}/gemini-2.5-flash:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );

  if (!res.ok) throw new Error(`Gemini prompt assist error: ${res.statusText}`);
  const data = await res.json();
  const refined = data.candidates?.[0]?.content?.parts?.[0]?.text ?? req.prompt;

  return {
    type: 'image', model: 'gemini-2.5-flash', provider: 'google',
    durationMs: Date.now() - start, metadata: { refinedPrompt: refined },
  };
}

// ── Shared helpers ────────────────────────────────────────────
function extractImageResult(
  data: unknown, model: string, start: number
): GenerationResult {
  const parts = (data as any).candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find(
    (p: any) => p.inlineData || p.inline_data
  );
  const inlineData = imagePart?.inlineData ?? imagePart?.inline_data;

  if (inlineData?.data) {
    const blob = base64ToBlob(
      inlineData.data,
      inlineData.mimeType ?? inlineData.mime_type ?? 'image/png'
    );
    return { type: 'image', blob, model, provider: 'google', durationMs: Date.now() - start };
  }

  const textPart = parts.find((p: any) => p.text);
  throw new Error(
    textPart?.text
      ? `Model returned text only: ${textPart.text}`
      : 'Google: no image in response. Ensure image generation is enabled in AI Studio.'
  );
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(b64: string, mimeType: string): Blob {
  const bytes = atob(b64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mimeType });
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
