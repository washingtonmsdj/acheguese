/**
 * useMenuAddons — Hook para gerenciar adicionais de itens
 *
 * SSOT: Consome MenuService do modules/business/gastronomy
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MenuService, type MenuItemAddon } from '@/modules/business/gastronomy/services/MenuService';
import { toast } from 'sonner';

export function useMenuAddons(itemId: string) {
  const queryClient = useQueryClient();

  // Query: Listar adicionais
  const { data: addons, isLoading, error } = useQuery({
    queryKey: ['menu-addons', itemId],
    queryFn: async () => {
      const result = await MenuService.listAddons(itemId);
      if (result.error) throw new Error(result.error);
      return result.data || [];
    },
    enabled: !!itemId,
  });

  // Mutation: Criar adicional
  const createMutation = useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string;
      price: number;
      max_quantity?: number;
    }) => {
      const result = await MenuService.createAddon({
        item_id: itemId,
        ...input,
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-addons', itemId] });
      toast.success('Adicional criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar adicional: ${error.message}`);
    },
  });

  // Mutation: Deletar adicional
  const deleteMutation = useMutation({
    mutationFn: async (addonId: string) => {
      const result = await MenuService.deleteAddon(addonId);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-addons', itemId] });
      toast.success('Adicional deletado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao deletar adicional: ${error.message}`);
    },
  });

  return {
    addons,
    isLoading,
    error,
    createAddon: createMutation.mutate,
    deleteAddon: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}



