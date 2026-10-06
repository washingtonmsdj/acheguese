import { describe, expect, it } from 'vitest';
import {
  getEducationEventTemporalState,
  isEducationEventActive,
} from '../eventTemporalState';

describe('Education event temporal state', () => {
  const now = new Date('2026-10-06T15:00:00.000Z').getTime();

  it('classifies future events as upcoming', () => {
    expect(
      getEducationEventTemporalState(
        { startsAt: '2026-10-06T16:00:00.000Z', endsAt: null },
        now,
      ),
    ).toBe('upcoming');
  });

  it('classifies started events with a future end as ongoing', () => {
    const event = {
      startsAt: '2026-10-06T14:00:00.000Z',
      endsAt: '2026-10-06T16:00:00.000Z',
    };

    expect(getEducationEventTemporalState(event, now)).toBe('ongoing');
    expect(isEducationEventActive(event, now)).toBe(true);
  });

  it('classifies ended or start-only events in the past as past', () => {
    expect(
      getEducationEventTemporalState(
        {
          startsAt: '2026-10-06T13:00:00.000Z',
          endsAt: '2026-10-06T14:00:00.000Z',
        },
        now,
      ),
    ).toBe('past');

    expect(
      getEducationEventTemporalState(
        { startsAt: '2026-10-06T13:00:00.000Z' },
        now,
      ),
    ).toBe('past');
  });

  it('does not normalize invalid chronology into a valid or active state', () => {
    const event = {
      startsAt: '2026-10-06T16:00:00.000Z',
      endsAt: '2026-10-06T15:00:00.000Z',
    };

    expect(getEducationEventTemporalState(event, now)).toBe('invalid');
    expect(isEducationEventActive(event, now)).toBe(false);
  });
});
