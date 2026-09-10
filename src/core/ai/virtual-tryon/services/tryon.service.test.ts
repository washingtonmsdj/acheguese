import { beforeEach, describe, expect, it, vi } from 'vitest';

const { invoke, readHttpErrorBody } = vi.hoisted(() => ({
  invoke: vi.fn(),
  readHttpErrorBody: vi.fn(),
}));

vi.mock('@/integrations/supabase', () => ({
  supabase: {
    functions: { invoke },
    from: vi.fn(),
  },
  readSupabaseFunctionHttpErrorBody: readHttpErrorBody,
}));

vi.mock('@/core/media/services/MediaService', () => ({
  mediaService: { uploadToBucket: vi.fn() },
}));

vi.mock('@/core/realtime', () => ({
  realtimeService: { subscribe: vi.fn() },
}));

import { tryOnService } from './tryon.service';

const generationId = '11111111-1111-4111-8111-111111111111';

describe('tryOnService.enqueueGeneration', () => {
  beforeEach(() => {
    invoke.mockReset();
    readHttpErrorBody.mockReset();
    readHttpErrorBody.mockResolvedValue(null);
  });

  it('accepts only a correlated 202-style ACK contract', async () => {
    invoke.mockResolvedValue({
      data: { ok: true, generationId, provider: 'replicate' },
      error: null,
    });

    await expect(tryOnService.enqueueGeneration(generationId)).resolves.toBeUndefined();
  });

  it('rejects an ACK for a different generation', async () => {
    invoke.mockResolvedValue({
      data: {
        ok: true,
        generationId: '22222222-2222-4222-8222-222222222222',
        provider: 'replicate',
      },
      error: null,
    });

    await expect(tryOnService.enqueueGeneration(generationId)).rejects.toThrow(
      'Resposta inválida ao iniciar a geração.',
    );
  });

  it('maps whitelisted ownership failures', async () => {
    const httpError = { message: 'Edge Function returned a non-2xx status code' };
    invoke.mockResolvedValue({ data: null, error: httpError });
    readHttpErrorBody.mockResolvedValue({ error: 'forbidden' });

    await expect(tryOnService.enqueueGeneration(generationId)).rejects.toThrow(
      'Você não tem acesso a esta geração.',
    );
    expect(readHttpErrorBody).toHaveBeenCalledWith(httpError);
  });

  it('does not expose unknown server-side 500 messages to the browser', async () => {
    invoke.mockResolvedValue({
      data: null,
      error: { message: 'Edge Function returned a non-2xx status code' },
    });
    readHttpErrorBody.mockResolvedValue({
      error: 'relation private.internal_table does not exist',
    });

    await expect(tryOnService.enqueueGeneration(generationId)).rejects.toThrow(
      'Não foi possível iniciar a geração agora.',
    );
  });
});
