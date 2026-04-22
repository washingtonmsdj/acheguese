/**
 * useMenuVariations â€” Hook para gerenciar variaÃ§Ãµes de itens
 *
 * SSOT: Consome MenuService do modules/business/gastronomy
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MenuService, type MenuItemVariation } from '@/modules/business/gastronomy/services/MenuService';
import { toast } from 'sonner';

export function useMenuVariations(itemId: string) {
  const queryClient = useQueryClient();

  // Query: Listar variaÃ§Ãµes
  const { data: variations, isLoading, error } = useQuery({
    queryKey: ['menu-variations', itemId],
    queryFn: async () => {
      const result = await MenuService.listVariations(itemId);
      if (result.error) throw new Error(result.error);
      return result.data || [];
    },
    enabled: !!itemId,
  });

  // Mutation: Criar variaÃ§Ã£o
  const createMutation = useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string;
      price_adjustment: number;
    }) => {
      const result = await MenuService.createVariation({
        item_id: itemId,
        ...input,
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-variations', itemId] });
      toast.success('VariaÃ§Ã£o criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar variaÃ§Ã£o: ${error.message}`);
    },
  });

  // Mutation: Deletar variaÃ§Ã£o
  const deleteMutation = useMutation({
    mutationFn: async (variationId: string) => {
      const result = await MenuService.deleteVariation(variationId);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-variations', itemId] });
      toast.success('VariaÃ§Ã£o deletada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao deletar variaÃ§Ã£o: ${error.message}`);
    },
  });

  return {
    variations,
    isLoading,
    error,
    createVariation: createMutation.mutate,
    deleteVariation: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}



