/**
 * useAdminTerritoryManagement
 * 
 * Hook para gestão de visibilidade de territórios no seletor principal.
 * Controla metadata.is_selector_active em locations e territorial_groups.
 * 
 * ✅ SSOT: Database → TerritorialManagementService → Hook → Component
 */
import { logger } from '@/shared/utils/logger';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase';
import { RolloutService } from '@/core/rollout/services/RolloutService';
import { createRolloutRepository } from '@/core/rollout/repositories/createRolloutRepository';
import { createLocationRepository } from '@/core/location/repositories/createLocationRepository';
import { ModuleKey, RolloutStatus, RolloutSource } from '@/core/rollout/types';
import { communityRolloutService } from '@/core/community/services';
import {
  TerritorialManagementService,
  type VisibilityFlag,
  type TerritoryNode,
} from '@/core/territorial';
// Re-export types for convenience
export type { VisibilityFlag, TerritoryNode };

type DistrictCommunityMetric = {
  residentsCount: number;
  isCommunityEnabled: boolean;
  source: RolloutSource;
};

type TerritoryManagementData = Awaited<
  ReturnType<typeof TerritorialManagementService.fetchTerritoryTree>
>;

export function useAdminTerritoryManagement() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'territory-management'],
    queryFn: () => TerritorialManagementService.fetchTerritoryTree(),
  });

  const districtIds =
    data?.locations
      ?.filter((location: TerritoryNode) => location.type === 'district')
      .map((location: TerritoryNode) => location.id) ?? [];

  const { data: districtCommunityMetrics = new Map<string, DistrictCommunityMetric>() } = useQuery({
    queryKey: ['admin', 'community-district-metrics', districtIds],
    enabled: districtIds.length > 0,
    queryFn: async () => {
      const rolloutService = new RolloutService(createRolloutRepository(), createLocationRepository());

      const [rollouts, residencesResult] = await Promise.all([
        Promise.all(
          districtIds.map(async (districtId) => {
            const effective = await rolloutService.getEffectiveRollout({
              module_key: ModuleKey.COMMUNITY,
              location_id: districtId,
            });
            return [districtId, effective.effective_rollout] as const;
          })
        ),
        supabase
          .from('user_residences')
          .select('location_id')
          .eq('is_primary', true)
          .in('location_id', districtIds),
      ]);

      if (residencesResult.error) {
        throw residencesResult.error;
      }

      const residentsCountByDistrict = new Map<string, number>();
      for (const row of residencesResult.data ?? []) {
        const locationId = row.location_id as string | null;
        if (!locationId) continue;
        residentsCountByDistrict.set(locationId, (residentsCountByDistrict.get(locationId) ?? 0) + 1);
      }

      const map = new Map<string, DistrictCommunityMetric>();
      for (const [districtId, rollout] of rollouts) {
        map.set(districtId, {
          residentsCount: residentsCountByDistrict.get(districtId) ?? 0,
          isCommunityEnabled: rollout.status === RolloutStatus.ACTIVE,
          source: rollout.source,
        });
      }

      return map;
    },
    staleTime: 60_000,
  });

  const toggleCommunityRolloutMutation = useMutation({
    mutationFn: async ({ districtId, enabled }: { districtId: string; enabled: boolean }) => {
      await communityRolloutService.setCommunityEnabled(districtId, enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'community-district-metrics'] });
      toast.success('Rollout da comunidade atualizado para o bairro');
    },
    onError: (err: unknown) => {
      logger.error('Erro ao atualizar rollout de comunidade por bairro', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar rollout da comunidade');
    },
  });

  const toggleLocationMutation = useMutation({
    mutationFn: async ({ id, currentValue }: { id: string; currentValue: boolean }) => {
      logger.debug('🔄 Toggle location:', id, 'from', currentValue, 'to', !currentValue);
      
      const newValue = !currentValue;
      await TerritorialManagementService.toggleLocationSelector(id, newValue);
      
      logger.debug('✅ Toggle completed');
      return { id, newValue };
    },
    onMutate: async ({ id, currentValue }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['admin', 'territory-management'] });
      
      // Snapshot previous value
      const previousData = queryClient.getQueryData<TerritoryManagementData>(['admin', 'territory-management']);
      
      // Optimistically update
      queryClient.setQueryData<TerritoryManagementData>(['admin', 'territory-management'], (old) => {
        if (!old) return old;
        
        return {
          ...old,
          locations: old.locations.map((loc: TerritoryNode) =>
            loc.id === id ? { ...loc, is_selector_active: !currentValue } : loc
          ),
        };
      });
      
      return { previousData };
    },
    onError: (err: unknown, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['admin', 'territory-management'], context.previousData);
      }
      logger.error('❌ Mutation error:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar visibilidade');
    },
    onSuccess: () => {
      logger.debug('✅ Mutation success, invalidating queries...');
      
      // Pequeno delay para garantir que o banco foi atualizado
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'territory-management'] });
        queryClient.invalidateQueries({ queryKey: ['selector-territories'] });
      }, 100);
      
      toast.success('Visibilidade no seletor atualizada');
    },
  });

  const toggleGroupMutation = useMutation({
    mutationFn: async ({ id, currentValue }: { id: string; currentValue: boolean }) => {
      logger.debug('🔄 Toggle group:', id, 'from', currentValue, 'to', !currentValue);
      
      const newValue = !currentValue;
      await TerritorialManagementService.toggleGroupSelector(id, newValue);
      
      logger.debug('✅ Toggle completed');
      return { id, newValue };
    },
    onMutate: async ({ id, currentValue }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['admin', 'territory-management'] });
      
      // Snapshot previous value
      const previousData = queryClient.getQueryData<TerritoryManagementData>(['admin', 'territory-management']);
      
      // Optimistically update
      queryClient.setQueryData<TerritoryManagementData>(['admin', 'territory-management'], (old) => {
        if (!old) return old;
        
        return {
          ...old,
          groups: old.groups.map((grp: TerritoryNode) =>
            grp.id === id ? { ...grp, is_selector_active: !currentValue } : grp
          ),
        };
      });
      
      return { previousData };
    },
    onError: (err: unknown, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['admin', 'territory-management'], context.previousData);
      }
      logger.error('❌ Mutation error:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar visibilidade do grupo');
    },
    onSuccess: () => {
      logger.debug('✅ Mutation success, invalidating queries...');
      
      // Pequeno delay para garantir que o banco foi atualizado
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'territory-management'] });
        queryClient.invalidateQueries({ queryKey: ['selector-territories'] });
      }, 100);
      
      toast.success('Visibilidade do grupo no seletor atualizada');
    },
  });

  // Generic flag toggle for locations
  const toggleLocationFlag = async (id: string, flag: VisibilityFlag, currentValue: boolean) => {
    await TerritorialManagementService.updateMetadataFlag('locations', id, flag, !currentValue);
    
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'territory-management'] });
      queryClient.invalidateQueries({ queryKey: ['selector-territories'] });
    }, 100);
    toast.success('Visibilidade atualizada');
  };

  const toggleGroupFlag = async (id: string, flag: VisibilityFlag, currentValue: boolean) => {
    await TerritorialManagementService.updateMetadataFlag('territorial_groups', id, flag, !currentValue);
    
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'territory-management'] });
      queryClient.invalidateQueries({ queryKey: ['selector-territories'] });
    }, 100);
    toast.success('Visibilidade atualizada');
  };

  return {
    locations: data?.locations || [],
    groups: data?.groups || [],
    groupMembers: data?.groupMembers || new Map(),
    isLoading,
    error,
    toggleLocationSelector: (id: string, currentValue: boolean) => {
      toggleLocationMutation.mutate({ id, currentValue });
    },
    toggleGroupSelector: (id: string, currentValue: boolean) => {
      toggleGroupMutation.mutate({ id, currentValue });
    },
    toggleLocationFlag,
    toggleGroupFlag,
    isToggling: toggleLocationMutation.isPending || toggleGroupMutation.isPending,
    districtCommunityMetrics,
    toggleCommunityRollout: (districtId: string, enabled: boolean) =>
      toggleCommunityRolloutMutation.mutate({ districtId, enabled }),
    isTogglingCommunityRollout: toggleCommunityRolloutMutation.isPending,
  };
}
