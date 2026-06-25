import { useState, useEffect } from 'react';
import type { Task } from './adapters/_base';
import ToolSwitcher from './components/ToolSwitcher/ToolSwitcher';
import PromptBar from './components/PromptBar/PromptBar';
import ResultCanvas from './components/ResultCanvas/ResultCanvas';
import HistoryStrip from './components/HistoryStrip/HistoryStrip';
import KeyVault from './components/KeyVault/KeyVault';
import ImageGen from './modules/image-gen/ImageGen';
import ImageEdit from './modules/image-edit/ImageEdit';
import VideoGen from './modules/video-gen/VideoGen';
import VfxCompose from './modules/vfx-compose/VfxCompose';
import ArchViz from './modules/archviz/ArchViz';
import Upscale from './modules/upscale/Upscale';
import PromptAssist from './modules/prompt-assist/PromptAssist';
import { useSessionStore } from './store/session.store';
import { useKeysStore } from './store/keys.store';
import { usePromptStore } from './store/prompt.store';
import { generateImage } from './modules/image-gen/imageGen.service';
import { editImage } from './modules/image-edit/imageEdit.service';
import { generateVideo } from './modules/video-gen/videoGen.service';
import { generateVfx } from './modules/vfx-compose/vfxCompose.service';

const TOOL_CONFIG: Record<Task, { label: string; title: string }> = {
  'image-gen': { label: '// Image Generation', title: 'Create' },
  'image-edit': { label: '// Image Editing', title: 'Refine' },
  'video-gen': { label: '// Video Generation', title: 'Animate' },
  'vfx-compose': { label: '// VFX Composition', title: 'Compose' },
  'archviz': { label: '// Architectural Visualization', title: 'Build' },
  'upscale': { label: '// Image Upscaling', title: 'Enhance' },
  'prompt-assist': { label: '// Prompt Assistant', title: 'Refine' },
  'style-transfer': { label: '// Style Transfer', title: 'Transfer' },
};

function App() {
  const [keyVaultOpen, setKeyVaultOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { activeTask, setActiveTask } = useSessionStore();
  const { availableProviders } = useKeysStore();
  const initPromptStore = usePromptStore(s => s.init);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  useEffect(() => {
    const hasKeys = availableProviders().length > 0;
    if (!hasKeys) setKeyVaultOpen(true);
    initPromptStore();
  }, []);

  const handleGenerate = () => {
    switch (activeTask) {
      case 'image-gen':    generateImage(); break;
      case 'image-edit':   editImage(); break;
      case 'video-gen':    generateVideo(); break;
      case 'vfx-compose':  generateVfx(); break;
      case 'archviz':      break;
    }
  };

  const renderModuleControls = () => {
    switch (activeTask) {
      case 'image-gen':     return <ImageGen />;
      case 'image-edit':    return <ImageEdit />;
      case 'video-gen':     return <VideoGen />;
      case 'vfx-compose':   return <VfxCompose />;
      case 'archviz':       return <ArchViz />;
      case 'upscale':       return <Upscale />;
      case 'prompt-assist': return <PromptAssist />;
      default:              return <ImageGen />;
    }
  };

  return (
    <div id="app" className="flex flex-col min-h-screen bg-studio-bg text-studio-text overflow-x-hidden font-body">
      {/* Header */}
      <ToolSwitcher 
        onOpenKeys={() => setKeyVaultOpen(true)} 
        onToggleMobileNav={() => setMobileNavOpen(!mobileNavOpen)} 
      />

      {/* Mobile Navigation Sheet */}
      {mobileNavOpen && (
        <div id="mobileNav" className="fixed inset-0 z-50">
            <div className="modal-overlay absolute inset-0" onClick={() => setMobileNavOpen(false)}></div>
            <div className="absolute top-14 left-0 right-0 bg-studio-bg border-b border-studio-border-light p-6 animate-fade-in">
                <div className="flex flex-col gap-1">
                    {(['image-gen', 'image-edit', 'video-gen', 'vfx-compose', 'archviz', 'upscale', 'prompt-assist'] as Task[]).map((tool) => (
                      <button 
                        key={tool}
                        onClick={() => { setActiveTask(tool); setMobileNavOpen(false); }}
                        className={`aw-tab text-left px-3 py-3 text-base ${activeTask === tool ? 'active' : ''}`}
                      >
                        {TOOL_CONFIG[tool].title}
                      </button>
                    ))}
                </div>
                <div className="mt-6 pt-6 border-t border-studio-border-light">
                    <button onClick={() => { setKeyVaultOpen(true); setMobileNavOpen(false); }} className="aw-btn-outline w-full py-3 rounded-full text-sm">Configure API Keys</button>
                </div>
            </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 pt-14 pb-[140px] md:pb-[100px] flex flex-col md:flex-row md:h-screen md:overflow-hidden relative z-10">
        
        {/* Left: Workspace / Canvas */}
        <section className="flex-1 flex flex-col min-h-0 relative">
          
          {/* Tool Title Bar */}
          <div className="px-6 pt-6 pb-2 flex items-end justify-between shrink-0">
            <div>
                <p className="label mb-1" id="toolLabel">{TOOL_CONFIG[activeTask].label}</p>
                <h1 className="display-lg text-2xl md:text-3xl" id="toolTitle">{TOOL_CONFIG[activeTask].title}</h1>
            </div>
          </div>

          {/* Canvas / Result Area */}
          <div className="flex-1 min-h-[300px] px-6 pb-4 overflow-y-auto scrollbar-none flex flex-col">
            <ResultCanvas />
          </div>

          {/* History Strip */}
          <div className="px-6 pb-4 shrink-0">
            <HistoryStrip />
          </div>

        </section>

        {/* Right: Parameters Panel */}
        <aside 
          className={`w-full shrink-0 border-t md:border-t-0 md:border-l border-studio-border-light bg-studio-bg md:bg-transparent overflow-y-auto scrollbar-none transition-all duration-300 ${panelCollapsed ? 'md:w-16 h-12 md:h-full' : 'md:w-80 lg:w-96'}`}
        >
          <div className={`p-6 md:p-6 md:pt-20 ${panelCollapsed ? 'md:px-2' : ''}`}>
            
            {/* Collapse toggle (desktop) */}
            <div className="hidden md:flex items-center justify-between mb-6">
                <span className={`label ${panelCollapsed ? 'hidden' : ''}`}>Parameters</span>
                <button onClick={() => setPanelCollapsed(!panelCollapsed)} className="text-studio-muted hover:text-studio-text transition-colors p-1 mx-auto" title="Toggle Panel">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ transform: panelCollapsed ? 'rotate(180deg)' : 'none' }}>
                        <polyline points="15 18 9 12 15 6"/>
                    </svg>
                </button>
            </div>

            <div id="toolControls" className={`space-y-6 animate-fade-in ${panelCollapsed ? 'hidden' : ''}`}>
                {renderModuleControls()}
            </div>

            {panelCollapsed && (
              <div 
                onClick={() => setPanelCollapsed(false)}
                className="hidden md:flex flex-1 flex-col items-center justify-center gap-1 mt-10 cursor-pointer text-studio-faded hover:text-studio-accent transition-colors"
              >
                <div className="text-xs tracking-widest font-mono uppercase [writing-mode:vertical-lr] select-none opacity-50">
                  Controls
                </div>
              </div>
            )}
          </div>
        </aside>

      </main>

      {/* Bottom Prompt Bar */}
      <PromptBar onGenerate={handleGenerate} />

      {/* Modals */}
      <KeyVault open={keyVaultOpen} onClose={() => setKeyVaultOpen(false)} />
    </div>
  );
}

export default App;
