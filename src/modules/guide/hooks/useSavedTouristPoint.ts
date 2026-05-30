import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMultiProfileContext } from '@/core/profiles/contexts/multi-profile-runtime-context';
import { TouristPointSavedService } from '../services/TouristPointSavedService';

function savedTouristPointQueryKey(profileId: string | undefined, touristPointId: string | undefined) {
  return ['guide:tourist-point:saved', profileId, touristPointId] as const;
}

export function useSavedTouristPoint(touristPointId: string | undefined) {
  const queryClient = useQueryClient();
  const { activeProfile } = useMultiProfileContext();
  const profileId = activeProfile?.id;
  const queryKey = savedTouristPointQueryKey(profileId, touristPointId);

  const savedQuery = useQuery({
    queryKey,
    queryFn: () => TouristPointSavedService.isSaved(touristPointId!, profileId!),
    enabled: !!touristPointId && !!profileId,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (!profileId) {
        throw new Error('Entre na sua conta para salvar pontos turisticos.');
      }
      if (!touristPointId) {
        throw new Error('Ponto turistico invalido.');
      }

      if (savedQuery.data) {
        await TouristPointSavedService.remove(touristPointId, profileId);
        return false;
      }

      await TouristPointSavedService.save(touristPointId, profileId);
      return true;
    },
    onSuccess: (isSaved) => {
      queryClient.setQueryData(queryKey, isSaved);
    },
  });

  return {
    canSave: !!profileId,
    isSaved: Boolean(savedQuery.data),
    isLoading: savedQuery.isLoading || toggleMutation.isPending,
    toggleSaved: toggleMutation.mutateAsync,
  };
}
