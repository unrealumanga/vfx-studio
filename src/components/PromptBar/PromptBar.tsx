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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [ghostText, setGhostText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (prompt.length > 5) {
        const results = await searchPrompts(prompt);
        if (results.length > 0) {
          setSuggestions(results);
          setSelectedIdx(0);
          setShowDropdown(true);
          const match = results.find(r => r.toLowerCase().startsWith(prompt.toLowerCase()));
          if (match) {
            setGhostText(match.slice(prompt.length));
          } else {
            setGhostText('');
          }
        } else {
          setSuggestions([]);
          setShowDropdown(false);
          setGhostText('');
        }
      } else {
        setSuggestions([]);
        setShowDropdown(false);
        setGhostText('');
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [prompt, searchPrompts]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const acceptSuggestion = (text: string) => {
    setPrompt(text);
    setSuggestions([]);
    setShowDropdown(false);
    setGhostText('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleGenerate();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      if (ghostText) {
        const newPrompt = prompt + ghostText;
        setPrompt(newPrompt);
        setGhostText('');
        setSuggestions([]);
        setShowDropdown(false);
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = newPrompt.length;
            textareaRef.current.selectionEnd = newPrompt.length;
            textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
          }
        });
      } else if (suggestions.length > 0 && selectedIdx >= 0) {
        acceptSuggestion(suggestions[selectedIdx]);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      if (suggestions.length > 0) {
        e.preventDefault();
        setSelectedIdx(i => (i < suggestions.length - 1 ? i + 1 : i));
      }
    }

    if (e.key === 'ArrowUp') {
      if (suggestions.length > 0) {
        e.preventDefault();
        setSelectedIdx(i => (i > 0 ? i - 1 : i));
      }
    }

    if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setShowDropdown(false);
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
    <div ref={containerRef} className="relative z-30">
      <div
        className={`relative flex items-end gap-2 glass-panel rounded-lg p-3 transition-all duration-300 ${
          isGenerating ? 'glow-pulse-active scale-[1.005]' : ''
        }`}
      >
        <div className="relative flex-1 min-w-0">
          {ghostText && (
            <div
              aria-hidden="true"
              className={`absolute inset-0 px-0 py-0 pointer-events-none select-none z-20 overflow-hidden ${TEXT_STYLE}`}
              style={{ color: 'transparent' }}
            >
              <span style={{ color: 'transparent' }}>{prompt}</span>
              <span className="text-studio-muted/35">{ghostText}</span>
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
            className={`w-full bg-transparent text-studio-text placeholder-studio-muted/40 resize-none outline-none leading-relaxed relative z-10 ${TEXT_STYLE}`}
          />

          {!prompt && (
            <span className="absolute top-0 left-0 pointer-events-none text-studio-muted/50 font-mono text-sm term-cursor select-none">
              Describe what you want to create
            </span>
          )}
        </div>

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
            className="interactive-btn bg-studio-accent hover:bg-studio-accent-dim disabled:opacity-40 disabled:cursor-not-allowed text-black font-display font-medium px-5 py-2 rounded-full text-sm transition-all"
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 w-full mt-2 glass-panel rounded-lg shadow-xl z-50 overflow-hidden text-sm font-mono border border-studio-border/50">
          <div className="p-2 text-[10px] text-studio-muted uppercase tracking-wider border-b border-studio-border/30 bg-black/20 flex justify-between">
            <span>// AUTOCOMPLETE</span>
            <span>[Tab] to accept</span>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {suggestions.map((sug, i) => (
              <div
                key={i}
                className={`p-3 cursor-pointer border-b border-studio-border/10 last:border-0 transition-colors ${
                  i === selectedIdx
                    ? 'bg-studio-accent/20 text-studio-text'
                    : 'text-studio-muted hover:bg-white/5 hover:text-studio-text'
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  acceptSuggestion(sug);
                }}
                onMouseEnter={() => setSelectedIdx(i)}
              >
                {sug}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-studio-danger text-sm mt-2 font-mono">{error}</p>
      )}
    </div>
  );
}
