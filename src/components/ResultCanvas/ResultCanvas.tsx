import { useRef, useState } from 'react';
import { useSessionStore } from '../../store/session.store';
import { blobToUrl } from '../../utils/blobUtils';
import MaskEditor from '../MaskEditor/MaskEditor';
import { upscaleImage } from '../../modules/upscale/upscale.service';

async function downloadResult(
  blob: Blob | undefined,
  url: string | undefined,
  filename: string
) {
  if (blob) {
    const objectUrl = URL.createObjectURL(blob);
    triggerDownload(objectUrl, filename);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
    return;
  }
  if (url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('fetch failed');
      const fetchedBlob = await res.blob();
      const objectUrl = URL.createObjectURL(fetchedBlob);
      triggerDownload(objectUrl, filename);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
    } catch {
      window.open(url, '_blank');
    }
  }
}

function triggerDownload(href: string, filename: string) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export default function ResultCanvas() {
  const { activeTask, currentResult, isGenerating, referenceImage, setReferenceImage, setActiveTask } =
    useSessionStore();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [showUpscaleOptions, setShowUpscaleOptions] = useState(false);
  const [upscaleFactor, setUpscaleFactor] = useState(2);
  const [isUpscalingInline, setIsUpscalingInline] = useState(false);

  if (activeTask === 'image-edit' && referenceImage) {
    return (
      <div className="w-full h-full flex flex-col relative bg-studio-bg overflow-hidden">
        <MaskEditor />
      </div>
    );
  }

  if (isGenerating || isUpscalingInline) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-studio-bg/60 backdrop-blur-sm z-20">
          <div className="spinner mb-4"></div>
          <p className="label animate-pulse">{isUpscalingInline ? 'Upscaling' : 'Rendering'}</p>
      </div>
    );
  }

  if (!currentResult) {
    return (
      <div id="emptyState" className="text-center p-8 animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-studio-elevated border border-studio-border-light flex items-center justify-center">
              <svg className="w-6 h-6 text-studio-muted" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
              </svg>
          </div>
          <p className="text-studio-muted text-sm max-w-xs mx-auto leading-relaxed">
              Describe what you want to create.<br/>Your result will appear here.
          </p>
      </div>
    );
  }

  const imageUrl = currentResult.blob
    ? blobToUrl(currentResult.blob)
    : currentResult.type === 'image'
    ? currentResult.url
    : undefined;

  const isVideo = currentResult.type === 'video';
  const timestamp = Date.now();

  const handleDownload = () => {
    const ext = isVideo ? 'mp4' : 'png';
    downloadResult(
      currentResult.blob,
      currentResult.url,
      `vfx-studio-${timestamp}.${ext}`
    );
  };

  const handleUseAsReference = async () => {
    if (currentResult.blob) {
      setReferenceImage(currentResult.blob);
    } else if (currentResult.url) {
      try {
        const res = await fetch(currentResult.url);
        const blob = await res.blob();
        setReferenceImage(blob);
      } catch {
        console.error('Could not load result as reference image');
        return;
      }
    }
    setActiveTask('image-edit');
  };

  const handleSendToVideo = async () => {
    if (currentResult.blob) {
      setReferenceImage(currentResult.blob);
    } else if (currentResult.url && currentResult.type === 'image') {
      try {
        const res = await fetch(currentResult.url);
        const blob = await res.blob();
        setReferenceImage(blob);
      } catch {
        console.error('Could not send result to video module');
        return;
      }
    }
    setActiveTask('video-gen');
  };

  const handleQuickUpscale = async () => {
    if (!currentResult) return;
    setIsUpscalingInline(true);
    setShowUpscaleOptions(false);

    try {
      let blob = currentResult.blob;
      if (!blob && currentResult.url) {
        const res = await fetch(currentResult.url);
        blob = await res.blob();
      }
      if (blob) {
        await upscaleImage(blob, upscaleFactor);
      }
    } catch (e) {
      console.error("Inline quick-upscaling failed:", e);
    } finally {
      setIsUpscalingInline(false);
    }
  };

  if (isVideo) {
    return (
      <div id="resultVideoContainer" className="w-full h-full p-4 flex items-center justify-center group relative">
        {currentResult.blob ? (
          <video
            ref={videoRef}
            src={URL.createObjectURL(currentResult.blob)}
            controls
            autoPlay
            loop
            muted
            playsInline
            className="max-w-full max-h-[70vh] rounded-lg shadow-sm border border-studio-border-light"
          />
        ) : (
          <div className="text-center">
            <p className="text-studio-muted mb-4">Video generated. Please download to view.</p>
            <button onClick={handleDownload} className="aw-btn px-6 py-2 rounded-xl">⬇ Download Video</button>
          </div>
        )}
        
        {/* Action pills hover */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="flex gap-2 pointer-events-auto bg-studio-bg/90 backdrop-blur-md p-1.5 rounded-full shadow-md border border-studio-border">
                <button onClick={handleDownload} className="aw-pill text-xs py-1.5 px-3">⬇ Save</button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div id="resultContainer" className="w-full h-full p-4 flex items-center justify-center animate-fade-in relative group">
      {imageUrl && (
        <div className="img-reveal rounded-lg overflow-hidden max-w-full max-h-full shadow-sm border border-studio-border-light">
          <img
            id="resultImage"
            src={imageUrl}
            alt="Result"
            className="max-w-full max-h-[70vh] object-contain block"
          />
        </div>
      )}

      {/* Floating Action Pills overlay */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="flex gap-2 pointer-events-auto bg-studio-bg/90 backdrop-blur-md p-1.5 rounded-full shadow-md border border-studio-border">
          <button onClick={handleDownload} className="aw-pill text-xs py-1.5 px-3">⬇ Save</button>
          <button onClick={handleUseAsReference} className="aw-pill text-xs py-1.5 px-3">✂ Edit</button>
          <button onClick={handleSendToVideo} className="aw-pill text-xs py-1.5 px-3">▶ Animate</button>
          <button onClick={() => setShowUpscaleOptions(true)} className="aw-pill text-xs py-1.5 px-3">✦ Upscale</button>
        </div>
      </div>

      {/* Pop-over Resolution Picker Overlay matching HTML */}
      {showUpscaleOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center font-body">
            <div className="modal-overlay absolute inset-0" onClick={() => setShowUpscaleOptions(false)}></div>
            <div className="absolute inset-x-4 top-[15%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[400px] bg-studio-bg border border-studio-border-light rounded-2xl shadow-2xl p-6 animate-fade-in z-10 text-studio-text">
                <h3 className="font-display font-semibold text-lg mb-1">Upscale Resolution</h3>
                <p className="text-studio-muted text-sm mb-6">Select output scale multiplier</p>
                <div className="flex gap-3 mb-6">
                    {[2, 3, 4].map(f => (
                        <button
                            key={f}
                            onClick={() => setUpscaleFactor(f)}
                            className={`upscale-option flex-1 py-4 border rounded-xl text-center transition-colors ${upscaleFactor === f ? 'border-studio-text bg-studio-elevated' : 'border-studio-border-light hover:border-studio-text'}`}
                        >
                            <span className="font-display font-semibold text-lg">{f}×</span>
                            <span className="block text-xs text-studio-muted mt-1">{f === 2 ? 'Standard' : f === 3 ? 'High' : 'Ultra'}</span>
                        </button>
                    ))}
                </div>
                <div className="flex gap-3">
                    <button onClick={handleQuickUpscale} className="aw-btn flex-1 py-3 rounded-xl text-sm">Upscale</button>
                    <button onClick={() => setShowUpscaleOptions(false)} className="aw-btn-outline flex-1 py-3 rounded-xl text-sm">Cancel</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
