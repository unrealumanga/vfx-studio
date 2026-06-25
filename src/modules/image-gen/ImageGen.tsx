import { useSessionStore } from '../../store/session.store';
import { useKeysStore } from '../../store/keys.store';
import { pickAdapter } from '../../utils/router';

export default function ImageGen() {
  const { aspectRatio, setAspectRatio, quality, setQuality, overrideProvider, imageStyle, setImageStyle, setNegativePrompt, negativePrompt } = useSessionStore();
  const keys = useKeysStore((s) => s.keys);
  
  let resolved: string | null = null;
  try {
    const r = pickAdapter('image-gen', keys, overrideProvider);
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
        <label className="label block mb-3">Aspect Ratio</label>
        <div className="grid grid-cols-4 gap-2">
          {['1:1', '16:9', '9:16', '4:3'].map((ar) => (
            <button
              key={ar}
              onClick={() => setAspectRatio(ar)}
              className={`aw-btn-outline py-2 rounded-lg text-xs font-medium ${aspectRatio === ar ? 'active bg-studio-accent text-white border-studio-accent' : ''}`}
            >
              {ar}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label block mb-3">Quality</label>
        <div className="flex gap-2">
          <button
            onClick={() => setQuality('standard')}
            className={`aw-btn-outline flex-1 py-2 rounded-lg text-xs font-medium ${quality === 'standard' ? 'active bg-studio-accent text-white border-studio-accent' : ''}`}
          >
            Standard
          </button>
          <button
            onClick={() => setQuality('ultra')}
            className={`aw-btn-outline flex-1 py-2 rounded-lg text-xs font-medium ${quality === 'ultra' ? 'active bg-studio-accent text-white border-studio-accent' : ''}`}
          >
            Ultra
          </button>
          <button
            onClick={() => setQuality('draft')}
            className={`aw-btn-outline flex-1 py-2 rounded-lg text-xs font-medium ${quality === 'draft' ? 'active bg-studio-accent text-white border-studio-accent' : ''}`}
          >
            Draft
          </button>
        </div>
      </div>

      <div>
        <label className="label block mb-3">Style</label>
        <select
          value={imageStyle}
          onChange={(e) => setImageStyle(e.target.value)}
          className="aw-input w-full px-4 py-3 rounded-xl text-sm appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e')] bg-no-repeat bg-[right_1rem_center] bg-[length:1rem]"
        >
          <option value="photographic">Photographic</option>
          <option value="digital-art">Digital Art</option>
          <option value="cinematic">Cinematic</option>
          <option value="anime">Anime</option>
          <option value="3d-render">3D Render</option>
          <option value="pixel-art">Pixel Art</option>
        </select>
      </div>

      <div>
        <label className="label block mb-3">Negative Prompt</label>
        <textarea
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          className="aw-input w-full px-4 py-3 rounded-xl text-sm resize-none h-20"
          placeholder="What to avoid..."
        ></textarea>
      </div>

    </div>
  );
}
