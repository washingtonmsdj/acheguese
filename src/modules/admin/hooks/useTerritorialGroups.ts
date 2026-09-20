/**
 * useTerritorialGroups
 *
 * Hook para gestão de grupos territoriais no admin.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listAdminTerritorialGroups,
  territorialGroupAdminService,
} from '@/core/territorial';
import { toast } from 'sonner';

export function useTerritorialGroups() {
  const queryClient = useQueryClient();

  const {
    data: groups = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'territorial-groups'],
    queryFn: listAdminTerritorialGroups,
    retry: 1,
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ groupId, currentStatus }: { groupId: string; currentStatus: string }) => {
      return territorialGroupAdminService.setStatus(
        groupId,
        currentStatus === 'active' ? 'inactive' : 'active',
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'territorial-groups'] });
      toast.success(
        variables.currentStatus === 'active'
          ? 'Grupo desativado com sucesso'
          : 'Grupo ativado com sucesso',
      );
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'Erro ao alterar status do grupo';
      toast.error(message);
    },
  });

  return {
    groups,
    isLoading,
    error: error instanceof Error ? error : null,
    refetch,
    togglingGroupId: toggleStatus.isPending ? toggleStatus.variables?.groupId ?? null : null,
    toggleStatus: (groupId: string, currentStatus: string) =>
      toggleStatus.mutate({ groupId, currentStatus }),
  };
}
