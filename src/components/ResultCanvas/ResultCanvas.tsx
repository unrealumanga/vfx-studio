import { useSessionStore } from '../../store/session.store';
import { blobToUrl, revokeBlobUrl } from '../../utils/blobUtils';

export default function ResultCanvas() {
  const { currentResult, isGenerating, progress } = useSessionStore();

  if (isGenerating) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto rounded-lg bg-gradient-to-r from-studio-surface via-studio-accent/20 to-studio-surface animate-shimmer bg-[length:200%_100%]" />
          <p className="text-studio-muted text-sm mt-3 font-mono">
            {progress > 0 ? `${Math.round(progress * 100)}%` : 'Generating...'}
          </p>
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
