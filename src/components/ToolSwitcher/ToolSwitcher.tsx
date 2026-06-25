import { useState, useEffect } from 'react';
import type { Task } from '../../adapters/_base';
import { useSessionStore } from '../../store/session.store';

// Removed 'upscale' and 'prompt-assist' from the toolbar
const TOOLS: { id: Task; label: string }[] = [
  { id: 'image-gen', label: 'Generate' },
  { id: 'image-edit', label: 'Edit' },
  { id: 'video-gen', label: 'Video' },
  { id: 'vfx-compose', label: 'Compose' },
  { id: 'archviz', label: 'ArchViz' },
];

interface ToolSwitcherProps {
  onOpenKeys: () => void;
  onToggleMobileNav: () => void;
}

export default function ToolSwitcher({ onOpenKeys, onToggleMobileNav }: ToolSwitcherProps) {
  const { activeTask, setActiveTask } = useSessionStore();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vfx-theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('vfx-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('vfx-theme', 'light');
    }
  }, [darkMode]);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-studio-bg/80 backdrop-blur-xl border-b border-studio-border-light transition-colors duration-300">
      <div className="flex items-center justify-between h-14 px-5 md:px-8">
        
        {/* Logo and Mobile Menu Button */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onToggleMobileNav} 
            className="md:hidden p-2 -ml-2 text-studio-muted hover:text-studio-text transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="4" y1="6" x2="20" y2="6"/>
                <line x1="4" y1="12" x2="20" y2="12"/>
                <line x1="4" y1="18" x2="20" y2="18"/>
            </svg>
          </button>
          <div 
            onClick={() => setActiveTask('image-gen')} 
            className="font-display font-bold text-lg tracking-tight text-studio-text no-select cursor-pointer"
          >
            VFX<span className="text-studio-muted font-light">.</span>STUDIO
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTask(tool.id)}
              className={`aw-tab px-3 py-2 ${activeTask === tool.id ? 'active' : ''}`}
            >
              {tool.label}
            </button>
          ))}
          <button onClick={() => setActiveTask('upscale')} className={`aw-tab px-3 py-2 ${activeTask === 'upscale' ? 'active' : ''}`}>Upscale</button>
          <button onClick={() => setActiveTask('prompt-assist')} className={`aw-tab px-3 py-2 ${activeTask === 'prompt-assist' ? 'active' : ''}`}>Assist</button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 text-studio-muted hover:text-studio-text transition-colors"
            title="Toggle theme"
          >
            {darkMode ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41"/>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
          
          <button
            onClick={onOpenKeys}
            className="aw-btn-outline px-4 py-2 rounded-full text-xs font-medium hidden sm:block"
          >
            Keys
          </button>
          {/* User requested: Top Generate button removed */}
        </div>
      </div>
    </header>
  );
}
