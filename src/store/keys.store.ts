import { create } from 'zustand';
import { encrypt, decrypt } from '../utils/crypto';

export type ProviderKey =
  | 'google'
  | 'openai'
  | 'anthropic'
  | 'replicate'
  | 'fal'
  | 'runway';

interface KeysState {
  keys: Partial<Record<ProviderKey, string>>;
  passphrase: string | null;

  setPassphrase: (p: string) => void;
  setKey: (provider: ProviderKey, key: string) => void;
  removeKey: (provider: ProviderKey) => void;
  loadFromStorage: (passphrase: string) => Promise<void>;
  getKey: (provider: ProviderKey) => string | undefined;
  hasKey: (provider: ProviderKey) => boolean;
  availableProviders: () => ProviderKey[];
}

const STORAGE_KEY = 'vfx-studio:keys-v1';

export const useKeysStore = create<KeysState>((set, get) => ({
  keys: {},
  passphrase: null,

  setPassphrase: (p) => set({ passphrase: p }),

  setKey: async (provider, key) => {
    const { passphrase, keys } = get();
    if (!passphrase) throw new Error('No passphrase set — cannot save key');

    const updated = { ...keys, [provider]: key };
    set({ keys: updated });

    const encrypted = await encrypt(JSON.stringify(updated), passphrase);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(encrypted));
  },

  removeKey: async (provider) => {
    const { passphrase, keys } = get();
    if (!passphrase) return;

    const updated = { ...keys };
    delete updated[provider];
    set({ keys: updated });

    const encrypted = await encrypt(JSON.stringify(updated), passphrase);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(encrypted));
  },

  loadFromStorage: async (passphrase) => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      set({ passphrase, keys: {} });
      return;
    }
    try {
      const encrypted = JSON.parse(raw);
      const decrypted = await decrypt(encrypted, passphrase);
      const keys = JSON.parse(decrypted) as Partial<Record<ProviderKey, string>>;
      set({ passphrase, keys });
    } catch {
      throw new Error('Invalid passphrase — could not decrypt keys');
    }
  },

  getKey: (provider) => get().keys[provider],
  hasKey: (provider) => !!get().keys[provider],
  availableProviders: () =>
    Object.entries(get().keys)
      .filter(([, v]) => !!v)
      .map(([k]) => k as ProviderKey),
}));
