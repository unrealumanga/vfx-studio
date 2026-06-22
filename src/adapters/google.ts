import type { BaseAdapter, GenerationRequest, GenerationResult } from './_base';

const IMAGEN_3_MODEL = 'imagen-3.0-generate-002';
const VEO_2_MODEL = 'veo-2.0-generate-001';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export const googleAdapter: BaseAdapter = {
  provider: 'google',
  displayName: 'Google AI (Imagen 3 · Veo 2)',

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

    if (req.task === 'video-gen') {
      return generateVideo(req, apiKey, start);
    }
    return generateImage(req, apiKey, start);
  },

  async validateKey(apiKey: string): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/${IMAGEN_3_MODEL}?key=${apiKey}`);
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
  const body = {
    instances: [
      {
        prompt: req.prompt,
        ...(req.negativePrompt && { negativePrompt: req.negativePrompt }),
        ...(req.referenceImage && {
          image: { bytesBase64Encoded: await blobToBase64(req.referenceImage) },
        }),
        ...(req.maskImage && {
          mask: { image: { bytesBase64Encoded: await blobToBase64(req.maskImage) } },
        }),
      },
    ],
    parameters: {
      sampleCount: 1,
      aspectRatio: req.aspectRatio ?? '1:1',
      ...(req.seed !== undefined && { seed: req.seed }),
    },
  };

  const res = await fetch(`${BASE_URL}/${IMAGEN_3_MODEL}:predict?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(`Google Imagen error: ${err?.error?.message ?? res.statusText}`);
  }

  const data = await res.json();
  const b64 = data.predictions?.[0]?.bytesBase64Encoded;
  if (!b64) throw new Error('Google Imagen: no image in response');

  const blob = base64ToBlob(b64, 'image/png');
  return {
    type: 'image',
    blob,
    model: IMAGEN_3_MODEL,
    provider: 'google',
    durationMs: Date.now() - start,
  };
}

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
  throw new Error('Veo 2: timed out waiting for video');
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
