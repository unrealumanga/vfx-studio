import type { Task } from '../../adapters/_base';
import { useSessionStore } from '../../store/session.store';

const TOOLS: { id: Task; label: string }[] = [
  { id: 'image-gen', label: 'Generate' },
  { id: 'image-edit', label: 'Inpaint & Edit' },
  { id: 'video-gen', label: 'Motion & Video' },
  { id: 'vfx-compose', label: 'VFX Composer' },
  { id: 'archviz', label: 'ArchViz' },
  { id: 'upscale', label: '↑Scale & Detail' },
  { id: 'prompt-assist', label: 'Prompt Assist' },
];

interface ToolSwitcherProps {
  onOpenKeys: () => void;
}

export default function ToolSwitcher({ onOpenKeys }: ToolSwitcherProps) {
  const { activeTask, setActiveTask } = useSessionStore();

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-studio-border-light shrink-0 w-full overflow-hidden select-none">
      <div className="flex items-center gap-10 overflow-x-auto scrollbar-none whitespace-nowrap flex-1 mr-4 py-0.5">
        
        {/* Brand/Logo - Clean and Bold (Non-glitch) */}
        <div 
          onClick={() => setActiveTask('image-gen')} 
          className="font-display text-base font-bold tracking-tight text-studio-text hover:text-studio-accent transition-colors"
        >
          AWWWARDS — VFX.STUDIO
        </div>

        {/* Minimal Underlined Navigation Tabs */}
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

      {/* Settings / Keys Action Button */}
      <button
        onClick={onOpenKeys}
        className="btn-outline px-4 py-1.5 rounded-full text-xs font-display font-medium uppercase tracking-wider transition-all shrink-0 flex items-center gap-1.5"
        title="API Key Configuration"
      >
        <span>⚙</span> Settings
      </button>
    </div>
  );
}
