import { LovableAIProvider } from './providers/LovableAIProvider';
import { FalProviderStub, ReplicateProviderStub } from './ProviderStubs';
import type { TryOnProvider } from '../domain/types';

/**
 * Registry de providers (SSOT). Para trocar o motor de IA basta
 * registrar outra implementação aqui. A camada de UI/serviço não muda.
 */
const providers = new Map<string, TryOnProvider>();
providers.set('lovable-ai', new LovableAIProvider());
providers.set('replicate', new ReplicateProviderStub());
providers.set('fal', new FalProviderStub());

export function getProvider(id: string): TryOnProvider {
  const p = providers.get(id);
  if (!p) throw new Error(`Unknown try-on provider: ${id}`);
  return p;
}

export function listProviders(): string[] {
  return [...providers.keys()];
}
