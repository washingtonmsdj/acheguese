import { describe, expect, it } from 'vitest';
import {
  EDUCATION_LEAD_LOST_REASON_MAX_LENGTH,
  getEducationLeadLostReasonValidationError,
} from '../leadPipelineValidation';

describe('Education lost lead reason validation', () => {
  it('accepts a concise operational reason', () => {
    expect(
      getEducationLeadLostReasonValidationError(
        'Família optou por outra instituição',
      ),
    ).toBeNull();
  });

  it('rejects blank and too-short reasons', () => {
    expect(getEducationLeadLostReasonValidationError('  ')).toContain(
      'pelo menos 3 caracteres',
    );
    expect(getEducationLeadLostReasonValidationError('ok')).toContain(
      'pelo menos 3 caracteres',
    );
  });

  it('rejects reasons above the canonical limit', () => {
    expect(
      getEducationLeadLostReasonValidationError(
        'x'.repeat(EDUCATION_LEAD_LOST_REASON_MAX_LENGTH + 1),
      ),
    ).toContain('no máximo 500 caracteres');
  });
});
