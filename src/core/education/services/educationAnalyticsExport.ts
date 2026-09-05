import type { EducationAnalyticsData } from '@/core/education';

type AnalyticsCsvValue = string | number | boolean | null | undefined;

function escapeCsvCell(value: AnalyticsCsvValue): string {
  const raw = value == null ? '' : String(value);
  const formulaSafe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${formulaSafe.replace(/"/g, '""')}"`;
}

function row(
  section: string,
  metric: string,
  value: AnalyticsCsvValue,
  dimension = '',
): string {
  return [section, metric, dimension, value].map(escapeCsvCell).join(',');
}

export function buildEducationAnalyticsCsv(
  data: EducationAnalyticsData,
): string {
  const rows = [
    ['secao', 'metrica', 'dimensao', 'valor'].map(escapeCsvCell).join(','),
    row('periodo', 'inicio', data.period.start),
    row('periodo', 'fim', data.period.end),
    row('leads', 'total', data.leads.total),
    row('leads', 'novos', data.leads.new),
    row('leads', 'contatados', data.leads.contacted),
    row('leads', 'visita_agendada', data.leads.visitScheduled),
    row('leads', 'proposta_enviada', data.leads.proposalSent),
    row('leads', 'matriculados', data.leads.enrolled),
    row('leads', 'perdidos', data.leads.lost),
    row('leads', 'taxa_conversao_pct', data.leads.conversionRate),
    row('leads', 'media_dias_conversao', data.leads.avgDaysToConversion),
    row('programas', 'total', data.programs.total),
    row('programas', 'ativos', data.programs.active),
    row('programas', 'media_visualizacoes', data.programs.avgViews),
    row('programas', 'media_interesses', data.programs.avgInquiries),
    row('programas', 'taxa_ocupacao_media_pct', data.programs.avgEnrollmentRate),
    row('programas', 'vagas_totais', data.programs.totalVacancies),
    row('programas', 'vagas_preenchidas', data.programs.filledVacancies),
    row('eventos', 'total', data.events.total),
    row('eventos', 'proximos', data.events.upcoming),
    row('eventos', 'participantes', data.events.totalAttendees),
    row('eventos', 'visitas_escolares', data.events.schoolToursCount),
    row('eventos', 'portas_abertas', data.events.openHouseCount),
    row('eventos', 'feiras_matricula', data.events.enrollmentFairCount),
  ];

  if (data.leads.guardianVsStudentRatio != null) {
    rows.push(
      row(
        'leads',
        'responsavel_vs_aluno_pct',
        data.leads.guardianVsStudentRatio,
      ),
    );
  }

  for (const grade of data.leads.byGrade ?? []) {
    rows.push(
      row('serie', 'leads', grade.leadCount, grade.grade),
      row('serie', 'matriculas', grade.enrollmentCount, grade.grade),
      row('serie', 'ocupacao_pct', grade.vacancyRate, grade.grade),
    );
  }

  for (const shift of data.leads.byShift ?? []) {
    rows.push(
      row('turno', 'leads', shift.leadCount, shift.shift),
      row('turno', 'matriculas', shift.enrollmentCount, shift.shift),
      row('turno', 'nivel_interesse', shift.interestLevel, shift.shift),
    );
  }

  if (data.schoolMetrics) {
    rows.push(
      row(
        'escola',
        'janela_matricula_aberta',
        data.schoolMetrics.enrollmentWindowOpen,
      ),
      row(
        'escola',
        'series_oferecidas',
        data.schoolMetrics.totalGradesOffered,
      ),
      row(
        'escola',
        'turnos_oferecidos',
        data.schoolMetrics.totalShiftsOffered,
      ),
      row(
        'escola',
        'serie_mais_procurada',
        data.schoolMetrics.mostRequestedGrade,
      ),
      row(
        'escola',
        'turno_mais_procurado',
        data.schoolMetrics.mostRequestedShift,
      ),
    );
  }

  return rows.join('\n');
}
