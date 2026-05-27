import { describe, it, expect } from 'vitest';
import * as niches from '../index';

describe('Education Niches Module Exports', () => {
  it('exports registry functions', () => {
    expect(typeof niches.getNicheByKey).toBe('function');
    expect(typeof niches.getAllNiches).toBe('function');
    expect(typeof niches.listNiches).toBe('function');
    expect(typeof niches.nicheExists).toBe('function');
    expect(typeof niches.hasCapability).toBe('function');
  });

  it('exports entitlement guards', () => {
    expect(typeof niches.getNicheEntitlements).toBe('function');
    expect(typeof niches.canCreateProgram).toBe('function');
    expect(typeof niches.canCreateEvent).toBe('function');
    expect(typeof niches.canReceiveLead).toBe('function');
    expect(typeof niches.allowsAnalytics).toBe('function');
    expect(typeof niches.allowsExport).toBe('function');
    expect(typeof niches.getVersion).toBe('function');
  });

  it('exports service and hook', () => {
    expect(niches).toHaveProperty('EducationNicheConfigService');
    expect(niches).toHaveProperty('useEducationNiche');
  });
});
