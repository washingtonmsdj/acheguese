import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  eq: vi.fn(),
}));

vi.mock('@/integrations/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: mocks.eq,
      })),
    })),
  },
}));

import { getLeadPipelineMetrics } from '../education.queries';

const PROFILE_ID = '11111111-1111-4111-8111-111111111111';

describe('getLeadPipelineMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null for average first-contact time when there is no valid sample', async () => {
    mocks.eq.mockResolvedValue({
      data: [
        {
          status: 'new',
          created_at: '2026-10-01T00:00:00.000Z',
          first_contact_at: null,
        },
        {
          status: 'contacted',
          created_at: '2026-10-03T00:00:00.000Z',
          first_contact_at: '2026-10-02T00:00:00.000Z',
        },
      ],
      error: null,
    });

    await expect(getLeadPipelineMetrics(PROFILE_ID)).resolves.toEqual({
      conversionRate: 0,
      avgDaysToFirstContact: null,
    });
  });

  it('averages only valid non-negative first-contact samples', async () => {
    mocks.eq.mockResolvedValue({
      data: [
        {
          status: 'enrolled',
          created_at: '2026-10-01T00:00:00.000Z',
          first_contact_at: '2026-10-03T00:00:00.000Z',
        },
        {
          status: 'contacted',
          created_at: '2026-10-01T00:00:00.000Z',
          first_contact_at: '2026-10-05T00:00:00.000Z',
        },
        {
          status: 'new',
          created_at: '2026-10-03T00:00:00.000Z',
          first_contact_at: '2026-10-02T00:00:00.000Z',
        },
      ],
      error: null,
    });

    await expect(getLeadPipelineMetrics(PROFILE_ID)).resolves.toEqual({
      conversionRate: 33,
      avgDaysToFirstContact: 3,
    });
  });

  it('propagates analytics read failures instead of returning synthetic zeros', async () => {
    mocks.eq.mockResolvedValue({
      data: null,
      error: { message: 'analytics read failed' },
    });

    await expect(getLeadPipelineMetrics(PROFILE_ID)).rejects.toThrow(
      'analytics read failed',
    );
  });

  it('rejects invalid profile ids before querying analytics', async () => {
    await expect(getLeadPipelineMetrics('not-a-uuid')).rejects.toThrow(
      'Education analytics requires a valid profile ID',
    );
    expect(mocks.eq).not.toHaveBeenCalled();
  });
});
