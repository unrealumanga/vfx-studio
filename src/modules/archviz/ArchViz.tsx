import { useRef } from 'react';
import { useSessionStore } from '../../store/session.store';
import { useKeysStore } from '../../store/keys.store';
import { pickAdapter } from '../../utils/router';

const ARCH_STYLES = ['Modern', 'Brutalist', 'Minimalist', 'Futuristic'];

export default function ArchViz() {
  const {
    overrideProvider,
    archVizStyle,
    setArchVizStyle,
    referenceImage,
    setReferenceImage,
    styleImage,
    setStyleImage
  } = useSessionStore();
  const keys = useKeysStore((s) => s.keys);
  
  const structureFileRef = useRef<HTMLInputElement>(null);
  const styleFileRef = useRef<HTMLInputElement>(null);

  let resolved: string | null = null;
  try {
    const r = pickAdapter('archviz', keys, overrideProvider);
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
          <label className="label block mb-3">Style Reference</label>
          <div className="relative">
              <input 
                  ref={styleFileRef} 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setStyleImage(file);
                  }} 
              />
              <label 
                  onClick={() => styleFileRef.current?.click()}
                  className="aw-btn-outline w-full py-4 rounded-xl flex flex-col items-center justify-center gap-2 border-dashed cursor-pointer hover:border-studio-text transition-colors"
              >
                  <span className="text-xs text-studio-muted">{styleImage ? '✓ Style Ref Loaded (Click to change)' : 'Upload style reference'}</span>
              </label>
          </div>
      </div>

      <div>
          <label className="label block mb-3">Structure Reference</label>
          <div className="relative">
              <input 
                  ref={structureFileRef} 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setReferenceImage(file);
                  }} 
              />
              <label 
                  onClick={() => structureFileRef.current?.click()}
                  className="aw-btn-outline w-full py-4 rounded-xl flex flex-col items-center justify-center gap-2 border-dashed cursor-pointer hover:border-studio-text transition-colors"
              >
                  <span className="text-xs text-studio-muted">{referenceImage ? '✓ Structure Ref Loaded (Click to change)' : 'Upload structure reference'}</span>
              </label>
          </div>
      </div>

      <div>
          <label className="label block mb-3">Architecture Style</label>
          <div className="grid grid-cols-2 gap-2">
              {ARCH_STYLES.map(style => (
                  <button
                      key={style}
                      onClick={() => setArchVizStyle(style.toLowerCase())}
                      className={`aw-btn-outline py-2 rounded-lg text-xs font-medium ${
                          archVizStyle === style.toLowerCase() ? 'active bg-studio-accent text-white border-studio-accent' : ''
                      }`}
                  >
                      {style}
                  </button>
              ))}
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
              Reset All References
          </button>
      )}

    </div>
  );
}
