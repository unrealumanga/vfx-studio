import { useSessionStore } from '../../store/session.store';
import { useKeysStore } from '../../store/keys.store';
import { pickAdapter } from '../../utils/router';

const VIDEO_MODELS: Record<string, { label: string; modelId: string }[]> = {
  google: [
    { label: 'Veo 2', modelId: 'veo-2.0-generate-001' },
    { label: 'Veo 3', modelId: 'veo-3.0-generate' },
  ],
  runway: [
    { label: 'Gen-2', modelId: 'gen-2' },
    { label: 'Gen-3 Alpha', modelId: 'gen-3-alpha' },
  ],
  fal: [
    { label: 'Luma Dream Machine', modelId: 'luma-dream-machine' },
    { label: 'Kling 1.6', modelId: 'kling-1.6' },
  ],
};

export default function VideoGen() {
  const {
    overrideProvider,
    setOverrideProvider,
    videoModel,
    setVideoModel,
    _videoDuration,
    setVideoDuration,
    aspectRatio,
    setAspectRatio
  } = useSessionStore();
  const keys = useKeysStore((s) => s.keys);

  let resolved: string | null = null;
  try {
    const r = pickAdapter('video-gen', keys, overrideProvider);
    resolved = r.provider;
  } catch {
    resolved = null;
  }

  const handleProviderChange = (provider: string) => {
    setOverrideProvider(provider);
    const models = VIDEO_MODELS[provider];
    if (models && models.length > 0) {
      setVideoModel(models[0].modelId);
    }
  };

  const activeProv = overrideProvider || resolved || 'google';

  return (
    <div className="space-y-5">
      
      {resolved && (
        <div className="flex items-center gap-2 mb-2">
          <span className="aw-pill py-1 px-3 text-[10px]">{resolved} Active</span>
        </div>
      )}

      <div>
        <label className="label block mb-3">Provider</label>
        <div className="flex gap-2">
          {['google', 'runway', 'fal'].map(p => (
              <button
                key={p}
                onClick={() => handleProviderChange(p)}
                className={`aw-btn-outline flex-1 py-2 rounded-lg text-xs font-medium capitalize ${activeProv === p ? 'active bg-studio-accent text-white border-studio-accent' : ''}`}
              >
                {p}
              </button>
          ))}
        </div>
      </div>

      {VIDEO_MODELS[activeProv] && (
        <div>
          <label className="label block mb-3">Model</label>
          <select
            value={videoModel}
            onChange={(e) => setVideoModel(e.target.value)}
            className="aw-input w-full px-4 py-3 rounded-xl text-sm appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e')] bg-no-repeat bg-[right_1rem_center] bg-[length:1rem]"
          >
            {VIDEO_MODELS[activeProv].map((m) => (
              <option key={m.modelId} value={m.modelId}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
          <label className="label block mb-3">Duration</label>
          <div className="flex gap-2">
              {[4, 5, 8, 10].map(d => (
                  <button
                      key={d}
                      onClick={() => setVideoDuration(d)}
                      className={`aw-btn-outline flex-1 py-2 rounded-lg text-xs font-medium ${
                          _videoDuration === d ? 'active bg-studio-accent text-white border-studio-accent' : ''
                      }`}
                  >
                      {d}s
                  </button>
              ))}
          </div>
      </div>

      <div>
          <label className="label block mb-3">Aspect Ratio</label>
          <div className="grid grid-cols-3 gap-2">
              {['16:9', '9:16', '1:1'].map(ar => (
                  <button
                      key={ar}
                      onClick={() => setAspectRatio(ar)}
                      className={`aw-btn-outline py-2 rounded-lg text-xs font-medium ${
                          aspectRatio === ar ? 'active bg-studio-accent text-white border-studio-accent' : ''
                      }`}
                  >
                      {ar}
                  </button>
              ))}
          </div>
      </div>

    </div>
  );
}
