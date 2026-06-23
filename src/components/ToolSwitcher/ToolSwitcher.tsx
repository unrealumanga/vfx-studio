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
    <div className="flex items-center justify-between px-4 py-2 bg-studio-surface border-b border-studio-border">
      <div className="flex items-center gap-1">
        <span className="text-studio-accent font-display font-bold text-sm mr-3">◈ VFX Studio</span>
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTask(tool.id)}
            className={`px-3 py-1.5 rounded text-xs font-medium font-display transition-colors ${
              activeTask === tool.id
                ? 'bg-studio-accent text-white'
                : 'text-studio-muted hover:text-studio-text hover:bg-studio-border'
            }`}
          >
            {tool.label}
          </button>
        ))}
      </div>
      <button
        onClick={onOpenKeys}
        className="text-studio-muted hover:text-studio-text text-xs font-medium px-2 py-1 rounded hover:bg-studio-border transition-colors"
        title="API Key Settings"
      >
        ⚙ Keys
      </button>
    </div>
  );
}
