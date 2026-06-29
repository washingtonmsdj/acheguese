import { describe, it, expect } from 'vitest';
import { EducationNicheConfigService } from '../services/EducationNicheConfigService';

describe('EducationNicheConfigService', () => {
  it('getConfig returns config for existing niche', () => {
    const config = EducationNicheConfigService.getConfig('regular_school');
    expect(config.nicheKey).toBe('regular_school');
    expect(config.displayName).toBe('Escola Regular');
  });

  it('getConfig returns default for non-existing niche', () => {
    const config = EducationNicheConfigService.getConfig('non_existent');
    expect(config.nicheKey).toBe('regular_school');
  });

  it('listNiches returns all niches by default', () => {
    const niches = EducationNicheConfigService.listNiches();
    expect(niches.length).toBeGreaterThan(0);
  });

  it('listNiches filters by supportLevel', () => {
    const niches = EducationNicheConfigService.listNiches({ supportLevel: 'basic_enabled' });
    niches.forEach((n) => expect(n.supportLevel).toBe('basic_enabled'));
  });

  it('hasCapability returns true for enabled capabilities', () => {
    expect(EducationNicheConfigService.hasCapability('daycare', 'trial_class_booking')).toBe(true);
    expect(EducationNicheConfigService.hasCapability('language_school', 'lead_capture')).toBe(true);
  });

  it('hasCapability returns false for missing capabilities', () => {
    expect(EducationNicheConfigService.hasCapability('regular_school', 'attendance_tracking')).toBe(false);
  });

  it('shouldShowSection returns true for enabled sections', () => {
    expect(EducationNicheConfigService.shouldShowSection('regular_school', 'programs')).toBe(true);
    expect(EducationNicheConfigService.shouldShowSection('regular_school', 'leads')).toBe(true);
  });

  it('shouldShowSection returns false for missing sections', () => {
    expect(EducationNicheConfigService.shouldShowSection('regular_school', 'attendance')).toBe(false);
  });

  it('validateForNiche returns valid for valid payload', () => {
    const result = EducationNicheConfigService.validateForNiche('regular_school', {});
    expect(result.isValid).toBe(true);
  });

  it('validateForNiche returns error for non-existing niche', () => {
    const result = EducationNicheConfigService.validateForNiche('non_existent', {});
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Nicho 'non_existent' nao existe");
  });

  it('getEffectiveCapabilities returns enabled capabilities', () => {
    const caps = EducationNicheConfigService.getEffectiveCapabilities('regular_school');
    expect(caps).toContain('lead_capture');
    expect(caps).toContain('lead_pipeline');
    expect(caps).toContain('whatsapp_cta');
  });

  it('getEffectiveCapabilities returns empty for non-existing niche', () => {
    const caps = EducationNicheConfigService.getEffectiveCapabilities('non_existent');
    expect(caps).toHaveLength(0);
  });

  it('isEnabled returns true for full_enabled and basic_enabled', () => {
    expect(EducationNicheConfigService.isEnabled('regular_school')).toBe(true);
    expect(EducationNicheConfigService.isEnabled('daycare')).toBe(true);
  });

  it('isEnabled returns false for beta and planned', () => {
    expect(EducationNicheConfigService.isEnabled('technical_school')).toBe(false);
  });

  it('isEnabled returns false for non-existing niche', () => {
    expect(EducationNicheConfigService.isEnabled('non_existent')).toBe(false);
  });
});
