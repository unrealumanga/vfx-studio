import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
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
import ModelTournament from './modules/model-tournament/ModelTournament';
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

  const dotRef = useRef<HTMLDivElement>(null);
  const outlineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hasKeys = availableProviders().length > 0;
    if (!hasKeys) {
      setKeyVaultOpen(true);
    }
    // Initialize embedding worker for prompt autocomplete
    initPromptStore();

    // GSAP Custom Cursor Trailing Effect
    const cursorDot = dotRef.current;
    const cursorOutline = outlineRef.current;

    if (cursorDot && cursorOutline && window.matchMedia('(pointer: fine)').matches) {
      const xToDot = gsap.quickTo(cursorDot, "x", { duration: 0.08, ease: "power3" });
      const yToDot = gsap.quickTo(cursorDot, "y", { duration: 0.08, ease: "power3" });
      const xToOutline = gsap.quickTo(cursorOutline, "x", { duration: 0.25, ease: "power3" });
      const yToOutline = gsap.quickTo(cursorOutline, "y", { duration: 0.25, ease: "power3" });

      const onMouseMove = (e: MouseEvent) => {
        xToDot(e.clientX);
        yToDot(e.clientY);
        xToOutline(e.clientX);
        yToOutline(e.clientY);
      };

      window.addEventListener('mousemove', onMouseMove);
      return () => window.removeEventListener('mousemove', onMouseMove);
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
        break;
      case 'upscale':
        break;
      case 'prompt-assist':
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
      case 'model-tournament': return <ModelTournament />;
      default: return <ImageGen />;
    }
  };

  return (
    <div className="md:h-screen flex flex-col relative md:overflow-hidden text-studio-text select-none min-h-screen">
      {/* GSAP Cursor Primitives */}
      <div ref={dotRef} className="cursor-dot hidden md:block" />
      <div ref={outlineRef} className="cursor-outline hidden md:block" />

      {/* 🎭 Ambient Living backdrops */}
      <div className="ambient-container">
        <div className="ambient-orb-1" />
        <div className="ambient-orb-2" />
        <div className="ambient-orb-3" />
      </div>
      <div className="ambient-grid" />

      <div className="relative z-10 flex flex-col h-full">
        <ToolSwitcher onOpenKeys={() => setKeyVaultOpen(true)} />

        <div className="px-4 pt-3 pb-2 animate-slide-up">
          <PromptBar onGenerate={handleGenerate} />
        </div>

        <div className="flex-1 flex flex-col md:flex-row gap-4 px-4 pb-2 min-h-0">
          <div 
            className="flex-1 glass-panel rounded-lg overflow-hidden animate-slide-up h-[400px] md:h-full relative"
            style={{ animationDelay: '100ms' }}
          >
            <ResultCanvas />
          </div>
          <div 
            className="w-full md:w-56 shrink-0 glass-panel rounded-lg p-3 overflow-y-auto animate-slide-up"
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
