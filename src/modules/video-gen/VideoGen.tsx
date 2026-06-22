import { useSessionStore } from '../../store/session.store';
import ModelBadge from '../../components/ModelBadge/ModelBadge';
import { pickAdapter } from '../../utils/router';
import { useKeysStore } from '../../store/keys.store';

export default function VideoGen() {
  const { aspectRatio, setAspectRatio, overrideProvider } = useSessionStore();
  const keys = useKeysStore((s) => s.keys);

  let resolved: string | null = null;
  try {
    const r = pickAdapter('video-gen', keys, overrideProvider);
    resolved = r.provider;
  } catch {
    resolved = null;
  }

  return (
    <div className="space-y-3">
      <ModelBadge currentProvider={resolved} />

      <div>
        <label className="text-studio-muted text-xs font-mono block mb-1">Aspect Ratio</label>
        <select
          value={aspectRatio}
          onChange={(e) => setAspectRatio(e.target.value)}
          className="w-full bg-studio-bg border border-studio-border rounded px-2 py-1.5 text-studio-text text-xs font-mono outline-none focus:border-studio-accent"
        >
          <option value="16:9">16:9 Landscape</option>
          <option value="9:16">9:16 Portrait</option>
          <option value="1:1">1:1 Square</option>
        </select>
      </div>

      <p className="text-studio-muted text-xs font-mono">
        Video generation may take 60-120 seconds.
      </p>
    </div>
  );
}
