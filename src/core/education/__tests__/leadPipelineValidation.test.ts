import { describe, expect, it } from 'vitest';
import {
  EDUCATION_LEAD_LOST_REASON_MAX_LENGTH,
  canMoveEducationLeadToStatus,
  getEducationLeadLostReasonValidationError,
  getEducationLeadNextStatuses,
} from '../leadPipelineValidation';

describe('Education lead pipeline state machine', () => {
  it('allows only the next active stage or lost from active statuses', () => {
    expect(canMoveEducationLeadToStatus('new', 'contacted')).toBe(true);
    expect(canMoveEducationLeadToStatus('new', 'lost')).toBe(true);
    expect(canMoveEducationLeadToStatus('new', 'enrolled')).toBe(false);
    expect(canMoveEducationLeadToStatus('proposal_sent', 'enrolled')).toBe(true);
  });

  it('keeps terminal statuses terminal while allowing idempotent retries', () => {
    expect(canMoveEducationLeadToStatus('enrolled', 'enrolled')).toBe(true);
    expect(canMoveEducationLeadToStatus('enrolled', 'lost')).toBe(false);
    expect(canMoveEducationLeadToStatus('lost', 'lost')).toBe(true);
    expect(canMoveEducationLeadToStatus('lost', 'contacted')).toBe(false);
    expect(getEducationLeadNextStatuses('enrolled')).toEqual([]);
    expect(getEducationLeadNextStatuses('lost')).toEqual([]);
  });

  it('returns the canonical next actions for active statuses', () => {
    expect(getEducationLeadNextStatuses('new')).toEqual(['contacted', 'lost']);
    expect(getEducationLeadNextStatuses('proposal_sent')).toEqual([
      'enrolled',
      'lost',
    ]);
  });
});

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
