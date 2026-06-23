import { useState } from 'react';
import { useSessionStore } from '../../store/session.store';
import { useKeysStore } from '../../store/keys.store';
import { googleAdapter } from '../../adapters/google';
import { openaiAdapter } from '../../adapters/openai';
import { replicateAdapter } from '../../adapters/replicate';
import type { GenerationResult } from '../../adapters/_base';
import { blobToUrl } from '../../utils/blobUtils';

export default function ModelTournament() {
  const { prompt, buildRequest, setGenerating, setError, setAnchor } = useSessionStore();
  const keys = useKeysStore(s => s.keys);
  
  const [results, setResults] = useState<Record<string, GenerationResult>>({});
  const [loading, setLoading] = useState(false);

  const handleTournament = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setResults({});
    setError(null);
    setGenerating(true);

    const req = buildRequest();
    
    const providers = [
      { name: 'google', adapter: googleAdapter, key: keys['google'] },
      { name: 'openai', adapter: openaiAdapter, key: keys['openai'] },
      { name: 'replicate', adapter: replicateAdapter, key: keys['replicate'] },
    ];

    const promises = providers.map(async (p) => {
      if (!p.key) return null;
      try {
        const res = await p.adapter.generate(req, p.key);
        setResults(prev => ({ ...prev, [p.name]: res }));
        return res;
      } catch (e) {
        console.error(`Tournament failed for ${p.name}`, e);
        return null;
      }
    });

    await Promise.allSettled(promises);
    setLoading(false);
    setGenerating(false);
  };

  const handleSetAnchor = (provider: string) => {
    const res = results[provider];
    if (res && res.blob) {
      setAnchor(res.seed || 1337, res.blob);
      alert(`Consistency Anchor Set to ${provider}`);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-studio-muted text-xs font-mono">
        Fires multiple models simultaneously. Pick the winner to set as the Consistency Anchor.
      </p>

      <button
        onClick={handleTournament}
        disabled={loading || !prompt.trim()}
        className="interactive-btn w-full bg-studio-gold hover:bg-yellow-500 text-studio-bg font-display font-medium text-sm py-2 rounded-full transition-colors shadow-[0_4px_15px_rgba(245,200,66,0.3)]"
      >
        {loading ? 'Battling...' : 'Start Tournament'}
      </button>

      {Object.keys(results).length > 0 && (
        <div className="space-y-4 mt-4">
          {Object.entries(results).map(([provider, res]) => (
            <div key={provider} className="glass-panel p-2 rounded-lg border border-studio-border relative group">
              <span className="absolute top-1 left-2 text-[10px] text-white bg-black/50 px-2 py-0.5 rounded backdrop-blur-md uppercase tracking-wide">
                {provider}
              </span>
              {res.blob ? (
                <img src={blobToUrl(res.blob)} className="w-full h-auto rounded" alt={provider} />
              ) : res.url ? (
                <img src={res.url} className="w-full h-auto rounded" alt={provider} />
              ) : null}
              <button
                onClick={() => handleSetAnchor(provider)}
                className="mt-2 w-full text-[10px] py-1 bg-studio-accent/20 hover:bg-studio-accent text-white rounded transition-colors"
              >
                Set as Consistency Anchor
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
