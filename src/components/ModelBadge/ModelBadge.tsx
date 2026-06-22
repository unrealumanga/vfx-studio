import { useState } from 'react';
import { useSessionStore } from '../../store/session.store';
import { useKeysStore } from '../../store/keys.store';

interface ModelBadgeProps {
  currentProvider: string | null;
}

const PROVIDER_NAMES: Record<string, string> = {
  google: 'Google AI',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  replicate: 'Replicate',
  fal: 'Fal.ai',
  runway: 'RunwayML',
};

export default function ModelBadge({ currentProvider }: ModelBadgeProps) {
  const [open, setOpen] = useState(false);
  const { overrideProvider, setOverrideProvider } = useSessionStore();
  const keys = useKeysStore((s) => s.keys);
  const available = (Object.keys(keys) as Array<keyof typeof keys>).filter((k) => !!keys[k]);

  const display = overrideProvider
    ? PROVIDER_NAMES[overrideProvider] ?? overrideProvider
    : currentProvider
      ? PROVIDER_NAMES[currentProvider] ?? currentProvider
      : 'Auto';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-studio-muted hover:text-studio-text bg-studio-surface border border-studio-border rounded px-2 py-1 font-mono transition-colors"
      >
        <span className="text-studio-accent">●</span>
        {display}
        <span className="text-studio-muted ml-1">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 bg-studio-surface border border-studio-border rounded-lg p-2 min-w-[160px] shadow-xl animate-slide-up">
            <button
              onClick={() => { setOverrideProvider(null); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                !overrideProvider ? 'bg-studio-accent/20 text-studio-accent' : 'text-studio-muted hover:text-studio-text hover:bg-studio-border'
              }`}
            >
              Auto (recommended)
            </button>
            {available.map((p) => (
              <button
                key={p}
                onClick={() => { setOverrideProvider(p); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                  overrideProvider === p ? 'bg-studio-accent/20 text-studio-accent' : 'text-studio-muted hover:text-studio-text hover:bg-studio-border'
                }`}
              >
                {PROVIDER_NAMES[p] ?? p}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
