/**
 * MenuManagementPage - Pagina de gestao do cardapio
 *
 * SSOT: Usa hooks que consomem MenuService.
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBusinessSubscription } from '@/core/billing';
import { useMenuCategories, useMenuItems, useGastronomyMenuId } from '@/modules/gastronomy/hooks';
import { CategoryList, CategoryForm, ItemCard, ItemForm } from '../components/menu';
import { UpgradePromptInline } from '../components';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { ArrowLeft, Plus, Search } from 'lucide-react';
import type { MenuCategory, MenuItem } from '@/core/gastronomy/MenuService';

export default function MenuManagementPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { entitlements, isLoading: loadingSubscription } = useBusinessSubscription(businessId!);

  const { menuId, isLoading: loadingMenuId } = useGastronomyMenuId(businessId);

  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

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
    updateItem,
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

  const handleCreateCategory = () => {
    if (!canUseCategories || !canAddMoreCategories) return;
    setSelectedCategory(null);
    setCategoryFormOpen(true);
  };

  const handleEditCategory = (category: MenuCategory) => {
    setSelectedCategory(category);
    setCategoryFormOpen(true);
  };

  const handleCategorySubmit = (values: Record<string, unknown>) => {
    if (selectedCategory) {
      updateCategory({ categoryId: selectedCategory.id, ...values });
    } else {
      if (!canUseCategories || !canAddMoreCategories) return;
      createCategory(values);
    }
    setCategoryFormOpen(false);
    setSelectedCategory(null);
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (confirm('Tem certeza que deseja deletar esta categoria?')) {
      deleteCategory(categoryId);
    }
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

  const handleItemSubmit = (values: Record<string, unknown>) => {
    const normalizedValues = {
      ...values,
      image_url: canUseImages ? values.image_url : undefined,
      category_id: canUseCategories ? values.category_id : undefined,
    };

    if (selectedItem) {
      updateItem({ itemId: selectedItem.id, ...normalizedValues });
    } else {
      if (!canAddMoreItems) return;
      createItem(normalizedValues);
    }
    setItemFormOpen(false);
    setSelectedItem(null);
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm('Tem certeza que deseja deletar este item?')) {
      deleteItem(itemId);
    }
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
          onClick={() => navigate(`/dashboard/business/${businessId}/gastronomy`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Dashboard
        </Button>
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium mb-2">Nenhum cardapio encontrado</p>
          <p className="text-sm">Configure o perfil gastronomico para criar seu cardapio.</p>
        </div>
      </div>
    );
  }

  if (!entitlements.canUseAdvancedMenu) {
    return (
      <div className="container max-w-6xl py-8 space-y-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/dashboard/business/${businessId}/gastronomy`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Dashboard
        </Button>

        <UpgradePromptInline
          businessId={businessId!}
          feature="Cardapio Avancado"
          requiredPlan="pro"
        />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/dashboard/business/${businessId}/gastronomy`)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Dashboard
        </Button>
        <h1 className="text-3xl font-bold">Gestao de Cardapio</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie categorias, itens, variacoes e adicionais
        </p>
      </div>

      <Tabs defaultValue="items" className="space-y-6">
        <TabsList>
          <TabsTrigger value="items">Itens</TabsTrigger>
          {canUseCategories && <TabsTrigger value="categories">Categorias</TabsTrigger>}
        </TabsList>

        <TabsContent value="items" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Itens do Cardapio</CardTitle>
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
                  Seu plano nao permite imagens nos itens.
                </div>
              )}

              {!canAddMoreItems && (
                <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  Voce atingiu o limite de {entitlements.maxMenuItems} itens. Faca upgrade para adicionar mais.
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
                  onDelete={handleDeleteItem}
                  onToggleAvailability={toggleAvailability}
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
                onDelete={handleDeleteCategory}
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
      />
    </div>
  );
}
