/**
 * useGastronomySetup — Hook para criação/edição do perfil gastronômico
 *
 * Consome GastronomyProfileService (SSOT).
 * Não acessa Supabase diretamente.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { GastronomyProfileService } from '@/core/gastronomy/GastronomyProfileService';
import type { BusinessCategory } from '@/core/business/types/Business';
import { getBusinessCategoryByBusinessDataId } from '@/modules/gastronomy/services/gastronomy-runtime.queries';
import type {
  CreateGastronomyProfileInput,
  UpdateGastronomyProfileInput,
} from '../types/gastronomy';

export function useGastronomySetup(businessId: string) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Busca perfil existente
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

  // Busca category da empresa para sugestão inteligente
  const { data: businessCategory } = useQuery({
    queryKey: ['business-category', businessId],
    queryFn: async () =>
      (await getBusinessCategoryByBusinessDataId(businessId)) as BusinessCategory | null,
    enabled: !!businessId,
  });

  const isNew = !profile;

  // Mutation de criação
  const createMutation = useMutation({
    mutationFn: (input: CreateGastronomyProfileInput) =>
      GastronomyProfileService.createProfileForBusiness(input),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Perfil gastronômico criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['gastronomy-profile', businessId] });
      queryClient.invalidateQueries({ queryKey: ['gastronomy-status', businessId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Mutation de atualização
  const updateMutation = useMutation({
    mutationFn: (input: UpdateGastronomyProfileInput) =>
      GastronomyProfileService.updateProfile(businessId, input),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Perfil gastronômico atualizado!');
      queryClient.invalidateQueries({ queryKey: ['gastronomy-profile', businessId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const save = async (input: CreateGastronomyProfileInput | UpdateGastronomyProfileInput) => {
    setIsSubmitting(true);
    try {
      if (isNew) {
        await createMutation.mutateAsync(input as CreateGastronomyProfileInput);
      } else {
        await updateMutation.mutateAsync(input as UpdateGastronomyProfileInput);
      }
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
