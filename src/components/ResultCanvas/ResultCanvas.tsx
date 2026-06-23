import { useRef } from 'react';
import { useSessionStore } from '../../store/session.store';
import { blobToUrl } from '../../utils/blobUtils';

// Downloads a blob or fetches a URL and downloads it
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
  const { currentResult, isGenerating, progress, setReferenceImage, setActiveTask } =
    useSessionStore();
  const videoRef = useRef<HTMLVideoElement>(null);

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-full relative overflow-hidden bg-black/40">
        <div className="hud-scanline" />
        <div className="text-center relative z-10 space-y-4">
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            <svg
              className="absolute inset-0 w-full h-full animate-[spin_8s_linear_infinite]"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50" cy="50" r="45"
                stroke="#88ce02" strokeWidth="1.5"
                strokeDasharray="10 30" fill="transparent" strokeLinecap="round"
              />
            </svg>
            <svg
              className="absolute inset-0 w-full h-full animate-[spin_4s_linear_infinite_reverse]"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50" cy="50" r="35"
                stroke="#f5c842" strokeWidth="1"
                strokeDasharray="40 10" fill="transparent" opacity="0.6"
              />
            </svg>
            <div className="w-6 h-6 rounded-full bg-studio-accent animate-pulse shadow-[0_0_15px_#88ce02]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-studio-text font-display font-medium text-xs tracking-wider uppercase">
              Orchestrating Models
            </h3>
            <p className="text-studio-muted text-[10px] font-mono">
              {progress > 0
                ? `PIPELINE: ${Math.round(progress * 100)}%`
                : 'DISPATCHING TO NEURAL PIPELINES...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentResult) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 select-none">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="opacity-20">
          <circle cx="32" cy="32" r="28" stroke="#88ce02" strokeWidth="1"
            strokeDasharray="6 6" className="animate-[spin_12s_linear_infinite]" />
          <circle cx="32" cy="32" r="18" stroke="#8a3ffc" strokeWidth="0.5"
            strokeDasharray="3 9" className="animate-[spin_8s_linear_infinite_reverse]" />
          <circle cx="32" cy="32" r="4" fill="#88ce02" opacity="0.6" />
        </svg>
        <p className="text-studio-muted text-xs font-mono tracking-wider">
          // AWAITING GENERATION
        </p>
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

  if (isVideo) {
    return (
      <div className="relative flex items-center justify-center h-full group">
        {currentResult.blob ? (
          <video
            ref={videoRef}
            src={URL.createObjectURL(currentResult.blob)}
            controls
            autoPlay
            loop
            muted
            playsInline
            className="max-w-full max-h-full rounded-lg"
          />
        ) : (
          <div className="flex flex-col items-center gap-4 text-center px-6">
            <div className="w-16 h-16 rounded-full border border-studio-accent/30 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <polygon points="5,3 19,12 5,21" fill="#88ce02" />
              </svg>
            </div>
            <div className="space-y-1">
              <p className="text-studio-text text-sm font-display">Video Ready</p>
              <p className="text-studio-muted text-xs font-mono leading-relaxed">
                Veo 2 videos cannot stream directly in browser.<br />
                Download to play locally.
              </p>
            </div>
            <button
              onClick={handleDownload}
              className="interactive-btn px-5 py-2 bg-studio-accent text-white text-sm font-display rounded-full shadow-[0_0_20px_rgba(136,206,2,0.3)] hover:shadow-[0_0_30px_rgba(136,206,2,0.5)] transition-all duration-200"
            >
              ⬇ Download Video
            </button>
          </div>
        )}

        <div className="absolute bottom-3 left-3 right-3 flex gap-2 justify-center">
          <button onClick={handleDownload} className="action-pill">
            ⬇ Download
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center h-full group">
      {imageUrl && (
        <img
          src={imageUrl}
          alt="Generated result"
          className="max-w-full max-h-full rounded-lg object-contain"
        />
      )}

      <div className="absolute inset-0 flex flex-col items-end justify-between p-3 opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 max-md:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto max-md:pointer-events-auto">
        <div className="text-right">
          <span className="text-[10px] font-mono text-white/50 bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">
            {currentResult.model} · {currentResult.provider}
          </span>
        </div>

        <div className="flex gap-2 w-full justify-center flex-wrap">
          <button onClick={handleDownload} className="action-pill">
            ⬇ Download
          </button>
          <button onClick={handleUseAsReference} className="action-pill">
            ✂ Edit
          </button>
          <button onClick={handleSendToVideo} className="action-pill">
            ▶ Animate
          </button>
        </div>
      </div>
    </div>
  );
}
