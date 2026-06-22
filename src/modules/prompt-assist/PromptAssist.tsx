import { useState } from 'react';
import { useSessionStore } from '../../store/session.store';
import ModelBadge from '../../components/ModelBadge/ModelBadge';
import { pickAdapter } from '../../utils/router';
import { useKeysStore } from '../../store/keys.store';
import { assistPrompt } from './promptAssist.service';

export default function PromptAssist() {
  const { prompt, overrideProvider } = useSessionStore();
  const keys = useKeysStore((s) => s.keys);
  const [working, setWorking] = useState(false);

  let resolved: string | null = null;
  try {
    const r = pickAdapter('prompt-assist', keys, overrideProvider);
    resolved = r.provider;
  } catch {
    resolved = null;
  }

  const handleAssist = async () => {
    if (!prompt.trim() || working) return;
    setWorking(true);
    await assistPrompt();
    setWorking(false);
  };

  return (
    <div className="space-y-3">
      <ModelBadge currentProvider={resolved} />

      <p className="text-studio-muted text-xs font-mono">
        Uses AI to expand your prompt into a detailed, cinematic description optimized for image generation.
      </p>

      <button
        onClick={handleAssist}
        disabled={!prompt.trim() || working}
        className="w-full bg-studio-accent hover:bg-studio-accent-dim disabled:opacity-40 text-white font-display font-medium text-sm py-2 rounded-full transition-colors"
      >
        {working ? 'Working...' : '✦ Expand Prompt'}
      </button>
    </div>
  );
}
