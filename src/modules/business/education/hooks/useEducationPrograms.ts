import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EducationService } from '../services';
import * as educationQueries from '@/core/education/services/education.queries';
import type { EducationLevel, EducationProgram } from '@/core/education';

export interface EducationProgramQueryOptions {
  includeInactive?: boolean;
}

export function useEducationPrograms(
  profileId?: string,
  options: EducationProgramQueryOptions = {},
) {
  const queryClient = useQueryClient();
  const { includeInactive = false } = options;
  const isActiveFilter = includeInactive ? undefined : true;

  const query = useQuery({
    queryKey: ['education', 'programs', profileId, isActiveFilter],
    queryFn: async () => {
      if (!profileId) return [];
      return educationQueries.listEducationPrograms(profileId, {
        isActive: isActiveFilter,
      });
    },
    enabled: Boolean(profileId),
  });

  const createMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      description?: string;
      ageGroup?: string;
      shift?: string;
      modality?: string;
      availableSlots?: number;
      priceFrom?: number;
      // Campos específicos para escola regular
      educationLevel?: EducationLevel;
      grade?: string;
      className?: string;
      maxCapacity?: number;
      currentEnrollment?: number;
      schedule?: string;
      curriculumTopics?: string[];
    }) => {
      if (!profileId) throw new Error('Profile ID required');
      const created = await EducationService.createProgram(profileId, payload);
      if (!created) throw new Error('Falha ao criar programa');
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education', 'programs', profileId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      programId,
      payload,
    }: {
      programId: string;
      payload: Partial<EducationProgram>;
    }) => {
      const updated = await EducationService.updateProgram(programId, payload);
      if (!updated) throw new Error('Falha ao atualizar programa');
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education', 'programs', profileId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (programId: string) => {
      const removed = await EducationService.deleteProgram(programId);
      if (!removed) throw new Error('Falha ao remover programa');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education', 'programs', profileId] });
    },
  });

  return {
    programs: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
  };
}
