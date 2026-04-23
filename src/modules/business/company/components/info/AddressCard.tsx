/**
 * AddressCard
 * 
 * Card de endereço com mapa (ou fallback visual) e botão de rota.
 * Usa StandaloneMap se houver coordenadas, senão exibe card estilizado.
 * 
 * SSOT: Props tipadas vindas de sections/types.ts
 * Sem gambiarras: Componente focado apenas em renderização
 */

import { MapPin, Navigation, ExternalLink, Store } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import StandaloneMap from '@/shared/components/standalone/StandaloneMap';
import { getCoordinates } from '@/core/business/services/business.helpers';
import type { AddressCardProps } from '../../sections/types';

export function AddressCard({
  business,
  addressText,
  locationText,
  onRoute,
}: AddressCardProps) {
  // SSOT: resolve coordenadas por helper canônico (address/location/metadata)
  if (getCoordinates(business)) {
    return <StandaloneMap business={business} />;
  }

  // Fallback: Card com endereço estilizado
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div
        className="relative h-44 sm:h-52 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/20 cursor-pointer group"
        onClick={onRoute}
      >
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`h-${i}`}
              className="absolute border-b border-foreground/20"
              style={{ top: `${(i + 1) * 12}%`, left: 0, right: 0 }}
            />
          ))}
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={`v-${i}`}
              className="absolute border-r border-foreground/20"
              style={{ left: `${(i + 1) * 8}%`, top: 0, bottom: 0 }}
            />
          ))}
        </div>

        {/* Business pin */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <div className="absolute -inset-6 bg-primary/10 rounded-full animate-pulse" />
            <div className="h-10 w-10 bg-primary rounded-full border-2 border-white shadow-lg flex items-center justify-center relative z-10">
              <Store className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-primary" />
          </div>
        </div>

        {/* Open in maps overlay */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-lg shadow-lg inline-flex items-center gap-1">
            <ExternalLink className="h-3 w-3" /> Abrir no mapa
          </span>
        </div>
      </div>

      {/* Address details */}
      <div className="p-5 space-y-3">
        {addressText && (
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">{addressText}</p>
              {locationText && (
                <p className="text-xs text-muted-foreground">{locationText}</p>
              )}
              {typeof business.address === "object" && business.address?.postal_code && (
                <p className="text-xs text-muted-foreground">
                  CEP: {business.address.postal_code}
                </p>
              )}
            </div>
          </div>
        )}
        <Button
          onClick={onRoute}
          variant="outline"
          className="w-full gap-2 rounded-lg border-primary/20 text-primary hover:bg-primary/5"
        >
          <Navigation className="h-4 w-4" /> Traçar rota no Google Maps
        </Button>
      </div>
    </div>
  );
}
