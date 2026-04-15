/**
 * DistanceBadge - Badge de distância
 * 
 * Mostra distância formatada em km ou metros.
 * 
 * @module core/geospatial/components
 */

import React from 'react';
import { Badge } from '@/shared/components/ui/badge';
import { MapPin } from 'lucide-react';

export interface DistanceBadgeProps {
  /** Distância em metros */
  distanceMeters: number;
  /** Mostrar ícone */
  showIcon?: boolean;
  /** Classe CSS adicional */
  className?: string;
}

/**
 * Badge que mostra distância formatada
 * 
 * @example
 * ```tsx
 * <DistanceBadge distanceMeters={1500} />
 * // Exibe: "1.5 km"
 * 
 * <DistanceBadge distanceMeters={500} />
 * // Exibe: "500 m"
 * ```
 */
export function DistanceBadge({
  distanceMeters,
  showIcon = true,
  className = '',
}: DistanceBadgeProps) {
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }

    const km = meters / 1000;
    if (km < 10) {
      return `${km.toFixed(1)} km`;
    }

    return `${Math.round(km)} km`;
  };

  return (
    <Badge variant="outline" className={`text-muted-foreground ${className}`}>
      {showIcon && <MapPin className="w-3 h-3 mr-1" />}
      {formatDistance(distanceMeters)}
    </Badge>
  );
}
