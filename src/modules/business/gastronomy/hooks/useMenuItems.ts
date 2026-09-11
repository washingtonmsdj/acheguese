/**
 * useMenuItems — Hook para gerenciar itens do cardápio
 *
 * SSOT: Consome MenuService de core/business.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMenuItem } from '@/core/business/services/menu.queries';
import {
  MenuService,
  type MenuItem,
  type MenuItemsListOptions,
} from '@/core/business/services/MenuService';
import { toast } from 'sonner';

export function useMenuItems(
  menuId: string,
  categoryId?: string,
  options?: MenuItemsListOptions,
) {
  const queryClient = useQueryClient();

  // Query: Listar itens
  const query = useQuery({
    queryKey: [
      'menu-items',
      menuId,
      categoryId,
      options?.page ?? null,
      options?.pageSize ?? null,
      options?.searchQuery ?? null,
      options?.status ?? null,
    ],
    queryFn: async () => {
      const result = await MenuService.listItems(menuId, categoryId, options);
      if (result.error) throw new Error(result.error);
      return {
        items: result.data || [],
        meta: result.meta,
      };
    },
    enabled: !!menuId,
  });

  const items = query.data?.items;

  // Mutation: Criar item
  const createMutation = useMutation({
    mutationFn: async (input: {
      category_id?: string;
      name: string;
      description?: string;
      price: number;
      image_url?: string;
      preparation_time_min?: number;
      stock_quantity?: number;
      stock_alert_threshold?: number;
      is_available?: boolean;
      tags?: string[];
      allergens?: string[];
      nutritional_info?: Record<string, unknown>;
    }) => {
      const result = await MenuService.createItem({
        menu_id: menuId,
        ...input,
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items', menuId] });
      toast.success('Item criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar item: ${error.message}`);
    },
  });

  // Mutation: Atualizar item
  const updateMutation = useMutation({
    mutationFn: async ({
      itemId,
      ...input
    }: {
      itemId: string;
    } & Partial<Omit<MenuItem, 'id' | 'menu_id' | 'created_at' | 'updated_at'>>) => {
      const result = await MenuService.updateItem(itemId, input);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items', menuId] });
      toast.success('Item atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar item: ${error.message}`);
    },
  });

  // Mutation: Deletar item
  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const result = await MenuService.deleteItem(itemId);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items', menuId] });
      toast.success('Item deletado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao deletar item: ${error.message}`);
    },
  });

  // Mutation: Alternar disponibilidade
  const toggleAvailabilityMutation = useMutation({
    mutationFn: async ({ itemId, isAvailable }: { itemId: string; isAvailable: boolean }) => {
      const result = await MenuService.toggleItemAvailability(itemId, isAvailable);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menu-items', menuId] });
      toast.success(variables.isAvailable ? 'Item disponibilizado!' : 'Item pausado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao alterar disponibilidade: ${error.message}`);
    },
  });

  return {
    items,
    totalCount: query.data?.meta?.totalCount ?? items?.length ?? 0,
    hasNextPage: query.data?.meta?.hasMore ?? false,
    isLoading: query.isLoading,
    error: query.error,
    createItem: createMutation.mutate,
    createItemAsync: createMutation.mutateAsync,
    updateItem: updateMutation.mutate,
    updateItemAsync: updateMutation.mutateAsync,
    deleteItem: deleteMutation.mutate,
    toggleAvailability: toggleAvailabilityMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isTogglingAvailability: toggleAvailabilityMutation.isPending,
  };
}

/**
 * useMenuItem — Hook para buscar um item específico
 */
export function useMenuItem(itemId: string | undefined) {
  const { data: item, isLoading, error } = useQuery({
    queryKey: ['menu-item', itemId],
    queryFn: async () => {
      if (!itemId) return null;
      return getMenuItem(itemId);
    },
    enabled: !!itemId,
  });

  return {
    item,
    isLoading,
    error,
  };
}
