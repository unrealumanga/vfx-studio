import { useState, useEffect } from 'react';
import { useKeysStore, type ProviderKey } from '../../store/keys.store';

const PROVIDER_LABELS: Record<ProviderKey, string> = {
  google: 'Google AI Studio (Gemini, Veo 2)',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-studio-border rounded-xl w-full max-w-lg p-6 animate-slide-up shadow-xl">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-5 border-b border-studio-border-light pb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-studio-accent animate-pulse shadow-[0_0_8px_rgba(232,64,64,0.3)]" />
            <h2 className="text-sm font-display font-semibold uppercase tracking-wider text-studio-text">
              {phase === 'unlock' ? 'Unlock Decryption Key' : 'API Key Management'}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-studio-faded hover:text-studio-text text-xl leading-none transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Phase 1: Unlock / Passphrase Input */}
        {phase === 'unlock' && (
          <div className="space-y-4">
            <p className="text-studio-muted text-xs leading-relaxed font-body">
              Enter your master passphrase to securely decrypt your credentials locally. 
              If this is your first session, choose a new passphrase to initialize your secure browser vault.
            </p>
            <input
              type="password"
              value={localPassphrase}
              onChange={(e) => setLocalPassphrase(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              placeholder="Master passphrase..."
              className="w-full bg-studio-surface border border-studio-border rounded-lg px-3 py-2 text-studio-text font-mono text-sm outline-none focus:border-studio-accent transition-all mb-1"
              autoFocus
            />
            {error && <p className="text-studio-danger text-xs font-mono">{error}</p>}
            <button
              onClick={handleUnlock}
              className="w-full btn-primary rounded-lg py-2.5 text-xs uppercase tracking-wider font-semibold shadow-md"
            >
              Unlock Key Vault
            </button>
          </div>
        )}

        {/* Phase 2: Decrypted Keys Management */}
        {phase === 'manage' && (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            {error && <p className="text-studio-danger text-xs font-mono">{error}</p>}
            {(Object.keys(PROVIDER_LABELS) as ProviderKey[]).map((provider) => (
              <div key={provider} className="bg-studio-surface border border-studio-border-light rounded-lg p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-studio-text text-xs font-display font-semibold uppercase tracking-wide">
                    {PROVIDER_LABELS[provider]}
                  </label>
                  {keys[provider] && (
                    <button
                      onClick={() => handleRemoveKey(provider)}
                      className="text-studio-accent text-xs font-medium hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </div>
                
                {keys[provider] ? (
                  <p className="text-studio-success text-xs font-mono">✓ Decrypted successfully from local storage</p>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={newKeys[provider] ?? ''}
                      onChange={(e) => setNewKeys((prev) => ({ ...prev, [provider]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveKey(provider)}
                      placeholder={`Paste ${provider} API key here...`}
                      className="flex-1 bg-white border border-studio-border rounded-lg px-3 py-1.5 text-studio-text font-mono text-xs outline-none focus:border-studio-accent"
                    />
                    <button
                      onClick={() => handleSaveKey(provider)}
                      className="btn-primary px-4 py-1.5 rounded-lg text-xs font-medium"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            ))}
            <p className="text-studio-faded text-[10px] leading-relaxed mt-4 font-mono">
              * Keys are encrypted locally using AES-256-GCM prior to storage. Credentials never contact external servers or middleware trackers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
