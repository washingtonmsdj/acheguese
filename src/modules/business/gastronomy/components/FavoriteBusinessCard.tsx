/**
 * FavoriteBusinessCard — Card de restaurante favorito
 *
 * Componente específico para a página de favoritos.
 * Recebe FavoriteBusiness diretamente — sem conversão de tipos.
 * Constrói a URL pública transacional via GastronomyUrlService (SSOT).
 */

import { Link } from 'react-router-dom';
import { Star, Truck, UtensilsCrossed } from 'lucide-react';

import type { FavoriteBusiness } from '@/core/business/services/gastronomy.favorites.queries';
import { GastronomyUrlService } from '@/core/verticals/gastronomy/services/GastronomyUrlService';
import { Badge } from '@/shared/components/ui/badge';
import { BusinessLogo } from '@/shared/components/ui/business-logo';
import { getCuisineLabel } from '../constants';

interface FavoriteBusinessCardProps {
  favorite: FavoriteBusiness;
}

export function FavoriteBusinessCard({ favorite: fav }: FavoriteBusinessCardProps) {
  const url =
    fav.business_geographic_path && fav.business_slug
      ? GastronomyUrlService.getPublicDetailUrlFromTerritory(
          fav.business_geographic_path,
          fav.business_slug,
        )
      : null;

  const cuisineLabel = fav.cuisine_type ? getCuisineLabel(fav.cuisine_type) : null;

  const card = (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-territory-border bg-territory-surface text-territory-ink shadow-sm transition-all duration-300 hover:border-territory-brand/35 hover:shadow-md">
      <div className="relative aspect-[16/10] overflow-hidden bg-territory-raised">
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
            <UtensilsCrossed className="h-12 w-12 text-territory-muted" aria-hidden="true" />
          </div>
        )}

        <div className="absolute bottom-3 left-3 h-16 w-16 overflow-hidden rounded-xl border-2 border-territory-surface bg-territory-surface shadow-lg">
          <BusinessLogo
            name={fav.business_name}
            logoUrl={fav.business_logo_url}
            alt={fav.business_name}
            initialsClassName="text-xl"
          />
        </div>

        {fav.price_range ? (
          <div className="absolute right-3 top-3">
            <Badge className="border-0 bg-black/60 text-xs text-white backdrop-blur-sm">
              {fav.price_range}
            </Badge>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <h3 className="line-clamp-2 font-heading text-base font-bold leading-tight transition-colors group-hover:text-territory-brand">
            {fav.business_name}
          </h3>
          {cuisineLabel ? (
            <p className="text-sm leading-tight text-territory-muted">{cuisineLabel}</p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-2">
          {fav.business_rating > 0 ? (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-territory-sun text-territory-sun" aria-hidden="true" />
              <span className="text-sm font-bold">{fav.business_rating.toFixed(1)}</span>
              <span className="text-xs text-territory-muted">
                ({fav.business_total_reviews})
              </span>
            </div>
          ) : null}
          {fav.delivery_enabled ? (
            <div className="flex items-center gap-1 text-xs font-medium text-territory-success">
              <Truck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Delivery</span>
            </div>
          ) : null}
        </div>

        <div className="mt-auto flex w-full items-center justify-center gap-1 rounded-xl border border-territory-border px-3 py-2 text-sm font-semibold text-territory-brand transition-colors group-hover:border-territory-brand group-hover:bg-territory-brand group-hover:text-territory-on-image">
          Ver cardápio
        </div>
      </div>
    </article>
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
