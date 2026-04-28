import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { educationQueries, educationMutations } from '../services';
import type { EducationProgram } from '../types';

export function useEducationPrograms(profileId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['education', 'programs', profileId],
    queryFn: async () => {
      if (!profileId) return [];
      return educationQueries.listEducationPrograms(profileId, { isActive: true });
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
      educationLevel?: string;
      grade?: string;
      className?: string;
      maxCapacity?: number;
      currentEnrollment?: number;
      schedule?: string;
    }) => {
      if (!profileId) throw new Error('Profile ID required');
      const result = await educationMutations.createEducationProgram({
        education_profile_id: profileId,
        name: payload.name,
        description: payload.description ?? null,
        age_group: payload.ageGroup ?? null,
        shift: payload.shift ?? null,
        modality: payload.modality ?? null,
        available_slots: payload.availableSlots ?? null,
        price_from: payload.priceFrom ?? null,
        is_active: true,
        display_order: 0,
        education_level: payload.educationLevel ?? null,
        grade: payload.grade ?? null,
        class_name: payload.className ?? null,
        max_capacity: payload.maxCapacity ?? null,
        current_enrollment: payload.currentEnrollment ?? null,
        schedule: payload.schedule ?? null,
      });
      if (result.error) throw result.error;
      return result.data!;
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
      const result = await educationMutations.updateEducationProgram(programId, payload);
      if (result.error) throw result.error;
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education', 'programs', profileId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (programId: string) => {
      const result = await educationMutations.deleteEducationProgram(programId);
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education', 'programs', profileId] });
    },
  });

  return {
    programs: query.data ?? [],
    isLoading: query.isLoading,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
  };
}
