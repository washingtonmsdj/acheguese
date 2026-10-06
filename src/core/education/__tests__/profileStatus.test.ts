import { describe, expect, it } from 'vitest';
import {
  EDUCATION_PROFILE_STATUSES_CANONICAL,
  isEducationProfileStatus,
} from '../profileStatus';

describe('Education profile status contract', () => {
  it('accepts every canonical profile status', () => {
    for (const status of EDUCATION_PROFILE_STATUSES_CANONICAL) {
      expect(isEducationProfileStatus(status)).toBe(true);
    }
  });

  it('rejects values outside the enum contract', () => {
    expect(isEducationProfileStatus('active')).toBe(false);
    expect(isEducationProfileStatus('archived')).toBe(false);
  });
});
