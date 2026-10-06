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

  it('preserves an unknown enrollment window as an empty CSV value', () => {
    const csv = buildEducationAnalyticsCsv({
      ...fixture,
      schoolMetrics: {
        ...fixture.schoolMetrics!,
        enrollmentWindowOpen: null,
      },
    });

    expect(csv).toContain(
      '"escola","janela_matricula_aberta","",""',
    );
    expect(csv).not.toContain(
      '"escola","janela_matricula_aberta","","false"',
    );
  });

  it('keeps a missing first-contact average empty instead of exporting zero', () => {
    const csv = buildEducationAnalyticsCsv({
      ...fixture,
      leads: {
        ...fixture.leads,
        avgDaysToFirstContact: null,
      },
    });

    expect(csv).toContain(
      '"leads","media_dias_ate_primeiro_contato","",""',
    );
    expect(csv).not.toContain(
      '"leads","media_dias_ate_primeiro_contato","","0"',
    );
  });

  it('keeps an unmeasurable program occupancy rate empty', () => {
    const csv = buildEducationAnalyticsCsv({
      ...fixture,
      programs: {
        ...fixture.programs,
        avgEnrollmentRate: null,
        totalVacancies: 0,
        filledVacancies: 0,
      },
    });

    expect(csv).toContain(
      '"programas","taxa_ocupacao_media_pct","",""',
    );
    expect(csv).not.toContain(
      '"programas","taxa_ocupacao_media_pct","","0"',
    );
  });

  it('neutralizes spreadsheet formulas in text dimensions', () => {
    const csv = buildEducationAnalyticsCsv(fixture);
    expect(csv).toContain('"serie","leads","\'=1+1","4"');
    expect(csv).not.toContain('"serie","leads","=1+1","4"');
  });
  it('neutralizes formulas hidden after spaces and control characters', () => {
    const csv = buildEducationAnalyticsCsv({
      ...fixture,
      leads: {
        ...fixture.leads,
        byGrade: [
          { grade: ' \t=HYPERLINK(1)', leadCount: 4, enrollmentCount: 1 },
        ],
      },
    });

    expect(csv).toContain(`"serie","leads","' \t=HYPERLINK(1)","4"`);
    expect(csv).not.toContain(`"serie","leads"," \t=HYPERLINK(1)","4"`);
  });

});
