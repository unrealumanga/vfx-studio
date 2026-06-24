import { useRef, useState } from 'react';
import { useSessionStore } from '../../store/session.store';
import ModelBadge from '../../components/ModelBadge/ModelBadge';
import { pickAdapter } from '../../utils/router';
import { useKeysStore } from '../../store/keys.store';
import { upscaleImage, professionalFinish } from './upscale.service';

export default function Upscale() {
  const { referenceImage, setReferenceImage, overrideProvider } = useSessionStore();
  const keys = useKeysStore((s) => s.keys);
  const fileRef = useRef<HTMLInputElement>(null);

  const [upscaleFactor, setUpscaleFactor] = useState<number>(4);

  let resolved: string | null = null;
  try {
    const r = pickAdapter('upscale', keys, overrideProvider);
    resolved = r.provider;
  } catch {
    resolved = null;
  }

  return (
    <div className="space-y-4 font-body">
      <ModelBadge currentProvider={resolved} />

      {/* Upload image to upscale */}
      <div className="space-y-2">
        <label className="text-studio-muted text-xs font-display font-medium uppercase tracking-wide block">Image to Upscale</label>
        <input 
          ref={fileRef} 
          type="file" 
          accept="image/*" 
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setReferenceImage(file);
          }} 
          className="hidden" 
        />
        
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full text-xs py-2 px-3 border border-studio-border rounded-lg text-studio-muted hover:text-studio-text hover:border-neutral-500 bg-white transition-all text-left flex items-center justify-between"
        >
          <span>{referenceImage ? '✓ Image loaded' : 'Select file...'}</span>
          <span className="text-[10px] uppercase font-mono text-studio-faded">Upload</span>
        </button>
      </div>

      {/* Quick Ingestion action */}
      <div className="flex gap-2">
        <button
          onClick={async () => {
            const session = useSessionStore.getState();
            const result = session.currentResult;
            if (result) {
              if (result.blob) {
                setReferenceImage(result.blob);
              } else if (result.url) {
                try {
                  const res = await fetch(result.url);
                  const blob = await res.blob();
                  setReferenceImage(blob);
                } catch (e) {
                  console.error("Failed to load result image into reference:", e);
                }
              }
            }
          }}
          className="w-full text-xs text-studio-muted hover:text-studio-accent hover:border-studio-accent bg-white border border-studio-border rounded-lg py-2 font-mono transition-all uppercase tracking-wider text-center"
        >
          ↻ Use current result
        </button>
      </div>

      {/* Scale Factor Selector */}
      {referenceImage && (
        <div className="space-y-1 animate-slide-up">
          <label className="text-studio-muted text-xs font-display font-medium uppercase tracking-wide block">Scale Factor</label>
          <div className="grid grid-cols-3 gap-2 bg-studio-surface border border-studio-border-light p-1 rounded-lg">
            {[2, 3, 4].map((f) => (
              <button
                key={f}
                onClick={() => setUpscaleFactor(f)}
                className={`py-1 rounded text-xs font-mono transition-colors ${
                  upscaleFactor === f
                    ? 'bg-studio-accent text-white font-semibold'
                    : 'text-studio-muted hover:bg-neutral-100 hover:text-studio-text'
                }`}
              >
                {f}x
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scale actions */}
      {referenceImage && (
        <div className="space-y-3 pt-2 border-t border-studio-border-light animate-slide-up">
          <button
            onClick={() => upscaleImage()}
            className="w-full btn-primary py-2 rounded-full text-xs uppercase tracking-wider font-semibold shadow-md interactive-btn"
          >
            Basic Upscale ({upscaleFactor}x)
          </button>
          
          <button
            onClick={() => professionalFinish()}
            className="w-full btn-outline py-2 rounded-full text-xs uppercase tracking-wider font-semibold hover:border-studio-accent hover:text-studio-accent transition-colors interactive-btn"
          >
            ✨ Professional Finish Pipeline
          </button>
          
          <p className="text-studio-faded text-[10px] font-mono leading-relaxed mt-1">
            * Chains: Real-ESRGAN ({upscaleFactor}x) → GFPGAN Face Sharpening → Img2Img cinematic grading. Requires Replicate key.
          </p>
        </div>
      )}
    </div>
  );
}
