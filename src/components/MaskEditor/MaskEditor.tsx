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

  useEffect(() => {
    if (referenceImage) {
      const url = URL.createObjectURL(referenceImage);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImageUrl(null);
    }
  }, [referenceImage]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || !imageUrl) return;

    const imgElement = document.createElement('img');
    imgElement.src = imageUrl;
    imgElement.onload = () => {
      const initCanvas = () => {
        if (!containerRef.current || !canvasRef.current) return;

        const containerWidth = containerRef.current.clientWidth - 32; // match HTML padding assumption
        const containerHeight = containerRef.current.clientHeight - 32;

        if (containerWidth <= 0 || containerHeight <= 0) {
          requestAnimationFrame(initCanvas);
          return;
        }

        const scaleX = containerWidth / imgElement.width;
        const scaleY = containerHeight / imgElement.height;
        const scale = Math.min(scaleX, scaleY, 1) * 0.95;

        const canvasWidth = imgElement.width * scale;
        const canvasHeight = imgElement.height * scale;

        const fCanvas = new Canvas(canvasRef.current!, {
          width: canvasWidth,
          height: canvasHeight,
          isDrawingMode: tool === 'brush',
          backgroundColor: '#ffffff'
        });

        const brush = new PencilBrush(fCanvas);
        brush.color = brushMode === 'draw' ? '#000000' : '#ffffff';
        brush.width = brushSize;
        fCanvas.freeDrawingBrush = brush;

        FabricImage.fromURL(imageUrl).then((fImg) => {
          fImg.set({
            scaleX: scale,
            scaleY: scale,
            left: 0,
            top: 0,
            originX: 'left',
            originY: 'top',
            selectable: false,
            evented: false,
          });
          fCanvas.backgroundImage = fImg;
          fCanvas.renderAll();
        });

        fabricRef.current = fCanvas;
        fCanvas.calcOffset();

        fCanvas.on('path:created', () => {
          updateMask(fCanvas);
        });

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
            originX: 'left',
            originY: 'top',
            fill: brushMode === 'draw' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.8)',
            stroke: brushMode === 'draw' ? '#000000' : '#ffffff',
            strokeWidth: 1,
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

      initCanvas();
    };

    return () => {
      fabricRef.current?.dispose();
      fabricRef.current = null;
    };
  }, [imageUrl, tool]);

  useEffect(() => {
    const fCanvas = fabricRef.current;
    if (fCanvas && fCanvas.freeDrawingBrush) {
      fCanvas.freeDrawingBrush.width = brushSize;
      fCanvas.freeDrawingBrush.color = brushMode === 'draw' ? '#000000' : '#ffffff';
    }
  }, [brushSize, brushMode]);

  const updateMask = (canvasInstance: Canvas) => {
    const originalBgImage = canvasInstance.backgroundImage;
    
    canvasInstance.backgroundImage = undefined as any;
    canvasInstance.backgroundColor = '#ffffff';
    canvasInstance.renderAll();

    const dataUrl = canvasInstance.toDataURL({ format: 'png', multiplier: 1 });

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

  const btnBase = "px-3 py-1 rounded-full text-[10px] font-display font-medium uppercase tracking-wider transition-colors";

  return (
    <div ref={containerRef} className="w-full h-full relative">
      
      {/* Mask Canvas Container */}
      <div id="maskCanvasContainer" className="w-full h-full flex items-center justify-center p-4">
        <canvas ref={canvasRef} />
      </div>

      {/* Mask Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 bg-studio-bg/90 backdrop-blur-md border border-studio-border-light rounded-full py-2 px-4 shadow-sm">
        
        <div className="flex items-center gap-2">
            <span className="label">Mask</span>
            <div className="h-3 w-px bg-studio-border-light"></div>
            
            {/* Draw/Erase */}
            <div className="flex bg-studio-elevated p-0.5 rounded-full border border-studio-border-light">
                <button
                    onClick={() => setBrushMode('draw')}
                    className={`${btnBase} ${brushMode === 'draw' ? 'bg-studio-accent text-white' : 'text-studio-muted hover:text-studio-text'}`}
                >Draw</button>
                <button
                    onClick={() => setBrushMode('erase')}
                    className={`${btnBase} ${brushMode === 'erase' ? 'bg-studio-accent text-white' : 'text-studio-muted hover:text-studio-text'}`}
                >Erase</button>
            </div>
            
            {/* Brush/Rect */}
            <div className="flex bg-studio-elevated p-0.5 rounded-full border border-studio-border-light">
                <button
                    onClick={() => setTool('brush')}
                    className={`${btnBase} ${tool === 'brush' ? 'bg-studio-accent text-white' : 'text-studio-muted hover:text-studio-text'}`}
                >Brush</button>
                <button
                    onClick={() => setTool('rect')}
                    className={`${btnBase} ${tool === 'rect' ? 'bg-studio-accent text-white' : 'text-studio-muted hover:text-studio-text'}`}
                >Rect</button>
            </div>
        </div>

        <div className="flex items-center gap-2">
            {tool === 'brush' && (
              <>
                <span className="label">{brushSize}px</span>
                <input 
                    type="range" 
                    min="5" 
                    max="120" 
                    value={brushSize} 
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-20"
                />
                <div className="h-3 w-px bg-studio-border-light"></div>
              </>
            )}
            
            <button onClick={handleClearMask} className="text-[10px] font-display uppercase tracking-wider text-studio-muted hover:text-studio-text transition-colors px-2">Clear</button>
            <button 
                onClick={() => {
                    setReferenceImage(null);
                    setMaskImage(null);
                    // Stay in image-edit or switch to image-gen?
                }} 
                className="text-[10px] font-display uppercase tracking-wider text-studio-muted hover:text-studio-danger transition-colors px-2"
            >
              Exit
            </button>
        </div>

      </div>

    </div>
  );
}
