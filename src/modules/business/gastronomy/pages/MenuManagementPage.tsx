/**
 * MenuManagementPage - Página de gestão do cardápio
 *
 * SSOT: Usa hooks que consomem MenuService.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusinessDashboardContext } from '@/modules/business/dashboard/businessDashboardContext';
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
import { ArrowLeft, LayoutGrid, List, Plus, Search } from 'lucide-react';
import type { MenuCategory, MenuItem } from '@/core/business/services/MenuService';
import { businessManagementRoutes } from '@/core/business/utils/businessManagementRoutes';

export default function MenuManagementPage() {
  const { businessId, businessDataId } = useBusinessDashboardContext();
  const navigate = useNavigate();
  const { entitlements, isLoading: loadingSubscription } =
    useBusinessSubscription(businessDataId);
  const { user } = useSessionContext();

  const { menuId, isLoading: loadingMenuId } = useGastronomyMenuId(businessDataId);
  const { data: gastronomyProfile } = useGastronomyProfile(businessDataId);

  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'paused' | 'soldOut'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
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
      (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (filterStatus === 'all' ||
        (filterStatus === 'soldOut' && item.stock_quantity === 0) ||
        (filterStatus === 'available' && item.is_available && item.stock_quantity !== 0) ||
        (filterStatus === 'paused' && !item.is_available && item.stock_quantity !== 0)),
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
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
                <div className="relative col-span-3 min-w-0 sm:col-span-1 sm:basis-full lg:basis-auto">
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
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Categorias</SelectItem>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Select value={filterStatus} onValueChange={(value: 'all' | 'available' | 'paused' | 'soldOut') => setFilterStatus(value)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Status</SelectItem>
                    <SelectItem value="available">Disponíveis</SelectItem>
                    <SelectItem value="paused">Pausados</SelectItem>
                    <SelectItem value="soldOut">Esgotados</SelectItem>
                  </SelectContent>
                </Select>

                <div className="col-span-1 inline-flex self-start justify-self-end rounded-lg border border-territory-border bg-territory-surface p-1 sm:col-auto sm:self-auto sm:justify-self-auto" aria-label="Modo de visualização">
                  <button
                    type="button"
                    aria-label="Visualizar em lista"
                    aria-pressed={viewMode === 'list'}
                    onClick={() => setViewMode('list')}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand ${viewMode === 'list' ? 'bg-territory-brand text-white' : 'text-territory-muted hover:bg-territory-raised hover:text-territory-ink'}`}
                  >
                    <List className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Visualizar em grade"
                    aria-pressed={viewMode === 'grid'}
                    onClick={() => setViewMode('grid')}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand ${viewMode === 'grid' ? 'bg-territory-brand text-white' : 'text-territory-muted hover:bg-territory-raised hover:text-territory-ink'}`}
                  >
                    <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                <Button onClick={handleCreateItem} disabled={!canAddMoreItems} className="col-span-3 w-full sm:col-auto sm:w-auto">
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
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-2 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6' : 'space-y-4'}>
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
                  layout={viewMode}
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

        {isPizzaria && businessDataId && user && (
          <TabsContent value="pizzaria">
            <PizzaAdminPanel businessId={businessDataId} userId={user.id} />
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
