import { describe, it, expect } from 'vitest';
import {
  useEducationList,
  useEducationDetail,
  useEducationProfile,
  useEducationPrograms,
  useEducationLeads,
  useLeadPipeline,
  useEducationEvents,
} from '../index';

describe('Education Hooks Exports', () => {
  it('exports useEducationList', () => {
    expect(typeof useEducationList).toBe('function');
  });

  it('exports useEducationDetail', () => {
    expect(typeof useEducationDetail).toBe('function');
  });

  it('exports useEducationProfile', () => {
    expect(typeof useEducationProfile).toBe('function');
  });

  it('exports useEducationPrograms', () => {
    expect(typeof useEducationPrograms).toBe('function');
  });

  it('exports useEducationLeads', () => {
    expect(typeof useEducationLeads).toBe('function');
  });

  it('exports useLeadPipeline', () => {
    expect(typeof useLeadPipeline).toBe('function');
  });

  it('exports useEducationEvents', () => {
    expect(typeof useEducationEvents).toBe('function');
  });
});
