import { Badge } from '@/shared/components/ui/badge';
import { Clock, MapPin, Star } from 'lucide-react';
import { OpeningStatusBadge } from './OpeningStatusBadge';
import type { GastronomyBusiness } from '../types';
import { getCuisineLabel } from '../constants';

interface Props {
  business: GastronomyBusiness;
}

export function GastronomyHero({ business }: Props) {
  const { gastronomy_profile } = business;

  return (
    <div className="relative">
      {/* Banner */}
      {business.banner_url && (
        <div className="h-64 w-full overflow-hidden">
          <img
            src={business.banner_url}
            alt={business.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Info principal */}
      <div className="container mx-auto px-4">
        <div className="flex items-start gap-6 -mt-16 relative z-10">
          {/* Logo */}
          {business.logo_url && (
            <img
              src={business.logo_url}
              alt={business.name}
              className="w-32 h-32 rounded-lg border-4 border-background object-cover bg-background"
            />
          )}

          {/* Detalhes */}
          <div className="flex-1 pt-16">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{business.name}</h1>
                <p className="text-muted-foreground mb-3">
                  {getCuisineLabel(gastronomy_profile.cuisine_type)}
                </p>
                
                <div className="flex items-center gap-4 flex-wrap">
                  <OpeningStatusBadge openingHours={business.horario_funcionamento} />
                  
                  {business.rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{business.rating.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">
                        ({business.total_reviews})
                      </span>
                    </div>
                  )}

                  <Badge variant="secondary">{gastronomy_profile.price_range}</Badge>
                </div>
              </div>
            </div>

            {/* Badges de serviço */}
            <div className="flex gap-2 mt-4">
              {gastronomy_profile.delivery_enabled && (
                <Badge variant="outline">Entrega</Badge>
              )}
              {gastronomy_profile.takeout_enabled && (
                <Badge variant="outline">Retirada</Badge>
              )}
              {gastronomy_profile.dine_in_enabled && (
                <Badge variant="outline">No local</Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
