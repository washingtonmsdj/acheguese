/**
 * useDriverServiceArea
 * 
 * Hook para gerenciar áreas de serviço do motorista
 * Substitui delete direto no banco em ServiceAreaSettings
 * 
 * SSOT: Database → MobilityService → Hook → Component
 */
import { logger } from '@/shared/utils/logger';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteDriverNeighborhood, deleteDriverServiceArea } from '@/core/mobility/services/mobility.mutations';
import { toast } from 'sonner';

export function useDriverServiceArea() {
  const queryClient = useQueryClient();

  const deleteNeighborhood = useMutation({
    mutationFn: (id: string) => deleteDriverNeighborhood(id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['driver-neighborhoods'] });
        toast.success('Bairro removido com sucesso');
      } else {
        logger.error('Erro ao remover bairro', result.error);
        toast.error('Erro ao remover bairro');
      }
    },
    onError: (error) => {
      logger.error('Erro ao remover bairro', error);
      toast.error('Erro ao remover bairro');
    },
  });

  const deleteServiceArea = useMutation({
    mutationFn: ({ table, id }: { table: string; id: string }) => 
      deleteDriverServiceArea(table, id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['driver-service-areas'] });
        toast.success('Área removida com sucesso');
      } else {
        logger.error('Erro ao remover área', result.error);
        toast.error('Erro ao remover área');
      }
    },
    onError: (error) => {
      logger.error('Erro ao remover área', error);
      toast.error('Erro ao remover área');
    },
  });

  return {
    deleteNeighborhood: deleteNeighborhood.mutate,
    deleteServiceArea: deleteServiceArea.mutate,
    isDeleting: deleteNeighborhood.isPending || deleteServiceArea.isPending,
  };
}
