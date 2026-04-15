/**
 * useMenuCategories — Hook para gerenciar categorias do cardápio
 *
 * SSOT: Consome MenuService do core/gastronomy
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MenuService, type MenuCategory } from '@/core/gastronomy/MenuService';
import { toast } from 'sonner';

export function useMenuCategories(menuId: string) {
  const queryClient = useQueryClient();

  // Query: Listar categorias
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['menu-categories', menuId],
    queryFn: async () => {
      const result = await MenuService.listCategories(menuId);
      if (result.error) throw new Error(result.error);
      return result.data || [];
    },
    enabled: !!menuId,
  });

  // Mutation: Criar categoria
  const createMutation = useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string;
      display_order?: number;
    }) => {
      const result = await MenuService.createCategory({
        menu_id: menuId,
        ...input,
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories', menuId] });
      toast.success('Categoria criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar categoria: ${error.message}`);
    },
  });

  // Mutation: Atualizar categoria
  const updateMutation = useMutation({
    mutationFn: async ({
      categoryId,
      ...input
    }: {
      categoryId: string;
      name?: string;
      description?: string;
      display_order?: number;
      is_active?: boolean;
    }) => {
      const result = await MenuService.updateCategory(categoryId, input);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories', menuId] });
      toast.success('Categoria atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar categoria: ${error.message}`);
    },
  });

  // Mutation: Deletar categoria
  const deleteMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const result = await MenuService.deleteCategory(categoryId);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories', menuId] });
      toast.success('Categoria deletada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao deletar categoria: ${error.message}`);
    },
  });

  // Mutation: Reordenar categorias
  const reorderMutation = useMutation({
    mutationFn: async (updates: Array<{ id: string; display_order: number }>) => {
      const result = await MenuService.reorderCategories(updates);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories', menuId] });
      toast.success('Categorias reordenadas com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao reordenar categorias: ${error.message}`);
    },
  });

  return {
    categories,
    isLoading,
    error,
    createCategory: createMutation.mutate,
    updateCategory: updateMutation.mutate,
    deleteCategory: deleteMutation.mutate,
    reorderCategories: reorderMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isReordering: reorderMutation.isPending,
  };
}
