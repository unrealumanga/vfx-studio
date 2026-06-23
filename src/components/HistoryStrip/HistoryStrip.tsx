import { useEffect, useRef } from 'react';
import { useHistoryStore } from '../../store/history.store';
import { useSessionStore } from '../../store/session.store';

export default function HistoryStrip() {
  const { entries, init, clearHistory } = useHistoryStore();
  const { setResult, setPrompt, setError } = useSessionStore();
  const urlMap = useRef<Map<number, string>>(new Map());

  useEffect(() => {
    init();
    return () => {
      urlMap.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  function getThumbnailUrl(entry: typeof entries[0]): string | null {
    if (entry.result.type === 'video') return null;
    if (entry.result.url) return entry.result.url;
    if (!entry.result.blob) return null;

    if (!urlMap.current.has(entry.id)) {
      urlMap.current.set(entry.id, URL.createObjectURL(entry.result.blob));
    }
    return urlMap.current.get(entry.id) ?? null;
  }

  const handleSelect = (entry: typeof entries[0]) => {
    setPrompt(entry.prompt);
    setResult(entry.result);
    setError(null);
  };

  return (
    <div className="glass-panel border-t border-studio-border/30 px-4 py-3 shrink-0 select-none">
      <div className="flex items-center gap-2">
        <span className="text-studio-accent text-xs font-mono shrink-0">▸ HISTORY</span>
        <div className="flex gap-2 overflow-x-auto flex-1 scrollbar-none scroll-smooth py-0.5">
          {entries.map((entry) => {
            const thumbUrl = getThumbnailUrl(entry);
            return (
              <button
                key={entry.id}
                onClick={() => handleSelect(entry)}
                className="shrink-0 w-12 h-12 rounded border border-studio-border overflow-hidden hover:border-studio-accent transition-colors bg-studio-bg relative group"
                title={entry.prompt}
              >
                {entry.result.type === 'video' ? (
                  <div className="w-full h-full flex items-center justify-center text-studio-accent text-base">▶</div>
                ) : thumbUrl ? (
                  <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-studio-muted text-[10px] font-mono">IMG</div>
                )}
              </button>
            );
          })}
          {entries.length === 0 && (
            <span className="text-studio-muted text-xs font-mono opacity-40 py-1">
              no history yet
            </span>
          )}
        </div>
        {entries.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-studio-muted hover:text-studio-danger text-xs shrink-0 px-2 transition-colors"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
