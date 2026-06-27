import { useRef, useEffect, useState } from 'react';
import { useSessionStore } from '../../store/session.store';
import { usePromptStore } from '../../store/prompt.store';
import { useKeysStore } from '../../store/keys.store';
import { pickAdapter } from '../../utils/router';

interface PromptBarProps {
  onGenerate: () => void;
}

export default function PromptBar({ onGenerate }: PromptBarProps) {
  const { prompt, setPrompt, isGenerating, error, activeTask, setReferenceImage, setMaskImage, setError } = useSessionStore();
  const searchPrompts = usePromptStore(s => s.search);
  const keys = useKeysStore(s => s.keys);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [ghostText, setGhostText] = useState('');
  const [isExpanding, setIsExpanding] = useState(false);

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

  // V8 Restored Inline Expand/Refine Prompt function
  const handleExpandPrompt = async () => {
    if (!prompt.trim() || isExpanding) return;
    setIsExpanding(true);
    setError(null);

    try {
      const { adapter, apiKey } = pickAdapter('prompt-assist', keys);
      const session = useSessionStore.getState();
      const req = session.buildRequest();
      const result = await adapter.generate(req, apiKey);
      const refined = result.metadata?.refinedPrompt as string;
      if (refined) setPrompt(refined);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsExpanding(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferenceImage(file);
      setMaskImage(null);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-studio-bg/90 backdrop-blur-xl border-t border-studio-border-light p-3 md:p-6 transition-all duration-300">
      <div className="max-w-4xl mx-auto relative">
        <div className="aw-panel rounded-xl md:rounded-2xl flex items-center gap-2 md:gap-3 p-1.5 pr-2 md:p-2 md:pr-3 shadow-sm focus-within:border-studio-text transition-colors relative z-10">
          
          {/* Functional direct device reference file input & trigger */}
          <input 
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            id="promptBarFileUpload"
          />
          <button 
            onClick={() => fileRef.current?.click()}
            className="p-1.5 md:p-2 text-studio-muted hover:text-studio-text transition-colors shrink-0 rounded-lg hover:bg-studio-elevated" 
            title="Upload reference image directly"
          >
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
              className="w-full bg-transparent border-none outline-none text-studio-text placeholder:text-studio-faded text-xs md:text-base py-1.5 md:py-2 z-10 relative"
              placeholder="Describe what you want to create..."
              autoComplete="off"
            />
            {/* Ghost text positioned absolutely behind/underneath the input text visually */}
            {ghostText && prompt && (
               <div className="absolute left-0 right-0 text-transparent text-xs md:text-base py-1.5 md:py-2 pointer-events-none whitespace-pre overflow-hidden flex">
                  <span className="opacity-0">{prompt}</span>
                  <span className="text-studio-faded/40">{ghostText}</span>
               </div>
            )}
          </div>

          <div className="hidden md:flex items-center gap-1 text-studio-faded text-xs font-mono mr-1 shrink-0">
              <span className="px-1.5 py-0.5 border border-studio-border rounded">Tab</span>
          </div>

          {/* V8 Restored prominent ✦ Expand prompt button */}
          <button
            onClick={handleExpandPrompt}
            disabled={isExpanding || !prompt.trim()}
            className="aw-btn-outline px-3 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-display font-medium uppercase tracking-wider shrink-0 transition-all interactive-btn disabled:opacity-45"
            title="Expand prompt with AI assistance"
          >
            {isExpanding ? '...' : '✦ Expand'}
          </button>
          
          {/* Main Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={(!prompt.trim() && activeTask !== 'upscale') || isGenerating}
            className="aw-btn px-4 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-medium shrink-0 flex items-center gap-1.5 md:gap-2 transition-all interactive-btn"
          >
            <span>{isGenerating ? '...' : 'Generate'}</span>
            {!isGenerating && (
              <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polyline points="9 18 15 12 9 6"/>
              </svg>
            )}
          </button>

        </div>
        
        {error && (
          <p className="text-studio-danger text-[10px] md:text-xs font-mono mt-1 px-3 absolute top-full">✕ Error: {error}</p>
        )}
      </div>
    </div>
  );
}
