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
    avgDaysToConversion: 4,
    byGrade: [
      {
        grade: '=1+1',
        leadCount: 4,
        enrollmentCount: 1,
        vacancyRate: 25,
      },
    ],
    byShift: [
      {
        shift: 'morning',
        leadCount: 5,
        enrollmentCount: 2,
        interestLevel: 'medium',
      },
    ],
    guardianVsStudentRatio: 60,
  },
  programs: {
    total: 3,
    active: 2,
    avgViews: 12,
    avgInquiries: 6,
    avgEnrollmentRate: 50,
    totalVacancies: 20,
    filledVacancies: 10,
  },
  events: {
    total: 2,
    upcoming: 1,
    totalAttendees: 8,
    schoolToursCount: 1,
    openHouseCount: 1,
    enrollmentFairCount: 0,
  },
  period: {
    start: '2026-08-01T00:00:00.000Z',
    end: '2026-08-31T23:59:59.999Z',
  },
  schoolMetrics: {
    enrollmentWindowOpen: true,
    totalGradesOffered: 4,
    totalShiftsOffered: 2,
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
    expect(csv).toContain('"escola","series_oferecidas","","4"');
  });

  it('neutralizes spreadsheet formulas in text dimensions', () => {
    const csv = buildEducationAnalyticsCsv(fixture);
    expect(csv).toContain('"serie","leads","\'=1+1","4"');
    expect(csv).not.toContain('"serie","leads","=1+1","4"');
  });
});
