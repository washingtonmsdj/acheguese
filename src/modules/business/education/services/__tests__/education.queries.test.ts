import { describe, it, expect } from 'vitest';
import * as queries from '@/core/education/services/education.queries';

describe('Education Queries Exports', () => {
  it('exports getEducationProfileById', () => {
    expect(typeof queries.getEducationProfileById).toBe('function');
  });

  it('exports getEducationProfileByBusinessId', () => {
    expect(typeof queries.getEducationProfileByBusinessId).toBe('function');
  });

  it('exports listPublishedEducationProfiles', () => {
    expect(typeof queries.listPublishedEducationProfiles).toBe('function');
  });

  it('exports listEducationPrograms', () => {
    expect(typeof queries.listEducationPrograms).toBe('function');
  });

  it('exports getEducationProgramById', () => {
    expect(typeof queries.getEducationProgramById).toBe('function');
  });

  it('exports listEducationLeads', () => {
    expect(typeof queries.listEducationLeads).toBe('function');
  });

  it('exports getEducationLeadById', () => {
    expect(typeof queries.getEducationLeadById).toBe('function');
  });

  it('exports listLeadEvents', () => {
    expect(typeof queries.listLeadEvents).toBe('function');
  });

  it('exports listEducationEvents', () => {
    expect(typeof queries.listEducationEvents).toBe('function');
  });

  it('exports getEducationEventById', () => {
    expect(typeof queries.getEducationEventById).toBe('function');
  });
});
