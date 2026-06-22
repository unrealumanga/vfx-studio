import { pickAdapter } from '../../utils/router';
import { useKeysStore } from '../../store/keys.store';
import { useSessionStore } from '../../store/session.store';
import { useHistoryStore } from '../../store/history.store';

export interface ArchVizPresets {
  cameraAngle: string;
  timeOfDay: string;
  materialStyle: string;
}

const CAMERA_ANGLES: Record<string, string> = {
  'eye-level': 'Eye level, human perspective, 1.5m height, 35mm lens',
  'aerial': 'Aerial overview, 45° pitch, wide angle lens',
  'worms-eye': "Worm's eye view, dramatic upward angle, wide lens",
  'interior-corner': 'Interior corner view, 24mm wide lens, room POV',
  'section-cut': 'Section cut, cutaway showing interior layout',
};

const TIMES_OF_DAY: Record<string, string> = {
  'golden-hour': 'Golden hour lighting, warm tones, long soft shadows, magic hour glow',
  'blue-hour': 'Blue hour lighting, post-sunset, cool ambient light, twilight',
  'overcast': 'Overcast sky, diffused lighting, no harsh shadows, detail-maximizing',
  'midday': 'Midday sun, harsh direct light, sharp shadows, Middle East appropriate',
  'night': 'Night scene with artificial interior lighting, warm accent lights',
  'studio': 'Studio white lighting, neutral, presentation-ready, even illumination',
};

const MATERIAL_STYLES: Record<string, string> = {
  'concrete-glass': 'Modern brutalist, raw concrete surfaces, large glass panels, steel frames',
  'stone-timber': 'Natural stone cladding, warm timber accents, biophilic design',
  'polished-marble': 'Luxury finish, polished marble floors and surfaces, elegant',
  'desert': 'Warm terracotta tones, sandstone textures, desert palette, earthy',
  'scandinavian': 'Minimal white interiors, light wood floors, clean lines, Nordic',
};

export function getCameraAngleLabel(key: string): string {
  return CAMERA_ANGLES[key]?.split(',')[0] ?? key;
}

export function getTimeOfDayLabel(key: string): string {
  return TIMES_OF_DAY[key]?.split(',')[0] ?? key;
}

export function getMaterialStyleLabel(key: string): string {
  return MATERIAL_STYLES[key]?.split(',')[0] ?? key;
}

export async function generateArchViz(presets?: ArchVizPresets) {
  const session = useSessionStore.getState();
  const keys = useKeysStore.getState().keys;
  const { addEntry } = useHistoryStore.getState();

  const cameraAngle = presets?.cameraAngle ?? session.archvizCameraAngle;
  const timeOfDay = presets?.timeOfDay ?? session.archvizTimeOfDay;
  const materialStyle = presets?.materialStyle ?? session.archvizMaterialStyle;

  const cameraDesc = CAMERA_ANGLES[cameraAngle] ?? 'Standard view';
  const timeDesc = TIMES_OF_DAY[timeOfDay] ?? 'Natural lighting';
  const materialDesc = MATERIAL_STYLES[materialStyle] ?? 'Modern';

  const enhancedPrompt = `Photorealistic architectural visualization, ${cameraDesc}, ${timeDesc}, ${materialDesc}. Hyper-detailed, 8K render quality, professional ArchViz, unreal engine 5 quality, octane render aesthetic, perfect global illumination, accurate reflections. ${session.prompt}`;

  session.setError(null);
  session.setGenerating(true);

  try {
    const { adapter, apiKey } = pickAdapter(
      'archviz',
      keys,
      session.overrideProvider
    );

    const req = session.buildRequest();
    req.prompt = enhancedPrompt;
    const result = await adapter.generate(req, apiKey);

    session.setResult(result);
    await addEntry(enhancedPrompt, result, 'archviz');
  } catch (e) {
    session.setError((e as Error).message);
  } finally {
    session.setGenerating(false);
  }
}
