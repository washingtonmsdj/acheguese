/**
 * ItemCard — Card de item do cardápio
 *
 * Mostra informações do item com ações rápidas
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
          {/* Imagem */}
          <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            )}
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium truncate">{item.name}</h4>
                  {item.is_featured && (
                    <Badge variant="secondary">Destaque</Badge>
                  )}
                  {!item.is_available && (
                    <Badge variant="outline">Pausado</Badge>
                  )}
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
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(item)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Metadados */}
            <div className="flex items-center gap-4 mt-2">
              <span className="text-lg font-semibold text-primary">
                R$ {item.price.toFixed(2)}
              </span>

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

            {/* Tags e Características Dietéticas */}
            <div className="flex flex-wrap gap-1 mt-2">
              {item.is_vegan && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  🌱 Vegano
                </Badge>
              )}
              {item.is_vegetarian && !item.is_vegan && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
                  🥬 Vegetariano
                </Badge>
              )}
              {item.is_gluten_free && (
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                  🌾 Sem Glúten
                </Badge>
              )}
              {item.is_lactose_free && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  🥛 Sem Lactose
                </Badge>
              )}
              {item.is_spicy && (
                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                  🌶️ Picante
                </Badge>
              )}
              {item.tags && item.tags.length > 0 && item.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Toggle Disponibilidade */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t">
              <div className="flex items-center gap-2">
                <Switch
                  checked={item.is_available}
                  onCheckedChange={(checked) =>
                    onToggleAvailability(item.id, checked)
                  }
                />
                <span className="text-sm text-muted-foreground">
                  {item.is_available ? 'Disponivel para venda' : 'Pausado no cardapio'}
                </span>
              </div>
              {!isSoldOut && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onMarkSoldOut(item.id)}
                >
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


