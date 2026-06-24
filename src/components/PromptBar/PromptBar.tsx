import { useRef, useEffect, useState } from 'react';
import { useSessionStore } from '../../store/session.store';
import { useKeysStore } from '../../store/keys.store';
import { usePromptStore } from '../../store/prompt.store';
import { pickAdapter } from '../../utils/router';

interface PromptBarProps {
  onGenerate: () => void;
}

const TEXT_STYLE = [
  'font-mono',
  'text-sm',
  'leading-relaxed',
  'tracking-normal',
  'whitespace-pre-wrap',
  'break-words',
].join(' ');

export default function PromptBar({ onGenerate }: PromptBarProps) {
  const { prompt, setPrompt, isGenerating, error, setError, buildRequest } = useSessionStore();
  const searchPrompts = usePromptStore(s => s.search);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExpanding, setIsExpanding] = useState(false);
  const [ghostText, setGhostText] = useState('');

  // Semantic/In-memory autocomplete matching
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (prompt.trim().length > 3) {
        const results = await searchPrompts(prompt);
        if (results.length > 0) {
          // Find first suggestion starting with current typed string (case insensitive)
          const match = results.find(r => r.toLowerCase().startsWith(prompt.toLowerCase()));
          if (match && match.toLowerCase() !== prompt.toLowerCase()) {
            setGhostText(match.slice(prompt.length));
          } else {
            setGhostText('');
          }
        } else {
          setGhostText('');
        }
      } else {
        setGhostText('');
      }
    };

    const timer = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(timer);
  }, [prompt, searchPrompts]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleGenerate();
      return;
    }

    if (e.key === 'Tab') {
      if (ghostText) {
        e.preventDefault();
        const newPrompt = prompt + ghostText;
        setPrompt(newPrompt);
        setGhostText('');
        // Restore focus selection at the end
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = newPrompt.length;
            textareaRef.current.selectionEnd = newPrompt.length;
            textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
          }
        });
      }
    }
  };

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
      if (refined) setPrompt(refined);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsExpanding(false);
    }
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-2">
      <div className="relative flex items-end gap-3 bg-studio-bg border border-studio-border rounded-xl p-4 transition-shadow focus-within:border-studio-accent focus-within:shadow-[0_4px_20px_rgba(232,64,64,0.06)]">
        
        {/* Core Input Layer with overlapping ghost autocomplete */}
        <div className="relative flex-1 min-w-0 min-h-[44px]">
          {/* Overlay matching div containing transparent typed text + ghost suffix */}
          {ghostText && (
            <div
              aria-hidden="true"
              className={`absolute inset-0 px-0 py-0 pointer-events-none select-none z-0 overflow-hidden ${TEXT_STYLE}`}
              style={{ color: 'transparent' }}
            >
              <span style={{ color: 'transparent' }}>{prompt}</span>
              <span className="text-studio-faded/35">{ghostText}</span>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              if (!e.target.value) setGhostText('');
            }}
            onKeyDown={handleKeyDown}
            placeholder=""
            rows={2}
            className={`w-full bg-transparent text-studio-text placeholder-studio-faded/40 resize-none outline-none leading-relaxed relative z-10 ${TEXT_STYLE}`}
            style={{ caretColor: 'var(--accent-red)' }}
          />

          {/* Minimal blink cursor prompt placeholder */}
          {!prompt && (
            <span className="absolute top-0 left-0 pointer-events-none text-studio-faded/50 font-mono text-sm term-cursor select-none">
              Describe what you want to create... <span className="text-studio-accent text-xs animate-pulse opacity-70">(Tab to complete suggestions)</span>
            </span>
          )}
        </div>

        {/* Action button grouping */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExpandPrompt}
            disabled={isExpanding || !prompt.trim()}
            className="btn-outline px-4 py-2 rounded-full text-xs font-display font-medium uppercase tracking-wider disabled:opacity-40 interactive-btn"
            title="Expand prompt with AI assistance"
          >
            {isExpanding ? 'Expanding...' : '✦ Expand'}
          </button>
          
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="btn-primary px-6 py-2 rounded-full text-xs font-display font-medium uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed interactive-btn"
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-studio-accent text-xs font-mono mt-1 px-1">✕ Error: {error}</p>
      )}
    </div>
  );
}
