import { useState } from 'react';
import type { Task } from '../../adapters/_base';
import { useSessionStore } from '../../store/session.store';

const TOOLS: { id: Task; label: string }[] = [
  { id: 'image-gen', label: 'Gen' },
  { id: 'image-edit', label: 'Edit' },
  { id: 'video-gen', label: 'Video' },
  { id: 'vfx-compose', label: 'VFX' },
  { id: 'archviz', label: 'ArchViz' },
  { id: 'upscale', label: '↑Scale' },
  { id: 'prompt-assist', label: 'Prompt' },
];

interface ToolSwitcherProps {
  onOpenKeys: () => void;
}

function scrambleText(targetText: string, onUpdate: (val: string) => void) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+{}|:"<>?';
  let iterations = 0;
  const interval = setInterval(() => {
    onUpdate(
      targetText
        .split('')
        .map((char, index) => {
          if (index < iterations) return targetText[index];
          if (char === ' ') return ' ';
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join('')
    );
    if (iterations >= targetText.length) clearInterval(interval);
    iterations += 1 / 3;
  }, 30);
}

export default function ToolSwitcher({ onOpenKeys }: ToolSwitcherProps) {
  const { activeTask, setActiveTask } = useSessionStore();

  return (
    <div className="flex items-center justify-between px-4 py-2 glass-panel border-b border-studio-border/30 shrink-0 w-full overflow-hidden select-none">
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none whitespace-nowrap flex-1 mr-4 py-0.5">
        <div className="glitch-container mr-4 shrink-0">
          <span
            className="glitch-text text-studio-accent font-display font-bold text-sm tracking-wider cursor-pointer"
            data-text="VFX.STUDIO"
          >
            VFX.STUDIO
          </span>
        </div>

        <div className="flex gap-1">
          {TOOLS.map((tool) => {
            const [label, setLabel] = useState(tool.label);
            return (
              <button
                key={tool.id}
                onMouseEnter={() => scrambleText(tool.label, setLabel)}
                onClick={() => setActiveTask(tool.id)}
                className={`px-3 py-1.5 rounded text-xs font-mono transition-all duration-200 shrink-0 interactive-btn ${
                  activeTask === tool.id
                    ? 'bg-studio-accent text-black shadow-[0_2px_10px_rgba(0,243,255,0.3)]'
                    : 'text-studio-muted hover:text-studio-text hover:bg-studio-border'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
      <button
        onClick={onOpenKeys}
        className="text-studio-muted hover:text-studio-text text-xs font-mono px-2 py-1 rounded hover:bg-studio-border transition-colors shrink-0"
        title="API Key Settings"
      >
        ⚙ Keys
      </button>
    </div>
  );
}
