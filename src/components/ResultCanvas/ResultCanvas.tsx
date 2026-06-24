import { useRef, useState } from 'react';
import { useSessionStore } from '../../store/session.store';
import { blobToUrl } from '../../utils/blobUtils';
import MaskEditor from '../MaskEditor/MaskEditor';
import { upscaleImage } from '../../modules/upscale/upscale.service';

// Helper to trigger client-side file downloads
async function downloadResult(
  blob: Blob | undefined,
  url: string | undefined,
  filename: string
) {
  if (blob) {
    const objectUrl = URL.createObjectURL(blob);
    triggerDownload(objectUrl, filename);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
    return;
  }
  if (url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('fetch failed');
      const fetchedBlob = await res.blob();
      const objectUrl = URL.createObjectURL(fetchedBlob);
      triggerDownload(objectUrl, filename);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
    } catch {
      window.open(url, '_blank');
    }
  }
}

function triggerDownload(href: string, filename: string) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export default function ResultCanvas() {
  const { activeTask, currentResult, isGenerating, progress, referenceImage, setReferenceImage, setActiveTask } =
    useSessionStore();
  const videoRef = useRef<HTMLVideoElement>(null);

  // V6 In-Context Quick-Upscale states
  const [showUpscaleOptions, setShowUpscaleOptions] = useState(false);
  const [upscaleFactor, setUpscaleFactor] = useState(2);
  const [isUpscalingInline, setIsUpscalingInline] = useState(false);

  // ── Scenario A: MaskEditor Workspace ─────────────────────────────
  if (activeTask === 'image-edit' && referenceImage) {
    return (
      <div className="w-full h-full flex flex-col relative bg-neutral-900 overflow-hidden">
        <MaskEditor />
      </div>
    );
  }

  // ── Scenario B: Generating Loading State ─────────────────────────
  if (isGenerating || isUpscalingInline) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-studio-surface p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="loading-spinner mb-2" />
          <div className="space-y-1">
            <h3 className="text-studio-text font-display font-medium text-sm tracking-wide uppercase">
              {isUpscalingInline ? 'Performing In-Context Detail Upscale' : 'Orchestrating Model pipelines'}
            </h3>
            <p className="text-studio-faded text-xs font-mono">
              {isUpscalingInline 
                ? `INCREASING RESOLUTION MULTIPLIER TO ${upscaleFactor}x...`
                : progress > 0
                ? `PROCESSING: ${Math.round(progress * 100)}%`
                : 'DISPATCHING TO NEURAL INFRASTRUCTURE...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Scenario C: Empty / Awaiting state ───────────────────────────
  if (!currentResult) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-4 select-none p-6 text-center">
        <svg width="48" height="48" viewBox="0 0 64 64" fill="none" className="text-studio-faded opacity-30">
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="32" cy="32" r="14" stroke="currentColor" strokeWidth="1" />
          <path d="M32 24v16M24 32h16" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
        <div className="space-y-1">
          <p className="text-studio-muted text-xs font-display font-medium tracking-widest uppercase">
            Awaiting prompt generation
          </p>
          <p className="text-studio-faded text-[11px] font-mono leading-relaxed">
            Configure keys, select a generation tool above, and press enter to start rendering.
          </p>
        </div>
      </div>
    );
  }

  const imageUrl = currentResult.blob
    ? blobToUrl(currentResult.blob)
    : currentResult.type === 'image'
    ? currentResult.url
    : undefined;

  const isVideo = currentResult.type === 'video';
  const timestamp = Date.now();

  const handleDownload = () => {
    const ext = isVideo ? 'mp4' : 'png';
    downloadResult(
      currentResult.blob,
      currentResult.url,
      `vfx-studio-${timestamp}.${ext}`
    );
  };

  const handleUseAsReference = async () => {
    if (currentResult.blob) {
      setReferenceImage(currentResult.blob);
    } else if (currentResult.url) {
      try {
        const res = await fetch(currentResult.url);
        const blob = await res.blob();
        setReferenceImage(blob);
      } catch {
        console.error('Could not load result as reference image');
        return;
      }
    }
    setActiveTask('image-edit');
  };

  const handleSendToVideo = async () => {
    if (currentResult.blob) {
      setReferenceImage(currentResult.blob);
    } else if (currentResult.url && currentResult.type === 'image') {
      try {
        const res = await fetch(currentResult.url);
        const blob = await res.blob();
        setReferenceImage(blob);
      } catch {
        console.error('Could not send result to video module');
        return;
      }
    }
    setActiveTask('video-gen');
  };

  // V6 In-Context Quick Upscaling Trigger
  const handleQuickUpscale = async () => {
    if (!currentResult) return;
    setIsUpscalingInline(true);
    setShowUpscaleOptions(false);

    try {
      let blob = currentResult.blob;
      if (!blob && currentResult.url) {
        const res = await fetch(currentResult.url);
        blob = await res.blob();
      }
      if (blob) {
        await upscaleImage(blob, upscaleFactor);
      }
    } catch (e) {
      console.error("Inline quick-upscaling failed:", e);
    } finally {
      setIsUpscalingInline(false);
    }
  };

  // ── Scenario D: Video Output ────────────────────────────────────
  if (isVideo) {
    return (
      <div className="relative flex items-center justify-center h-full w-full p-4 group">
        {currentResult.blob ? (
          <video
            ref={videoRef}
            src={URL.createObjectURL(currentResult.blob)}
            controls
            autoPlay
            loop
            muted
            playsInline
            className="max-w-full max-h-full rounded-lg shadow-sm"
          />
        ) : (
          <div className="flex flex-col items-center gap-4 text-center px-6">
            <div className="w-14 h-14 rounded-full border border-studio-border-light bg-studio-surface flex items-center justify-center">
              <svg width="20" height="24" viewBox="0 0 24 24" fill="none">
                <polygon points="5,3 19,12 5,21" fill="var(--accent-red)" />
              </svg>
            </div>
            <div className="space-y-1">
              <p className="text-studio-text text-sm font-display font-medium">Video Render Complete</p>
              <p className="text-studio-faded text-xs leading-relaxed max-w-xs">
                Google Veo 2 mp4 streams cannot load inline due to credentials. Download to play.
              </p>
            </div>
            <button
              onClick={handleDownload}
              className="btn-primary font-display"
            >
              ⬇ Download Video
            </button>
          </div>
        )}

        <div className="absolute bottom-4 left-0 right-0 flex gap-2 justify-center px-4 pointer-events-none">
          <div className="flex gap-2 pointer-events-auto bg-studio-surface/90 backdrop-blur-md p-1.5 rounded-full shadow-md border border-studio-border/30">
            <button onClick={handleDownload} className="action-pill">
              ⬇ Download
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Scenario E: Image Output with Inline Pop-Over Upscale Modal ──
  return (
    <div className="relative flex items-center justify-center h-full w-full p-4 group bg-studio-surface overflow-hidden">
      {imageUrl && (
        <img
          src={imageUrl}
          alt="Generated result"
          className="max-w-full max-h-full rounded-lg object-contain transition-transform duration-300"
        />
      )}

      {/* Details bar */}
      <div className="absolute top-4 right-4 pointer-events-none">
        <span className="text-[10px] font-mono text-studio-muted bg-white/90 border border-studio-border px-2.5 py-1 rounded-full shadow-sm">
          {currentResult.model} · {currentResult.provider}
        </span>
      </div>

      {/* Floating Action Pills overlay */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center px-4 pointer-events-none">
        <div className="flex gap-2 pointer-events-auto bg-white/90 backdrop-blur-md p-1.5 rounded-full shadow-md border border-studio-border">
          <button onClick={handleDownload} className="action-pill">
            ⬇ Download
          </button>
          <button onClick={handleUseAsReference} className="action-pill">
            ✂ Edit
          </button>
          <button onClick={handleSendToVideo} className="action-pill">
            ▶ Animate
          </button>
          <button onClick={() => setShowUpscaleOptions(true)} className="action-pill">
            ✦ Upscale
          </button>
        </div>
      </div>

      {/* V6 Pop-over Resolution Picker Overlay */}
      {showUpscaleOptions && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 shadow-xl border border-studio-border max-w-sm w-full animate-slide-up flex flex-col gap-4 text-studio-text">
            <div className="space-y-1">
              <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-studio-text">In-Context Quick Upscaler</h4>
              <p className="text-studio-muted text-xs">
                Enhance details and sharpen current results instantly without leaving your current workspace.
              </p>
            </div>
            
            <div className="flex gap-3 my-2">
              {[2, 3, 4].map((f) => (
                <button
                  key={f}
                  onClick={() => setUpscaleFactor(f)}
                  className={`flex-1 py-2 rounded-lg text-xs font-mono font-medium transition-colors ${
                    upscaleFactor === f 
                      ? 'bg-studio-accent text-white font-semibold shadow-md' 
                      : 'bg-studio-surface border border-studio-border-light hover:bg-neutral-100 hover:text-studio-text'
                  }`}
                >
                  {f}x
                </button>
              ))}
            </div>

            <div className="flex gap-2 justify-end border-t border-studio-border-light pt-3 shrink-0">
              <button 
                onClick={() => setShowUpscaleOptions(false)} 
                className="btn-outline px-4 py-1.5 rounded-full text-xs font-display"
              >
                Cancel
              </button>
              <button 
                onClick={handleQuickUpscale} 
                className="btn-primary px-4 py-1.5 rounded-full text-xs font-display"
              >
                Upscale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
