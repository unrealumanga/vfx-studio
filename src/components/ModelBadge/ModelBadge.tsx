import { useState } from 'react';
import { useSessionStore } from '../../store/session.store';
import { useKeysStore } from '../../store/keys.store';
import { pickAdapter } from '../../utils/router';

// Human-readable model labels per provider + task
const MODEL_LABELS: Record<string, Record<string, string>> = {
  google: {
    'image-gen':  'Gemini Image',
    'image-edit': 'Gemini Image',
    'video-gen':  'Veo 2',
    'archviz':    'Gemini Image',
    'upscale':    'Gemini Pro',
    'prompt-assist': 'Gemini Flash',
    default:      'Google AI',
  },
  openai: {
    'image-gen':  'DALL·E 3',
    'image-edit': 'DALL·E 2',
    'prompt-assist': 'GPT-4o',
    default:      'OpenAI',
  },
  anthropic: {
    'prompt-assist': 'Claude Sonnet',
    default:         'Claude',
  },
  replicate: {
    'image-gen':  'Flux Dev',
    'upscale':    'Real-ESRGAN',
    default:      'Replicate',
  },
  fal: { default: 'Fal.ai' },
  runway: {
    'video-gen':  'Runway Gen-3',
    'vfx-compose': 'Runway Gen-3',
    default:       'RunwayML',
  },
};

interface ModelBadgeProps {
  currentProvider: string | null;
}

export default function ModelBadge({ currentProvider }: ModelBadgeProps) {
  const { activeTask, overrideProvider, setOverrideProvider } = useSessionStore();
  const { keys } = useKeysStore();
  const [open, setOpen] = useState(false);

  const getLabel = (provider: string) => {
    const taskLabels = MODEL_LABELS[provider];
    if (!taskLabels) return provider;
    return taskLabels[activeTask] ?? taskLabels['default'] ?? provider;
  };

  const availableForTask = Object.keys(keys)
    .filter((p) => {
      try {
        pickAdapter(activeTask, keys, p);
        return true;
      } catch {
        return false;
      }
    });

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-studio-border text-xs font-mono text-studio-muted hover:text-studio-accent hover:border-studio-accent/50 transition-all duration-150"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-studio-accent animate-pulse" />
        {currentProvider ? getLabel(currentProvider) : 'No key set'}
        <span className="text-[10px] opacity-50">▾</span>
      </button>

      {open && availableForTask.length > 0 && (
        <div className="absolute top-full left-0 mt-1 z-50 glass-panel rounded-lg overflow-hidden min-w-[140px] border border-studio-border shadow-xl animate-slide-up">
          <div className="p-1.5 text-[10px] text-studio-muted font-mono uppercase tracking-wider border-b border-studio-border/30 px-2">
            Switch model
          </div>
          {availableForTask.map((p) => (
            <button
              key={p}
              onClick={() => {
                setOverrideProvider(p === currentProvider ? null : p);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs font-mono transition-colors duration-100 ${
                p === (overrideProvider ?? currentProvider)
                  ? 'text-studio-accent bg-studio-accent/10'
                  : 'text-studio-text hover:bg-white/5'
              }`}
            >
              {getLabel(p)}
            </button>
          ))}
          {overrideProvider && (
            <button
              onClick={() => { setOverrideProvider(null); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-[10px] font-mono text-studio-muted hover:text-studio-danger border-t border-studio-border/20 transition-colors"
            >
              ✕ Reset to auto
            </button>
          )}
        </div>
      )}
    </div>
  );
}
