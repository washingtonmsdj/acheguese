import { describe, it, expect } from 'vitest';
import * as pages from '../index';

describe('Education Pages Exports', () => {
  it('exports all pages', () => {
    expect(typeof pages.EducationExplorerPage).toBe('function');
    expect(typeof pages.EducationDetailPage).toBe('function');
    expect(typeof pages.EducationDashboardPage).toBe('function');
    expect(typeof pages.EducationSetupPage).toBe('function');
    expect(typeof pages.EducationLeadsPage).toBe('function');
    expect(typeof pages.EducationEventsPage).toBe('function');
    expect(typeof pages.EducationProgramsPage).toBe('function');
    expect(typeof pages.EducationAnalyticsPage).toBe('function');
    expect(typeof pages.EducationPlansPage).toBe('function');
  });
});
