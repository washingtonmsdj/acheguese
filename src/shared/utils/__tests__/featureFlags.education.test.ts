import { describe, it, expect, vi } from 'vitest';
import {
  FEATURE_FLAGS,
  isFeatureEnabled,
  getFeatureFlag,
  getEnabledFeatures,
  getAllFeatureFlags,
} from '../featureFlags';

describe('Education Feature Flags', () => {
  it('has EDUCATION_MODULE flag', () => {
    expect(FEATURE_FLAGS.EDUCATION_MODULE).toBeDefined();
    expect(FEATURE_FLAGS.EDUCATION_MODULE.key).toBe('education_module');
  });

  it('has EDUCATION_PREMIUM flag', () => {
    expect(FEATURE_FLAGS.EDUCATION_PREMIUM).toBeDefined();
    expect(FEATURE_FLAGS.EDUCATION_PREMIUM.key).toBe('education_premium');
  });

  it('has EDUCATION_NICHES flag', () => {
    expect(FEATURE_FLAGS.EDUCATION_NICHES).toBeDefined();
    expect(FEATURE_FLAGS.EDUCATION_NICHES.key).toBe('education_niches');
  });

  it('EDUCATION_MODULE is enabled by default', () => {
    expect(FEATURE_FLAGS.EDUCATION_MODULE.enabled).toBe(true);
  });

  it('EDUCATION_PREMIUM is enabled in development', () => {
    expect(FEATURE_FLAGS.EDUCATION_PREMIUM.enabled).toBe(true);
    expect(FEATURE_FLAGS.EDUCATION_PREMIUM.environments).toContain('development');
  });

  it('isFeatureEnabled returns true for EDUCATION_MODULE', () => {
    expect(isFeatureEnabled('EDUCATION_MODULE')).toBe(true);
  });

  it('getFeatureFlag returns correct flag', () => {
    const flag = getFeatureFlag('EDUCATION_MODULE');
    expect(flag).toBeDefined();
    expect(flag?.key).toBe('education_module');
  });

  it('getFeatureFlag returns undefined for non-existent flag', () => {
    expect(getFeatureFlag('NON_EXISTENT')).toBeUndefined();
  });

  it('getAllFeatureFlags returns all flags', () => {
    const flags = getAllFeatureFlags();
    expect(flags.EDUCATION_MODULE).toBeDefined();
    expect(flags.EDUCATION_PREMIUM).toBeDefined();
    expect(flags.EDUCATION_NICHES).toBeDefined();
  });

  it('getEnabledFeatures includes education flags', () => {
    const enabled = getEnabledFeatures();
    expect(enabled).toContain('EDUCATION_MODULE');
    expect(enabled).toContain('EDUCATION_NICHES');
  });
});
