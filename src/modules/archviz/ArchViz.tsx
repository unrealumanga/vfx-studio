import { useRef } from 'react';
import { useSessionStore } from '../../store/session.store';
import ModelBadge from '../../components/ModelBadge/ModelBadge';
import { pickAdapter } from '../../utils/router';
import { useKeysStore } from '../../store/keys.store';
import { generateArchViz, getCameraAngleLabel, getTimeOfDayLabel, getMaterialStyleLabel } from './archviz.service';

const CAMERA_ANGLES = ['eye-level', 'aerial', 'worms-eye', 'interior-corner', 'section-cut'];
const TIMES_OF_DAY = ['golden-hour', 'blue-hour', 'overcast', 'midday', 'night', 'studio'];
const MATERIAL_STYLES = ['concrete-glass', 'stone-timber', 'polished-marble', 'desert', 'scandinavian'];

export default function ArchViz() {
  const {
    overrideProvider,
    archvizCameraAngle,
    archvizTimeOfDay,
    archvizMaterialStyle,
    setArchvizCameraAngle,
    setArchvizTimeOfDay,
    setArchvizMaterialStyle,
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

  const handleGenerate = () => {
    generateArchViz();
  };

  return (
    <div className="space-y-4 font-body">
      <ModelBadge currentProvider={resolved} />

      {/* Preset Dropdowns */}
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-studio-muted text-xs font-display font-medium uppercase tracking-wide block">Camera Angle</label>
          <select
            value={archvizCameraAngle}
            onChange={(e) => setArchvizCameraAngle(e.target.value)}
            className="w-full bg-white border border-studio-border rounded-lg px-2.5 py-2 text-studio-text text-xs outline-none focus:border-studio-accent"
          >
            {CAMERA_ANGLES.map((angle) => (
              <option key={angle} value={angle}>{getCameraAngleLabel(angle)}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-studio-muted text-xs font-display font-medium uppercase tracking-wide block">Time of Day / Lighting</label>
          <select
            value={archvizTimeOfDay}
            onChange={(e) => setArchvizTimeOfDay(e.target.value)}
            className="w-full bg-white border border-studio-border rounded-lg px-2.5 py-2 text-studio-text text-xs outline-none focus:border-studio-accent"
          >
            {TIMES_OF_DAY.map((t) => (
              <option key={t} value={t}>{getTimeOfDayLabel(t)}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-studio-muted text-xs font-display font-medium uppercase tracking-wide block">Material Style</label>
          <select
            value={archvizMaterialStyle}
            onChange={(e) => setArchvizMaterialStyle(e.target.value)}
            className="w-full bg-white border border-studio-border rounded-lg px-2.5 py-2 text-studio-text text-xs outline-none focus:border-studio-accent"
          >
            {MATERIAL_STYLES.map((m) => (
              <option key={m} value={m}>{getMaterialStyleLabel(m)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Multi-reference Image Inputs */}
      <div className="pt-3 border-t border-studio-border-light space-y-3">
        <h4 className="text-[11px] font-mono font-semibold tracking-wider text-studio-muted uppercase">// Structure & Style References</h4>
        
        {/* Slot A: Structure Input (ControlNet equivalent) */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono text-studio-faded block">1. Structure reference (depth, lines):</label>
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
          <button
            onClick={() => structureFileRef.current?.click()}
            className="w-full text-xs py-1.5 px-3 border border-studio-border rounded-lg text-studio-muted hover:text-studio-text hover:border-neutral-500 bg-white transition-all text-left flex justify-between items-center"
          >
            <span className="truncate">{referenceImage ? '✓ Structure Loaded' : 'Select structure image...'}</span>
            <span className="text-[9px] uppercase font-mono text-studio-faded">{referenceImage ? 'Edit' : 'Upload'}</span>
          </button>
        </div>

        {/* Slot B: Style Input (Mood / Material consistency) */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono text-studio-faded block">2. Style reference (aesthetic, color):</label>
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
          <button
            onClick={() => styleFileRef.current?.click()}
            className="w-full text-xs py-1.5 px-3 border border-studio-border rounded-lg text-studio-muted hover:text-studio-text hover:border-neutral-500 bg-white transition-all text-left flex justify-between items-center"
          >
            <span className="truncate">{styleImage ? '✓ Style Loaded' : 'Select style image...'}</span>
            <span className="text-[9px] uppercase font-mono text-studio-faded">{styleImage ? 'Edit' : 'Upload'}</span>
          </button>
        </div>

        {/* Quick Result Ingestion Buttons */}
        <div className="flex gap-2">
          <button
            onClick={async () => {
              const session = useSessionStore.getState();
              const result = session.currentResult;
              if (result) {
                const blob = result.blob ?? (result.url ? await (await fetch(result.url)).blob() : null);
                if (blob) setReferenceImage(blob);
              }
            }}
            className="flex-1 text-[10px] text-center text-studio-muted hover:text-studio-accent bg-white border border-studio-border rounded py-1 font-mono transition-colors uppercase tracking-wider"
          >
            ↻ Use result as Structure
          </button>
          <button
            onClick={async () => {
              const session = useSessionStore.getState();
              const result = session.currentResult;
              if (result) {
                const blob = result.blob ?? (result.url ? await (await fetch(result.url)).blob() : null);
                if (blob) setStyleImage(blob);
              }
            }}
            className="flex-1 text-[10px] text-center text-studio-muted hover:text-studio-accent bg-white border border-studio-border rounded py-1 font-mono transition-colors uppercase tracking-wider"
          >
            ↻ Use result as Style
          </button>
        </div>

        {/* Clear Reference button */}
        {(referenceImage || styleImage) && (
          <button
            onClick={() => {
              setReferenceImage(null);
              setStyleImage(null);
            }}
            className="w-full text-[10px] text-studio-danger bg-white border border-studio-border hover:border-studio-danger rounded py-1 font-mono transition-colors uppercase tracking-wider"
          >
            Reset All References
          </button>
        )}
      </div>

      {/* Action Button */}
      <div className="pt-2 border-t border-studio-border-light">
        <button
          onClick={handleGenerate}
          className="w-full btn-primary py-2.5 rounded-full text-xs uppercase tracking-wider font-semibold shadow-md interactive-btn"
        >
          Generate ArchViz
        </button>
      </div>
    </div>
  );
}
