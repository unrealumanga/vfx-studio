import ModelBadge from '../../components/ModelBadge/ModelBadge';
import { useSessionStore } from '../../store/session.store';
import { useKeysStore } from '../../store/keys.store';
import { pickAdapter } from '../../utils/router';

export default function VfxCompose() {
  const { overrideProvider } = useSessionStore();
  const keys = useKeysStore((s) => s.keys);

  let resolved: string | null = null;
  try {
    const r = pickAdapter('vfx-compose', keys, overrideProvider);
    resolved = r.provider;
  } catch {
    resolved = null;
  }

  return (
    <div className="space-y-3">
      <ModelBadge currentProvider={resolved} />
      <p className="text-studio-muted text-xs font-mono">
        VFX Composer — coming in Phase 2. Combine video with generated overlays.
      </p>
    </div>
  );
}
