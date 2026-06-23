import { create } from 'zustand';
import type { Task, GenerationRequest, GenerationResult } from '../adapters/_base';

interface SessionState {
  activeTask: Task;
  prompt: string;
  negativePrompt: string;
  aspectRatio: string;
  quality: 'draft' | 'standard' | 'ultra';
  referenceImage: Blob | null;
  maskImage: Blob | null;
  styleImage: Blob | null;
  currentResult: GenerationResult | null;
  isGenerating: boolean;
  progress: number;
  error: string | null;
  overrideProvider: string | null;

  // ArchViz Presets
  archvizCameraAngle: string;
  archvizTimeOfDay: string;
  archvizMaterialStyle: string;

  // Google Model Override
  googleModel: string;

  // Video Duration State
  _videoDuration: number;

  // Consistency Anchor
  anchorSeed: number | null;
  anchorImage: Blob | null;

  setActiveTask: (task: Task) => void;
  setPrompt: (p: string) => void;
  setNegativePrompt: (p: string) => void;
  setAspectRatio: (ar: string) => void;
  setQuality: (q: 'draft' | 'standard' | 'ultra') => void;
  setReferenceImage: (b: Blob | null) => void;
  setMaskImage: (b: Blob | null) => void;
  setStyleImage: (b: Blob | null) => void;
  setResult: (r: GenerationResult) => void;
  setGenerating: (v: boolean, progress?: number) => void;
  setError: (e: string | null) => void;
  setOverrideProvider: (p: string | null) => void;
  setArchvizCameraAngle: (v: string) => void;
  setArchvizTimeOfDay: (v: string) => void;
  setArchvizMaterialStyle: (v: string) => void;
  setGoogleModel: (v: string) => void;
  setVideoDuration: (v: number) => void;
  setAnchor: (seed: number | null, img: Blob | null) => void;
  buildRequest: () => GenerationRequest;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  activeTask: 'image-gen',
  prompt: '',
  negativePrompt: '',
  aspectRatio: '16:9',
  quality: 'standard',
  referenceImage: null,
  maskImage: null,
  styleImage: null,
  currentResult: null,
  isGenerating: false,
  progress: 0,
  error: null,
  overrideProvider: null,

  archvizCameraAngle: 'eye-level',
  archvizTimeOfDay: 'golden-hour',
  archvizMaterialStyle: 'concrete-glass',

  googleModel: 'nano-banana-2',
  _videoDuration: 8,

  anchorSeed: null,
  anchorImage: null,

  setActiveTask: (activeTask) => set({ activeTask }),
  setPrompt: (prompt) => set({ prompt }),
  setNegativePrompt: (negativePrompt) => set({ negativePrompt }),
  setAspectRatio: (aspectRatio) => set({ aspectRatio }),
  setQuality: (quality) => set({ quality }),
  setReferenceImage: (referenceImage) => set({ referenceImage }),
  setMaskImage: (maskImage) => set({ maskImage }),
  setStyleImage: (styleImage) => set({ styleImage }),
  setResult: (currentResult) => set({ currentResult }),
  setGenerating: (isGenerating, progress = 0) => set({ isGenerating, progress }),
  setError: (error) => set({ error }),
  setOverrideProvider: (overrideProvider) => set({ overrideProvider }),
  setArchvizCameraAngle: (archvizCameraAngle) => set({ archvizCameraAngle }),
  setArchvizTimeOfDay: (archvizTimeOfDay) => set({ archvizTimeOfDay }),
  setArchvizMaterialStyle: (archvizMaterialStyle) => set({ archvizMaterialStyle }),
  setGoogleModel: (googleModel) => set({ googleModel }),
  setVideoDuration: (_videoDuration) => set({ _videoDuration }),
  setAnchor: (anchorSeed, anchorImage) => set({ anchorSeed, anchorImage }),

  buildRequest: (): GenerationRequest => {
    const s = get();
    // Inject consistency anchor if present
    const seed = s.anchorSeed ?? undefined;
    const ref = s.activeTask === 'image-gen' ? (s.anchorImage ?? s.referenceImage ?? undefined) : (s.referenceImage ?? undefined);
    
    return {
      prompt: s.prompt,
      negativePrompt: s.negativePrompt || undefined,
      referenceImage: ref,
      maskImage: s.maskImage ?? undefined,
      styleImage: s.styleImage ?? undefined,
      aspectRatio: s.aspectRatio as GenerationRequest['aspectRatio'],
      quality: s.quality,
      task: s.activeTask,
      duration: s._videoDuration,
      seed,
      metadata: {
        googleModel: s.googleModel,
      },
    };
  },
}));
