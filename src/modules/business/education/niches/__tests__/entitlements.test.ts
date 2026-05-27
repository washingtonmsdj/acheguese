import { describe, it, expect } from 'vitest';
import {
  getNicheEntitlements,
  canCreateProgram,
  canCreateEvent,
  canReceiveLead,
  allowsAnalytics,
  allowsExport,
  getVersion,
  getNicheByKey,
} from '../registry';

describe('Education Niche Entitlements', () => {
  it('getNicheEntitlements returns entitlements for existing niche', () => {
    const entitlements = getNicheEntitlements('regular_school');
    expect(entitlements).not.toBeNull();
    expect(entitlements?.maxPrograms).toBeGreaterThan(0);
    expect(entitlements?.maxLeadsPerMonth).toBeGreaterThan(0);
    expect(entitlements?.maxEvents).toBeGreaterThan(0);
    expect(entitlements?.storageMB).toBeGreaterThan(0);
  });

  it('getNicheEntitlements returns null for non-existing niche', () => {
    expect(getNicheEntitlements('non_existent')).toBeNull();
  });

  it('canCreateProgram returns true when under limit', () => {
    expect(canCreateProgram('regular_school', 10)).toBe(true);
  });

  it('canCreateProgram returns false when at limit', () => {
    expect(canCreateProgram('regular_school', 20)).toBe(false);
    expect(canCreateProgram('regular_school', 25)).toBe(false);
  });

  it('canCreateProgram returns false for non-existing niche', () => {
    expect(canCreateProgram('non_existent', 0)).toBe(false);
  });

  it('canCreateEvent returns true when under limit', () => {
    expect(canCreateEvent('regular_school', 5)).toBe(true);
  });

  it('canCreateEvent returns false when at limit', () => {
    expect(canCreateEvent('regular_school', 10)).toBe(false);
  });

  it('canReceiveLead returns true when under limit', () => {
    expect(canReceiveLead('regular_school', 400)).toBe(true);
  });

  it('canReceiveLead returns false when at limit', () => {
    expect(canReceiveLead('regular_school', 500)).toBe(false);
    expect(canReceiveLead('regular_school', 600)).toBe(false);
  });

  it('allowsAnalytics returns true for basic niches', () => {
    expect(allowsAnalytics('regular_school')).toBe(true);
    expect(allowsAnalytics('daycare')).toBe(true);
  });

  it('allowsAnalytics returns false for non-existing niche', () => {
    expect(allowsAnalytics('non_existent')).toBe(false);
  });

  it('allowsExport returns true for basic niches', () => {
    expect(allowsExport('regular_school')).toBe(true);
  });

  it('allowsExport returns false for beta niches', () => {
    expect(allowsExport('technical_school')).toBe(false);
  });

  it('getVersion returns correct version object', () => {
    const version = getVersion('regular_school');
    expect(version).toEqual({ major: 1, minor: 0, patch: 0 });
  });

  it('getVersion returns null for non-existing niche', () => {
    expect(getVersion('non_existent')).toBeNull();
  });

  it('each niche has valid entitlements', () => {
    const niches = ['regular_school', 'daycare', 'language_school', 'prep_course'];
    niches.forEach((nicheKey) => {
      const entitlements = getNicheEntitlements(nicheKey);
      expect(entitlements).not.toBeNull();
      expect(entitlements!.maxPrograms).toBeGreaterThan(0);
      expect(entitlements!.maxLeadsPerMonth).toBeGreaterThan(0);
      expect(entitlements!.maxEvents).toBeGreaterThan(0);
      expect(entitlements!.storageMB).toBeGreaterThan(0);
    });
  });

  it('each niche has version info', () => {
    const niches = ['regular_school', 'daycare', 'technical_school'];
    niches.forEach((nicheKey) => {
      const version = getVersion(nicheKey);
      expect(version).not.toBeNull();
      expect(version!.major).toBeGreaterThanOrEqual(0);
      expect(version!.minor).toBeGreaterThanOrEqual(0);
      expect(version!.patch).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('Education Niche Default Settings', () => {
  it('each niche has defaultSettings', () => {
    const niche = getNicheByKey('regular_school');
    expect(niche).not.toBeNull();
    expect(niche!.defaultSettings).toBeDefined();
    expect(typeof niche!.defaultSettings).toBe('object');
  });

  it('defaultSettings has showPricing', () => {
    const niche = getNicheByKey('regular_school');
    expect(niche!.defaultSettings.showPricing).toBeDefined();
  });

  it('daycare has highlightSafety setting', () => {
    const niche = getNicheByKey('daycare');
    expect(niche!.defaultSettings.highlightSafety).toBe(true);
  });

  it('language_school has showCertifications setting', () => {
    const niche = getNicheByKey('language_school');
    expect(niche!.defaultSettings.showCertifications).toBe(true);
  });
});
