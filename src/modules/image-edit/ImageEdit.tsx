import { useRef } from 'react';
import { useSessionStore } from '../../store/session.store';
import { useKeysStore } from '../../store/keys.store';
import { pickAdapter } from '../../utils/router';

export default function ImageEdit() {
  const { referenceImage, setReferenceImage, setMaskImage, overrideProvider, imageEditMode, setImageEditMode } = useSessionStore();
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
      setMaskImage(null);
    }
  };

  return (
    <div className="space-y-5">
      
      {resolved && (
        <div className="flex items-center gap-2 mb-2">
          <span className="aw-pill py-1 px-3 text-[10px]">{resolved} Active</span>
        </div>
      )}

      <div>
        <label className="label block mb-3">Edit Mode</label>
        <div className="flex gap-2">
          <button
            onClick={() => setImageEditMode('inpaint')}
            className={`aw-btn-outline flex-1 py-2 rounded-lg text-xs font-medium ${imageEditMode === 'inpaint' ? 'active bg-studio-accent text-white border-studio-accent' : ''}`}
          >
            Inpaint
          </button>
          <button
            onClick={() => setImageEditMode('outpaint')}
            className={`aw-btn-outline flex-1 py-2 rounded-lg text-xs font-medium ${imageEditMode === 'outpaint' ? 'active bg-studio-accent text-white border-studio-accent' : ''}`}
          >
            Outpaint
          </button>
          <button
            onClick={() => setImageEditMode('replace')}
            className={`aw-btn-outline flex-1 py-2 rounded-lg text-xs font-medium ${imageEditMode === 'replace' ? 'active bg-studio-accent text-white border-studio-accent' : ''}`}
          >
            Replace
          </button>
        </div>
      </div>

      <div>
        <label className="label block mb-3">Reference Image</label>
        <div className="relative">
          <input 
            ref={fileRef} 
            type="file" 
            accept="image/*" 
            onChange={handleImageUpload} 
            className="hidden" 
            id="editImageUpload"
          />
          
          <label 
            htmlFor="editImageUpload" 
            className="aw-btn-outline w-full py-4 rounded-xl flex flex-col items-center justify-center gap-2 border-dashed cursor-pointer hover:border-studio-text transition-colors"
          >
            <svg className="w-5 h-5 text-studio-muted" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span className="text-xs text-studio-muted">{referenceImage ? '✓ Image Loaded (Click to change)' : 'Drop image or click to upload'}</span>
          </label>
        </div>
      </div>

      {referenceImage && (
        <div>
          <button
            onClick={() => {
              setReferenceImage(null);
              setMaskImage(null);
            }}
            className="aw-btn-outline w-full py-2 rounded-xl text-xs font-medium text-studio-danger border-studio-danger hover:bg-studio-danger/10"
          >
            Clear reference & mask
          </button>
        </div>
      )}
      
      <div>
        <label className="label block mb-3">Strength</label>
        <input type="range" min="0" max="100" defaultValue="70" className="w-full mb-1" />
        <div className="flex justify-between text-xs text-studio-faded font-mono">
            <span>Subtle</span>
            <span>Strong</span>
        </div>
      </div>

    </div>
  );
}
