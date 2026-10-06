import { describe, expect, it } from 'vitest';
import {
  EDUCATION_EVENT_LOCATION_MAX_LENGTH,
  EDUCATION_EVENT_TITLE_MAX_LENGTH,
  getEducationEventValidationError,
} from '../eventValidation';

describe('Education event validation', () => {
  const valid = {
    title: 'Visita aberta',
    startsAt: '2026-10-10T13:00:00.000Z',
    endsAt: '2026-10-10T14:00:00.000Z',
    location: 'Auditório',
  };

  it('accepts a valid chronological range', () => {
    expect(getEducationEventValidationError(valid)).toBeNull();
  });

  it('rejects an end time equal to or before the start time', () => {
    expect(
      getEducationEventValidationError({
        ...valid,
        endsAt: valid.startsAt,
      }),
    ).toBe('O término do evento deve ser posterior ao início.');

    expect(
      getEducationEventValidationError({
        ...valid,
        endsAt: '2026-10-10T12:59:00.000Z',
      }),
    ).toBe('O término do evento deve ser posterior ao início.');
  });

  it('rejects invalid dates', () => {
    expect(
      getEducationEventValidationError({ ...valid, startsAt: 'invalida' }),
    ).toBe('Informe uma data e hora de início válidas.');
  });

  it('tracks database-backed text limits', () => {
    expect(
      getEducationEventValidationError({
        ...valid,
        title: 'x'.repeat(EDUCATION_EVENT_TITLE_MAX_LENGTH + 1),
      }),
    ).toContain('O título deve ter no máximo');

    expect(
      getEducationEventValidationError({
        ...valid,
        location: 'x'.repeat(EDUCATION_EVENT_LOCATION_MAX_LENGTH + 1),
      }),
    ).toContain('O local deve ter no máximo');
  });
});
