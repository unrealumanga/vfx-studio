import { useEffect } from 'react';
import { useHistoryStore } from '../../store/history.store';
import { useSessionStore } from '../../store/session.store';
import { blobToUrl, revokeBlobUrl } from '../../utils/blobUtils';

export default function HistoryStrip() {
  const { entries, init, clearHistory } = useHistoryStore();
  const { setResult, setPrompt, setError } = useSessionStore();

  useEffect(() => {
    init();
  }, []);

  const handleSelect = (entry: typeof entries[0]) => {
    setPrompt(entry.prompt);
    setResult(entry.result);
    setError(null);
  };

  return (
    <div className="glass-panel border-t border-studio-border/30 px-4 py-3 shrink-0 select-none">
      <div className="flex items-center gap-2">
        <span className="text-studio-accent text-xs font-mono shrink-0 animate-pulse">▸ HISTORY</span>
        <div className="flex gap-2 overflow-x-auto flex-1 scrollbar-none scroll-smooth py-0.5">
          {entries.map((entry) => (
            <button
              key={entry.id}
              onClick={() => handleSelect(entry)}
              className="shrink-0 w-12 h-12 rounded border border-studio-border overflow-hidden hover:border-studio-accent transition-colors bg-studio-bg"
              title={entry.prompt}
            >
              {entry.result.type === 'video' ? (
                <div className="w-full h-full flex items-center justify-center text-studio-muted text-xs">▶</div>
              ) : entry.result.blob ? (
                <img
                  src={blobToUrl(entry.result.blob)}
                  alt=""
                  className="w-full h-full object-cover"
                  onLoad={(e) => revokeBlobUrl((e.target as HTMLImageElement).src)}
                />
              ) : entry.result.url ? (
                <img src={entry.result.url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-studio-muted text-xs">Tx</div>
              )}
            </button>
          ))}
        </div>
        {entries.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-studio-muted hover:text-studio-danger text-xs shrink-0 px-2 transition-colors"
            title="Clear history"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
