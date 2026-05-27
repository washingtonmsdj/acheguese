import { describe, it, expect } from 'vitest';
import { EducationService } from '../EducationService';

describe('EducationService Exports', () => {
  it('exports getOrCreateProfile', () => {
    expect(typeof EducationService.getOrCreateProfile).toBe('function');
  });

  it('exports canManageProfile', () => {
    expect(typeof EducationService.canManageProfile).toBe('function');
  });

  it('exports publishProfile', () => {
    expect(typeof EducationService.publishProfile).toBe('function');
  });

  it('exports pauseProfile', () => {
    expect(typeof EducationService.pauseProfile).toBe('function');
  });

  it('exports listActivePrograms', () => {
    expect(typeof EducationService.listActivePrograms).toBe('function');
  });

  it('exports createProgram', () => {
    expect(typeof EducationService.createProgram).toBe('function');
  });

  it('exports createLead', () => {
    expect(typeof EducationService.createLead).toBe('function');
  });

  it('exports moveLeadInPipeline', () => {
    expect(typeof EducationService.moveLeadInPipeline).toBe('function');
  });

  it('exports getLeadsPipelineSummary', () => {
    expect(typeof EducationService.getLeadsPipelineSummary).toBe('function');
  });

  it('exports listUpcomingPublicEvents', () => {
    expect(typeof EducationService.listUpcomingPublicEvents).toBe('function');
  });

  it('exports createEvent', () => {
    expect(typeof EducationService.createEvent).toBe('function');
  });
});
