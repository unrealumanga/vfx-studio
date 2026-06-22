export type Task =
  | 'image-gen'
  | 'image-edit'
  | 'video-gen'
  | 'vfx-compose'
  | 'archviz'
  | 'upscale'
  | 'style-transfer'
  | 'prompt-assist';

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:2' | '21:9';
export type Quality = 'draft' | 'standard' | 'ultra';
export type OutputType = 'image' | 'video';

export interface GenerationRequest {
  prompt: string;
  negativePrompt?: string;
  referenceImage?: Blob;
  maskImage?: Blob;
  styleImage?: Blob;
  aspectRatio?: AspectRatio;
  width?: number;
  height?: number;
  duration?: number;
  fps?: number;
  quality?: Quality;
  seed?: number;
  steps?: number;
  guidanceScale?: number;
  style?: string;
  cameraMotion?: string;
  task: Task;
}

export interface GenerationResult {
  type: OutputType;
  url?: string;
  blob?: Blob;
  thumbnailBlob?: Blob;
  seed?: number;
  model: string;
  provider: string;
  durationMs: number;
  width?: number;
  height?: number;
  metadata?: Record<string, unknown>;
}

export interface AdapterCapabilities {
  tasks: Task[];
  maxImageWidth: number;
  maxImageHeight: number;
  supportsVideo: boolean;
  supportsInpainting: boolean;
  supportsStyleTransfer: boolean;
  supportsStreaming: boolean;
  typicalLatencyMs: number;
}

export interface BaseAdapter {
  readonly provider: string;
  readonly displayName: string;
  readonly capabilities: AdapterCapabilities;

  generate(req: GenerationRequest, apiKey: string): Promise<GenerationResult>;

  generateWithProgress?(
    req: GenerationRequest,
    apiKey: string,
    onProgress: (progress: number, previewBlob?: Blob) => void
  ): Promise<GenerationResult>;

  validateKey?(apiKey: string): Promise<boolean>;
}
