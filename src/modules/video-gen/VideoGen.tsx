import { useRef, useEffect, useState } from 'react';
import { useSessionStore } from '../../store/session.store';
import ModelBadge from '../../components/ModelBadge/ModelBadge';
import { pickAdapter } from '../../utils/router';
import { useKeysStore } from '../../store/keys.store';

type VideoMode = 'text' | 'image' | 'start-end';

export default function VideoGen() {
  const {
    aspectRatio, setAspectRatio,
    overrideProvider, setReferenceImage, setStyleImage,
    referenceImage, styleImage,
    _videoDuration, setVideoDuration,
  } = useSessionStore();
  const keys = useKeysStore((s) => s.keys);
  const [mode, setMode] = useState<VideoMode>('text');
  const startRef = useRef<HTMLInputElement>(null);
  const endRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setReferenceImage(null);
    setStyleImage(null);
  }, [mode]);

  let resolved: string | null = null;
  try {
    const r = pickAdapter('video-gen', keys, overrideProvider);
    resolved = r.provider;
  } catch { resolved = null; }

  const handleStartUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setReferenceImage(f);
  };

  const handleEndUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setStyleImage(f);
  };

  return (
    <div className="space-y-3">
      <ModelBadge currentProvider={resolved} />

      <div>
        <label className="text-studio-muted text-xs font-mono block mb-1">Mode</label>
        <div className="grid grid-cols-3 gap-1">
          {(['text', 'image', 'start-end'] as VideoMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`text-[10px] py-1.5 rounded font-mono transition-colors ${
                mode === m
                  ? 'bg-studio-accent text-white'
                  : 'bg-studio-bg border border-studio-border text-studio-muted hover:text-studio-text'
              }`}
            >
              {m === 'text' ? 'Text→Vid' : m === 'image' ? 'Img→Vid' : 'Start→End'}
            </button>
          ))}
        </div>
      </div>

      {mode === 'image' && (
        <div>
          <label className="text-studio-muted text-xs font-mono block mb-1">
            Starting Frame
          </label>
          <input ref={startRef} type="file" accept="image/*"
            onChange={handleStartUpload} className="hidden" />
          <button
            onClick={() => startRef.current?.click()}
            className="w-full bg-studio-bg border border-studio-border rounded px-3 py-2 text-xs text-studio-muted font-mono hover:text-studio-text transition-colors text-left"
          >
            {referenceImage ? '✓ Start frame loaded' : 'Upload starting image...'}
          </button>
        </div>
      )}

      {mode === 'start-end' && (
        <div className="space-y-2">
          <div>
            <label className="text-studio-muted text-xs font-mono block mb-1">First Frame</label>
            <input ref={startRef} type="file" accept="image/*"
              onChange={handleStartUpload} className="hidden" />
            <button
              onClick={() => startRef.current?.click()}
              className="w-full bg-studio-bg border border-studio-border rounded px-3 py-2 text-xs text-studio-muted font-mono hover:text-studio-text transition-colors text-left"
            >
              {referenceImage ? '✓ First frame loaded' : 'Upload first frame...'}
            </button>
          </div>
          <div>
            <label className="text-studio-muted text-xs font-mono block mb-1">Last Frame</label>
            <input ref={endRef} type="file" accept="image/*"
              onChange={handleEndUpload} className="hidden" />
            <button
              onClick={() => endRef.current?.click()}
              className="w-full bg-studio-bg border border-studio-border rounded px-3 py-2 text-xs text-studio-muted font-mono hover:text-studio-text transition-colors text-left"
            >
              {styleImage ? '✓ Last frame loaded' : 'Upload last frame...'}
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="text-studio-muted text-xs font-mono block mb-1">
          Duration — {_videoDuration}s
        </label>
        <input
          type="range" min={4} max={8} step={2} value={_videoDuration}
          onChange={(e) => {
            setVideoDuration(Number(e.target.value));
          }}
          className="w-full accent-studio-accent"
        />
        <div className="flex justify-between text-studio-muted text-xs font-mono mt-0.5">
          <span>4s</span><span>6s</span><span>8s</span>
        </div>
      </div>

      <div>
        <label className="text-studio-muted text-xs font-mono block mb-1">Aspect Ratio</label>
        <select
          value={aspectRatio}
          onChange={(e) => setAspectRatio(e.target.value)}
          className="w-full bg-studio-bg border border-studio-border rounded px-2 py-1.5 text-studio-text text-xs font-mono outline-none focus:border-studio-accent"
        >
          <option value="16:9">16:9 Landscape</option>
          <option value="9:16">9:16 Portrait</option>
          <option value="1:1">1:1 Square</option>
        </select>
      </div>

      <p className="text-studio-muted text-xs font-mono">
        ⏱ Video generation takes 2–5 minutes. Page will update when ready.
      </p>
    </div>
  );
}
