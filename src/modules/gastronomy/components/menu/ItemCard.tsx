/**
 * ItemCard — Card de item do cardápio
 *
 * Mostra informações do item com ações rápidas
 */

import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Switch } from '@/shared/components/ui/switch';
import { Pencil, Trash2, Image as ImageIcon, Clock } from 'lucide-react';
import type { MenuItem } from '@/core/gastronomy/MenuService';

interface ItemCardProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (itemId: string) => void;
  onToggleAvailability: (itemId: string, isAvailable: boolean) => void;
}

export function ItemCard({
  item,
  onEdit,
  onDelete,
  onToggleAvailability,
}: ItemCardProps) {
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
                    <Badge variant="outline">Indisponível</Badge>
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
                <span className="text-sm text-muted-foreground">
                  Estoque: {item.stock_quantity}
                </span>
              )}
            </div>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Toggle Disponibilidade */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
              <Switch
                checked={item.is_available}
                onCheckedChange={(checked) =>
                  onToggleAvailability(item.id, checked)
                }
              />
              <span className="text-sm text-muted-foreground">
                {item.is_available ? 'Disponível' : 'Indisponível'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
