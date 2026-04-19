/**
 * RouteLayer - Componente para renderizar rotas no mapa
 * 
 * Consome core/routing para cálculo de rotas e renderiza no MapLibreAdapter.
 * 
 * @module core/maps/components/v3
 */
import { logger } from '@/shared/utils/logger';
import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { routingService } from '@/core/routing';
import type { RouteRequest, TransportProfile } from '@/core/routing/types';
import type { Coordinates } from '@/core/maps/types';
interface RouteLayerProps {
  /** ID do mapa MapLibre */
  mapId: string;
  /** Requisição de rota */
  routeRequest?: RouteRequest;
  /** Origem e destino para rota simples */
  origin?: Coordinates;
  destination?: Coordinates;
  /** Perfil de transporte (padrão: car) */
  profile?: TransportProfile;
  /** Cor da linha da rota (padrão: #3b82f6) */
  lineColor?: string;
  /** Largura da linha (padrão: 4) */
  lineWidth?: number;
  /** Opacidade da linha (padrão: 0.8) */
  lineOpacity?: number;
  /** Callback quando rota é calculada */
  onRouteCalculated?: (route: any) => void;
  /** Callback quando ocorre erro */
  onError?: (error: Error) => void;
}

/**
 * Componente para renderizar rotas no mapa
 * 
 * @example
 * ```tsx
 * <RouteLayer
 *   mapId="main-map"
 *   origin={{ latitude: -12.9714, longitude: -38.5014 }}
 *   destination={{ latitude: -12.9800, longitude: -38.5100 }}
 *   profile="car"
 *   lineColor="#3b82f6"
 * />
 * ```
 */
export function RouteLayer({
  mapId,
  routeRequest,
  origin,
  destination,
  profile = 'car',
  lineColor = '#3b82f6',
  lineWidth = 4,
  lineOpacity = 0.8,
  onRouteCalculated,
  onError,
}: RouteLayerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const routeSourceRef = useRef<string | null>(null);

  useEffect(() => {
    const map = (window as any)[`maplibre-map-${mapId}`] as maplibregl.Map;
    if (!map) {
      logger.warn(`[RouteLayer] Mapa ${mapId} não encontrado`);
      return;
    }

    const calculateAndRenderRoute = async () => {
      setLoading(true);
      setError(null);

      try {
        let request: RouteRequest;
        
        if (routeRequest) {
          request = routeRequest;
        } else if (origin && destination) {
          request = {
            origin,
            destination,
            options: { profile },
          };
        } else {
          throw new Error('Nenhuma requisição de rota fornecida');
        }

        const response = await routingService.calculateRoute(request);
        const route = response.primaryRoute;
        
        // Converter coordenadas para formato [lng, lat]
        const coordinates = route.geometry.map(coord => [coord.longitude, coord.latitude]);
        
        // Criar ou atualizar source da rota
        const sourceId = `route-${mapId}`;
        routeSourceRef.current = sourceId;
        
        if (map.getSource(sourceId)) {
          // Atualizar source existente
          const source = map.getSource(sourceId) as maplibregl.GeoJSONSource;
          source.setData({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates,
            },
            properties: {},
          });
        } else {
          // Criar novo source
          map.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates,
              },
              properties: {},
            },
          });
          
          // Criar layer
          map.addLayer({
            id: `route-layer-${mapId}`,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': lineColor,
              'line-width': lineWidth,
              'line-opacity': lineOpacity,
            },
          });
        }
        
        onRouteCalculated?.(route);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao calcular rota';
        setError(errorMessage);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
        logger.error('[RouteLayer] Erro:', err);
      } finally {
        setLoading(false);
      }
    };

    calculateAndRenderRoute();

    // Cleanup
    return () => {
      if (routeSourceRef.current) {
        const sourceId = routeSourceRef.current;
        const layerId = `route-layer-${mapId}`;
        
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
        
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      }
    };
  }, [mapId, routeRequest, origin, destination, profile, lineColor, lineWidth, lineOpacity, onRouteCalculated, onError]);

  // Componente não renderiza nada visualmente
  return null;
}