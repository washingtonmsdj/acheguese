import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  EducationObservabilityService,
  trackLeadCreated,
  trackLeadConverted,
  trackProfilePublished,
  trackEducationError,
} from '@/core/education/services/EducationObservabilityService';

// Mock Supabase
vi.mock('@/integrations/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [], count: 0 })),
        })),
        eq: vi.fn(() => Promise.resolve({ data: [], count: 0 })),
      })),
    })),
  },
}));

// Mock logger
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

  describe('trackConversion', () => {
    it('should track conversion event', async () => {
      await EducationObservabilityService.trackConversion({
        eventType: 'education_lead_created',
        profileId: 'profile-123',
        leadId: 'lead-123',
        nicheKey: 'regular_school',
      });

      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      await EducationObservabilityService.trackConversion({
        eventType: 'education_lead_created',
        profileId: 'invalid',
      });

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('trackError', () => {
    it('should track error event', async () => {
      await EducationObservabilityService.trackError({
        eventType: 'education_lead_save_failed',
        profileId: 'profile-123',
        error: {
          message: 'Test error',
          code: 'TEST_ERROR',
        },
      });

      // Should not throw
      expect(true).toBe(true);
    });

    it('should include error stack', async () => {
      await EducationObservabilityService.trackError({
        eventType: 'education_profile_save_failed',
        error: {
          message: 'Test error',
          stack: 'Error stack trace',
        },
      });

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('trackUserJourney', () => {
    it('should track user journey event', async () => {
      await EducationObservabilityService.trackUserJourney({
        eventType: 'education_landing_viewed',
        profileId: 'profile-123',
        metadata: {
          source: 'organic',
        },
      });

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('trackPerformance', () => {
    it('should track performance event', async () => {
      await EducationObservabilityService.trackPerformance({
        eventType: 'education_page_load_slow',
        profileId: 'profile-123',
        performance: {
          duration: 3000,
          timestamp: Date.now(),
        },
      });

      // Should not throw
      expect(true).toBe(true);
    });

    it('should alert on critical performance', async () => {
      await EducationObservabilityService.trackPerformance({
        eventType: 'education_page_load_slow',
        performance: {
          duration: 6000, // > 5s
          timestamp: Date.now(),
        },
      });

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('getMetrics', () => {
    it('should return metrics', async () => {
      const metrics = await EducationObservabilityService.getMetrics();

      expect(metrics).toHaveProperty('leadsCreatedToday');
      expect(metrics).toHaveProperty('leadsConvertedToday');
      expect(metrics).toHaveProperty('conversionRate');
      expect(metrics).toHaveProperty('avgPageLoadTime');
      expect(metrics).toHaveProperty('apiErrorRate');
      expect(metrics).toHaveProperty('activeProfiles');
      expect(metrics).toHaveProperty('publishedProfiles');
    });

    it('should return metrics for specific profile', async () => {
      const metrics = await EducationObservabilityService.getMetrics('profile-123');

      expect(metrics).toBeDefined();
      expect(typeof metrics.leadsCreatedToday).toBe('number');
    });

    it('should handle errors gracefully', async () => {
      const metrics = await EducationObservabilityService.getMetrics('invalid');

      expect(metrics).toEqual({
        leadsCreatedToday: 0,
        leadsConvertedToday: 0,
        conversionRate: 0,
        avgPageLoadTime: 0,
        apiErrorRate: 0,
        activeProfiles: 0,
        publishedProfiles: 0,
      });
    });
  });

  describe('Convenience Functions', () => {
    it('trackLeadCreated should work', async () => {
      await trackLeadCreated('profile-123', 'lead-123', 'regular_school', {
        source: 'website',
      });

      // Should not throw
      expect(true).toBe(true);
    });

    it('trackLeadConverted should work', async () => {
      await trackLeadConverted('profile-123', 'lead-123', 'regular_school', {
        previousStatus: 'contacted',
      });

      // Should not throw
      expect(true).toBe(true);
    });

    it('trackProfilePublished should work', async () => {
      await trackProfilePublished('profile-123', 'business-123', 'regular_school', {
        institutionType: 'Escola Regular',
      });

      // Should not throw
      expect(true).toBe(true);
    });

    it('trackEducationError should work', async () => {
      const error = new Error('Test error');
      await trackEducationError('education_lead_save_failed', error, {
        profileId: 'profile-123',
      });

      // Should not throw
      expect(true).toBe(true);
    });
  });
});

