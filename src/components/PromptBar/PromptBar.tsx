import { useRef, useEffect, useState } from 'react';
import { useSessionStore } from '../../store/session.store';
import { usePromptStore } from '../../store/prompt.store';

interface PromptBarProps {
  onGenerate: () => void;
}

export default function PromptBar({ onGenerate }: PromptBarProps) {
  const { prompt, setPrompt, isGenerating, error, activeTask } = useSessionStore();
  const searchPrompts = usePromptStore(s => s.search);
  const inputRef = useRef<HTMLInputElement>(null);
  const [ghostText, setGhostText] = useState('');

  // Semantic/In-memory autocomplete matching
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (prompt.trim().length > 3) {
        const results = await searchPrompts(prompt);
        if (results.length > 0) {
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
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
      }
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && activeTask !== 'upscale') {
      inputRef.current?.focus();
      return;
    }
    if (isGenerating) return;
    onGenerate();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-studio-bg/90 backdrop-blur-xl border-t border-studio-border-light p-4 md:p-6 transition-all duration-300">
      <div className="max-w-4xl mx-auto relative">
        <div className="aw-panel rounded-2xl flex items-center gap-3 p-2 pr-3 shadow-sm focus-within:border-studio-text transition-colors relative z-10">
          
          <button className="p-2 text-studio-muted hover:text-studio-text transition-colors shrink-0" title="Upload reference (use module panel)">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
          </button>
          
          <div className="flex-1 relative flex items-center min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                if (!e.target.value) setGhostText('');
              }}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent border-none outline-none text-studio-text placeholder:text-studio-faded text-sm md:text-base py-2 z-10 relative"
              placeholder="Describe what you want to create..."
              autoComplete="off"
            />
            {/* Ghost text positioned absolutely behind/underneath the input text visually */}
            {ghostText && prompt && (
               <div className="absolute left-0 right-0 text-transparent text-sm md:text-base py-2 pointer-events-none whitespace-pre overflow-hidden flex">
                  <span className="opacity-0">{prompt}</span>
                  <span className="text-studio-faded/40">{ghostText}</span>
               </div>
            )}
          </div>

          <div className="hidden md:flex items-center gap-1 text-studio-faded text-xs font-mono mr-2 shrink-0">
              <span className="px-1.5 py-0.5 border border-studio-border rounded">Tab</span>
          </div>
          
          <button
            onClick={handleGenerate}
            disabled={(!prompt.trim() && activeTask !== 'upscale') || isGenerating}
            className="aw-btn px-6 py-2.5 rounded-xl text-sm font-medium shrink-0 flex items-center gap-2"
          >
            <span>{isGenerating ? 'Generating...' : 'Generate'}</span>
            {!isGenerating && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polyline points="9 18 15 12 9 6"/>
              </svg>
            )}
          </button>

        </div>
        
        {error && (
          <p className="text-studio-danger text-xs font-mono mt-2 px-4 absolute top-full">✕ Error: {error}</p>
        )}
      </div>
    </div>
  );
}
