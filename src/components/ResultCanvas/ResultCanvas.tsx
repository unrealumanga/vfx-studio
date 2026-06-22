import { useSessionStore } from '../../store/session.store';
import { blobToUrl, revokeBlobUrl } from '../../utils/blobUtils';

export default function ResultCanvas() {
  const { currentResult, isGenerating, progress } = useSessionStore();

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-full relative overflow-hidden bg-black/40">
        <div className="hud-scanline" />

        <div className="text-center relative z-10 space-y-4">
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full animate-[spin_8s_linear_infinite]" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" stroke="#7c6dff" strokeWidth="1.5" strokeDasharray="10 30" fill="transparent" strokeLinecap="round" />
            </svg>
            <svg className="absolute inset-0 w-full h-full animate-[spin_4s_linear_infinite_reverse]" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="35" stroke="#f5c842" strokeWidth="1" strokeDasharray="40 10" fill="transparent" opacity="0.6" />
            </svg>
            <div className="w-6 h-6 rounded-full bg-studio-accent animate-pulse shadow-[0_0_15px_#7c6dff]" />
          </div>

          <div className="space-y-1">
            <h3 className="text-studio-text font-display font-medium text-xs tracking-wider uppercase">Orchestrating Models</h3>
            <p className="text-studio-muted text-[10px] font-mono">
              {progress > 0 ? `REPLICATING REGIMES: ${Math.round(progress * 100)}%` : 'DISPATCHING TO NEURAL PIPELINES...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentResult) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-studio-muted text-sm font-mono">Your result will appear here</p>
      </div>
    );
  }

  if (currentResult.type === 'video' && currentResult.url) {
    return (
      <div className="flex items-center justify-center h-full">
        <video
          src={currentResult.url}
          controls
          autoPlay
          loop
          muted
          className="max-w-full max-h-full rounded-lg"
        />
      </div>
    );
  }

  if (currentResult.blob) {
    const url = blobToUrl(currentResult.blob);
    return (
      <div className="flex items-center justify-center h-full">
        <img
          src={url}
          alt="Generated result"
          className="max-w-full max-h-full rounded-lg object-contain"
          onLoad={() => revokeBlobUrl(url)}
        />
      </div>
    );
  }

  if (currentResult.url) {
    return (
      <div className="flex items-center justify-center h-full">
        <img
          src={currentResult.url}
          alt="Generated result"
          className="max-w-full max-h-full rounded-lg object-contain"
        />
      </div>
    );
  }

  return null;
}
