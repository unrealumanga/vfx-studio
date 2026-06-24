import { useRef, useEffect, useState } from 'react';
import { useSessionStore } from '../../store/session.store';
import { Canvas, Image as FabricImage, PencilBrush, Rect } from 'fabric';

export default function MaskEditor() {
  const { referenceImage, setMaskImage, setReferenceImage } = useSessionStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  
  const [brushSize, setBrushSize] = useState(25);
  const [brushMode, setBrushMode] = useState<'draw' | 'erase'>('draw');
  const [tool, setTool] = useState<'brush' | 'rect'>('brush');
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
      const scale = Math.min(scaleX, scaleY, 1) * 0.95;

      const canvasWidth = imgElement.width * scale;
      const canvasHeight = imgElement.height * scale;

      const fCanvas = new Canvas(canvasRef.current!, {
        width: canvasWidth,
        height: canvasHeight,
        isDrawingMode: tool === 'brush', // enable drawing mode ONLY for brush tool
      });

      // Set up the brush
      const brush = new PencilBrush(fCanvas);
      // Visible mask styling: black stroke draws over white canvas, eraser uses white to overwrite
      brush.color = brushMode === 'draw' ? '#000000' : '#ffffff';
      brush.width = brushSize;
      fCanvas.freeDrawingBrush = brush;

      // Load reference image as non-selectable static background layer
      FabricImage.fromURL(imageUrl).then((fImg) => {
        fImg.scale(scale);
        fCanvas.backgroundImage = fImg;
        fCanvas.renderAll();
        fImg.selectable = false;
        fImg.evented = false;
      });

      fabricRef.current = fCanvas;

      // Sync mask updates dynamically on stroke completion
      fCanvas.on('path:created', () => {
        updateMask(fCanvas);
      });

      // Handle custom rectangular selection tool dragging
      let rect: Rect | null = null;
      let isDragging = false;
      let startX = 0;
      let startY = 0;

      fCanvas.on('mouse:down', (opt) => {
        if (tool !== 'rect' || !opt.scenePoint) return;
        isDragging = true;
        startX = opt.scenePoint.x;
        startY = opt.scenePoint.y;

        rect = new Rect({
          left: startX,
          top: startY,
          width: 0,
          height: 0,
          // Semi-transparent overlay with dotted marching-ants border
          fill: brushMode === 'draw' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.8)',
          stroke: brushMode === 'draw' ? '#000000' : '#ffffff',
          strokeWidth: 1.5,
          strokeDashArray: [4, 4],
          selectable: false,
          evented: false,
        });

        fCanvas.add(rect);
        fCanvas.renderAll();
      });

      fCanvas.on('mouse:move', (opt) => {
        if (!isDragging || !rect || !opt.scenePoint) return;
        
        const currentX = opt.scenePoint.x;
        const currentY = opt.scenePoint.y;

        rect.set({
          width: Math.abs(currentX - startX),
          height: Math.abs(currentY - startY),
          left: Math.min(startX, currentX),
          top: Math.min(startY, currentY),
        });

        fCanvas.renderAll();
      });

      fCanvas.on('mouse:up', () => {
        if (!isDragging) return;
        isDragging = false;
        if (rect) {
          // Flatten rect style on draw end
          rect.set({
            strokeDashArray: undefined,
            fill: brushMode === 'draw' ? '#000000' : '#ffffff',
            stroke: brushMode === 'draw' ? '#000000' : '#ffffff',
          });
          rect = null;
        }
        fCanvas.renderAll();
        updateMask(fCanvas);
      });
    };

    return () => {
      fabricRef.current?.dispose();
      fabricRef.current = null;
    };
  }, [imageUrl, tool]);

  // Sync brush changes dynamically when state dependencies update
  useEffect(() => {
    const fCanvas = fabricRef.current;
    if (fCanvas && fCanvas.freeDrawingBrush) {
      fCanvas.freeDrawingBrush.width = brushSize;
      fCanvas.freeDrawingBrush.color = brushMode === 'draw' ? '#000000' : '#ffffff';
    }
  }, [brushSize, brushMode]);

  // Generate clean, high-precision binary mask image
  const updateMask = (canvasInstance: Canvas) => {
    const originalBgImage = canvasInstance.backgroundImage;
    
    // Hide visual background layer and set white canvas backdrop to isolate black mask strokes
    canvasInstance.backgroundImage = undefined as any;
    canvasInstance.backgroundColor = '#ffffff';
    canvasInstance.renderAll();

    const dataUrl = canvasInstance.toDataURL({ format: 'png', multiplier: 1 });

    // Restore background layers instantly
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
    <div ref={containerRef} className="w-full h-full flex flex-col justify-center items-center relative p-6 select-none bg-neutral-950 dark:bg-neutral-900">
      
      {/* ── Toolbar Brush Controls Overlaid atop Canvas ── */}
      <div className="absolute top-4 left-4 right-4 z-40 flex flex-wrap items-center justify-between gap-3 bg-neutral-900/90 dark:bg-neutral-800/90 backdrop-blur-md border border-neutral-800 dark:border-neutral-700 rounded-full py-2 px-5 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">// Masking workspace</span>
          <div className="h-4 w-px bg-neutral-800 dark:bg-neutral-700" />
          
          {/* Draw/Erase toggle */}
          <div className="flex bg-neutral-950 dark:bg-neutral-900 p-1 rounded-full border border-neutral-800 dark:border-neutral-700">
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

          <div className="h-4 w-px bg-neutral-800 dark:bg-neutral-700" />

          {/* Brush/Rectangle Tool select toggle */}
          <div className="flex bg-neutral-950 dark:bg-neutral-900 p-1 rounded-full border border-neutral-800 dark:border-neutral-700">
            <button
              onClick={() => setTool('brush')}
              className={`px-3 py-1 rounded-full text-[10px] font-display font-medium uppercase tracking-wider transition-colors ${
                tool === 'brush' ? 'bg-studio-accent text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Brush
            </button>
            <button
              onClick={() => setTool('rect')}
              className={`px-3 py-1 rounded-full text-[10px] font-display font-medium uppercase tracking-wider transition-colors ${
                tool === 'rect' ? 'bg-studio-accent text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Rect
            </button>
          </div>
        </div>

        {/* Brush Size Slider */}
        <div className="flex items-center gap-3">
          {tool === 'brush' && (
            <>
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Size: {brushSize}px</span>
              <input
                type="range"
                min="5"
                max="120"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-24 accent-studio-accent h-1 bg-neutral-800 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="h-4 w-px bg-neutral-800 dark:bg-neutral-700" />
            </>
          )}
          
          {/* Actions */}
          <button
            onClick={handleClearMask}
            className="px-3 py-1 border border-neutral-800 dark:border-neutral-700 hover:border-neutral-500 rounded-full text-[10px] text-neutral-300 font-display font-medium uppercase tracking-wider transition-colors"
          >
            Clear
          </button>
          
          <button
            onClick={() => {
              setReferenceImage(null);
              setMaskImage(null);
            }}
            className="px-3 py-1 bg-neutral-800 dark:bg-neutral-700 hover:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-200 rounded-full text-[10px] font-display font-medium uppercase tracking-wider transition-colors"
          >
            Exit
          </button>
        </div>
      </div>

      {/* ── Visual Drawing Canvas Area ── */}
      <div className="mask-canvas-container flex items-center justify-center pointer-events-auto">
        <canvas ref={canvasRef} />
      </div>

      {/* ── Info footer help ── */}
      <div className="absolute bottom-4 left-4 pointer-events-none">
        <p className="text-[10px] font-mono text-neutral-500">
          * Mask strokes are drawn in visible dark ink and saved dynamically. Press Generate below to render edits.
        </p>
      </div>
    </div>
  );
}
