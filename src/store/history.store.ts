import { create } from 'zustand';
import { openDB, type IDBPDatabase } from 'idb';
import type { GenerationResult } from '../adapters/_base';

interface HistoryEntry {
  id: number;
  prompt: string;
  result: GenerationResult;
  timestamp: number;
  task: string;
}

interface HistoryState {
  entries: HistoryEntry[];
  db: IDBPDatabase | null;

  init: () => Promise<void>;
  addEntry: (prompt: string, result: GenerationResult, task: string) => Promise<void>;
  loadEntries: () => Promise<void>;
  clearHistory: () => Promise<void>;
}

const DB_NAME = 'vfx-studio-history';
const DB_VERSION = 1;
const STORE_NAME = 'history';

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('timestamp', 'timestamp');
      }
    },
  });
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  entries: [],
  db: null,

  init: async () => {
    const db = await getDB();
    set({ db });
    await get().loadEntries();
  },

  addEntry: async (prompt, result, task) => {
    const { db } = get();
    if (!db) return;

    // For video: don't persist the blob (too large). Store URL or placeholder.
    const storableResult: GenerationResult = result.type === 'video'
      ? { ...result, blob: undefined }   // strip blob for storage
      : result;

    const entry: Omit<HistoryEntry, 'id'> = {
      prompt,
      result: storableResult,
      timestamp: Date.now(),
      task,
    };

    const id = await db.add(STORE_NAME, entry);
    // For in-memory list, keep the original result with blob intact
    const memoryEntry: HistoryEntry = { ...entry, id: id as number, result };
    set((s) => ({ entries: [memoryEntry, ...s.entries].slice(0, 50) }));
  },

  loadEntries: async () => {
    const { db } = get();
    if (!db) return;

    const entries = await db.getAllFromIndex(STORE_NAME, 'timestamp');
    const sorted = (entries as HistoryEntry[]).reverse().slice(0, 50);
    set({ entries: sorted });
  },

  clearHistory: async () => {
    const { db } = get();
    if (!db) return;
    await db.clear(STORE_NAME);
    set({ entries: [] });
  },
}));
