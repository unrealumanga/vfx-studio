import { useSessionStore } from '../../store/session.store';
import ModelBadge from '../../components/ModelBadge/ModelBadge';
import { pickAdapter } from '../../utils/router';
import { useKeysStore } from '../../store/keys.store';
import { generateVideo } from './videoGen.service';

// Video model options per provider
const VIDEO_MODELS: Record<string, { label: string; modelId: string }[]> = {
  google: [
    { label: 'Veo 2', modelId: 'veo-2.0-generate-001' },
  ],
  runway: [
    { label: 'Gen-2', modelId: 'gen-2' },
    { label: 'Gen-3 Alpha', modelId: 'gen-3-alpha' },
  ],
  fal: [
    { label: 'Luma Dream Machine', modelId: 'luma-dream-machine' },
  ],
};

export default function VideoGen() {
  const {
    overrideProvider,
    setOverrideProvider,
    videoModel,
    setVideoModel,
    referenceImage,
  } = useSessionStore();
  const keys = useKeysStore((s) => s.keys);

  let resolved: string | null = null;
  try {
    const r = pickAdapter('video-gen', keys, overrideProvider);
    resolved = r.provider;
  } catch {
    resolved = null;
  }

  const handleProviderChange = (provider: string) => {
    setOverrideProvider(provider);
    // Set default model for that provider
    const models = VIDEO_MODELS[provider];
    if (models && models.length > 0) {
      setVideoModel(models[0].modelId);
    }
  };

  return (
    <div className="space-y-4 font-body text-studio-text dark:text-white">
      <ModelBadge currentProvider={resolved} />

      <div className="space-y-2">
        <label className="text-studio-muted text-xs font-display font-medium uppercase tracking-wide block">Provider</label>
        <select
          value={overrideProvider || ''}
          onChange={(e) => handleProviderChange(e.target.value)}
          className="w-full bg-white dark:bg-neutral-800 border border-studio-border dark:border-neutral-700 rounded-lg px-3 py-2 text-studio-text dark:text-white text-xs outline-none focus:border-studio-accent"
        >
          <option value="">Auto (priority order)</option>
          <option value="google">Google (Veo 2)</option>
          <option value="runway">RunwayML</option>
          <option value="fal">Fal.ai</option>
        </select>
      </div>

      {overrideProvider && VIDEO_MODELS[overrideProvider] && (
        <div className="space-y-2">
          <label className="text-studio-muted text-xs font-display font-medium uppercase tracking-wide block">Model</label>
          <select
            value={videoModel}
            onChange={(e) => setVideoModel(e.target.value)}
            className="w-full bg-white dark:bg-neutral-800 border border-studio-border dark:border-neutral-700 rounded-lg px-3 py-2 text-studio-text dark:text-white text-xs outline-none focus:border-studio-accent"
          >
            {VIDEO_MODELS[overrideProvider].map((m) => (
              <option key={m.modelId} value={m.modelId}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2 pt-2 border-t border-studio-border-light dark:border-neutral-700">
        <button
          onClick={() => generateVideo()}
          disabled={!referenceImage}
          className="w-full btn-primary py-2.5 rounded-full text-xs uppercase tracking-wider font-semibold shadow-md interactive-btn disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Generate Video
        </button>
        {!referenceImage && (
          <p className="text-studio-faded text-[10px] font-mono text-center">
            Please upload a reference image in the main canvas first.
          </p>
        )}
      </div>
    </div>
  );
}
