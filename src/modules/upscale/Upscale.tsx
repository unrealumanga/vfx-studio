import { useRef } from 'react';
import { useSessionStore } from '../../store/session.store';
import ModelBadge from '../../components/ModelBadge/ModelBadge';
import { pickAdapter } from '../../utils/router';
import { useKeysStore } from '../../store/keys.store';
import { upscaleImage } from './upscale.service';

export default function Upscale() {
  const { referenceImage, setReferenceImage, overrideProvider } = useSessionStore();
  const keys = useKeysStore((s) => s.keys);
  const fileRef = useRef<HTMLInputElement>(null);

  let resolved: string | null = null;
  try {
    const r = pickAdapter('upscale', keys, overrideProvider);
    resolved = r.provider;
  } catch {
    resolved = null;
  }

  return (
    <div className="space-y-3">
      <ModelBadge currentProvider={resolved} />

      <div>
        <label className="text-studio-muted text-xs font-mono block mb-1">Image to Upscale</label>
        <input ref={fileRef} type="file" accept="image/*" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) setReferenceImage(file);
        }} className="hidden" />
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full bg-studio-bg border border-studio-border rounded px-3 py-2 text-xs text-studio-muted font-mono hover:text-studio-text transition-colors text-left"
        >
          {referenceImage ? '✓ Image loaded' : 'Click to upload image...'}
        </button>
      </div>

      {referenceImage && (
        <button
          onClick={() => {
            upscaleImage();
          }}
          className="w-full bg-studio-accent hover:bg-studio-accent-dim text-white font-display font-medium text-sm py-2 rounded-full transition-colors"
        >
          Upscale
        </button>
      )}
    </div>
  );
}
