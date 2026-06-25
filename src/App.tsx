import { useState, useEffect } from 'react';
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

function App() {
  const [keyVaultOpen, setKeyVaultOpen] = useState(false);
  const { activeTask } = useSessionStore();
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
    <div className="flex flex-col md:h-screen bg-studio-bg text-studio-text md:overflow-hidden select-none font-body min-h-screen">
      {/* 1. Header Navigation */}
      <ToolSwitcher onOpenKeys={() => setKeyVaultOpen(true)} />

      {/* 2. Main Centered Workspace Area */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 p-6 md:min-h-0 md:overflow-hidden">
        {/* Left/Main Column: Result Display or Canvas masking */}
        <div className="flex-1 flat-panel rounded-xl overflow-hidden relative flex flex-col min-h-0 bg-studio-surface border border-studio-border">
          <ResultCanvas />
        </div>

        {/* Right Column: Parameters Panel (Collapsible) */}
        <div className={`w-full shrink-0 transition-all duration-300 md:h-full flex flex-col ${panelCollapsed ? 'md:w-16 h-12 md:h-full' : 'md:w-64'}`}>
          <div className="flex-1 flat-panel rounded-xl p-4 overflow-y-auto bg-studio-surface border border-studio-border flex flex-col gap-4">
            
            {/* Header control with collapse toggle */}
            <div className="flex items-center justify-between border-b border-studio-border-light pb-2 shrink-0">
              <h3 className={`font-display font-semibold text-xs tracking-wider text-studio-muted uppercase ${panelCollapsed ? 'hidden' : ''}`}>
                // Parameters
              </h3>
              <button
                onClick={() => setPanelCollapsed(!panelCollapsed)}
                className="text-studio-muted hover:text-studio-accent font-mono text-sm leading-none p-1 hover:bg-studio-border rounded transition-colors"
                title={panelCollapsed ? "Expand side controls" : "Collapse side controls"}
              >
                {panelCollapsed ? '▸' : '◂'}
              </button>
            </div>
            
            {/* Controls body */}
            <div className={`flex-1 min-h-0 ${panelCollapsed ? 'hidden' : 'flex flex-col'}`}>
              {renderModuleControls()}
            </div>
            
            {/* Collapsed placeholder indicator */}
            {panelCollapsed && (
              <div 
                onClick={() => setPanelCollapsed(false)}
                className="hidden md:flex flex-1 flex-col items-center justify-center gap-1 cursor-pointer text-studio-faded hover:text-studio-accent transition-colors"
                title="Expand side controls"
              >
                <div className="text-xs tracking-widest font-mono uppercase [writing-mode:vertical-lr] select-none opacity-50">
                  Settings
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* 3. History timeline strip */}
      <div className="px-6 pb-2">
        <HistoryStrip />
      </div>

      {/* 4. Bottom fixed/centered Prompt Input Bar */}
      <div className="px-6 pb-6 pt-2 w-full max-w-4xl mx-auto shrink-0">
        <PromptBar onGenerate={handleGenerate} />
      </div>

      {/* 5. Key Decryption Settings Panel */}
      <KeyVault open={keyVaultOpen} onClose={() => setKeyVaultOpen(false)} />
    </div>
  );
}

export default App;
