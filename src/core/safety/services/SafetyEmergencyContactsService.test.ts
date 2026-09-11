import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sendEmergencyAlert } = vi.hoisted(() => ({
  sendEmergencyAlert: vi.fn(),
}));

vi.mock('@/integrations/supabase', () => ({
  supabase: {},
}));

vi.mock('@/shared/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../providers/EmailNotificationProvider', () => ({
  emailNotificationProvider: { sendEmergencyAlert },
}));

import { SafetyEmergencyContactsService } from './SafetyEmergencyContactsService';
import type { EmergencyAlert, EmergencyContact } from '../types';

const alert = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
} as EmergencyAlert;

const contacts = [
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444',
  '55555555-5555-4555-8555-555555555555',
  '66666666-6666-4666-8666-666666666666',
].map((id) => ({ id }) as EmergencyContact);

function deliveryResult(
  contactId: string,
  status:
    | 'dispatching'
    | 'sent'
    | 'delivered'
    | 'failed'
    | 'cancelled'
    | 'reconciliation_required',
  success: boolean,
) {
  return {
    success,
    contactId,
    channel: 'email' as const,
    timestamp: '2026-09-11T12:00:00.000Z',
    status,
  };
}

describe('SafetyEmergencyContactsService emergency delivery summary', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sendEmergencyAlert.mockReset();
  });

  it('counts only provider-accepted or delivered contacts as notified', async () => {
    vi.spyOn(SafetyEmergencyContactsService, 'listEmergencyContacts').mockResolvedValue(
      contacts,
    );

    sendEmergencyAlert
      .mockResolvedValueOnce(deliveryResult(contacts[0].id, 'sent', true))
      .mockResolvedValueOnce(deliveryResult(contacts[1].id, 'delivered', true))
      .mockResolvedValueOnce(deliveryResult(contacts[2].id, 'dispatching', true))
      .mockResolvedValueOnce(
        deliveryResult(contacts[3].id, 'reconciliation_required', false),
      )
      .mockResolvedValueOnce(deliveryResult(contacts[4].id, 'cancelled', false))
      .mockResolvedValueOnce(deliveryResult(contacts[5].id, 'failed', false));

    const summary = await SafetyEmergencyContactsService.notifyEmergencyContacts(
      '77777777-7777-4777-8777-777777777777',
      alert,
    );

    expect(summary).toEqual({
      contactsAttempted: 6,
      contactsNotified: 2,
      contactIds: [contacts[0].id, contacts[1].id],
      successful: 2,
      inProgress: 1,
      reconciliationRequired: 1,
      cancelled: 1,
      failed: 1,
    });
  });

  it('keeps a rejected worker invocation in the failure bucket', async () => {
    vi.spyOn(SafetyEmergencyContactsService, 'listEmergencyContacts').mockResolvedValue([
      contacts[0],
    ]);
    sendEmergencyAlert.mockRejectedValueOnce(new Error('worker unavailable'));

    await expect(
      SafetyEmergencyContactsService.notifyEmergencyContacts(
        '77777777-7777-4777-8777-777777777777',
        alert,
      ),
    ).resolves.toEqual({
      contactsAttempted: 1,
      contactsNotified: 0,
      contactIds: [],
      successful: 0,
      inProgress: 0,
      reconciliationRequired: 0,
      cancelled: 0,
      failed: 1,
    });
  });
});
