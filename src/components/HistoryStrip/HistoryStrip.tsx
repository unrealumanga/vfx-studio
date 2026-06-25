import { useEffect, useRef } from 'react';
import { useHistoryStore } from '../../store/history.store';
import { useSessionStore } from '../../store/session.store';

export default function HistoryStrip() {
  const { entries, init, clearHistory } = useHistoryStore();
  const { setResult, setPrompt, setError, activeTask } = useSessionStore();
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
    if(entry.task && entry.task !== activeTask) {
        // optionally switch task based on history
    }
  };

  return (
    <div className="aw-panel rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
            <span className="label">Recent</span>
            {entries.length > 0 && (
                <button 
                    onClick={clearHistory}
                    className="text-[10px] font-mono uppercase tracking-wider text-studio-faded hover:text-studio-text transition-colors"
                >
                    Clear
                </button>
            )}
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1 items-center">
            {entries.length === 0 ? (
                <div className="text-studio-faded text-xs italic py-2">No generations yet</div>
            ) : (
                entries.map((entry) => {
                    const thumbUrl = getThumbnailUrl(entry);
                    return (
                        <div 
                            key={entry.id}
                            onClick={() => handleSelect(entry)}
                            className="shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border border-studio-border-light hover:border-studio-border cursor-pointer transition-all hover:scale-105 bg-studio-elevated flex items-center justify-center relative group"
                            title={entry.prompt}
                        >
                            {entry.result.type === 'video' ? (
                                <span className="text-2xl text-studio-muted">▶</span>
                            ) : thumbUrl ? (
                                <img src={thumbUrl} className="w-full h-full object-cover" alt="" />
                            ) : (
                                <span className="text-xs font-mono text-studio-muted">IMG</span>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                        </div>
                    );
                })
            )}
        </div>
    </div>
  );
}
