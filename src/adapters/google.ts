// src/adapters/google.ts
// Updated June 2026 — Imagen deprecated, all routes now use Nano Banana (Gemini image models)

import type { BaseAdapter, GenerationRequest, GenerationResult } from './_base';

// Nano Banana = gemini-2.5-flash-image — the current Google image model
const NANO_BANANA       = 'gemini-2.5-flash-image';
const GEMINI_PRO_IMAGE  = 'gemini-3.1-flash-image-preview'; // ultra quality path
const VEO_2_MODEL       = 'veo-2.0-generate-001';
const BASE_URL          = 'https://generativelanguage.googleapis.com/v1beta/models';

export const googleAdapter: BaseAdapter = {
  provider: 'google',
  displayName: 'Google AI (Nano Banana · Veo 2)',

  capabilities: {
    tasks: ['image-gen', 'image-edit', 'video-gen', 'archviz', 'style-transfer', 'prompt-assist'],
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
    if (req.task === 'video-gen') return generateVideo(req, apiKey, start);
    if (req.task === 'prompt-assist') return assistWithGemini(req, apiKey, start);
    if (req.task === 'image-edit' && req.referenceImage) return editImage(req, apiKey, start);
    return generateImage(req, apiKey, start);
  },

  async validateKey(apiKey: string): Promise<boolean> {
    try {
      const res = await fetch(
        `${BASE_URL}/${NANO_BANANA}:generateContent?key=${apiKey}`,
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
    } catch {
      return false;
    }
  },
};

// ── Image Generation ──────────────────────────────────────────
async function generateImage(
  req: GenerationRequest,
  apiKey: string,
  start: number
): Promise<GenerationResult> {
  // Ultra quality → use preview pro model, otherwise Nano Banana
  const model = req.quality === 'ultra' ? GEMINI_PRO_IMAGE : NANO_BANANA;

  const body = {
    contents: [{
      parts: [{ text: req.prompt + (req.negativePrompt ? `. Avoid: ${req.negativePrompt}` : '') }],
    }],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
      // aspectRatio supported on Nano Banana
      ...(req.aspectRatio && { aspectRatio: req.aspectRatio }),
    },
  };

  const res = await fetch(`${BASE_URL}/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Google image gen error: ${err?.error?.message ?? res.statusText}`);
  }

  return extractImageResult(await res.json(), model, 'google', start);
}

// ── Image Editing ─────────────────────────────────────────────
async function editImage(
  req: GenerationRequest,
  apiKey: string,
  start: number
): Promise<GenerationResult> {
  const model = req.quality === 'ultra' ? GEMINI_PRO_IMAGE : NANO_BANANA;

  const imageB64  = await blobToBase64(req.referenceImage!);
  const imageMime = req.referenceImage!.type || 'image/png';

  // Build parts — image first, then optional mask, then instruction
  const parts: unknown[] = [
    { inline_data: { mime_type: imageMime, data: imageB64 } },
  ];

  if (req.maskImage) {
    const maskB64 = await blobToBase64(req.maskImage);
    parts.push({ inline_data: { mime_type: 'image/png', data: maskB64 } });
    parts.push({
      text: `Edit only the masked/highlighted area: ${req.prompt}. Preserve everything outside the mask exactly as it is.`,
    });
  } else {
    parts.push({
      text: `Edit this image: ${req.prompt}. Maintain the overall composition and style.`,
    });
  }

  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
      temperature: 0.4,
    },
  };

  const res = await fetch(`${BASE_URL}/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Google image edit error: ${err?.error?.message ?? res.statusText}`);
  }

  return extractImageResult(await res.json(), model, 'google', start);
}

// ── Prompt Assist ─────────────────────────────────────────────
async function assistWithGemini(
  req: GenerationRequest,
  apiKey: string,
  start: number
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

  // Use text-only Gemini Flash for prompt assist — no image model needed
  const res = await fetch(
    `${BASE_URL}/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) throw new Error(`Gemini prompt assist error: ${res.statusText}`);
  const data = await res.json();
  const refined = data.candidates?.[0]?.content?.parts?.[0]?.text ?? req.prompt;

  return {
    type: 'image',
    model: 'gemini-2.5-flash',
    provider: 'google',
    durationMs: Date.now() - start,
    metadata: { refinedPrompt: refined },
  };
}

// ── Video Generation ──────────────────────────────────────────
async function generateVideo(
  req: GenerationRequest,
  apiKey: string,
  start: number
): Promise<GenerationResult> {
  const body = {
    model: VEO_2_MODEL,
    prompt: { text: req.prompt },
    generationConfig: {
      durationSeconds: req.duration ?? 8,
      aspectRatio: req.aspectRatio ?? '16:9',
    },
  };

  const initRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${VEO_2_MODEL}:generateVideo?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );

  if (!initRes.ok) throw new Error(`Veo 2 init error: ${initRes.statusText}`);
  const operation = await initRes.json();
  const result = await pollOperation(operation.name, apiKey);
  const response = result?.response as { videos?: Array<{ uri: string }> } | undefined;
  const videoUri = response?.videos?.[0]?.uri;
  if (!videoUri) throw new Error('Veo 2: no video in response');

  return {
    type: 'video',
    url: videoUri,
    model: VEO_2_MODEL,
    provider: 'google',
    durationMs: Date.now() - start,
  };
}

// ── Shared helpers ────────────────────────────────────────────

function extractImageResult(
  data: Record<string, unknown>,
  model: string,
  provider: string,
  start: number
): GenerationResult {
  const parts = (data as any).candidates?.[0]?.content?.parts ?? [];

  const imagePart = parts.find(
    (p: Record<string, unknown>) => p.inlineData || p.inline_data
  );
  const inlineData = imagePart?.inlineData ?? imagePart?.inline_data;

  if (inlineData?.data) {
    const blob = base64ToBlob(inlineData.data, inlineData.mimeType ?? inlineData.mime_type ?? 'image/png');
    return { type: 'image', blob, model, provider, durationMs: Date.now() - start };
  }

  // No image returned — surface text if any
  const textPart = parts.find((p: Record<string, unknown>) => p.text);
  throw new Error(
    textPart?.text
      ? `Model returned text only: ${textPart.text}`
      : 'Google: no image in response. Check your API key has image generation enabled at aistudio.google.com'
  );
}

async function pollOperation(
  operationName: string,
  apiKey: string,
  maxAttempts = 60
): Promise<Record<string, unknown>> {
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(3000);
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`
    );
    const op = await res.json();
    if (op.done) return op;
  }
  throw new Error('Veo 2: timed out');
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

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
