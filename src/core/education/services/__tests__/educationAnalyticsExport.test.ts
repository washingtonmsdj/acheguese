import { describe, expect, it } from 'vitest';
import { buildEducationAnalyticsCsv } from '../educationAnalyticsExport';
import type { EducationAnalyticsData } from '@/core/education';

const fixture: EducationAnalyticsData = {
  leads: {
    total: 10,
    new: 2,
    contacted: 3,
    visitScheduled: 1,
    proposalSent: 1,
    enrolled: 2,
    lost: 1,
    conversionRate: 20,
    avgDaysToFirstContact: 4,
    byGrade: [
      {
        grade: '=1+1',
        leadCount: 4,
        enrollmentCount: 1,
      },
    ],
    byShift: [
      {
        shift: 'morning',
        leadCount: 5,
        enrollmentCount: 2,
      },
    ],
  },
  programs: {
    total: 3,
    active: 2,
    avgEnrollmentRate: 50,
    totalVacancies: 20,
    filledVacancies: 10,
  },
  events: {
    total: 2,
    upcoming: 1,
    schoolToursCount: 1,
    openHouseCount: 1,
    enrollmentFairCount: 0,
  },
  schoolMetrics: {
    enrollmentWindowOpen: true,
    mostRequestedGrade: '6 ano',
    mostRequestedShift: 'morning',
  },
};

describe('buildEducationAnalyticsCsv', () => {
  it('serializes the canonical analytics read model', () => {
    const csv = buildEducationAnalyticsCsv(fixture);

    expect(csv).toContain('"leads","total","","10"');
    expect(csv).toContain('"programas","ativos","","2"');
    expect(csv).toContain('"eventos","proximos","","1"');
    expect(csv).toContain('"leads","media_dias_ate_primeiro_contato","","4"');
    expect(csv).toContain('"escola","serie_mais_procurada","","6 ano"');
  });

  it('neutralizes spreadsheet formulas in text dimensions', () => {
    const csv = buildEducationAnalyticsCsv(fixture);
    expect(csv).toContain('"serie","leads","\'=1+1","4"');
    expect(csv).not.toContain('"serie","leads","=1+1","4"');
  });
});
