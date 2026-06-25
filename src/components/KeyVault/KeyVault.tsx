import { useState, useEffect } from 'react';
import { useKeysStore, type ProviderKey } from '../../store/keys.store';

const PROVIDER_LABELS: Record<ProviderKey, string> = {
  google: 'Google (Gemini / Video)',
  openai: 'OpenAI / DALL-E',
  anthropic: 'Anthropic (Claude)',
  replicate: 'Replicate',
  fal: 'Fal.ai',
  runway: 'Runway ML',
};

interface KeyVaultProps {
  open: boolean;
  onClose: () => void;
}

export default function KeyVault({ open, onClose }: KeyVaultProps) {
  const { keys, passphrase, setPassphrase, setKey, removeKey, loadFromStorage } = useKeysStore();
  const [localPassphrase, setLocalPassphrase] = useState('');
  const [newKeys, setNewKeys] = useState<Partial<Record<ProviderKey, string>>>({});
  const [phase, setPhase] = useState<'unlock' | 'manage'>('unlock');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setPhase(passphrase ? 'manage' : 'unlock');
      setNewKeys({});
      setError('');
    }
  }, [open, passphrase]);

  const handleUnlock = async () => {
    if (!localPassphrase.trim()) return;
    setError('');
    try {
      await loadFromStorage(localPassphrase);
      setPassphrase(localPassphrase);
      setPhase('manage');
    } catch {
      setError('Invalid passphrase or corrupt data. Try again.');
    }
  };

  const handleSaveKey = async (provider: ProviderKey) => {
    const key = newKeys[provider];
    if (!key?.trim()) return;
    setError('');
    try {
      await setKey(provider, key.trim());
      setNewKeys((prev) => ({ ...prev, [provider]: '' }));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleRemoveKey = async (provider: ProviderKey) => {
    await removeKey(provider);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-body">
      <div className="modal-overlay absolute inset-0" onClick={onClose}></div>
      <div className="absolute inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[480px] bg-studio-bg border border-studio-border-light rounded-2xl shadow-2xl p-6 md:p-8 animate-fade-in max-h-[80vh] overflow-y-auto z-10">
        
        <div className="flex items-center justify-between mb-8">
            <div>
                <h2 className="font-display font-semibold text-xl tracking-tight">Key Vault</h2>
                <p className="text-studio-muted text-sm mt-1">Securely stored in your browser</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-studio-elevated rounded-full transition-colors">
                <svg className="w-5 h-5 text-studio-muted" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>

        {phase === 'unlock' && (
          <div className="space-y-5">
            <div>
                <label className="label block mb-2">Master Passphrase</label>
                <input
                    type="password"
                    value={localPassphrase}
                    onChange={(e) => setLocalPassphrase(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                    placeholder="Enter to encrypt/decrypt keys"
                    className="aw-input w-full px-4 py-3 rounded-xl"
                    autoFocus
                />
            </div>
            {error && <p className="text-studio-danger text-xs font-mono px-1">{error}</p>}
            <div className="mt-8">
                <button onClick={handleUnlock} className="aw-btn w-full py-3 rounded-xl text-sm font-medium">Unlock Vault</button>
            </div>
          </div>
        )}

        {phase === 'manage' && (
          <div className="space-y-5">
            {error && <p className="text-studio-danger text-xs font-mono">{error}</p>}
            
            <div className="space-y-4">
              {(Object.keys(PROVIDER_LABELS) as ProviderKey[]).map((provider) => (
                <div key={provider}>
                    <div className="flex items-center justify-between mb-2">
                        <label className="label block">{PROVIDER_LABELS[provider]}</label>
                        {keys[provider] && (
                            <button onClick={() => handleRemoveKey(provider)} className="text-[10px] text-studio-danger hover:underline uppercase tracking-wider font-mono">Remove</button>
                        )}
                    </div>
                    {keys[provider] ? (
                        <div className="aw-input w-full px-4 py-3 rounded-xl flex items-center justify-between bg-studio-surface opacity-70">
                            <span className="text-sm font-mono text-studio-muted">••••••••••••••••</span>
                            <span className="text-studio-success text-xs font-medium">Saved</span>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <input
                                type="password"
                                value={newKeys[provider] ?? ''}
                                onChange={(e) => setNewKeys((prev) => ({ ...prev, [provider]: e.target.value }))}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveKey(provider)}
                                placeholder="Paste API key..."
                                className="key-input aw-input flex-1 px-4 py-3 rounded-xl"
                            />
                            <button onClick={() => handleSaveKey(provider)} className="aw-btn px-4 rounded-xl text-sm">Save</button>
                        </div>
                    )}
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
