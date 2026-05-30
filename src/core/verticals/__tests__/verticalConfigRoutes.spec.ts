import { describe, expect, it } from 'vitest';
import { businessManagementRoutes } from '@/core/business/utils/businessManagementRoutes';
import { getBusinessCreateRoute, VERTICAL_CONFIGS } from '@/core/verticals/config';

describe('vertical route contracts', () => {
  it('builds contextual create routes through business management route SSOT', () => {
    expect(getBusinessCreateRoute()).toBe(businessManagementRoutes.create());
    expect(getBusinessCreateRoute('gastronomy')).toBe(
      businessManagementRoutes.createByVerticalSlug('gastronomia'),
    );
    expect(getBusinessCreateRoute('education')).toBe(
      businessManagementRoutes.createByVerticalSlug('educacao'),
    );
  });

  it('delegates vertical setup and dashboard routes to business management routes', () => {
    expect(VERTICAL_CONFIGS.gastronomy.setupRoute('business-1')).toBe(
      businessManagementRoutes.gastronomySetup('business-1'),
    );
    expect(VERTICAL_CONFIGS.gastronomy.dashboardRoute('business-1')).toBe(
      businessManagementRoutes.gastronomia('business-1'),
    );
    expect(VERTICAL_CONFIGS.education.setupRoute('business-1')).toBe(
      businessManagementRoutes.educationSetup('business-1'),
    );
    expect(VERTICAL_CONFIGS.education.dashboardRoute('business-1')).toBe(
      businessManagementRoutes.education('business-1'),
    );
  });

  it('rejects unsafe vertical route slugs', () => {
    expect(() => businessManagementRoutes.createByVerticalSlug('educacao/extra')).toThrow(
      /slug vertical/,
    );
  });
});
