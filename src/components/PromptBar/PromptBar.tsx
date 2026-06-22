import { useRef, useEffect, useState } from 'react';
import { useSessionStore } from '../../store/session.store';
import { useKeysStore } from '../../store/keys.store';
import { pickAdapter } from '../../utils/router';

interface PromptBarProps {
  onGenerate: () => void;
}

export default function PromptBar({ onGenerate }: PromptBarProps) {
  const { prompt, setPrompt, isGenerating, error, setError, buildRequest } = useSessionStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isExpanding, setIsExpanding] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleGenerate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    onGenerate();
  };

  const handleExpandPrompt = async () => {
    if (!prompt.trim() || isExpanding) return;
    setIsExpanding(true);
    setError(null);

    try {
      const keys = useKeysStore.getState().keys;
      const { adapter, apiKey } = pickAdapter('prompt-assist', keys);
      const req = buildRequest();
      const result = await adapter.generate(req, apiKey);
      const refined = result.metadata?.refinedPrompt as string;
      if (refined) {
        setPrompt(refined);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsExpanding(false);
    }
  };

  return (
    <div className="relative">
      <div 
        className={`relative flex items-end gap-2 glass-panel rounded-lg p-3 transition-all duration-300 ${
          isGenerating ? 'glow-pulse-active scale-[1.005]' : ''
        }`}
      >
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleGenerate();
            }
          }}
          placeholder="✦ Describe what you want to create..."
          rows={2}
          className="flex-1 bg-transparent text-studio-text placeholder-studio-muted font-mono text-sm resize-none outline-none leading-relaxed"
        />
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExpandPrompt}
            disabled={isExpanding || !prompt.trim()}
            className="interactive-btn text-studio-muted hover:text-studio-accent transition-colors text-sm font-medium disabled:opacity-40 px-2 py-1.5 rounded hover:bg-studio-border"
            title="Expand prompt with AI assistance"
          >
            {isExpanding ? '...' : '✦'}
          </button>
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="interactive-btn bg-studio-accent hover:bg-studio-accent-dim disabled:opacity-40 disabled:cursor-not-allowed text-white font-display font-medium px-5 py-2 rounded-full text-sm transition-all"
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
      {error && (
        <p className="text-studio-danger text-sm mt-2 font-mono">{error}</p>
      )}
    </div>
  );
}
