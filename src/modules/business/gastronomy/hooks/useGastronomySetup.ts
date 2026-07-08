/**
 * useGastronomySetup - Hook para criacao/edicao do perfil gastronomico
 *
 * Consome GastronomyProfileService (SSOT).
 * Nao acessa Supabase diretamente.
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { BusinessCategory } from '@/core/business/types/Business';
import { GastronomyProfileService } from '@/modules/business/gastronomy/services/GastronomyProfileService';
import { getBusinessCategoryByBusinessDataId } from '@/modules/business/gastronomy/services/gastronomy-runtime.queries';
import type {
  CreateGastronomyProfileInput,
  UpdateGastronomyProfileInput,
} from '../types/gastronomy';

export function useGastronomySetup(businessId: string) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: profile,
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ['gastronomy-profile', businessId],
    queryFn: () => GastronomyProfileService.getByBusinessId(businessId),
    enabled: !!businessId,
    select: (result) => result.data,
  });

  const { data: businessCategory } = useQuery({
    queryKey: ['business-category', businessId],
    queryFn: async () =>
      (await getBusinessCategoryByBusinessDataId(businessId)) as BusinessCategory | null,
    enabled: !!businessId,
  });

  const isNew = !profile;

  const createMutation = useMutation({
    mutationFn: (input: CreateGastronomyProfileInput) =>
      GastronomyProfileService.createProfileForBusiness(input),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['gastronomy-profile', businessId] });
      queryClient.invalidateQueries({ queryKey: ['gastronomy-status', businessId] });
      queryClient.invalidateQueries({ queryKey: ['gastronomy-menu-id', businessId] });

      if (result.error && result.data) {
        toast.warning(result.error);
        return;
      }

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Perfil gastronomico criado com sucesso!');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateGastronomyProfileInput) =>
      GastronomyProfileService.updateProfile(businessId, input),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['gastronomy-profile', businessId] });
      queryClient.invalidateQueries({ queryKey: ['gastronomy-menu-id', businessId] });

      if (result.error && result.data) {
        toast.warning(result.error);
        return;
      }

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Perfil gastronomico atualizado!');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const save = async (
    input: CreateGastronomyProfileInput | UpdateGastronomyProfileInput,
  ): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      const result = isNew
        ? await createMutation.mutateAsync(input as CreateGastronomyProfileInput)
        : await updateMutation.mutateAsync(input as UpdateGastronomyProfileInput);

      return Boolean(result.data) || !result.error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    profile,
    businessCategory,
    isLoading,
    isNew,
    isSubmitting,
    fetchError,
    save,
  };
}
