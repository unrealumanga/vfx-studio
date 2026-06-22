import { pickAdapter } from '../../utils/router';
import { useKeysStore } from '../../store/keys.store';
import { useSessionStore } from '../../store/session.store';
import { useHistoryStore } from '../../store/history.store';

export async function editImage() {
  const session = useSessionStore.getState();
  const keys = useKeysStore.getState().keys;
  const { addEntry } = useHistoryStore.getState();

  session.setError(null);
  session.setGenerating(true);

  try {
    const { adapter, apiKey } = pickAdapter(
      'image-edit',
      keys,
      session.overrideProvider
    );

    const req = session.buildRequest();
    const result = await adapter.generate(req, apiKey);

    session.setResult(result);
    await addEntry(session.prompt, result, 'image-edit');
  } catch (e) {
    session.setError((e as Error).message);
  } finally {
    session.setGenerating(false);
  }
}
