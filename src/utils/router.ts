import type { Task } from '../adapters/_base';
import type { ProviderKey } from '../store/keys.store';
import { googleAdapter } from '../adapters/google';
import { openaiAdapter } from '../adapters/openai';
import { anthropicAdapter } from '../adapters/anthropic';
import { replicateAdapter } from '../adapters/replicate';
import type { BaseAdapter } from '../adapters/_base';

const ADAPTERS: Record<string, BaseAdapter> = {
  google: googleAdapter,
  openai: openaiAdapter,
  anthropic: anthropicAdapter,
  replicate: replicateAdapter,
};

const TASK_PRIORITY: Record<Task, ProviderKey[]> = {
  'image-gen':      ['google', 'openai', 'replicate', 'fal'],
  'image-edit':     ['openai', 'google', 'replicate'],
  'video-gen':      ['google', 'runway', 'fal'],
  'vfx-compose':    ['runway', 'fal', 'replicate'],
  'archviz':        ['google', 'replicate', 'fal'],
  'upscale':        ['google', 'replicate', 'fal'],
  'style-transfer': ['replicate', 'google', 'fal'],
  'prompt-assist':  ['anthropic', 'openai', 'google'],
};

export interface RouterResult {
  adapter: BaseAdapter;
  provider: ProviderKey;
  apiKey: string;
}

export function pickAdapter(
  task: Task,
  availableKeys: Partial<Record<ProviderKey, string>>,
  overrideProvider?: string | null
): RouterResult {
  if (overrideProvider && availableKeys[overrideProvider as ProviderKey]) {
    const adapter = ADAPTERS[overrideProvider];
    if (!adapter) throw new Error(`Unknown provider: ${overrideProvider}`);
    return {
      adapter,
      provider: overrideProvider as ProviderKey,
      apiKey: availableKeys[overrideProvider as ProviderKey]!,
    };
  }

  const priority = TASK_PRIORITY[task];
  for (const provider of priority) {
    const key = availableKeys[provider];
    if (key && ADAPTERS[provider]) {
      return { adapter: ADAPTERS[provider], provider, apiKey: key };
    }
  }

  const needed = TASK_PRIORITY[task].join(', ');
  throw new Error(
    `No API key available for task "${task}". Add one of: ${needed} in Settings.`
  );
}
