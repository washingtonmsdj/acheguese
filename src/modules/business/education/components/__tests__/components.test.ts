import { describe, it, expect } from 'vitest';
import * as components from '../index';

describe('Education Components Exports', () => {
  it('exports all components', () => {
    // React components can be functions or objects (forwardRef/memo)
    expect(components.EducationCard).toBeDefined();
    expect(components.EducationProgramsSection).toBeDefined();
    expect(components.EducationLeadForm).toBeDefined();
    expect(components.EducationContactSidebar).toBeDefined();
    expect(components.EducationStatusBadge).toBeDefined();
    expect(components.EducationPipelineView).toBeDefined();
    expect(components.EducationAnalyticsOverviewCard).toBeDefined();
    expect(components.EducationAnalyticsConversionCard).toBeDefined();
  });

  it('all exports are valid React components', () => {
    // Components should be truthy and either function or object
    const componentExports = [
      'EducationCard',
      'EducationProgramsSection',
      'EducationLeadForm',
      'EducationContactSidebar',
      'EducationStatusBadge',
      'EducationPipelineView',
      'EducationAnalyticsOverviewCard',
      'EducationAnalyticsConversionCard',
    ];

    componentExports.forEach((name) => {
      const comp = (components as Record<string, unknown>)[name];
      expect(comp).toBeDefined();
      expect(typeof comp === 'function' || typeof comp === 'object').toBe(true);
    });
  });
});
