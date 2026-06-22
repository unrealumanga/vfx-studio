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
import { generateImage } from './modules/image-gen/imageGen.service';
import { editImage } from './modules/image-edit/imageEdit.service';
import { generateVideo } from './modules/video-gen/videoGen.service';
import { generateVfx } from './modules/vfx-compose/vfxCompose.service';
import { generateArchViz } from './modules/archviz/archviz.service';
import { upscaleImage } from './modules/upscale/upscale.service';
import { assistPrompt } from './modules/prompt-assist/promptAssist.service';

function App() {
  const [keyVaultOpen, setKeyVaultOpen] = useState(false);
  const { activeTask } = useSessionStore();
  const { availableProviders } = useKeysStore();

  useEffect(() => {
    const hasKeys = availableProviders().length > 0;
    if (!hasKeys) {
      setKeyVaultOpen(true);
    }
  }, []);

  const handleGenerate = () => {
    switch (activeTask) {
      case 'image-gen':
        generateImage();
        break;
      case 'image-edit':
        editImage();
        break;
      case 'video-gen':
        generateVideo();
        break;
      case 'vfx-compose':
        generateVfx();
        break;
      case 'archviz':
        generateArchViz();
        break;
      case 'upscale':
        upscaleImage();
        break;
      case 'prompt-assist':
        assistPrompt();
        break;
    }
  };

  const renderModuleControls = () => {
    switch (activeTask) {
      case 'image-gen': return <ImageGen />;
      case 'image-edit': return <ImageEdit />;
      case 'video-gen': return <VideoGen />;
      case 'vfx-compose': return <VfxCompose />;
      case 'archviz': return <ArchViz />;
      case 'upscale': return <Upscale />;
      case 'prompt-assist': return <PromptAssist />;
      default: return <ImageGen />;
    }
  };

  return (
    <div className="h-screen flex flex-col relative overflow-hidden text-studio-text select-none">
      {/* 🎭 Ambient Living backdrops */}
      <div className="ambient-container">
        <div className="ambient-orb-1" />
        <div className="ambient-orb-2" />
        <div className="ambient-orb-3" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <ToolSwitcher onOpenKeys={() => setKeyVaultOpen(true)} />

        <div className="px-4 pt-3 pb-2 animate-slide-up">
          <PromptBar onGenerate={handleGenerate} />
        </div>

        <div className="flex-1 flex gap-4 px-4 pb-2 min-h-0">
          <div 
            className="flex-1 glass-panel rounded-lg overflow-hidden animate-slide-up"
            style={{ animationDelay: '100ms' }}
          >
            <ResultCanvas />
          </div>
          <div 
            className="w-56 shrink-0 glass-panel rounded-lg p-3 overflow-y-auto animate-slide-up"
            style={{ animationDelay: '200ms' }}
          >
            {renderModuleControls()}
          </div>
        </div>

        <div className="animate-slide-up" style={{ animationDelay: '300ms' }}>
          <HistoryStrip />
        </div>
      </div>

      <KeyVault open={keyVaultOpen} onClose={() => setKeyVaultOpen(false)} />
    </div>
  );
}

export default App;
