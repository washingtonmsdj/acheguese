import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Flame, Leaf, MilkOff, WheatOff } from 'lucide-react';
import type { MenuItemWithRelations } from '../types';
import { formatBrl } from '../utils/currency';

interface Props {
  item: MenuItemWithRelations;
  onSelect?: (item: MenuItemWithRelations) => void;
}

export function MenuItemCard({ item, onSelect }: Props) {
  const handleSelect = () => {
    if (!item.is_available || !onSelect) return;
    onSelect(item);
  };

  return (
    <div
      className={`rounded-xl border bg-card p-4 transition-all ${
        item.is_available
          ? 'cursor-pointer hover:border-primary/30 hover:shadow-sm'
          : 'opacity-60'
      }`}
      onClick={handleSelect}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-disabled={!item.is_available}
      onKeyDown={(event) => {
        if (!onSelect) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleSelect();
        }
      }}
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        {item.image_url && (
          <img
            src={item.image_url}
            alt={item.name}
            className="aspect-[4/3] w-full rounded-lg object-cover sm:w-32"
          />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h4 className="line-clamp-2 font-semibold">{item.name}</h4>
                {item.is_featured && (
                  <Badge className="border-amber-500/20 bg-amber-500/10 text-amber-700">
                    Destaque
                  </Badge>
                )}
              </div>

              {item.description && (
                <p className="mb-2 line-clamp-3 text-sm text-muted-foreground">{item.description}</p>
              )}

              <div className="flex flex-wrap gap-2">
                {item.is_vegetarian && (
                  <Badge variant="outline" className="gap-1">
                    <Leaf className="h-3 w-3" />
                    Vegetariano
                  </Badge>
                )}
                {item.is_vegan && (
                  <Badge variant="outline" className="gap-1">
                    <Leaf className="h-3 w-3" />
                    Vegano
                  </Badge>
                )}
                {item.is_gluten_free && (
                  <Badge variant="outline" className="gap-1">
                    <WheatOff className="h-3 w-3" />
                    Sem gluten
                  </Badge>
                )}
                {item.is_lactose_free && (
                  <Badge variant="outline" className="gap-1">
                    <MilkOff className="h-3 w-3" />
                    Sem lactose
                  </Badge>
                )}
                {item.is_spicy && (
                  <Badge variant="outline" className="gap-1">
                    <Flame className="h-3 w-3" />
                    Picante
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
              <p className="mb-0 text-lg font-semibold text-primary sm:mb-2">{formatBrl(item.base_price)}</p>
              <Button
                size="sm"
                disabled={!item.is_available}
                onClick={(event) => {
                  event.stopPropagation();
                  handleSelect();
                }}
              >
                {item.is_available ? 'Adicionar' : 'Indisponivel'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

