import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EducationObservabilityService,
  trackEducationError,
  trackLeadConverted,
  trackLeadCreated,
  trackProfilePublished,
} from '@/core/education/services/EducationObservabilityService';
import { logger } from '@/shared/utils/logger';

vi.mock('@/shared/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('EducationObservabilityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('forwards conversion events to external analytics without database persistence', async () => {
    const gtag = vi.fn();
    vi.stubGlobal('gtag', gtag);

    await EducationObservabilityService.trackConversion({
      eventType: 'education_lead_created',
      profileId: 'profile-123',
      leadId: 'lead-123',
      nicheKey: 'regular_school',
      metadata: { source: 'website' },
    });

    expect(gtag).toHaveBeenCalledWith(
      'event',
      'education_lead_created',
      expect.objectContaining({
        profile_id: 'profile-123',
        lead_id: 'lead-123',
        niche_key: 'regular_school',
        source: 'website',
      }),
    );
  });

  it('sends technical errors to logger and Sentry when available', async () => {
    const captureException = vi.fn();
    vi.stubGlobal('Sentry', { captureException });

    await EducationObservabilityService.trackError({
      eventType: 'education_lead_save_failed',
      profileId: 'profile-123',
      error: {
        message: 'Test error',
        stack: 'stack',
      },
    });

    expect(logger.error).toHaveBeenCalledWith(
      '[Education Error]',
      expect.objectContaining({
        eventType: 'education_lead_save_failed',
        profileId: 'profile-123',
      }),
    );
    expect(captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Test error' }),
      expect.objectContaining({
        tags: expect.objectContaining({
          module: 'education',
          event_type: 'education_lead_save_failed',
        }),
      }),
    );
  });

  it('keeps convenience conversion helpers on the same observability contract', async () => {
    const gtag = vi.fn();
    vi.stubGlobal('gtag', gtag);

    await trackLeadCreated('profile-1', 'lead-1', 'regular_school', {
      source: 'website',
    });
    await trackLeadConverted('profile-1', 'lead-1', 'regular_school', {
      previousStatus: 'contacted',
    });
    await trackProfilePublished(
      'profile-1',
      'business-1',
      'regular_school',
      { institutionType: 'regular_school' },
    );

    expect(gtag).toHaveBeenCalledTimes(3);
    expect(gtag.mock.calls.map((call) => call[1])).toEqual([
      'education_lead_created',
      'education_lead_converted',
      'education_profile_published',
    ]);
  });

  it('promotes known error context out of metadata for technical diagnostics', async () => {
    const captureException = vi.fn();
    vi.stubGlobal('Sentry', { captureException });

    await trackEducationError(
      'education_profile_publish_failed',
      new Error('publish failed'),
      {
        profileId: 'profile-1',
        businessId: 'business-1',
        nicheKey: 'regular_school',
      },
    );

    expect(logger.error).toHaveBeenCalledWith(
      '[Education Error]',
      expect.objectContaining({
        profileId: 'profile-1',
        businessId: 'business-1',
        nicheKey: 'regular_school',
      }),
    );
    expect(captureException).toHaveBeenCalledTimes(1);
  });
});
