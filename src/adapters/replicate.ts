import type { BaseAdapter, GenerationRequest, GenerationResult } from './_base';
import { blobToBase64 } from '../utils/blobUtils';

const BASE_URL = 'https://api.replicate.com/v1';

const MODELS = {
  'image-gen': 'black-forest-labs/flux-dev',
  'image-gen-fast': 'black-forest-labs/flux-schnell',
  'upscale': 'nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa',
  'archviz': 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
};

export const replicateAdapter: BaseAdapter = {
  provider: 'replicate',
  displayName: 'Replicate (Flux · ESRGAN)',

  capabilities: {
    tasks: ['image-gen', 'archviz', 'upscale', 'style-transfer'],
    maxImageWidth: 2048,
    maxImageHeight: 2048,
    supportsVideo: false,
    supportsInpainting: false,
    supportsStyleTransfer: true,
    supportsStreaming: false,
    typicalLatencyMs: 15000,
  },

  async generate(req: GenerationRequest, apiKey: string): Promise<GenerationResult> {
    const start = Date.now();
    const modelId = selectModel(req);

    // Asynchronously resolve reference images / style images to Base64 URIs for clean JSON serialization
    const input: Record<string, unknown> = {};

    if (req.task === 'upscale') {
      if (req.referenceImage) {
        const b64 = await blobToBase64(req.referenceImage);
        input['image'] = `data:${req.referenceImage.type || 'image/png'};base64,${b64}`;
      }
    } else {
      input['prompt'] = req.prompt;
      input['negative_prompt'] = req.negativePrompt ?? 'blurry, low quality, distorted';
      input['num_inference_steps'] = req.steps ?? 28;
      input['guidance_scale'] = req.guidanceScale ?? 3.5;
      input['width'] = req.width ?? 1024;
      input['height'] = req.height ?? 1024;
      if (req.seed !== undefined) {
        input['seed'] = req.seed;
      }
      if (req.referenceImage) {
        const b64 = await blobToBase64(req.referenceImage);
        input['image'] = `data:${req.referenceImage.type || 'image/png'};base64,${b64}`;
      }
      if (req.styleImage) {
        const b64 = await blobToBase64(req.styleImage);
        input['style_image'] = `data:${req.styleImage.type || 'image/png'};base64,${b64}`;
      }
    }

    const initRes = await fetch(`${BASE_URL}/predictions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ version: modelId.split(':')[1], input }),
    });

    if (!initRes.ok) {
      const err = await initRes.json().catch(() => ({}));
      throw new Error(`Replicate init error: ${err?.error?.message ?? initRes.statusText}`);
    }
    const prediction = await initRes.json();

    const result = await pollPrediction(prediction.id, apiKey);
    const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;
    if (!outputUrl) throw new Error('Replicate: no output URL in response');

    const imageRes = await fetch(outputUrl);
    const blob = await imageRes.blob();

    return {
      type: 'image',
      blob,
      url: outputUrl,
      model: modelId,
      provider: 'replicate',
      durationMs: Date.now() - start,
    };
  },
};

function selectModel(req: GenerationRequest): string {
  if (req.task === 'upscale') return MODELS['upscale'];
  if (req.task === 'archviz') return MODELS['archviz'];
  if (req.quality === 'draft') return MODELS['image-gen-fast'];
  return MODELS['image-gen'];
}

async function pollPrediction(
  id: string,
  apiKey: string,
  maxAttempts = 120
): Promise<Record<string, unknown>> {
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(2000);
    const res = await fetch(`${BASE_URL}/predictions/${id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const p = await res.json();
    if (p.status === 'succeeded') return p;
    if (p.status === 'failed') throw new Error(`Replicate failed: ${p.error}`);
  }
  throw new Error('Replicate: timed out');
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
