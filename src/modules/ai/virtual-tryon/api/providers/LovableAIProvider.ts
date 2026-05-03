import type { TryOnProvider, TryOnProviderRequest, TryOnProviderResult } from '../domain/types';

/**
 * LovableAIProvider — usa o gateway Lovable AI (Gemini image) via edge function.
 * O cliente NÃO chama o gateway diretamente; isto é apenas o contrato.
 * A implementação real fica na edge function `tryon-generate`.
 */
export class LovableAIProvider implements TryOnProvider {
  readonly id = 'lovable-ai';
  // Provider abstrato; a chamada concreta é feita pela edge function.
  async generate(_req: TryOnProviderRequest): Promise<TryOnProviderResult> {
    throw new Error('LovableAIProvider.generate must be invoked via edge function');
  }
}
