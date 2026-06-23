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
  { id: 'model-tournament', label: '⚔️ Tourney' },
];

interface ToolSwitcherProps {
  onOpenKeys: () => void;
}

export default function ToolSwitcher({ onOpenKeys }: ToolSwitcherProps) {
  const { activeTask, setActiveTask } = useSessionStore();

  return (
    <div className="flex items-center justify-between px-4 py-2 glass-panel border-b border-studio-border/30 shrink-0 w-full overflow-hidden select-none">
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none whitespace-nowrap flex-1 mr-4 py-0.5">
        <span className="text-studio-accent font-display font-bold text-sm mr-4 shrink-0">◈ VFX Studio</span>
        <div className="flex gap-1">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTask(tool.id)}
              className={`px-3 py-1.5 rounded text-xs font-medium font-display transition-all duration-200 shrink-0 interactive-btn ${
                activeTask === tool.id
                  ? 'bg-studio-accent text-white shadow-[0_2px_10px_rgba(136,206,2,0.3)]'
                  : 'text-studio-muted hover:text-studio-text hover:bg-studio-border'
              }`}
            >
              {tool.label}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={onOpenKeys}
        className="text-studio-muted hover:text-studio-text text-xs font-medium px-3 py-1.5 rounded hover:bg-studio-border transition-all duration-200 shrink-0 interactive-btn glass-panel border border-studio-border/30"
        title="API Key Settings"
      >
        ⚙ Keys
      </button>
    </div>
  );
}
