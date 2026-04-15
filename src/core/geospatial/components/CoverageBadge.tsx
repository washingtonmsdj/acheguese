// @ts-nocheck
/**
 * CoverageBadge - Badge de cobertura geográfica
 * 
 * Mostra se entidade atende a localização do usuário.
 * 
 * @module core/geospatial/components
 */

import React from 'react';
import { Badge } from '@/shared/components/ui/badge';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useCheckCoverage } from '../hooks/useCoverage';
import { useRobustGeolocation } from '@/shared/hooks';
import type { CoverageEntityType } from '../services/CoverageService';

export interface CoverageBadgeProps {
  /** Tipo de entidade */
  entityType: CoverageEntityType;
  /** ID da entidade */
  entityId: string;
  /** Mostrar apenas se tiver cobertura */
  showOnlyIfCovered?: boolean;
  /** Classe CSS adicional */
  className?: string;
}

/**
 * Badge que mostra se entidade atende a região do usuário
 * 
 * @example
 * ```tsx
 * <CoverageBadge
 *   entityType="business"
 *   entityId={business.id}
 * />
 * ```
 */
export function CoverageBadge({
  entityType,
  entityId,
  showOnlyIfCovered = false,
  className = '',
}: CoverageBadgeProps) {
  const { coords, loading: loadingLocation } = useRobustGeolocation({ useCache: true });

  const { data: coverage, isLoading } = useCheckCoverage({
    entityType,
    entityId,
    userLocation: coords,
    enabled: !!coords,
  });

  // Não mostrar se localização não disponível
  if (!coords && !loadingLocation) {
    return null;
  }

  // Loading
  if (loadingLocation || isLoading) {
    return (
      <Badge variant="outline" className={className}>
        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        Verificando...
      </Badge>
    );
  }

  // Tem cobertura
  if (coverage?.has_coverage) {
    return (
      <Badge variant="success" className={`bg-green-100 text-green-800 ${className}`}>
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Atende sua região
      </Badge>
    );
  }

  // Não tem cobertura
  if (!showOnlyIfCovered) {
    return (
      <Badge variant="warning" className={`bg-yellow-100 text-yellow-800 ${className}`}>
        <XCircle className="w-3 h-3 mr-1" />
        Fora da área de cobertura
      </Badge>
    );
  }

  return null;
}
