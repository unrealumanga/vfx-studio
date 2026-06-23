import { useState } from 'react';
import { useSessionStore } from '../../store/session.store';
import ModelBadge from '../../components/ModelBadge/ModelBadge';
import { pickAdapter } from '../../utils/router';
import { useKeysStore } from '../../store/keys.store';
import { assistPrompt, TEMPLATES, type TemplateKey } from './promptAssist.service';

export default function PromptAssist() {
  const { prompt, overrideProvider } = useSessionStore();
  const keys = useKeysStore((s) => s.keys);
  const [working, setWorking] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey | ''>('');

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
    await assistPrompt(selectedTemplate ? selectedTemplate : undefined);
    setWorking(false);
  };

  return (
    <div className="space-y-3">
      <ModelBadge currentProvider={resolved} />

      <p className="text-studio-muted text-[10px] font-mono leading-relaxed">
        Uses AI to expand your prompt into a detailed, cinematic description optimized for generation.
      </p>

      <div>
        <label className="text-studio-muted text-xs font-mono block mb-1">Amplification Template</label>
        <select
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value as TemplateKey | '')}
          className="w-full bg-studio-bg border border-studio-border rounded px-2 py-1.5 text-studio-text text-xs font-mono outline-none focus:border-studio-accent"
        >
          <option value="">Auto (Default)</option>
          {Object.entries(TEMPLATES).map(([key, temp]) => (
            <option key={key} value={key}>{temp.label}</option>
          ))}
        </select>
      </div>

      <button
        onClick={handleAssist}
        disabled={!prompt.trim() || working}
        className="interactive-btn w-full bg-studio-accent hover:bg-studio-accent-dim disabled:opacity-40 text-white font-display font-medium text-sm py-2 rounded-full transition-colors shadow-[0_4px_15px_rgba(124,109,255,0.3)]"
      >
        {working ? 'Amplifying...' : '✦ Expand Prompt'}
      </button>
    </div>
  );
}
