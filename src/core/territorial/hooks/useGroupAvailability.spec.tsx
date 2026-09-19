import { describe, expect, it, vi } from 'vitest';

import { ModuleKey } from '@/core/rollout/types';
import { isGroupAvailabilityQueryEnabled } from './useGroupAvailability';

vi.mock('../GroupAvailabilityService', () => ({
  groupAvailabilityService: {
    getGroupModuleAvailability: vi.fn(),
  },
}));

describe('isGroupAvailabilityQueryEnabled', () => {
  it('blocks database queries for public fallback IDs', () => {
    expect(
      isGroupAvailabilityQueryEnabled(
        'fallback-group-complexo-nordeste',
        ModuleKey.COMMUNITY,
      ),
    ).toBe(false);
  });

  it('keeps database queries enabled for persisted UUID IDs', () => {
    expect(
      isGroupAvailabilityQueryEnabled(
        '550e8400-e29b-41d4-a716-446655440000',
        ModuleKey.COMMUNITY,
      ),
    ).toBe(true);
  });

  it('requires a module key before querying', () => {
    expect(
      isGroupAvailabilityQueryEnabled(
        '550e8400-e29b-41d4-a716-446655440000',
        null,
      ),
    ).toBe(false);
  });
});
