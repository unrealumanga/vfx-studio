import { useRef, useEffect, useState } from 'react';
import { useSessionStore } from '../../store/session.store';
import ModelBadge from '../../components/ModelBadge/ModelBadge';
import { pickAdapter } from '../../utils/router';
import { useKeysStore } from '../../store/keys.store';
import { Canvas, Image as FabricImage, PencilBrush } from 'fabric';

export default function ImageEdit() {
  const { referenceImage, setReferenceImage, setMaskImage, overrideProvider } = useSessionStore();
  const keys = useKeysStore((s) => s.keys);
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const [fabricCanvas, setFabricCanvas] = useState<Canvas | null>(null);
  const [brushSize, setBrushSize] = useState(20);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  let resolved: string | null = null;
  try {
    const r = pickAdapter('image-edit', keys, overrideProvider);
    resolved = r.provider;
  } catch {
    resolved = null;
  }

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
    if (!canvasRef.current || !imageUrl) return;

    const imgElement = document.createElement('img');
    imgElement.src = imageUrl;
    imgElement.onload = () => {
      const containerWidth = canvasRef.current?.parentElement?.clientWidth ?? 512;
      const maxWidth = Math.min(512, containerWidth);
      const scale = maxWidth / imgElement.width;
      const canvasWidth = maxWidth;
      const canvasHeight = imgElement.height * scale;

      const fCanvas = new Canvas(canvasRef.current!, {
        width: canvasWidth,
        height: canvasHeight,
        isDrawingMode: true,
      });

      const brush = new PencilBrush(fCanvas);
      brush.color = '#ffffff';
      brush.width = brushSize;
      fCanvas.freeDrawingBrush = brush;

      FabricImage.fromURL(imageUrl).then((fImg) => {
        fImg.scale(scale);
        fCanvas.backgroundImage = fImg;
        fCanvas.renderAll();
      });

      fabricRef.current = fCanvas;
      setFabricCanvas(fCanvas);

      fCanvas.on('path:created', () => {
        updateMask(fCanvas);
      });
    };

    return () => {
      fabricRef.current?.dispose();
      fabricRef.current = null;
    };
  }, [imageUrl]);

  useEffect(() => {
    if (fabricCanvas && fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.width = brushSize;
    }
  }, [brushSize, fabricCanvas]);

  const updateMask = (canvasInstance: Canvas) => {
    const originalBgImage = canvasInstance.backgroundImage;
    
    canvasInstance.backgroundImage = undefined as any;
    canvasInstance.backgroundColor = '#000000';
    canvasInstance.renderAll();

    const dataUrl = canvasInstance.toDataURL({ format: 'png', multiplier: 1 });

    canvasInstance.backgroundImage = originalBgImage;
    canvasInstance.backgroundColor = '';
    canvasInstance.renderAll();

    fetch(dataUrl)
      .then((res) => res.blob())
      .then((blob) => setMaskImage(blob));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setReferenceImage(file);
  };

  const handleClearMask = () => {
    if (fabricCanvas) {
      fabricCanvas.clear();
      if (imageUrl) {
        FabricImage.fromURL(imageUrl).then((fImg) => {
          const containerWidth = canvasRef.current?.parentElement?.clientWidth ?? 512;
          const maxWidth = Math.min(512, containerWidth);
          const scale = maxWidth / fImg.width!;
          fImg.scale(scale);
          fabricCanvas.backgroundImage = fImg;
          fabricCanvas.renderAll();
          setMaskImage(null);
        });
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ModelBadge currentProvider={resolved} />
      </div>

      <div>
        <label className="text-studio-muted text-xs font-mono block mb-1">Reference Image</label>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full bg-studio-bg border border-studio-border rounded px-3 py-2 text-xs text-studio-muted font-mono hover:text-studio-text transition-colors text-left"
        >
          {referenceImage ? '✓ Image loaded' : 'Click to upload image...'}
        </button>
      </div>

      {imageUrl && (
        <div className="space-y-2">
          <label className="text-studio-muted text-xs font-mono block">Draw Mask (White brush)</label>
          <div className="border border-studio-border rounded bg-black/50 p-1 flex justify-center">
            <canvas ref={canvasRef} />
          </div>

          <div className="flex items-center justify-between gap-2">
            <label className="text-studio-muted text-xs font-mono">Brush Size</label>
            <input
              type="range"
              min="5"
              max="100"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-24 accent-studio-accent"
            />
          </div>

          <button
            onClick={handleClearMask}
            className="w-full text-xs text-studio-danger bg-studio-bg border border-studio-border hover:border-studio-danger rounded py-1.5 font-mono transition-colors"
          >
            Clear Mask
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => {
            const session = useSessionStore.getState();
            const result = session.currentResult;
            if (result?.blob) {
              setReferenceImage(result.blob);
            }
          }}
          className="w-full text-xs text-studio-muted hover:text-studio-text bg-studio-bg border border-studio-border rounded py-1.5 font-mono transition-colors"
        >
          ↻ Use current result
        </button>
      </div>
    </div>
  );
}
