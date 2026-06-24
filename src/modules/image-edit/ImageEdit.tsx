import { useRef } from 'react';
import { useSessionStore } from '../../store/session.store';
import ModelBadge from '../../components/ModelBadge/ModelBadge';
import { pickAdapter } from '../../utils/router';
import { useKeysStore } from '../../store/keys.store';

export default function ImageEdit() {
  const { referenceImage, setReferenceImage, setMaskImage, overrideProvider, googleModel, setGoogleModel } = useSessionStore();
  const keys = useKeysStore((s) => s.keys);
  const fileRef = useRef<HTMLInputElement>(null);

  let resolved: string | null = null;
  try {
    const r = pickAdapter('image-edit', keys, overrideProvider);
    resolved = r.provider;
  } catch {
    resolved = null;
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferenceImage(file);
      setMaskImage(null); // Reset any existing mask on new uploads
    }
  };

  return (
    <div className="space-y-4 font-body">
      
      {/* Dynamic Model Badge */}
      <div className="flex items-center gap-2">
        <ModelBadge currentProvider={resolved} />
      </div>

      {/* Model Selection Dropdown */}
      {resolved === 'google' && (
        <div className="space-y-1">
          <label className="text-studio-muted text-xs font-display font-medium uppercase tracking-wide block">Google Model</label>
          <select
            value={googleModel}
            onChange={(e) => setGoogleModel(e.target.value)}
            className="w-full bg-white border border-studio-border rounded-lg px-3 py-2 text-studio-text text-xs outline-none focus:border-studio-accent"
          >
            <option value="nano-banana">Nano Banana (fast)</option>
            <option value="nano-banana-2">Nano Banana 2 (default)</option>
            <option value="nano-banana-pro">Nano Banana Pro (studio quality)</option>
          </select>
        </div>
      )}

      {/* Upload Reference Image Slot */}
      <div className="space-y-2">
        <label className="text-studio-muted text-xs font-display font-medium uppercase tracking-wide block">Reference Image</label>
        <input 
          ref={fileRef} 
          type="file" 
          accept="image/*" 
          onChange={handleImageUpload} 
          className="hidden" 
        />
        
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full text-xs py-2 px-3 border border-studio-border rounded-lg text-studio-muted hover:text-studio-text hover:border-neutral-500 bg-white transition-all text-left flex items-center justify-between"
        >
          <span>{referenceImage ? '✓ Image uploaded' : 'Select file...'}</span>
          <span className="text-[10px] uppercase font-mono text-studio-faded">Upload</span>
        </button>
      </div>

      {/* Help info when image is loaded */}
      {referenceImage && (
        <div className="p-3 bg-studio-surface border border-studio-border-light rounded-lg space-y-1.5 animate-slide-up">
          <p className="text-[10px] font-mono text-studio-accent uppercase tracking-wider font-semibold">Workspace Active</p>
          <p className="text-studio-muted text-[11px] leading-relaxed">
            Strokes drawn directly on the main panel over your image define the mask.
          </p>
          <button
            onClick={() => {
              setReferenceImage(null);
              setMaskImage(null);
            }}
            className="w-full text-[10px] text-studio-danger bg-white border border-studio-border hover:border-studio-danger rounded py-1 font-mono transition-colors uppercase tracking-wider mt-1"
          >
            Clear reference & mask
          </button>
        </div>
      )}

      {/* Auxiliary actions */}
      <div className="pt-2 border-t border-studio-border-light space-y-2">
        <button
          onClick={async () => {
            const session = useSessionStore.getState();
            const result = session.currentResult;
            if (result) {
              if (result.blob) {
                setReferenceImage(result.blob);
                setMaskImage(null);
              } else if (result.url) {
                try {
                  const res = await fetch(result.url);
                  const blob = await res.blob();
                  setReferenceImage(blob);
                  setMaskImage(null);
                } catch (e) {
                  console.error("Failed to load result image as reference:", e);
                }
              }
            }
          }}
          className="w-full text-xs text-studio-muted hover:text-studio-accent hover:border-studio-accent bg-white border border-studio-border rounded-lg py-2 font-mono transition-colors interactive-btn uppercase tracking-wider text-center"
        >
          ↻ Use current result
        </button>
      </div>
    </div>
  );
}
