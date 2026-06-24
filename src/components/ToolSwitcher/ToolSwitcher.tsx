import { useState, useEffect } from 'react';
import type { Task } from '../../adapters/_base';
import { useSessionStore } from '../../store/session.store';

// Removed 'upscale' and 'prompt-assist' from the toolbar
const TOOLS: { id: Task; label: string }[] = [
  { id: 'image-gen', label: 'Generate' },
  { id: 'image-edit', label: 'Inpaint & Edit' },
  { id: 'video-gen', label: 'Motion & Video' },
  { id: 'vfx-compose', label: 'VFX Composer' },
  { id: 'archviz', label: 'ArchViz' },
];

interface ToolSwitcherProps {
  onOpenKeys: () => void;
}

export default function ToolSwitcher({ onOpenKeys }: ToolSwitcherProps) {
  const { activeTask, setActiveTask } = useSessionStore();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-neutral-900 border-b border-studio-border-light dark:border-neutral-800 shrink-0 w-full overflow-hidden select-none transition-colors duration-200">
      <div className="flex items-center gap-10 overflow-x-auto scrollbar-none whitespace-nowrap flex-1 mr-4 py-0.5">
        
        {/* Logo – removed "AWWWARDS –" */}
        <div 
          onClick={() => setActiveTask('image-gen')} 
          className="font-display text-base font-bold tracking-tight text-studio-text dark:text-white hover:text-studio-accent dark:hover:text-studio-accent transition-colors cursor-pointer"
        >
          VFX.STUDIO
        </div>

        <div className="flex gap-6 items-center">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTask(tool.id)}
              className={`tab-link text-xs font-display font-medium tracking-wide uppercase transition-all duration-200 shrink-0 ${
                activeTask === tool.id ? 'active' : ''
              }`}
            >
              {tool.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Dark/Gray Mode toggle button */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="btn-outline px-3.5 py-1.5 rounded-full text-xs font-display font-medium uppercase tracking-wider transition-all shrink-0 flex items-center gap-1.5 dark:border-neutral-700 dark:hover:bg-neutral-800"
          title="Toggle dark mode"
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
        
        {/* Keys button */}
        <button
          onClick={onOpenKeys}
          className="btn-outline px-4 py-1.5 rounded-full text-xs font-display font-medium uppercase tracking-wider transition-all shrink-0 flex items-center gap-1.5 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          <span>⚙</span> Keys
        </button>
      </div>
    </div>
  );
}
