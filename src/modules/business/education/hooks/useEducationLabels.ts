/**
 * Education Module - useEducationLabels Hook
 * 
 * Hook para acessar labels específicas do nicho de education.
 * Segue SSOT: labels vêm do registry do nicho.
 */

import { useMemo } from 'react';
import { getNicheOrDefault } from '../niches/registry';
import type { EducationNicheLabels } from '../niches/types';

// Labels padrão (fallback) - em português genérico
const DEFAULT_LABELS: EducationNicheLabels = {
  institutionTypeLabel: 'Tipo de Instituição',
  institutionTypePlaceholder: 'Ex: Escola, Curso, Centro',
  summaryLabel: 'Sobre a Instituição',
  summaryPlaceholder: 'Descreva a instituição...',
  programSingular: 'Programa',
  programPlural: 'Programas',
  programAddButton: 'Adicionar Programa',
  programEmptyState: 'Nenhum programa cadastrado',
  programCapacityLabel: 'Vagas',
  leadSingular: 'Lead',
  leadPlural: 'Leads',
  leadAddButton: 'Adicionar Lead',
  leadEmptyState: 'Nenhum lead cadastrado',
  leadSourceLabel: 'Como conheceu',
  eventSingular: 'Evento',
  eventPlural: 'Eventos',
  eventAddButton: 'Criar Evento',
  eventEmptyState: 'Nenhum evento agendado',
  enrollmentLabel: 'Matrícula',
  enrollmentCTA: 'Quero me matricular',
  gradeLabel: 'Nível',
  shiftLabel: 'Turno',
  ageGroupLabel: 'Faixa Etária',
  dashboardWelcome: 'Bem-vindo',
  dashboardProgramsTitle: 'Programas',
  dashboardLeadsTitle: 'Leads',
  dashboardEventsTitle: 'Eventos',
};

interface UseEducationLabelsReturn {
  labels: EducationNicheLabels;
  isLoading: boolean;
}

/**
 * Hook para obter labels específicas do nicho de education.
 * 
 * @param nicheKey - Chave do nicho (ex: 'regular_school', 'daycare')
 * @returns Labels configuradas para o nicho ou labels padrão
 * 
 * @example
 * const { labels } = useEducationLabels('regular_school');
 * // labels.programSingular = 'Série/Turma'
 * // labels.leadSingular = 'Interessado'
 */
export function useEducationLabels(nicheKey: string | null | undefined): UseEducationLabelsReturn {
  const labels = useMemo(() => {
    if (!nicheKey) {
      return DEFAULT_LABELS;
    }
    
    const niche = getNicheOrDefault(nicheKey);
    return niche.uiLabels ?? DEFAULT_LABELS;
  }, [nicheKey]);

  return {
    labels,
    isLoading: false,
  };
}

/**
 * Hook otimizado que já retorna apenas as labels (sem wrapper).
 * Útil quando só precisa das labels em componentes simples.
 */
export function useLabels(nicheKey: string | null | undefined): EducationNicheLabels {
  const { labels } = useEducationLabels(nicheKey);
  return labels;
}
