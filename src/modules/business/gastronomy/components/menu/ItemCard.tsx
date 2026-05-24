/**
 * ItemCard — Card de item do cardápio
 */

import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Switch } from '@/shared/components/ui/switch';
import { Pencil, Trash2, Image as ImageIcon, Clock, PackageX } from 'lucide-react';
import type { MenuItem } from '@/modules/business/gastronomy/services/MenuService';

interface ItemCardProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (itemId: string) => void;
  onToggleAvailability: (itemId: string, isAvailable: boolean) => void;
  onMarkSoldOut: (itemId: string) => void;
}

export function ItemCard({
  item,
  onEdit,
  onDelete,
  onToggleAvailability,
  onMarkSoldOut,
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

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="w-24 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden aspect-[4/3]">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium truncate">{item.name}</h4>
                  {item.is_featured && <Badge variant="secondary">Destaque</Badge>}
                  {!item.is_available && <Badge variant="outline">Pausado</Badge>}
                  {isSoldOut && (
                    <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
                      Esgotado
                    </Badge>
                  )}
                  {hasLowStock && (
                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                      Estoque baixo
                    </Badge>
                  )}
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-2">
              <span className="text-lg font-semibold text-primary">R$ {item.price.toFixed(2)}</span>

              {item.preparation_time_min && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {item.preparation_time_min} min
                </div>
              )}

              {item.stock_quantity !== null && (
                <span className={isSoldOut ? 'text-sm font-medium text-red-700' : 'text-sm text-muted-foreground'}>
                  Estoque: {item.stock_quantity}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1 mt-2">
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

            <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t">
              <div className="flex items-center gap-2">
                <Switch
                  checked={item.is_available}
                  onCheckedChange={(checked) => onToggleAvailability(item.id, checked)}
                />
                <span className="text-sm text-muted-foreground">
                  {item.is_available ? 'Disponível para venda' : 'Pausado no cardápio'}
                </span>
              </div>
              {!isSoldOut && (
                <Button type="button" variant="outline" size="sm" onClick={() => onMarkSoldOut(item.id)}>
                  <PackageX className="w-4 h-4 mr-2" />
                  Marcar esgotado
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
