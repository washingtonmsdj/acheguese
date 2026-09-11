/**
 * ItemCard — Card de item do cardápio
 */

import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Switch } from '@/shared/components/ui/switch';
import { Pencil, Trash2, Image as ImageIcon, Clock, PackageX } from 'lucide-react';
import type { MenuItem } from '@/core/business/services/MenuService';
import { formatBrl } from '../../utils/currency';

interface ItemCardProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (itemId: string) => void;
  onToggleAvailability: (itemId: string, isAvailable: boolean) => void;
  onMarkSoldOut: (itemId: string) => void;
  layout?: 'list' | 'grid';
}

export function ItemCard({
  item,
  onEdit,
  onDelete,
  onToggleAvailability,
  onMarkSoldOut,
  layout = 'list',
}: ItemCardProps) {
  const nutritionalInfo =
    item.nutritional_info && typeof item.nutritional_info === 'object'
      ? (item.nutritional_info as Record<string, unknown>)
      : {};

  const isVegan = nutritionalInfo.is_vegan === true;
  const isVegetarian = nutritionalInfo.is_vegetarian === true;
  const isGlutenFree = nutritionalInfo.is_gluten_free === true;
  const isLactoseFree = nutritionalInfo.is_lactose_free === true;
  const isSpicy = nutritionalInfo.is_spicy === true;

  const isSoldOut = item.stock_quantity === 0;
  const hasLowStock =
    typeof item.stock_quantity === 'number' &&
    typeof item.stock_alert_threshold === 'number' &&
    item.stock_quantity > 0 &&
    item.stock_quantity <= item.stock_alert_threshold;
  const isGrid = layout === 'grid';

  return (
    <Card className={isGrid ? 'h-full' : undefined}>
      <CardContent className={isGrid ? 'h-full p-2 sm:p-4' : 'p-4'}>
        <div className={isGrid ? 'flex h-full flex-col gap-2' : 'flex gap-4'}>
          <div className={isGrid ? 'aspect-[5/3] w-full flex-shrink-0 overflow-hidden rounded-lg bg-muted sm:aspect-[4/3]' : 'aspect-[4/3] w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted'}>
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className={isGrid ? 'mb-1 flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2' : 'mb-1 flex flex-wrap items-center gap-1 sm:gap-2'}>
                  <h4 className={isGrid ? 'truncate text-xs font-semibold sm:text-base' : 'truncate font-medium'}>{item.name}</h4>
                  {item.is_featured && <Badge variant="secondary" className={isGrid ? 'text-[0.625rem]' : undefined}>Destaque</Badge>}
                  {!item.is_available && <Badge variant="outline" className={isGrid ? 'text-[0.625rem]' : undefined}>Pausado</Badge>}
                  {isSoldOut && (
                    <Badge variant="outline" className={isGrid ? 'border-red-200 bg-red-50 text-[0.625rem] text-red-700' : 'border-red-200 bg-red-50 text-red-700'}>
                      Esgotado
                    </Badge>
                  )}
                  {hasLowStock && (
                    <Badge variant="outline" className={isGrid ? 'border-amber-200 bg-amber-50 text-[0.625rem] text-amber-700' : 'border-amber-200 bg-amber-50 text-amber-700'}>
                      Estoque baixo
                    </Badge>
                  )}
                </div>
                {item.description && (
                  <p className={isGrid ? 'line-clamp-2 text-[0.6875rem] leading-4 text-muted-foreground sm:text-sm sm:leading-5' : 'line-clamp-2 text-sm text-muted-foreground'}>{item.description}</p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                <Button variant="ghost" size="sm" aria-label={`Editar ${item.name}`} onClick={() => onEdit(item)} className={isGrid ? 'h-9 w-9 p-0' : undefined}>
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button variant="ghost" size="sm" aria-label={`Excluir ${item.name}`} onClick={() => onDelete(item.id)} className={isGrid ? 'h-9 w-9 p-0' : undefined}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>

            <div className={isGrid ? 'mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 sm:gap-4' : 'mt-2 flex items-center gap-4'}>
              <span className={isGrid ? 'text-sm font-semibold text-primary sm:text-lg' : 'text-lg font-semibold text-primary'}>{formatBrl(item.price)}</span>

              {item.preparation_time_min && (
                <div className={isGrid ? 'flex items-center gap-1 text-[0.6875rem] text-muted-foreground sm:text-sm' : 'flex items-center gap-1 text-sm text-muted-foreground'}>
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  {item.preparation_time_min} min
                </div>
              )}

              {item.stock_quantity !== null && (
                <span className={isGrid ? (isSoldOut ? 'text-[0.6875rem] font-medium text-red-700 sm:text-sm' : 'text-[0.6875rem] text-muted-foreground sm:text-sm') : (isSoldOut ? 'text-sm font-medium text-red-700' : 'text-sm text-muted-foreground')}>
                  Estoque: {item.stock_quantity}
                </span>
              )}
            </div>

            <div className={isGrid ? 'mt-2 hidden flex-wrap gap-1 sm:flex' : 'mt-2 flex flex-wrap gap-1'}>
              {isVegan && <Badge variant="outline" className="text-xs">Vegano</Badge>}
              {isVegetarian && !isVegan && <Badge variant="outline" className="text-xs">Vegetariano</Badge>}
              {isGlutenFree && <Badge variant="outline" className="text-xs">Sem gluten</Badge>}
              {isLactoseFree && <Badge variant="outline" className="text-xs">Sem lactose</Badge>}
              {isSpicy && <Badge variant="outline" className="text-xs">Picante</Badge>}
              {item.tags && item.tags.length > 0 && item.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className={isGrid ? 'mt-auto flex items-center justify-between gap-2 border-t pt-2 sm:mt-3 sm:gap-3 sm:pt-3' : 'mt-3 flex flex-wrap items-center justify-between gap-3 border-t pt-3'}>
              <div className="flex items-center gap-2">
                <Switch
                  aria-label={`${item.is_available ? 'Desativar' : 'Ativar'} disponibilidade de ${item.name}`}
                  checked={item.is_available}
                  onCheckedChange={(checked) => onToggleAvailability(item.id, checked)}
                />
                <span className={isGrid ? 'sr-only sm:not-sr-only sm:text-sm sm:text-muted-foreground' : 'text-sm text-muted-foreground'}>
                  {item.is_available ? 'Disponível para venda' : 'Pausado no cardápio'}
                </span>
              </div>
              {!isSoldOut && (
                <Button type="button" variant="outline" size="sm" aria-label={`Marcar ${item.name} como esgotado`} onClick={() => onMarkSoldOut(item.id)} className={isGrid ? 'h-9 w-9 p-0 sm:h-9 sm:w-auto sm:px-3' : undefined}>
                  <PackageX className="h-4 w-4 sm:mr-2" aria-hidden="true" />
                  <span className={isGrid ? 'hidden sm:inline' : undefined}>Marcar esgotado</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
