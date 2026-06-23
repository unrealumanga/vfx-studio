import { pickAdapter } from '../../utils/router';
import { useKeysStore } from '../../store/keys.store';
import { useSessionStore } from '../../store/session.store';

// Amplification Templates
export const TEMPLATES = {
  gulf_exterior: {
    label: "Gulf Exterior (ArchViz)",
    system: "You are a 20-year ArchViz director specializing in Middle Eastern developments. Convert the user's concept into a highly detailed cinematic prompt. Focus on harsh midday sun or golden hour, realistic shadows, modern brutalist or sand-colored stone materials, and crisp architectural lines.",
    wrapper: "Photorealistic architectural visualization of {prompt}, shot on 35mm lens, {lighting}, {materials}. Ultra-detailed, 8K, Unreal Engine 5 render, octane aesthetic."
  },
  interior_natural: {
    label: "Interior Natural Light",
    system: "You are a top-tier interior ArchViz artist. Expand the user's concept into a beautiful interior prompt. Emphasize soft diffused natural light, biophilic elements, realistic textures (wood, fabric, stone), and inviting atmospheres.",
    wrapper: "High-end interior visualization of {prompt}, soft natural volumetric lighting, {materials}, highly detailed PBR textures, architectural photography, photorealistic."
  },
  aerial_masterplan: {
    label: "Aerial Masterplan",
    system: "You are an urban planner and visualization expert. Expand the user's concept into an aerial drone-shot prompt. Describe the layout, environment (desert, coastal, urban), integration with surroundings, and sweeping scale.",
    wrapper: "Aerial drone photography of {prompt}, sweeping masterplan view, {environment}, clear sky, highly detailed scale model aesthetic, 8K resolution, photorealistic."
  },
  cinematic_vfx: {
    label: "Cinematic VFX",
    system: "You are a Hollywood VFX supervisor. Expand the user's concept into a cinematic shot description. Focus on camera motion, lens flares, dramatic lighting, atmospherics (smoke, fog, dust), and color grading.",
    wrapper: "Cinematic VFX shot of {prompt}, anamorphic lens flare, dramatic lighting, {atmospherics}, professional color grading, IMAX 70mm, masterpiece."
  }
};

export type TemplateKey = keyof typeof TEMPLATES;

export async function assistPrompt(templateKey?: TemplateKey) {
  const session = useSessionStore.getState();
  const keys = useKeysStore.getState().keys;

  session.setError(null);

  try {
    const { adapter, apiKey } = pickAdapter(
      'prompt-assist',
      keys,
      session.overrideProvider
    );

    const req = session.buildRequest();
    
    // Inject the template
    if (templateKey && TEMPLATES[templateKey]) {
      req.metadata = { ...req.metadata, systemPrompt: TEMPLATES[templateKey].system };
    }

    const result = await adapter.generate(req, apiKey);
    let refined = result.metadata?.refinedPrompt as string;

    if (refined) {
      if (templateKey && TEMPLATES[templateKey]) {
        // Simple heuristic to replace placeholder
        refined = TEMPLATES[templateKey].wrapper.replace('{prompt}', refined).replace('{lighting}', 'cinematic lighting').replace('{materials}', 'hyper-detailed materials').replace('{environment}', 'epic environment').replace('{atmospherics}', 'rich atmospherics');
      }
      session.setPrompt(refined);
    }
  } catch (e) {
    session.setError((e as Error).message);
  }
}

