import { pickAdapter } from '../../utils/router';
import { useKeysStore } from '../../store/keys.store';
import { useSessionStore } from '../../store/session.store';

export async function assistPrompt() {
  const session = useSessionStore.getState();
  const keys = useKeysStore.getState().keys;

  session.setError(null);

  try {
    const { adapter, apiKey } = pickAdapter(
      'prompt-assist',
      keys,
      session.overrideProvider
    );

    const req = session.buildRequest();
    const result = await adapter.generate(req, apiKey);
    const refined = result.metadata?.refinedPrompt as string;

    if (refined) {
      session.setPrompt(refined);
    }
  } catch (e) {
    session.setError((e as Error).message);
  }
}
