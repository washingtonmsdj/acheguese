/**
 * useAdminTerritoryManagement
 * 
 * Hook para gestão de visibilidade de territórios no seletor principal.
 * Controla metadata.is_selector_active em locations e territorial_groups.
 * 
 * ✅ SSOT: Database → TerritorialManagementService → Hook → Component
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  TerritorialManagementService,
  type VisibilityFlag,
  type TerritoryNode,
} from '@/core/territorial';

// Re-export types for convenience
export type { VisibilityFlag, TerritoryNode };

export function useAdminTerritoryManagement() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'territory-management'],
    queryFn: () => TerritorialManagementService.fetchTerritoryTree(),
  });

  const toggleLocationMutation = useMutation({
    mutationFn: async ({ id, currentValue }: { id: string; currentValue: boolean }) => {
      console.log('🔄 Toggle location:', id, 'from', currentValue, 'to', !currentValue);
      
      const newValue = !currentValue;
      await TerritorialManagementService.toggleLocationSelector(id, newValue);
      
      console.log('✅ Toggle completed');
      return { id, newValue };
    },
    onMutate: async ({ id, currentValue }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['admin', 'territory-management'] });
      
      // Snapshot previous value
      const previousData = queryClient.getQueryData(['admin', 'territory-management']);
      
      // Optimistically update
      queryClient.setQueryData(['admin', 'territory-management'], (old: any) => {
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
    onError: (err: any, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['admin', 'territory-management'], context.previousData);
      }
      console.error('❌ Mutation error:', err);
      toast.error(err.message || 'Erro ao atualizar visibilidade');
    },
    onSuccess: () => {
      console.log('✅ Mutation success, invalidating queries...');
      
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
      console.log('🔄 Toggle group:', id, 'from', currentValue, 'to', !currentValue);
      
      const newValue = !currentValue;
      await TerritorialManagementService.toggleGroupSelector(id, newValue);
      
      console.log('✅ Toggle completed');
      return { id, newValue };
    },
    onMutate: async ({ id, currentValue }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['admin', 'territory-management'] });
      
      // Snapshot previous value
      const previousData = queryClient.getQueryData(['admin', 'territory-management']);
      
      // Optimistically update
      queryClient.setQueryData(['admin', 'territory-management'], (old: any) => {
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
    onError: (err: any, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['admin', 'territory-management'], context.previousData);
      }
      console.error('❌ Mutation error:', err);
      toast.error(err.message || 'Erro ao atualizar visibilidade do grupo');
    },
    onSuccess: () => {
      console.log('✅ Mutation success, invalidating queries...');
      
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
  };
}
