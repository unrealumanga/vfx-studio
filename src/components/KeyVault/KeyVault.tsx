import { useState, useEffect } from 'react';
import { useKeysStore, type ProviderKey } from '../../store/keys.store';

const PROVIDER_LABELS: Record<ProviderKey, string> = {
  google: 'Google AI Studio (Imagen 3, Veo 2)',
  openai: 'OpenAI (DALL·E 3, GPT-4o)',
  anthropic: 'Anthropic (Claude)',
  replicate: 'Replicate (Flux, ESRGAN)',
  fal: 'Fal.ai',
  runway: 'RunwayML',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="glass-panel rounded-lg w-full max-w-lg p-6 animate-slide-up shadow-[0_0_50px_rgba(124,109,255,0.15)]">
        <div className="flex items-center justify-between mb-4 border-b border-studio-border pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-studio-accent animate-pulse shadow-[0_0_8px_#7c6dff]" />
            <h2 className="text-lg font-display font-bold text-studio-text tracking-wide">
              {phase === 'unlock' ? 'Unlock Key Vault' : 'API Key Management'}
            </h2>
          </div>
          <button onClick={onClose} className="text-studio-muted hover:text-studio-text text-xl leading-none transition-colors">&times;</button>
        </div>

        {phase === 'unlock' && (
          <div className="space-y-4">
            <p className="text-studio-muted text-xs font-mono leading-relaxed">
              Enter your secret passphrase to decrypt stored API keys. 
              First time? Enter a new passphrase to initialize your local browser vault.
            </p>
            <input
              type="password"
              value={localPassphrase}
              onChange={(e) => setLocalPassphrase(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              placeholder="Enter passphrase..."
              className="w-full bg-black/40 border border-studio-border rounded px-3 py-2 text-studio-text font-mono text-sm outline-none focus:border-studio-accent focus:shadow-[0_0_15px_rgba(124,109,255,0.25)] transition-all mb-1"
              autoFocus
            />
            {error && <p className="text-studio-danger text-xs font-mono">{error}</p>}
            <button
              onClick={handleUnlock}
              className="interactive-btn w-full bg-studio-accent hover:bg-studio-accent-dim text-white rounded-full py-2 font-display font-bold text-sm tracking-wide transition-all shadow-[0_4px_15px_rgba(124,109,255,0.3)]"
            >
              Unlock Vault
            </button>
          </div>
        )}

        {phase === 'manage' && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {error && <p className="text-studio-danger text-sm">{error}</p>}
            {(Object.keys(PROVIDER_LABELS) as ProviderKey[]).map((provider) => (
              <div key={provider} className="bg-studio-bg rounded p-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-studio-text text-sm font-medium">{PROVIDER_LABELS[provider]}</label>
                  {keys[provider] && (
                    <button
                      onClick={() => handleRemoveKey(provider)}
                      className="text-studio-danger text-xs hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {keys[provider] ? (
                  <p className="text-studio-success text-xs font-mono">✓ Key configured</p>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={newKeys[provider] ?? ''}
                      onChange={(e) => setNewKeys((prev) => ({ ...prev, [provider]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveKey(provider)}
                      placeholder={`Paste ${provider} API key...`}
                      className="flex-1 bg-studio-surface border border-studio-border rounded px-2 py-1.5 text-studio-text font-mono text-xs outline-none focus:border-studio-accent"
                    />
                    <button
                      onClick={() => handleSaveKey(provider)}
                      className="bg-studio-accent hover:bg-studio-accent-dim text-white px-3 rounded text-xs font-medium transition-colors"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            ))}
            <p className="text-studio-muted text-xs mt-2">
              Keys are encrypted with AES-256-GCM and stored in your browser's localStorage.
              They are never sent to any server.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
