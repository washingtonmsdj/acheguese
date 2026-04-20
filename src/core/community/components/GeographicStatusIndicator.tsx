/**
 * GeographicStatusIndicator - Indicador de status da integração geográfica
 * 
 * Mostra o status da localização ativa e rollout do community.
 * Útil para debug e feedback ao usuário.
 */

import React from 'react';
import { useCommunityLocation, useCommunityRollout } from '../hooks';
import { Badge } from '@/shared/components/ui/badge';
import { MapPin, Shield, AlertCircle, CheckCircle } from 'lucide-react';

interface GeographicStatusIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export function GeographicStatusIndicator({ 
  showDetails = false, 
  className = '' 
}: GeographicStatusIndicatorProps) {
  const location = useCommunityLocation();
  const rollout = useCommunityRollout();

  if (!showDetails && location.hasActiveLocation && rollout.canUseFeatures) {
    // Modo compacto - só mostra quando tudo está OK
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <CheckCircle className="h-4 w-4 text-green-500" />
        <span className="text-sm text-green-500">
          {location.activeLocation?.name}
        </span>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Status da Localização */}
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        <span className="text-sm font-medium">Localização:</span>
        {location.hasActiveLocation ? (
          <Badge variant="default" className="bg-green-100 text-green-800">
            {location.activeLocation?.name} ({location.filterScope})
          </Badge>
        ) : (
          <Badge variant="destructive">
            Não selecionada
          </Badge>
        )}
      </div>

      {/* Status do Rollout */}
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4" />
        <span className="text-sm font-medium">Community:</span>
        {rollout.isLoading ? (
          <Badge variant="secondary">
            Verificando...
          </Badge>
        ) : rollout.canUseFeatures ? (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Ativo ({rollout.rolloutSource?.toLowerCase()})
          </Badge>
        ) : (
          <Badge variant="destructive">
            {rollout.blockReason || 'Inativo'}
          </Badge>
        )}
      </div>

      {/* Detalhes adicionais */}
      {showDetails && (
        <div className="text-xs text-gray-500 space-y-1">
          {location.hasActiveLocation && (
            <div>
              Location ID: {location.activeLocationId}
            </div>
          )}
          {rollout.rollout && (
            <div>
              Rollout: {rollout.rollout.status} 
              {rollout.isInherited && ` (herdado de ${rollout.inheritedFrom})`}
            </div>
          )}
          {rollout.config && (
            <div>
              Config: {JSON.stringify(rollout.config)}
            </div>
          )}
        </div>
      )}

      {/* Mensagem de erro/aviso */}
      {rollout.isBlocked && (
        <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
          <div className="text-sm text-red-700">
            {rollout.blockReason}
          </div>
        </div>
      )}
    </div>
  );
}