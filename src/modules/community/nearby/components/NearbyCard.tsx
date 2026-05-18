/**
 * NearbyCard - Card de entidade próxima com distância
 * 
 * Exibe informações de uma entidade próxima ao usuário.
 * Distingue entre distância GPS real e contexto territorial.
 * 
 * SSOT: Usa resolveDistanceLabel para exibição contextual.
 * 
 * @module features/nearby/components
 */

import React from 'react';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Store, Calendar, AlertTriangle, Landmark, Navigation, Clock, MapPin } from 'lucide-react';
import type { NearbyEntity } from '../hooks/useNearbyEntities';
import { resolveDistanceLabel } from '@/core/location/utils/entityLocationDisplay';

interface NearbyCardProps {
  entity: NearbyEntity;
  onNavigate: (url: string) => void;
}

const ENTITY_CONFIG = {
  business: { 
    emoji: '🏢', 
    label: 'Empresa', 
    baseUrl: '/empresas',
    icon: Store,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  event: { 
    emoji: '📅', 
    label: 'Evento', 
    baseUrl: '/eventos',
    icon: Calendar,
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  alert: { 
    emoji: '⚠️', 
    label: 'Alerta', 
    baseUrl: '/alertas',
    icon: AlertTriangle,
    color: 'bg-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  tourist_point: { 
    emoji: '🏛️', 
    label: 'Ponto Turístico', 
    baseUrl: '/pontos-turisticos',
    icon: Landmark,
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
};

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

function getWalkingTime(meters: number): string {
  // Velocidade média de caminhada: 5 km/h = 83 m/min
  const minutes = Math.round(meters / 83);
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

/**
 * Card de entidade próxima
 * 
 * @example
 * ```tsx
 * <NearbyCard
 *   entity={{
 *     id: '123',
 *     type: 'business',
 *     name: 'Padaria do Bairro',
 *     distance: 350,
 *     latitude: -12.97,
 *     longitude: -38.50,
 *   }}
 *   onNavigate={(url) => navigate(url)}
 * />
 * ```
 */
export function NearbyCard({ entity, onNavigate }: NearbyCardProps) {
  const config = ENTITY_CONFIG[entity.type];
  const Icon = config.icon;
  
  // Determinar se temos distância real (GPS) ou apenas contexto territorial
  const hasRealDistance = entity.distance > 0 && entity.distance < 100000; // <100km = real
  const distance = hasRealDistance ? formatDistance(entity.distance) : null;
  const walkingTime = hasRealDistance ? getWalkingTime(entity.distance) : null;
  const metadata = entity.metadata as Record<string, unknown> | undefined;
  const territoryName =
    (typeof metadata?.neighborhood === "string" ? metadata.neighborhood : null) ||
    (typeof metadata?.city === "string" ? metadata.city : null);
  
  const url = React.useMemo(() => {
    if (entity.type === 'tourist_point') {
      const slug = typeof metadata?.slug === "string" ? metadata.slug : null;
      return `${config.baseUrl}/${slug || entity.id}`;
    }
    if (entity.type === 'business' && typeof metadata?.slug === "string") {
      return `${config.baseUrl}/${metadata.slug}`;
    }
    if (entity.type === 'event' && typeof metadata?.slug === "string") {
      return `${config.baseUrl}/${metadata.slug}`;
    }
    return `${config.baseUrl}/${entity.id}`;
  }, [entity, config.baseUrl]);

  // Badge de tipo de serviço
  const isService =
    metadata?.category === "services" || metadata?.is_mobile_service === true;
  const entityBadge = isService ? 'Serviço' : config.label;

  return (
    <Card 
      className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50"
      onClick={() => onNavigate(url)}
    >
      <div className={`absolute inset-0 ${config.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      
      <div className="relative p-4">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 p-3 rounded-xl ${config.color} text-white shadow-sm`}>
            <Icon className="h-6 w-6" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {entity.name}
              </h3>
              <Badge variant="secondary" className="flex-shrink-0 text-xs">
                {entityBadge}
              </Badge>
            </div>

            {/* Distance info — GPS vs territorial */}
            <div className="flex items-center gap-4 text-sm">
              {hasRealDistance ? (
                <>
                  <div className="flex items-center gap-1.5 text-primary font-semibold">
                    <Navigation className="h-4 w-4" />
                    <span>{distance}</span>
                  </div>
                  {walkingTime && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>🚶 {walkingTime}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{territoryName || 'na região'}</span>
                </div>
              )}

              {/* Badge de serviço móvel */}
              {isService && (
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  Atende na região
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hover indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
    </Card>
  );
}
