import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEducationNiche } from '../hooks/useEducationNiche';

describe('useEducationNiche', () => {
  it('returns null config for undefined nicheKey', () => {
    const { result } = renderHook(() => useEducationNiche(undefined));
    expect(result.current.config).toBeNull();
    expect(result.current.isEnabled).toBe(false);
    expect(result.current.canUseNow).toBe(false);
  });

  it('returns config for valid nicheKey', () => {
    const { result } = renderHook(() => useEducationNiche('regular_school'));
    expect(result.current.config).not.toBeNull();
    expect(result.current.config?.nicheKey).toBe('regular_school');
    expect(result.current.isEnabled).toBe(true);
    expect(result.current.isPublic).toBe(true);
    expect(result.current.canUseNow).toBe(true);
  });

  it('hasCapability returns true for enabled capabilities', () => {
    const { result } = renderHook(() => useEducationNiche('regular_school'));
    expect(result.current.hasCapability('lead_capture')).toBe(true);
    expect(result.current.hasCapability('lead_pipeline')).toBe(true);
  });

  it('hasCapability returns false for missing capabilities', () => {
    const { result } = renderHook(() => useEducationNiche('regular_school'));
    expect(result.current.hasCapability('attendance_tracking')).toBe(false);
  });

  it('shouldShowSection returns true for enabled sections', () => {
    const { result } = renderHook(() => useEducationNiche('regular_school'));
    expect(result.current.shouldShowSection('programs')).toBe(true);
    expect(result.current.shouldShowSection('leads')).toBe(true);
  });

  it('shouldShowSection returns false for non-existing section', () => {
    const { result } = renderHook(() => useEducationNiche('regular_school'));
    expect(result.current.shouldShowSection('attendance')).toBe(false);
  });

  it('returns isBeta true for beta niches', () => {
    const { result } = renderHook(() => useEducationNiche('technical_school'));
    expect(result.current.isBeta).toBe(true);
  });

  it('validateForNiche returns valid for empty payload', () => {
    const { result } = renderHook(() => useEducationNiche('regular_school'));
    const validation = result.current.validateForNiche({});
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('returns correct adminSections', () => {
    const { result } = renderHook(() => useEducationNiche('regular_school'));
    expect(result.current.adminSections).toContain('basic_profile');
    expect(result.current.adminSections).toContain('programs');
    expect(result.current.adminSections).toContain('leads');
  });
});
