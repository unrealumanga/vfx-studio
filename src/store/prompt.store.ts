import { create } from 'zustand';
import { openDB, type IDBPDatabase } from 'idb';

interface PromptEntry {
  id: number;
  text: string;
  embedding: number[];
}

interface PromptState {
  db: IDBPDatabase | null;
  isReady: boolean;
  isIndexing: boolean;
  progress: number;
  worker: Worker | null;
  
  init: () => Promise<void>;
  search: (query: string, topK?: number) => Promise<string[]>;
}

const DB_NAME = 'vfx-studio-prompts';
const DB_VERSION = 1;
const STORE_NAME = 'prompts';

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
      }
    },
  });
}

function cosineSimilarity(a: number[], b: number[]) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export const usePromptStore = create<PromptState>((set, get) => ({
  db: null,
  isReady: false,
  isIndexing: false,
  progress: 0,
  worker: null,

  init: async () => {
    if (get().worker) return; // Already initialized

    const db = await getDB();
    set({ db });

    const worker = new Worker(new URL('../workers/embedding.worker.ts', import.meta.url), {
      type: 'module',
    });

    set({ worker });

    const count = await db.count(STORE_NAME);
    if (count === 0) {
      set({ isIndexing: true });
      // Fetch prompts from public directory
      try {
        const res = await fetch('/vfx-studio/prompts.json');
        if (res.ok) {
          const prompts: string[] = await res.json();
          let processed = 0;
          
          worker.onmessage = async (e) => {
            if (e.data.type === 'result') {
              await db.add(STORE_NAME, {
                text: e.data.text,
                embedding: e.data.embedding,
              });
              processed++;
              set({ progress: processed / prompts.length });
              if (processed === prompts.length) {
                set({ isIndexing: false, isReady: true });
                // Reset worker onmessage for search
                worker.onmessage = null;
              }
            }
          };

          for (let i = 0; i < prompts.length; i++) {
            worker.postMessage({ type: 'embed', text: prompts[i], id: i });
          }
        } else {
          set({ isIndexing: false, isReady: true });
        }
      } catch (e) {
        console.error("Failed to load initial prompts", e);
        set({ isIndexing: false, isReady: true });
      }
    } else {
      set({ isReady: true });
    }
  },

  search: async (query: string, topK = 5): Promise<string[]> => {
    const { worker, db, isReady } = get();
    if (!worker || !db || !isReady || !query.trim()) return [];

    try {
      const queryEmbedding = await new Promise<number[]>((resolve, reject) => {
        const id = `search_${Date.now()}`;
        const handler = (e: MessageEvent) => {
          if (e.data.id === id) {
            worker.removeEventListener('message', handler);
            if (e.data.type === 'result') resolve(e.data.embedding);
            else reject(new Error(e.data.error || 'Embedding failed'));
          }
        };
        worker.addEventListener('message', handler);
        worker.postMessage({ type: 'embed', text: query, id });
      });

      const allEntries: PromptEntry[] = await db.getAll(STORE_NAME);
      const scored = allEntries
        .map(entry => ({
          text: entry.text,
          score: cosineSimilarity(queryEmbedding, entry.embedding)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

      return scored.map(s => s.text);
    } catch (error) {
      console.error("Autocomplete search error:", error);
      return [];
    }
  }
}));
