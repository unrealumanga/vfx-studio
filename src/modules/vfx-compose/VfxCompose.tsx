import { useRef } from 'react';
import { useSessionStore } from '../../store/session.store';
import { useKeysStore } from '../../store/keys.store';
import { pickAdapter } from '../../utils/router';

export default function VfxCompose() {
  const { overrideProvider, referenceImage, setReferenceImage, styleImage, setStyleImage } = useSessionStore();
  const keys = useKeysStore((s) => s.keys);
  
  const baseFileRef = useRef<HTMLInputElement>(null);
  const overlayFileRef = useRef<HTMLInputElement>(null);

  let resolved: string | null = null;
  try {
    const r = pickAdapter('vfx-compose', keys, overrideProvider);
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
          <label className="label block mb-3">Composition Mode</label>
          <select className="aw-input w-full px-4 py-3 rounded-xl text-sm appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e')] bg-no-repeat bg-[right_1rem_center] bg-[length:1rem]">
              <option>Layer Blend</option>
              <option>Green Screen</option>
              <option>Particle System</option>
              <option>Light Wrap</option>
          </select>
      </div>

      <div>
          <label className="label block mb-3">Base Layer</label>
          <div className="relative">
              <input 
                  ref={baseFileRef} 
                  type="file" 
                  accept="image/*,video/*" 
                  className="hidden" 
                  onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setReferenceImage(file);
                  }} 
              />
              <label 
                  onClick={() => baseFileRef.current?.click()}
                  className="aw-btn-outline w-full py-4 rounded-xl flex flex-col items-center justify-center gap-2 border-dashed cursor-pointer hover:border-studio-text transition-colors"
              >
                  <span className="text-xs text-studio-muted">{referenceImage ? '✓ Base Layer Loaded' : 'Upload base media'}</span>
              </label>
          </div>
      </div>

      <div>
          <label className="label block mb-3">Overlay Layer</label>
          <div className="relative">
              <input 
                  ref={overlayFileRef} 
                  type="file" 
                  accept="image/*,video/*" 
                  className="hidden" 
                  onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setStyleImage(file);
                  }} 
              />
              <label 
                  onClick={() => overlayFileRef.current?.click()}
                  className="aw-btn-outline w-full py-4 rounded-xl flex flex-col items-center justify-center gap-2 border-dashed cursor-pointer hover:border-studio-text transition-colors"
              >
                  <span className="text-xs text-studio-muted">{styleImage ? '✓ Overlay Layer Loaded' : 'Upload overlay media'}</span>
              </label>
          </div>
      </div>

      {(referenceImage || styleImage) && (
          <button
              onClick={() => {
                  setReferenceImage(null);
                  setStyleImage(null);
              }}
              className="aw-btn-outline w-full py-2 rounded-xl text-xs font-medium text-studio-danger border-studio-danger hover:bg-studio-danger/10 mt-2"
          >
              Reset Layers
          </button>
      )}

    </div>
  );
}
