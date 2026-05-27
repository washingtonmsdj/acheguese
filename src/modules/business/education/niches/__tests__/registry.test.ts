import { describe, it, expect } from 'vitest';
import {
  getNicheByKey,
  getAllNiches,
  listNiches,
  getSelectableNiches,
  getPublicNiches,
  getAdminNiches,
  nicheExists,
  hasCapability,
  shouldShowAdminSection,
  getNicheOrDefault,
  EDUCATION_NICHES,
} from '../registry';

describe('Education Niches Registry', () => {
  it('getNicheByKey returns niche for existing keys', () => {
    const niche = getNicheByKey('regular_school');
    expect(niche).not.toBeNull();
    expect(niche?.nicheKey).toBe('regular_school');
  });

  it('getNicheByKey returns null for non-existing keys', () => {
    expect(getNicheByKey('non_existent')).toBeNull();
  });

  it('getAllNiches returns 8 niches', () => {
    expect(getAllNiches()).toHaveLength(8);
  });

  it('listNiches filters by supportLevel', () => {
    const basicNiches = listNiches({ supportLevel: 'basic_enabled' });
    expect(basicNiches.length).toBeGreaterThan(0);
    basicNiches.forEach((n) => expect(n.supportLevel).toBe('basic_enabled'));
  });

  it('listNiches filters by isSelectable', () => {
    const selectable = listNiches({ isSelectable: true });
    expect(selectable.length).toBeGreaterThan(0);
  });

  it('getSelectableNiches returns all selectable niches', () => {
    const niches = getSelectableNiches();
    expect(niches.length).toBeGreaterThan(0);
  });

  it('getPublicNiches returns all public niches', () => {
    const niches = getPublicNiches();
    niches.forEach((n) => expect(n.isPublic).toBe(true));
  });

  it('getAdminNiches excludes planned niches', () => {
    const niches = getAdminNiches();
    niches.forEach((n) => expect(n.supportLevel).not.toBe('planned'));
  });

  it('nicheExists returns true for existing niches', () => {
    expect(nicheExists('regular_school')).toBe(true);
    expect(nicheExists('daycare')).toBe(true);
  });

  it('nicheExists returns false for non-existing niches', () => {
    expect(nicheExists('non_existent')).toBe(false);
  });

  it('hasCapability returns true for enabled capabilities', () => {
    expect(hasCapability('regular_school', 'lead_capture')).toBe(true);
    expect(hasCapability('regular_school', 'whatsapp_cta')).toBe(true);
  });

  it('hasCapability returns false for missing capabilities', () => {
    expect(hasCapability('regular_school', 'attendance_tracking')).toBe(false);
  });

  it('hasCapability returns false for non-existing niche', () => {
    expect(hasCapability('non_existent', 'lead_capture')).toBe(false);
  });

  it('shouldShowAdminSection returns true for enabled sections', () => {
    expect(shouldShowAdminSection('regular_school', 'programs')).toBe(true);
    expect(shouldShowAdminSection('regular_school', 'leads')).toBe(true);
  });

  it('shouldShowAdminSection returns false for non-existing section', () => {
    expect(shouldShowAdminSection('regular_school', 'attendance' as any)).toBe(false);
  });

  it('getNicheOrDefault returns niche for existing key', () => {
    const niche = getNicheOrDefault('daycare');
    expect(niche.nicheKey).toBe('daycare');
  });

  it('getNicheOrDefault returns regular_school for non-existing key', () => {
    const niche = getNicheOrDefault('non_existent');
    expect(niche.nicheKey).toBe('regular_school');
  });

  it('EDUCATION_NICHES has all 8 niches', () => {
    const keys = Object.keys(EDUCATION_NICHES);
    expect(keys).toHaveLength(8);
    expect(keys).toContain('regular_school');
    expect(keys).toContain('daycare');
    expect(keys).toContain('language_school');
    expect(keys).toContain('prep_course');
    expect(keys).toContain('technical_school');
    expect(keys).toContain('tutoring_center');
    expect(keys).toContain('music_school');
    expect(keys).toContain('sports_school');
  });

  it('beta niches have isBeta true', () => {
    const betaNiches = listNiches({ supportLevel: 'beta' });
    betaNiches.forEach((n) => {
      expect(n.isBeta).toBe(true);
    });
  });

  it('basic niches have specific capabilities', () => {
    const basicNiches = listNiches({ supportLevel: 'basic_enabled' });
    basicNiches.forEach((n) => {
      expect(n.enabledCapabilities).toContain('lead_capture');
      expect(n.enabledCapabilities).toContain('lead_pipeline');
      expect(n.enabledCapabilities).toContain('whatsapp_cta');
    });
  });
});
