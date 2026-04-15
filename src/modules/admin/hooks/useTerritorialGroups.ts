/**
 * useTerritorialGroups
 * 
 * Hook para gestão de grupos territoriais no admin
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TerritorialGroupService } from '@/core/territorial/services/TerritorialGroupService';
import { toast } from 'sonner';

const service = new TerritorialGroupService();

export function useTerritorialGroups() {
  const queryClient = useQueryClient();

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['admin', 'territorial-groups'],
    queryFn: () => service.listAllGroups(),
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ groupId, currentStatus }: { groupId: string; currentStatus: string }) => {
      if (currentStatus === 'active') {
        return service.deactivateGroup(groupId);
      } else {
        return service.activateGroup(groupId);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'territorial-groups'] });
      toast.success(
        variables.currentStatus === 'active' 
          ? 'Grupo desativado com sucesso' 
          : 'Grupo ativado com sucesso'
      );
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao alterar status do grupo');
    },
  });

  return {
    groups,
    isLoading,
    toggleStatus: (groupId: string, currentStatus: string) => 
      toggleStatus.mutate({ groupId, currentStatus }),
  };
}
