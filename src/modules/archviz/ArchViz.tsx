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
    setArchvizMaterialStyle
  } = useSessionStore();
  const keys = useKeysStore((s) => s.keys);

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
    <div className="space-y-3">
      <ModelBadge currentProvider={resolved} />

      <div>
        <label className="text-studio-gold text-xs font-mono block mb-1">Camera Angle</label>
        <select
          value={archvizCameraAngle}
          onChange={(e) => setArchvizCameraAngle(e.target.value)}
          className="w-full bg-studio-bg border border-studio-border rounded px-2 py-1.5 text-studio-text text-xs font-mono outline-none focus:border-studio-gold"
        >
          {CAMERA_ANGLES.map((angle) => (
            <option key={angle} value={angle}>{getCameraAngleLabel(angle)}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-studio-gold text-xs font-mono block mb-1">Time of Day / Lighting</label>
        <select
          value={archvizTimeOfDay}
          onChange={(e) => setArchvizTimeOfDay(e.target.value)}
          className="w-full bg-studio-bg border border-studio-border rounded px-2 py-1.5 text-studio-text text-xs font-mono outline-none focus:border-studio-gold"
        >
          {TIMES_OF_DAY.map((t) => (
            <option key={t} value={t}>{getTimeOfDayLabel(t)}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-studio-gold text-xs font-mono block mb-1">Material Style</label>
        <select
          value={archvizMaterialStyle}
          onChange={(e) => setArchvizMaterialStyle(e.target.value)}
          className="w-full bg-studio-bg border border-studio-border rounded px-2 py-1.5 text-studio-text text-xs font-mono outline-none focus:border-studio-gold"
        >
          {MATERIAL_STYLES.map((m) => (
            <option key={m} value={m}>{getMaterialStyleLabel(m)}</option>
          ))}
        </select>
      </div>

      <button
        onClick={handleGenerate}
        className="w-full bg-studio-gold hover:bg-yellow-500 text-studio-bg font-display font-medium text-sm py-2 rounded-full transition-colors"
      >
        Generate ArchViz
      </button>
    </div>
  );
}
