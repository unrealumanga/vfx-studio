import { useRef, useEffect, useState } from 'react';
import { useSessionStore } from '../../store/session.store';
import { Canvas, Image as FabricImage, PencilBrush } from 'fabric';

export default function MaskEditor() {
  const { referenceImage, setMaskImage, setReferenceImage } = useSessionStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  
  const [brushSize, setBrushSize] = useState(25);
  const [brushMode, setBrushMode] = useState<'draw' | 'erase'>('draw');
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Load reference image blob as local object URL
  useEffect(() => {
    if (referenceImage) {
      const url = URL.createObjectURL(referenceImage);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImageUrl(null);
    }
  }, [referenceImage]);

  // Initialize fabric drawing canvas over image background
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || !imageUrl) return;

    const imgElement = document.createElement('img');
    imgElement.src = imageUrl;
    imgElement.onload = () => {
      if (!containerRef.current || !canvasRef.current) return;

      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;

      // Fit image proportionally within container
      const scaleX = containerWidth / imgElement.width;
      const scaleY = containerHeight / imgElement.height;
      const scale = Math.min(scaleX, scaleY, 1) * 0.95; // 5% padding padding

      const canvasWidth = imgElement.width * scale;
      const canvasHeight = imgElement.height * scale;

      const fCanvas = new Canvas(canvasRef.current!, {
        width: canvasWidth,
        height: canvasHeight,
        isDrawingMode: true,
      });

      const brush = new PencilBrush(fCanvas);
      brush.color = brushMode === 'draw' ? '#ffffff' : '#000000';
      brush.width = brushSize;
      fCanvas.freeDrawingBrush = brush;

      FabricImage.fromURL(imageUrl).then((fImg) => {
        fImg.scale(scale);
        fCanvas.backgroundImage = fImg;
        fCanvas.renderAll();
      });

      fabricRef.current = fCanvas;

      // Sync mask updates back to Zustand store dynamically
      fCanvas.on('path:created', () => {
        updateMask(fCanvas);
      });
    };

    return () => {
      fabricRef.current?.dispose();
      fabricRef.current = null;
    };
  }, [imageUrl]);

  // Sync brush changes dynamically
  useEffect(() => {
    const fCanvas = fabricRef.current;
    if (fCanvas && fCanvas.freeDrawingBrush) {
      fCanvas.freeDrawingBrush.width = brushSize;
      fCanvas.freeDrawingBrush.color = brushMode === 'draw' ? '#ffffff' : '#000000';
    }
  }, [brushSize, brushMode]);

  // Generate black and white mask image
  const updateMask = (canvasInstance: Canvas) => {
    const originalBgImage = canvasInstance.backgroundImage;
    
    // Hide visual background, force solid black to isolate drawn mask strokes
    canvasInstance.backgroundImage = undefined as any;
    canvasInstance.backgroundColor = '#000000';
    canvasInstance.renderAll();

    const dataUrl = canvasInstance.toDataURL({ format: 'png', multiplier: 1 });

    // Restore background reference immediately
    canvasInstance.backgroundImage = originalBgImage;
    canvasInstance.backgroundColor = '';
    canvasInstance.renderAll();

    fetch(dataUrl)
      .then((res) => res.blob())
      .then((blob) => setMaskImage(blob));
  };

  const handleClearMask = () => {
    const fCanvas = fabricRef.current;
    if (fCanvas && imageUrl) {
      fCanvas.clear();
      FabricImage.fromURL(imageUrl).then((fImg) => {
        if (!containerRef.current) return;
        const scaleX = containerRef.current.clientWidth / fImg.width!;
        const scaleY = containerRef.current.clientHeight / fImg.height!;
        const scale = Math.min(scaleX, scaleY, 1) * 0.95;
        fImg.scale(scale);
        fCanvas.backgroundImage = fImg;
        fCanvas.renderAll();
        setMaskImage(null);
      });
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col justify-center items-center relative p-6 select-none bg-neutral-950">
      
      {/* 1. Header Brush Controls Overlaid atop Canvas */}
      <div className="absolute top-4 left-4 right-4 z-40 flex flex-wrap items-center justify-between gap-3 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-full py-2 px-5 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">// Masking workspace</span>
          <div className="h-4 w-px bg-neutral-800" />
          
          {/* Draw/Erase toggle */}
          <div className="flex bg-neutral-950 p-1 rounded-full border border-neutral-800/80">
            <button
              onClick={() => setBrushMode('draw')}
              className={`px-3 py-1 rounded-full text-[10px] font-display font-medium uppercase tracking-wider transition-colors ${
                brushMode === 'draw' ? 'bg-studio-accent text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Draw
            </button>
            <button
              onClick={() => setBrushMode('erase')}
              className={`px-3 py-1 rounded-full text-[10px] font-display font-medium uppercase tracking-wider transition-colors ${
                brushMode === 'erase' ? 'bg-studio-accent text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Erase
            </button>
          </div>
        </div>

        {/* Brush Size Slider */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Size: {brushSize}px</span>
          <input
            type="range"
            min="5"
            max="120"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-24 accent-studio-accent h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
          />
          
          <div className="h-4 w-px bg-neutral-800" />
          
          {/* Actions */}
          <button
            onClick={handleClearMask}
            className="px-3 py-1 border border-neutral-800 hover:border-neutral-500 rounded-full text-[10px] text-neutral-300 font-display font-medium uppercase tracking-wider transition-colors"
          >
            Clear
          </button>
          <button
            onClick={() => {
              setReferenceImage(null);
              setMaskImage(null);
            }}
            className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-full text-[10px] font-display font-medium uppercase tracking-wider transition-colors"
          >
            Exit Workspace
          </button>
        </div>
      </div>

      {/* 2. Visual Drawing Canvas Area */}
      <div className="mask-canvas-container flex items-center justify-center pointer-events-auto">
        <canvas ref={canvasRef} />
      </div>

      {/* 3. Help Overlay */}
      <div className="absolute bottom-4 left-4 pointer-events-none">
        <p className="text-[10px] font-mono text-neutral-500">
          * Strokes are saved automatically. Press Generate below when finished.
        </p>
      </div>
    </div>
  );
}
