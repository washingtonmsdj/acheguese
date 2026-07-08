/**
 * FavoriteBusinessCard — Card de restaurante favorito
 *
 * Componente específico para a página de favoritos.
 * Recebe FavoriteBusiness diretamente — sem conversão de tipos.
 * Constroi a URL publica transacional via GastronomyUrlService (SSOT).
 */

import { Link } from 'react-router-dom';
import { Star, Truck, UtensilsCrossed } from 'lucide-react';

import { Badge } from '@/shared/components/ui/badge';
import { BusinessLogo } from '@/shared/components/ui/business-logo';
import { GastronomyUrlService } from '@/core/verticals/gastronomy/services/GastronomyUrlService';
import { getCuisineLabel } from '../constants';
import type { FavoriteBusiness } from '../services/favorites.queries';

interface FavoriteBusinessCardProps {
  favorite: FavoriteBusiness;
}

export function FavoriteBusinessCard({ favorite: fav }: FavoriteBusinessCardProps) {
  // URL publica transacional via SSOT - so constroi se tiver geographic_path e slug.
  const url =
    fav.business_geographic_path && fav.business_slug
      ? GastronomyUrlService.getPublicDetailUrlFromTerritory(
          fav.business_geographic_path,
          fav.business_slug,
        )
      : null;

  const cuisineLabel = fav.cuisine_type ? getCuisineLabel(fav.cuisine_type) : null;

  const card = (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-border/50 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-xl">
      {/* Banner com logo sobreposta */}
      <div className="relative aspect-[16/10] overflow-hidden bg-secondary/50">
        {fav.business_banner_url ? (
          <img
            src={fav.business_banner_url}
            alt={fav.business_name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <UtensilsCrossed className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Logo sobreposta no canto inferior esquerdo */}
        <div className="absolute bottom-3 left-3 h-16 w-16 overflow-hidden rounded-lg border-2 border-background shadow-lg">
          <BusinessLogo
            name={fav.business_name}
            logoUrl={fav.business_logo_url}
            alt={fav.business_name}
            initialsClassName="text-xl"
          />
        </div>

        {fav.price_range && (
          <div className="absolute right-3 top-3">
            <Badge className="border-0 bg-black/60 text-xs text-white backdrop-blur-sm">
              {fav.price_range}
            </Badge>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <h3 className="line-clamp-2 text-base font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
            {fav.business_name}
          </h3>
          {cuisineLabel && (
            <p className="text-sm leading-tight text-muted-foreground">{cuisineLabel}</p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          {fav.business_rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-bold">{fav.business_rating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">
                ({fav.business_total_reviews})
              </span>
            </div>
          )}
          {fav.delivery_enabled && (
            <div className="flex items-center gap-1 text-xs text-emerald-600">
              <Truck className="h-3.5 w-3.5" />
              <span>Delivery</span>
            </div>
          )}
        </div>

        <div className="mt-auto flex w-full items-center justify-center gap-1 rounded-lg border border-border px-3 py-2 text-sm transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
          Ver cardápio
        </div>
      </div>
    </div>
  );

  if (!url) {
    return <div className="block h-full">{card}</div>;
  }

  return (
    <Link to={url} className="block h-full" aria-label={`Ver ${fav.business_name}`}>
      {card}
    </Link>
  );
}
