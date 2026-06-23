import { pipeline, env } from '@xenova/transformers';

// Disable local models, fetch from HF
env.allowLocalModels = false;

class PipelineSingleton {
  static task = 'feature-extraction';
  static model = 'Xenova/all-MiniLM-L6-v2';
  static instance: any = null;

  static async getInstance(progress_callback?: Function) {
    if (this.instance === null) {
      this.instance = pipeline(this.task as any, this.model, { progress_callback });
    }
    return this.instance;
  }
}

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
  const { type, text, id } = event.data;

  if (type === 'embed') {
    try {
      const extractor = await PipelineSingleton.getInstance((x: any) => {
        self.postMessage({ type: 'progress', data: x });
      });

      const output = await extractor(text, { pooling: 'mean', normalize: true });
      const embedding = Array.from(output.data);

      self.postMessage({
        type: 'result',
        id,
        embedding,
        text
      });
    } catch (error: any) {
      self.postMessage({
        type: 'error',
        id,
        error: error.message
      });
    }
  }
});
