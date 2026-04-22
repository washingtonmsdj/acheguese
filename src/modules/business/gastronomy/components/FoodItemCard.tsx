/**
 * FoodItemCard - Card focado no prato/alimento (food-first)
 */

import { Link } from 'react-router-dom';
import { Badge } from '@/shared/components/ui/badge';
import { normalizePublicTerritoryPath } from '@/core/routing/utils/territoryUrls';
import {
  Star,
  MapPin,
  Truck,
  Clock,
  Leaf,
  Flame,
  ChevronRight,
  UtensilsCrossed,
} from 'lucide-react';
import type { PublicGastronomyFoodItem } from '../types';
import { formatBrl } from '../utils/currency';
import { formatDistance } from '@/shared/utils/geolocation';

interface Props {
  item: PublicGastronomyFoodItem;
  variant?: 'card' | 'compact';
  distanceMeters?: number;
}

export function FoodItemCard({ item, variant = 'card', distanceMeters }: Props) {
  const url = `/gastronomia${normalizePublicTerritoryPath(item.business_geographic_path)}/${item.business_slug}`;
  const distanceLabel =
    typeof distanceMeters === 'number' ? formatDistance(distanceMeters) : null;

  if (variant === 'compact') {
    return (
      <Link to={url} className="block group" aria-label={`Ver cardapio de ${item.business_name}`}>
        <div className="flex gap-3 rounded-xl border border-border/50 bg-card p-2.5 transition-all duration-200 hover:border-primary/30 hover:shadow-md">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-secondary/50">
                <UtensilsCrossed className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            {item.is_promotion && item.original_price && (
              <div className="absolute left-1 top-1 rounded-full bg-destructive px-1.5 py-0.5 text-[9px] font-bold text-destructive-foreground">
                -{Math.round((1 - item.price / item.original_price) * 100)}%
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div>
              <h4 className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">{item.name}</h4>
              <p className="truncate text-xs text-muted-foreground">
                {item.business_name}
                {distanceLabel ? ` - ${distanceLabel}` : ` - ${item.business_neighborhood}`}
              </p>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {item.original_price && (
                  <span className="text-xs text-muted-foreground line-through">{formatBrl(item.original_price)}</span>
                )}
                <span className="text-sm font-bold text-primary">{formatBrl(item.price)}</span>
              </div>

              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium">{item.business_rating.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={url} className="block h-full group" aria-label={`Ver cardapio de ${item.business_name}`}>
      <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border/50 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-xl">
        <div className="relative aspect-[4/3] overflow-hidden">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-secondary/50">
              <UtensilsCrossed className="h-12 w-12 text-muted-foreground" />
            </div>
          )}

          <div className="absolute left-2.5 top-2.5 flex gap-1.5">
            <div
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm ${
                item.business_is_open ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
              }`}
            >
              {item.business_is_open ? 'Aberto' : 'Fechado'}
            </div>
            {item.is_promotion && item.original_price && (
              <div className="rounded-full bg-destructive/90 px-2 py-0.5 text-[10px] font-semibold text-destructive-foreground backdrop-blur-sm">
                -{Math.round((1 - item.price / item.original_price) * 100)}% OFF
              </div>
            )}
          </div>

          <div className="absolute right-2.5 top-2.5 flex flex-col gap-1">
            {item.is_vegan && (
              <Badge className="gap-0.5 border-0 bg-green-600/90 px-1.5 text-[9px] text-white">
                <Leaf className="h-2.5 w-2.5" /> Vegano
              </Badge>
            )}
            {item.is_vegetarian && !item.is_vegan && (
              <Badge className="gap-0.5 border-0 bg-green-500/90 px-1.5 text-[9px] text-white">
                <Leaf className="h-2.5 w-2.5" /> Vegetariano
              </Badge>
            )}
            {item.is_spicy && (
              <Badge className="gap-0.5 border-0 bg-orange-500/90 px-1.5 text-[9px] text-white">
                <Flame className="h-2.5 w-2.5" /> Picante
              </Badge>
            )}
          </div>

          {item.business_delivery_enabled && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-5">
              <div className="flex items-center gap-3 text-[10px] text-white">
                {item.business_delivery_time_min && (
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-3 w-3" />
                    {item.business_delivery_time_min}-{item.business_delivery_time_max} min
                  </span>
                )}
                {item.business_delivery_fee !== undefined && (
                  <span className="flex items-center gap-0.5">
                    <Truck className="h-3 w-3" />
                    {item.business_delivery_fee === 0 ? 'Gratis' : formatBrl(item.business_delivery_fee)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-2.5 sm:gap-2.5 sm:p-3.5">
          <div className="flex min-h-[2.75rem] items-start justify-between gap-2 sm:min-h-[3rem]">
            <h3 className="line-clamp-2 min-h-[2.75rem] text-sm font-bold leading-tight text-foreground transition-colors group-hover:text-primary sm:min-h-[3rem] sm:text-base">
              {item.name}
            </h3>
            <div className="shrink-0 text-right">
              {item.original_price && (
                <span className="block text-[10px] text-muted-foreground line-through sm:text-xs">
                  {formatBrl(item.original_price)}
                </span>
              )}
              <span className="text-sm font-bold text-primary sm:text-base">{formatBrl(item.price)}</span>
            </div>
          </div>

          <p className="line-clamp-2 min-h-[2rem] text-[11px] text-muted-foreground sm:min-h-[2.25rem] sm:text-xs">{item.description}</p>

          <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground sm:text-xs">
            <span className="min-w-0 truncate font-medium text-foreground/80">{item.business_name}</span>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <span className="flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {item.business_rating.toFixed(1)}
              </span>
              <span className="flex max-w-[84px] items-center gap-0.5 truncate sm:max-w-[120px]">
                <MapPin className="h-3 w-3" />
                {distanceLabel ?? item.business_neighborhood}
              </span>
            </div>
          </div>

          <div className="mt-auto flex w-full items-center justify-center gap-1 rounded-lg border border-border px-3 py-2 text-[11px] transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground sm:text-xs">
            Ver cardapio <ChevronRight className="h-3 w-3" />
          </div>
        </div>
      </div>
    </Link>
  );
}

