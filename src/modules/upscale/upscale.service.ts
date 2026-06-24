import { pickAdapter } from '../../utils/router';
import { useKeysStore } from '../../store/keys.store';
import { useSessionStore } from '../../store/session.store';
import { useHistoryStore } from '../../store/history.store';
import { blobToBase64 } from '../../utils/blobUtils';

export async function upscaleImage(customBlob?: Blob, factor?: number) {
  const session = useSessionStore.getState();
  const keys = useKeysStore.getState().keys;
  const { addEntry } = useHistoryStore.getState();

  session.setError(null);
  session.setGenerating(true);

  try {
    const { adapter, apiKey } = pickAdapter(
      'upscale',
      keys,
      session.overrideProvider
    );

    const req = session.buildRequest();
    
    // V6 Adjustment: Overwrite with direct custom inputs if provided by quick action picker
    if (customBlob) {
      req.referenceImage = customBlob;
    }
    if (factor) {
      req.metadata = { ...req.metadata, upscaleFactor: factor };
    }

    const result = await adapter.generate(req, apiKey);

    session.setResult(result);
    await addEntry(session.prompt || "In-Context Quick Upscale", result, 'upscale');
  } catch (e) {
    session.setError((e as Error).message);
  } finally {
    session.setGenerating(false);
  }
}

export async function professionalFinish() {
  const session = useSessionStore.getState();
  const keys = useKeysStore.getState().keys;
  const { addEntry } = useHistoryStore.getState();

  const replicateKey = keys['replicate'];
  if (!replicateKey) {
    session.setError("Professional finish requires a Replicate API key.");
    return;
  }
  if (!session.referenceImage) {
    session.setError("Please upload or select a reference image first.");
    return;
  }

  session.setError(null);
  session.setGenerating(true, 0.1); // Show progress

  try {
    // 1. ESRGAN
    let currentImage = session.referenceImage;
    const { adapter: repAdapter } = pickAdapter('upscale', { replicate: replicateKey }, 'replicate');
    
    session.setGenerating(true, 0.33); // 33% ESRGAN
    let req = session.buildRequest();
    req.referenceImage = currentImage;
    req.task = 'upscale';
    let result = await repAdapter.generate(req, replicateKey);
    currentImage = result.blob!;

    // 2. GFPGAN (Sharpen Faces/Details)
    session.setGenerating(true, 0.66); // 66% GFPGAN
    
    const gfpganModel = 'tencentarc/gfpgan:9283608cb5ee8f2e21977ec302c4b8d70dcba25db8fbdcd8d0afcfa04a8b7dd5';
    const base64Img = await blobToBase64(currentImage);
    const mime = currentImage.type || 'image/png';
    const dataUri = `data:${mime};base64,${base64Img}`;
    
    let initRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${replicateKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ version: gfpganModel.split(':')[1], input: { img: dataUri, version: 'v1.4', scale: 2 } }),
    });

    if (!initRes.ok) throw new Error("GFPGAN init failed");
    let pred = await initRes.json();
    
    while (pred.status !== 'succeeded' && pred.status !== 'failed') {
      await new Promise(r => setTimeout(r, 2000));
      const pRes = await fetch(`https://api.replicate.com/v1/predictions/${pred.id}`, { headers: { Authorization: `Bearer ${replicateKey}` }});
      pred = await pRes.json();
    }
    if (pred.status === 'failed') throw new Error("GFPGAN failed");
    
    const outputUrl = Array.isArray(pred.output) ? pred.output[0] : pred.output;
    const gfpganBlob = await (await fetch(outputUrl)).blob();

    // 3. Img2Img Tone Grade (Using nano-banana-pro or flux via standard generate)
    session.setGenerating(true, 0.90);
    const { adapter, apiKey } = pickAdapter('image-edit', keys);
    req.referenceImage = gfpganBlob;
    req.prompt = "Professional color grading, 35mm film, cinematic tone grade, masterpiece, 8k resolution, photorealistic.";
    req.task = 'image-edit';
    const finalResult = await adapter.generate(req, apiKey);

    session.setResult(finalResult);
    await addEntry("Professional Finish Pipeline", finalResult, 'upscale');
  } catch (e: any) {
    session.setError(e.message);
  } finally {
    session.setGenerating(false);
  }
}
