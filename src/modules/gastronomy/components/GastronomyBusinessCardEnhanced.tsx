import { Link } from 'react-router-dom';
import { Badge } from '@/shared/components/ui/badge';
import { normalizePublicTerritoryPath } from '@/core/routing/utils/territoryUrls';
import { OpeningHoursService } from '@/core/business/services/OpeningHoursService';
import {
  Star,
  MapPin,
  Clock,
  Truck,
  UtensilsCrossed,
  ChevronRight,
} from 'lucide-react';
import type { GastronomyBusiness } from '../types';
import { getCuisineLabel } from '../constants';
import { formatBrl } from '../utils/currency';
import { resolveGastronomyProximity } from '../utils/proximity';

interface Props {
  business: GastronomyBusiness;
  variant?: 'card' | 'list';
  featured?: boolean;
  distanceMeters?: number;
}

function maybeLink(
  url: string | null,
  label: string,
  child: JSX.Element,
  className: string = 'block',
) {
  if (!url) {
    return <div className={className}>{child}</div>;
  }

  return (
    <Link to={url} className={`${className} group`} aria-label={label}>
      {child}
    </Link>
  );
}

export function GastronomyBusinessCardEnhanced({
  business,
  variant = 'card',
  featured = false,
  distanceMeters,
}: Props) {
  const { gastronomy_profile: gp } = business;
  const neighborhoodName = business.location?.name || 'Regiao nao informada';

  const isOpen = OpeningHoursService.calculateStatus(
    business.horario_funcionamento,
  ).is_open;

  const url =
    business.slug && business.geographic_path
      ? `/gastronomia${normalizePublicTerritoryPath(business.geographic_path)}/${business.slug}`
      : null;

  const userProximity = resolveGastronomyProximity(distanceMeters);

  if (variant === 'list') {
    const listCard = (
      <div className="flex gap-4 overflow-hidden rounded-xl border border-border/50 bg-card p-3 transition-all duration-200 hover:border-primary/30 hover:shadow-lg">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg sm:h-36 sm:w-36">
          {business.banner_url ? (
            <img
              src={business.banner_url}
              alt={business.name}
              loading="lazy"
              decoding="async"
              sizes="(max-width: 640px) 112px, 144px"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-secondary/50">
              <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div
            className={`absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              isOpen ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
            }`}
          >
            {isOpen ? 'Aberto' : 'Fechado'}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
          <div>
            <h3 className="truncate text-base font-bold text-foreground transition-colors group-hover:text-primary">
              {business.name}
            </h3>
            <p className="text-xs leading-tight text-muted-foreground">
              {getCuisineLabel(gp.cuisine_type)}
            </p>
            {userProximity ? (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {userProximity.distanceLabel}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {userProximity.etaLabel}
                </span>
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{neighborhoodName}</span>
              </div>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            {business.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold">{business.rating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({business.total_reviews})</span>
              </div>
            )}
            <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
              {gp.price_range}
            </Badge>
          </div>
        </div>
      </div>
    );

    return maybeLink(url, `Ver estabelecimento ${business.name}`, listCard, 'block');
  }

  const card = (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-xl border border-border/50 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-xl ${
        featured ? 'ring-1 ring-primary/20' : ''
      }`}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {business.banner_url ? (
          <img
            src={business.banner_url}
            alt={business.name}
            loading="lazy"
            decoding="async"
            sizes="(max-width: 768px) 100vw, 320px"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary/50">
            <UtensilsCrossed className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        <div className="absolute left-3 top-3 flex gap-1.5">
          <div
            className={`rounded-full px-2 py-0.5 text-xs font-semibold backdrop-blur-sm ${
              isOpen ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
            }`}
          >
            {isOpen ? 'Aberto' : 'Fechado'}
          </div>
          {featured && (
            <div className="rounded-full bg-primary/90 px-2 py-0.5 text-xs font-semibold text-primary-foreground backdrop-blur-sm">
              Destaque
            </div>
          )}
        </div>

        <div className="absolute right-3 top-3">
          <Badge className="border-0 bg-black/60 text-xs text-white backdrop-blur-sm">{gp.price_range}</Badge>
        </div>

        {gp.delivery_enabled && (gp.delivery_time_min || gp.delivery_fee !== undefined) && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-6">
            <div className="flex items-center gap-3 text-xs text-white">
              {gp.delivery_time_min && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {gp.delivery_time_min}-{gp.delivery_time_max} min
                </span>
              )}
              {gp.delivery_fee !== undefined && gp.delivery_fee !== null && (
                <span className="flex items-center gap-1">
                  <Truck className="h-3 w-3" />
                  {gp.delivery_fee === 0 ? 'Gratis' : formatBrl(gp.delivery_fee)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-h-[3.25rem] space-y-0.5">
          <h3 className="line-clamp-2 text-base font-bold leading-tight text-foreground transition-colors group-hover:text-primary sm:text-lg">
            {business.name}
          </h3>
          <p className="text-sm leading-tight text-muted-foreground">
            {getCuisineLabel(gp.cuisine_type)}
          </p>
        </div>

          <div className="flex min-h-[1.5rem] items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {business.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-bold">{business.rating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">({business.total_reviews})</span>
                </div>
              )}
              <Badge variant="outline" className="h-5 px-1.5 py-0 text-[10px]">
                {gp.price_range}
              </Badge>
            </div>
            {userProximity ? (
              <div className="flex flex-col items-end gap-0.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {userProximity.distanceLabel}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3 shrink-0" />
                  {userProximity.etaLabel}
                </span>
              </div>
            ) : (
              <div className="flex max-w-[45%] items-center gap-1 truncate text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{neighborhoodName}</span>
              </div>
            )}
          </div>

        <div className="mt-auto flex w-full items-center justify-center gap-1 rounded-lg border border-border px-3 py-2 text-sm transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
          Ver cardapio <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );

  return maybeLink(url, `Ver estabelecimento ${business.name}`, card, 'block h-full');
}

