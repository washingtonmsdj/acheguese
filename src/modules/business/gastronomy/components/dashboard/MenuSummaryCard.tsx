/**
 * MenuSummaryCard — Card de resumo do cardápio
 *
 * Mostra estatísticas do cardápio.
 * SSOT: Usa useMenuCategories e useMenuItems
 */

import { useGastronomyMenuId, useMenuCategories, useMenuItems } from '../../hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { UtensilsCrossed, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { businessManagementRoutes } from '@/core/business/utils/businessManagementRoutes';

interface MenuSummaryCardProps {
  /** Profile ID usado para navegacao administrativa. */
  businessId: string;
  /** business_data.id usado para resolver o menu persistido. */
  businessDataId: string;
}

export function MenuSummaryCard({ businessId, businessDataId }: MenuSummaryCardProps) {
  const { menuId, isLoading: menuIdLoading } = useGastronomyMenuId(businessDataId);
  const { categories, isLoading: categoriesLoading } = useMenuCategories(menuId ?? '');
  const { items, isLoading: itemsLoading } = useMenuItems(menuId ?? '');

  if (menuIdLoading || categoriesLoading || itemsLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  const totalCategories = categories?.length ?? 0;
  const totalItems = items?.length ?? 0;
  const availableItems = items?.filter((i) => i.is_available).length ?? 0;
  const unavailableItems = totalItems - availableItems;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5" />
          Cardápio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estatísticas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-3xl font-bold">{totalCategories}</p>
            <p className="text-sm text-muted-foreground">Categorias</p>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-3xl font-bold">{totalItems}</p>
            <p className="text-sm text-muted-foreground">Itens</p>
          </div>
        </div>

        {/* Disponibilidade */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Disponíveis:</span>
            <span className="font-medium text-green-600">{availableItems}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Indisponíveis:</span>
            <span className="font-medium text-red-600">{unavailableItems}</span>
          </div>
        </div>

        {/* Link para gestão */}
        <Link to={businessManagementRoutes.gastronomyCardapio(businessId)}>
          <Button variant="outline" className="w-full">
            Gerenciar Cardápio
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
