import { beforeEach, describe, expect, it, vi } from 'vitest';

const { invoke, resolveErrorMessage } = vi.hoisted(() => ({
  invoke: vi.fn(),
  resolveErrorMessage: vi.fn(),
}));

vi.mock('@/integrations/supabase', () => ({
  supabase: {
    functions: { invoke },
  },
  resolveSupabaseFunctionErrorMessage: resolveErrorMessage,
}));

vi.mock('@/shared/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import { EmailNotificationProvider } from './EmailNotificationProvider';
import type { EmergencyAlert, EmergencyContact } from '../types';

const provider = new EmailNotificationProvider();
const contact = { id: '11111111-1111-4111-8111-111111111111' } as EmergencyContact;
const alert = { id: '22222222-2222-4222-8222-222222222222' } as EmergencyAlert;

describe('EmailNotificationProvider', () => {
  beforeEach(() => {
    invoke.mockReset();
    resolveErrorMessage.mockReset();
    resolveErrorMessage.mockResolvedValue(null);
  });

  it('returns a validated provider-accepted sent result', async () => {
    invoke.mockResolvedValue({
      data: {
        success: true,
        contactId: contact.id,
        channel: 'email',
        timestamp: '2026-09-10T17:00:00.000Z',
        status: 'sent',
        metadata: { provider: 'resend' },
      },
      error: null,
    });

    await expect(provider.sendEmergencyAlert(contact, alert)).resolves.toEqual({
      success: true,
      contactId: contact.id,
      channel: 'email',
      timestamp: '2026-09-10T17:00:00.000Z',
      status: 'sent',
      error: undefined,
      metadata: { provider: 'resend' },
    });
  });

  it('preserves an in-progress worker outcome without claiming delivery', async () => {
    invoke.mockResolvedValue({
      data: {
        success: true,
        contactId: contact.id,
        channel: 'email',
        timestamp: '2026-09-10T17:00:00.000Z',
        status: 'dispatching',
        metadata: { providerAttemptSuppressed: true },
      },
      error: null,
    });

    await expect(provider.sendEmergencyAlert(contact, alert)).resolves.toEqual({
      success: true,
      contactId: contact.id,
      channel: 'email',
      timestamp: '2026-09-10T17:00:00.000Z',
      status: 'dispatching',
      error: undefined,
      metadata: { providerAttemptSuppressed: true },
    });
  });

  it('preserves a valid non-success reconciliation outcome', async () => {
    invoke.mockResolvedValue({
      data: {
        success: false,
        contactId: contact.id,
        channel: 'email',
        timestamp: '2026-09-10T17:00:00.000Z',
        status: 'reconciliation_required',
        error: 'Provider outcome needs reconciliation',
        metadata: { deliveryId: '44444444-4444-4444-8444-444444444444' },
      },
      error: null,
    });

    await expect(provider.sendEmergencyAlert(contact, alert)).resolves.toEqual({
      success: false,
      contactId: contact.id,
      channel: 'email',
      timestamp: '2026-09-10T17:00:00.000Z',
      status: 'reconciliation_required',
      error: 'Provider outcome needs reconciliation',
      metadata: { deliveryId: '44444444-4444-4444-8444-444444444444' },
    });
  });

  it('preserves a safe structured Edge rejection in the failed delivery result', async () => {
    const httpError = { message: 'Edge Function returned a non-2xx status code' };
    invoke.mockResolvedValue({ data: null, error: httpError });
    resolveErrorMessage.mockResolvedValue('Emergency alert is no longer active');

    const result = await provider.sendEmergencyAlert(contact, alert);

    expect(result.success).toBe(false);
    expect(result.status).toBe('failed');
    expect(result.error).toBe('Emergency alert is no longer active');
    expect(resolveErrorMessage).toHaveBeenCalledWith(httpError);
  });

  it('fails closed when the server response points to another contact', async () => {
    invoke.mockResolvedValue({
      data: {
        success: true,
        contactId: '33333333-3333-4333-8333-333333333333',
        channel: 'email',
        timestamp: '2026-09-10T17:00:00.000Z',
        status: 'sent',
      },
      error: null,
    });

    const result = await provider.sendEmergencyAlert(contact, alert);

    expect(result.success).toBe(false);
    expect(result.status).toBe('failed');
    expect(result.error).toBe('Resposta inválida do serviço de email de emergência');
  });

  it('fails closed when success and lifecycle state contradict each other', async () => {
    invoke.mockResolvedValue({
      data: {
        success: true,
        contactId: contact.id,
        channel: 'email',
        timestamp: '2026-09-10T17:00:00.000Z',
        status: 'failed',
      },
      error: null,
    });

    const result = await provider.sendEmergencyAlert(contact, alert);

    expect(result.success).toBe(false);
    expect(result.status).toBe('failed');
    expect(result.error).toBe('Resposta inválida do serviço de email de emergência');
  });
});
