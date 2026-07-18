import { describe, expect, it } from 'vitest';

import {
  VALID_FAILURE_REASONS,
  VALID_ITEM_DESTINATIONS,
  VALID_ITEM_HOLDERS,
  VALID_RESOLUTION_STATUSES,
  type FailedDeliveryMetadata,
} from './FailedDeliveryMetadata';

describe('FailedDeliveryMetadata contract', () => {
  it('keeps the required failure snapshot fields', () => {
    const metadata: FailedDeliveryMetadata = {
      failure_reason: 'recipient_unavailable',
      item_destination: 'return_to_sender',
      item_current_holder: 'driver',
      timestamp: new Date().toISOString(),
      resolution_status: 'pending',
    };

    expect(metadata).toMatchObject({
      failure_reason: 'recipient_unavailable',
      item_destination: 'return_to_sender',
      item_current_holder: 'driver',
      resolution_status: 'pending',
    });
  });

  it('supports evidence and the complete resolution lifecycle', () => {
    const metadata: FailedDeliveryMetadata = {
      failure_reason: 'other',
      item_destination: 'handoff_to_another_driver',
      item_current_holder: 'other_driver',
      timestamp: new Date().toISOString(),
      resolution_status: 'resolved',
      resolution_notes: 'Ocorrencia validada pela operacao.',
      failed_at_location: { lat: -12.9714, lng: -38.5014, address: 'Salvador, BA' },
      photos: ['evidence-id'],
      attempt_number: 2,
      next_ride_id: 'next-ride-id',
      handoff_driver_profile_id: 'driver-profile-id',
      manual_resolution_owner_profile_id: 'owner-profile-id',
      resolved_at: new Date().toISOString(),
      resolution_action_notes: 'Item transferido com sucesso.',
    };

    expect(metadata.resolution_status).toBe('resolved');
    expect(metadata.handoff_driver_profile_id).toBe('driver-profile-id');
    expect(metadata.photos).toEqual(['evidence-id']);
  });

  it('keeps the canonical enum values', () => {
    expect(VALID_FAILURE_REASONS).toEqual([
      'recipient_unavailable',
      'address_not_found',
      'address_inaccessible',
      'recipient_refused',
      'vehicle_issue',
      'driver_unavailable',
      'safety_issue',
      'package_damaged',
      'other',
    ]);
    expect(VALID_ITEM_DESTINATIONS).toEqual([
      'return_to_sender',
      'handoff_to_another_driver',
      'awaiting_manual_resolution',
    ]);
    expect(VALID_ITEM_HOLDERS).toEqual(['driver', 'sender', 'other_driver', 'hub']);
    expect(VALID_RESOLUTION_STATUSES).toEqual(['pending', 'in_progress', 'resolved', 'escalated']);
  });
});
