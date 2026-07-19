/**
 * MenuManagementPage - Página de gestão do cardápio
 *
 * SSOT: Usa hooks que consomem MenuService.
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBusinessSubscription } from '@/core/billing';
import { useMenuCategories, useMenuItems, useGastronomyMenuId, useGastronomyProfile } from '@/modules/business/gastronomy/hooks';
import { CategoryList, CategoryForm, ItemCard, ItemForm } from '../components/menu';
import { PizzaAdminPanel } from '../niches';
import { UpgradePromptInline } from '../components';
import { useSessionContext } from '@/core/session';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { ConfirmActionDialog } from '@/shared/components/ConfirmActionDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { ArrowLeft, Plus, Search } from 'lucide-react';
import type { MenuCategory, MenuItem } from '@/modules/business/gastronomy/services/MenuService';
import { businessManagementRoutes } from '@/core/business/utils/businessManagementRoutes';

export default function MenuManagementPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { entitlements, isLoading: loadingSubscription } = useBusinessSubscription(businessId!);
  const { user } = useSessionContext();

  const { menuId, isLoading: loadingMenuId } = useGastronomyMenuId(businessId);
  const { data: gastronomyProfile } = useGastronomyProfile(businessId);

  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const {
    categories,
    isLoading: loadingCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    isCreating: creatingCategory,
    isUpdating: updatingCategory,
  } = useMenuCategories(menuId ?? '');

  const {
    items,
    isLoading: loadingItems,
    createItem,
    createItemAsync,
    updateItem,
    updateItemAsync,
    deleteItem,
    toggleAvailability,
    isCreating: creatingItem,
    isUpdating: updatingItem,
  } = useMenuItems(menuId ?? '', filterCategory === 'all' ? undefined : filterCategory);

  const { items: allItems } = useMenuItems(menuId ?? '');

  const canUseCategories = entitlements.canUseMenuCategories;
  const canUseImages = entitlements.canUseMenuImages;
  const categoriesCount = categories?.length || 0;
  const totalItemsCount = allItems?.length || 0;

  const canAddMoreItems =
    entitlements.maxMenuItems === null || totalItemsCount < entitlements.maxMenuItems;

  const canAddMoreCategories =
    entitlements.maxCategories === null || categoriesCount < entitlements.maxCategories;
  const isPizzaria =
    gastronomyProfile?.niche_key === 'pizza' ||
    gastronomyProfile?.cuisine_type === 'pizzaria' ||
    gastronomyProfile?.cuisine_type === 'pizza';

  const handleCreateCategory = () => {
    if (!canUseCategories || !canAddMoreCategories) return;
    setSelectedCategory(null);
    setCategoryFormOpen(true);
  };

  const handleEditCategory = (category: MenuCategory) => {
    setSelectedCategory(category);
    setCategoryFormOpen(true);
  };

  const handleCategorySubmit = (values: { name: string; description?: string; display_order?: number }) => {
    if (selectedCategory) {
      updateCategory({ categoryId: selectedCategory.id, ...values });
    } else {
      if (!canUseCategories || !canAddMoreCategories) return;
      createCategory(values);
    }
    setCategoryFormOpen(false);
    setSelectedCategory(null);
  };

  const handleConfirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    deleteCategory(categoryToDelete);
    setCategoryToDelete(null);
  };

  const handleCreateItem = () => {
    if (!canAddMoreItems) return;
    setSelectedItem(null);
    setItemFormOpen(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setSelectedItem(item);
    setItemFormOpen(true);
  };

  const handleItemSubmit = async (values: {
    name: string;
    price: number;
    description?: string;
    image_url?: string;
    category_id?: string;
    preparation_time_min?: number;
    stock_quantity?: number;
    stock_alert_threshold?: number;
    is_available?: boolean;
    tags?: string[];
    allergens?: string[];
    nutritional_info?: Record<string, unknown>;
  }) => {
    const normalizedValues = {
      ...values,
      image_url: canUseImages ? values.image_url : undefined,
      category_id: canUseCategories ? values.category_id : undefined,
    };

    if (selectedItem) {
      await updateItemAsync({ itemId: selectedItem.id, ...normalizedValues });
    } else {
      if (!canAddMoreItems) return;
      await createItemAsync(normalizedValues);
    }
    setItemFormOpen(false);
    setSelectedItem(null);
    return true;
  };

  const handleConfirmDeleteItem = () => {
    if (!itemToDelete) return;
    deleteItem(itemToDelete);
    setItemToDelete(null);
  };

  const handleMarkItemSoldOut = (itemId: string) => {
    updateItem({ itemId, stock_quantity: 0, is_available: false });
  };

  const filteredItems =
    items?.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  if (loadingSubscription || loadingMenuId) {
    return (
      <div className="container max-w-6xl py-8">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!menuId) {
    return (
      <div className="container max-w-6xl py-8 space-y-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(businessManagementRoutes.gastronomia(businessId!))}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Dashboard
        </Button>
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium mb-2">Nenhum cardápio encontrado</p>
          <p className="text-sm">Configure o perfil gastronômico para criar seu cardápio.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(businessManagementRoutes.gastronomia(businessId!))}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Dashboard
        </Button>
        <h1 className="text-3xl font-bold">Gestão de Cardápio</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie categorias, itens, variações e adicionais
        </p>
      </div>

      {!entitlements.canUseAdvancedMenu && (
        <UpgradePromptInline
          businessId={businessId!}
          feature="Recursos avançados de cardápio"
          offerKey="catalog"
        />
      )}

      <Tabs defaultValue="items" className="space-y-6">
        <TabsList>
          <TabsTrigger value="items">Itens</TabsTrigger>
          {canUseCategories && <TabsTrigger value="categories">Categorias</TabsTrigger>}
          {isPizzaria && <TabsTrigger value="pizzaria">Pizzaria</TabsTrigger>}
        </TabsList>

        <TabsContent value="items" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Itens do Cardápio</CardTitle>
              <CardDescription>
                {totalItemsCount}
                {entitlements.maxMenuItems !== null && ` / ${entitlements.maxMenuItems}`} itens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar itens..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {canUseCategories && (
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Button onClick={handleCreateItem} disabled={!canAddMoreItems}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Item
                </Button>
              </div>

              {!canUseImages && (
                <div className="text-sm text-muted-foreground bg-muted/50 border rounded-lg p-3">
                  Seu plano não permite imagens nos itens.
                </div>
              )}

              {!canAddMoreItems && (
                <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  Você atingiu o limite de {entitlements.maxMenuItems} itens. Faça upgrade para adicionar mais.
                </div>
              )}
            </CardContent>
          </Card>

          {loadingItems ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Carregando itens...</p>
              </CardContent>
            </Card>
          ) : filteredItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'Nenhum item encontrado' : 'Nenhum item cadastrado ainda'}
                </p>
                {!searchQuery && (
                  <Button onClick={handleCreateItem} disabled={!canAddMoreItems}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Item
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onEdit={handleEditItem}
                  onDelete={setItemToDelete}
                  onToggleAvailability={(itemId, isAvailable) =>
                    toggleAvailability({ itemId, isAvailable })
                  }
                  onMarkSoldOut={handleMarkItemSoldOut}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {canUseCategories && (
          <TabsContent value="categories">
            {loadingCategories ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Carregando categorias...</p>
                </CardContent>
              </Card>
            ) : (
              <CategoryList
                categories={categories || []}
                onEdit={handleEditCategory}
                onDelete={setCategoryToDelete}
                onCreate={handleCreateCategory}
                onReorder={reorderCategories}
                canCreate={canAddMoreCategories}
                createDisabledReason={
                  entitlements.maxCategories !== null
                    ? `Limite de ${entitlements.maxCategories} categorias atingido.`
                    : undefined
                }
              />
            )}
          </TabsContent>
        )}

        {isPizzaria && businessId && user && (
          <TabsContent value="pizzaria">
            <PizzaAdminPanel businessId={businessId} userId={user.id} />
          </TabsContent>
        )}
      </Tabs>

      <CategoryForm
        open={categoryFormOpen}
        onClose={() => {
          setCategoryFormOpen(false);
          setSelectedCategory(null);
        }}
        onSubmit={handleCategorySubmit}
        category={selectedCategory}
        isSubmitting={creatingCategory || updatingCategory}
      />

      <ItemForm
        open={itemFormOpen}
        onClose={() => {
          setItemFormOpen(false);
          setSelectedItem(null);
        }}
        onSubmit={handleItemSubmit}
        item={selectedItem}
        categories={categories || []}
        isSubmitting={creatingItem || updatingItem}
        allowCategorySelection={canUseCategories}
        allowImage={canUseImages}
        isPizzaria={isPizzaria}
      />


      <ConfirmActionDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => {
          if (!open) setCategoryToDelete(null);
        }}
        title="Deletar categoria"
        description="A categoria será removida do cardápio. Confira antes se existem itens dependentes dela."
        confirmLabel="Deletar categoria"
        onConfirm={handleConfirmDeleteCategory}
      />

      <ConfirmActionDialog
        open={!!itemToDelete}
        onOpenChange={(open) => {
          if (!open) setItemToDelete(null);
        }}
        title="Deletar item"
        description="O item será removido do cardápio e deixará de aparecer para clientes."
        confirmLabel="Deletar item"
        onConfirm={handleConfirmDeleteItem}
      />
    </div>
  );
}
