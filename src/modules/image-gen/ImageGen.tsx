import { useSessionStore } from '../../store/session.store';
import ModelBadge from '../../components/ModelBadge/ModelBadge';
import { pickAdapter } from '../../utils/router';
import { useKeysStore } from '../../store/keys.store';

export default function ImageGen() {
  const { aspectRatio, setAspectRatio, quality, setQuality, overrideProvider, googleModel, setGoogleModel } = useSessionStore();
  const keys = useKeysStore((s) => s.keys);
  let resolved: string | null = null;
  try {
    const r = pickAdapter('image-gen', keys, overrideProvider);
    resolved = r.provider;
  } catch {
    resolved = null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ModelBadge currentProvider={resolved} />
      </div>

      <div>
        <label className="text-studio-muted text-xs font-mono block mb-1">Aspect Ratio</label>
        <select
          value={aspectRatio}
          onChange={(e) => setAspectRatio(e.target.value)}
          className="w-full bg-studio-bg border border-studio-border rounded px-2 py-1.5 text-studio-text text-xs font-mono outline-none focus:border-studio-accent"
        >
          <option value="1:1">1:1 Square</option>
          <option value="16:9">16:9 Landscape</option>
          <option value="9:16">9:16 Portrait</option>
          <option value="4:3">4:3</option>
          <option value="3:2">3:2</option>
          <option value="21:9">21:9 Ultra</option>
        </select>
      </div>

      <div>
        <label className="text-studio-muted text-xs font-mono block mb-1">Quality</label>
        <select
          value={quality}
          onChange={(e) => setQuality(e.target.value as 'draft' | 'standard' | 'ultra')}
          className="w-full bg-studio-bg border border-studio-border rounded px-2 py-1.5 text-studio-text text-xs font-mono outline-none focus:border-studio-accent"
        >
          <option value="draft">Draft (fast)</option>
          <option value="standard">Standard</option>
          <option value="ultra">Ultra (HD)</option>
        </select>
      </div>

      {resolved === 'google' && (
        <div>
          <label className="text-studio-muted text-xs font-mono block mb-1">Google Model</label>
          <select
            value={googleModel}
            onChange={(e) => setGoogleModel(e.target.value)}
            className="w-full bg-studio-bg border border-studio-border rounded px-2 py-1.5 text-studio-text text-xs font-mono outline-none focus:border-studio-accent"
          >
            <option value="nano-banana">Nano Banana (fast)</option>
            <option value="nano-banana-2">Nano Banana 2 (default)</option>
            <option value="nano-banana-pro">Nano Banana Pro (studio quality)</option>
          </select>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => {
            const session = useSessionStore.getState();
            const result = session.currentResult;
            if (result) {
              session.setReferenceImage(result.blob ?? null);
              session.setActiveTask('image-edit');
            }
          }}
          className="flex-1 text-xs text-studio-muted hover:text-studio-text bg-studio-bg border border-studio-border rounded py-1.5 font-mono transition-colors"
        >
          ✂ Edit
        </button>
        <button
          onClick={() => {
            const result = useSessionStore.getState().currentResult;
            if (result?.blob) {
              const url = URL.createObjectURL(result.blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `vfx-studio-${Date.now()}.png`;
              a.click();
              URL.revokeObjectURL(url);
            }
          }}
          className="flex-1 text-xs text-studio-muted hover:text-studio-text bg-studio-bg border border-studio-border rounded py-1.5 font-mono transition-colors"
        >
          ⬇ Download
        </button>
      </div>
    </div>
  );
}
