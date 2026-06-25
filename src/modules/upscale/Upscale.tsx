import { useRef, useState } from 'react';
import { useSessionStore } from '../../store/session.store';
import { useKeysStore } from '../../store/keys.store';
import { pickAdapter } from '../../utils/router';
import { upscaleImage, professionalFinish } from './upscale.service';

export default function Upscale() {
  const { referenceImage, setReferenceImage, overrideProvider } = useSessionStore();
  const keys = useKeysStore((s) => s.keys);
  const fileRef = useRef<HTMLInputElement>(null);

  const [upscaleFactor, setUpscaleFactor] = useState<number>(2);

  let resolved: string | null = null;
  try {
    const r = pickAdapter('upscale', keys, overrideProvider);
    resolved = r.provider;
  } catch {
    resolved = null;
  }

  return (
    <div className="space-y-5">
      
      {resolved && (
        <div className="flex items-center gap-2 mb-2">
          <span className="aw-pill py-1 px-3 text-[10px]">{resolved} Active</span>
        </div>
      )}

      <div>
          <label className="label block mb-3">Source Image</label>
          <div className="relative">
              <input 
                  ref={fileRef} 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setReferenceImage(file);
                  }} 
              />
              <label 
                  onClick={() => fileRef.current?.click()}
                  className="aw-btn-outline w-full py-4 rounded-xl flex flex-col items-center justify-center gap-2 border-dashed cursor-pointer hover:border-studio-text transition-colors"
              >
                  <span className="text-xs text-studio-muted">{referenceImage ? '✓ Image Loaded (Click to change)' : 'Upload image to upscale'}</span>
              </label>
          </div>
      </div>

      <div>
          <label className="label block mb-3">Target Scale</label>
          <div className="flex gap-2">
              {[2, 3, 4].map(scale => (
                  <button
                      key={scale}
                      onClick={() => setUpscaleFactor(scale)}
                      className={`aw-btn-outline flex-1 py-3 rounded-lg text-xs font-medium ${
                          upscaleFactor === scale ? 'active bg-studio-accent text-white border-studio-accent' : ''
                      }`}
                  >
                      {scale}×
                  </button>
              ))}
          </div>
      </div>

      <div>
          <label className="label block mb-3">Enhancement</label>
          <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-xl border border-studio-border-light hover:border-studio-border transition-colors cursor-pointer">
                  <span className="text-sm">Face Restoration</span>
                  <div className="toggle-track active"><div className="toggle-thumb"></div></div>
              </label>
              <label className="flex items-center justify-between p-3 rounded-xl border border-studio-border-light hover:border-studio-border transition-colors cursor-pointer">
                  <span className="text-sm">Detail Boost</span>
                  <div className="toggle-track active"><div className="toggle-thumb"></div></div>
              </label>
              <label className="flex items-center justify-between p-3 rounded-xl border border-studio-border-light hover:border-studio-border transition-colors cursor-pointer">
                  <span className="text-sm">Denoise</span>
                  <div className="toggle-track"><div className="toggle-thumb"></div></div>
              </label>
          </div>
      </div>

      {referenceImage && (
        <div className="pt-2 border-t border-studio-border-light space-y-3">
          <button
            onClick={() => upscaleImage(referenceImage, upscaleFactor)}
            className="w-full aw-btn py-3 rounded-xl text-sm font-medium"
          >
            Upscale Now ({upscaleFactor}x)
          </button>
          <button
            onClick={() => professionalFinish()}
            className="w-full aw-btn-outline py-3 rounded-xl text-sm font-medium"
          >
            Professional Finish
          </button>
        </div>
      )}

    </div>
  );
}
