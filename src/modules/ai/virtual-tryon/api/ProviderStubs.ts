import type { TryOnProvider, TryOnProviderRequest, TryOnProviderResult } from '../domain/types';

/** Stubs preparados para futuras implementações — apenas declaram o contrato. */
export class ReplicateProviderStub implements TryOnProvider {
  readonly id = 'replicate';
  async generate(_req: TryOnProviderRequest): Promise<TryOnProviderResult> {
    throw new Error('Replicate provider not configured. Add REPLICATE_API_TOKEN and implement.');
  }
}

export class FalProviderStub implements TryOnProvider {
  readonly id = 'fal';
  async generate(_req: TryOnProviderRequest): Promise<TryOnProviderResult> {
    throw new Error('fal.ai provider not configured. Add FAL_KEY and implement.');
  }
}
