/**
 * RideTrackingMap — Mapa de rastreamento de corrida com localização em tempo real.
 * Engine: MapLibre GL JS (via SSOT de mapa).
 */
import { logger } from '@/shared/utils/logger';
import { memo, useEffect, useRef, useState } from 'react';
import type { GeoJSONSource, Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { MapPin, Navigation, Clock, Loader2, RefreshCw } from 'lucide-react';
import { useDriverLocation, type DriverLocationData } from '@/core/mobility/hooks/useDriverLocation';
import { routingService } from '@/core/routing';
import { cn } from '@/shared/utils/cn';
import { DEFAULT_CAMERA, DEFAULT_TILE_STYLE } from '@/core/maps/providers/MapProvider';
import { loadMapLibreRuntime } from '@/core/maps/runtime/loadMapLibreRuntime';
import { MOBILITY_MAP_VISUALS } from '@/core/mobility/constants/mapVisuals';
import { createMobilityMapMarkerElement } from '@/core/mobility/utils/createMobilityMapMarkerElement';

interface RideTrackingMapProps {
  driverProfileId: string;
  rideId?: string;
  destinationLat?: number;
  destinationLon?: number;
  originLat?: number;
  originLon?: number;
  className?: string;
  showETA?: boolean;
  compact?: boolean;
  compactFill?: boolean;
  mode?: 'live' | 'snapshot';
  locationOverride?: DriverLocationData;
  compactStatusLabel?: string;
  showSnapshotOverlay?: boolean;
}

type EtaSummary = {
  eta_minutes?: number;
  distance_km?: number;
};

export const RideTrackingMap = memo(function RideTrackingMap({
  driverProfileId,
  rideId,
  destinationLat,
  destinationLon,
  originLat,
  originLon,
  className,
  showETA = true,
  compact = false,
  compactFill = false,
  mode = 'live',
  locationOverride,
  compactStatusLabel,
  showSnapshotOverlay = true,
}: RideTrackingMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const driverMarkerRef = useRef<MapLibreMarker | null>(null);
  const maplibreRuntimeRef = useRef<typeof import('maplibre-gl') | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const { location, eta, loading, error, isConnected, calculateETA, refetch } = useDriverLocation({
    driverProfileId,
    rideId,
    enabled: true,
    subscribe: mode === 'live',
  });
  const displayLocation = locationOverride ?? location;
  const displayIsConnected = Boolean(locationOverride) || isConnected;

  useEffect(() => {
    const map = mapRef.current;
    if (
      !map ||
      !mapReady ||
      originLat == null ||
      originLon == null ||
      destinationLat == null ||
      destinationLon == null
    ) {
      return;
    }

    let cancelled = false;

    const loadRoute = async () => {
      try {
        const routeResponse = await routingService.calculateRoute({
          origin: { latitude: originLat, longitude: originLon },
          destination: { latitude: destinationLat, longitude: destinationLon },
          options: {
            profile: 'car',
            alternatives: false,
          },
        });

        if (cancelled || !mapRef.current) return;

        const route = routeResponse.primaryRoute;
        const coordinates = route.geometry.map(coord => [coord.longitude, coord.latitude]);
        const liveMap = mapRef.current;

        if (liveMap.getSource('route-real')) {
          (liveMap.getSource('route-real') as GeoJSONSource).setData({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates,
            },
            properties: {},
          });
        } else {
          liveMap.addSource('route-real', {
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

          liveMap.addLayer({
            id: 'route-real-line',
            type: 'line',
            source: 'route-real',
            paint: {
              'line-color': MOBILITY_MAP_VISUALS.route.color,
              'line-width': MOBILITY_MAP_VISUALS.route.width,
              'line-opacity': MOBILITY_MAP_VISUALS.route.opacity,
            },
          }, 'driver-path-line');
        }
      } catch (error) {
        logger.error('[RideTrackingMap] Erro ao carregar rota real:', error);
      }
    };

    void loadRoute();

    return () => {
      cancelled = true;
    };
  }, [mapReady, originLat, originLon, destinationLat, destinationLon]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let disposed = false;

    const initializeMap = async () => {
      const maplibregl = await loadMapLibreRuntime();
      if (disposed || !containerRef.current || mapRef.current) return;

      maplibreRuntimeRef.current = maplibregl;
      const centerLng = originLon ?? destinationLon ?? DEFAULT_CAMERA.center[0];
      const centerLat = originLat ?? destinationLat ?? DEFAULT_CAMERA.center[1];

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: DEFAULT_TILE_STYLE.styleUrl,
        center: [centerLng, centerLat],
        zoom: 14,
        attributionControl: false,
      });
      mapRef.current = map;

      map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');
      if (compact) {
        map.addControl(new maplibregl.FullscreenControl(), 'top-right');
      }

      const updateDriverPath = () => {
        const source = map.getSource('driver-path');
        const activeLocation = locationOverride ?? location;
        if (!source || !activeLocation) return;

        const coordinates = [
          originLat != null && originLon != null ? [originLon, originLat] : null,
          [activeLocation.longitude, activeLocation.latitude],
          destinationLat != null && destinationLon != null ? [destinationLon, destinationLat] : null,
        ].filter((coordinate): coordinate is [number, number] => coordinate !== null);

        if (coordinates.length < 2) return;
        (source as GeoJSONSource).setData({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates },
          properties: {},
        });
      };

      map.on('load', () => {
        if (disposed) return;

        map.addSource('driver-path', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: [] },
            properties: {},
          },
        });
        map.addLayer({
          id: 'driver-path-line',
          type: 'line',
          source: 'driver-path',
          paint: {
            'line-color': MOBILITY_MAP_VISUALS.markers.driver.color,
            'line-width': MOBILITY_MAP_VISUALS.route.width,
            'line-opacity': MOBILITY_MAP_VISUALS.route.opacity,
          },
        });

        if (originLat != null && originLon != null) {
          const element = createMobilityMapMarkerElement('origin');
          new maplibregl.Marker({ element }).setLngLat([originLon, originLat]).addTo(map);
        }
        if (destinationLat != null && destinationLon != null) {
          const element = createMobilityMapMarkerElement('destination');
          new maplibregl.Marker({ element }).setLngLat([destinationLon, destinationLat]).addTo(map);
        }

        if (
          originLat != null &&
          originLon != null &&
          destinationLat != null &&
          destinationLon != null
        ) {
          map.fitBounds(
            [
              [Math.min(originLon, destinationLon), Math.min(originLat, destinationLat)],
              [Math.max(originLon, destinationLon), Math.max(originLat, destinationLat)],
            ],
            { padding: 60 },
          );
        }

        setMapReady(true);
        updateDriverPath();
      });
    };

    void initializeMap().catch((error) => {
      if (!disposed) {
        logger.error('[RideTrackingMap] Falha ao inicializar MapLibre:', error);
      }
    });

    return () => {
      disposed = true;
      driverMarkerRef.current?.remove();
      driverMarkerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      maplibreRuntimeRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = maplibreRuntimeRef.current;
    if (!map || !maplibregl || !mapReady || !displayLocation) return;

    const lngLat: [number, number] = [displayLocation.longitude, displayLocation.latitude];

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLngLat(lngLat);
    } else {
      const element = createMobilityMapMarkerElement('driver', 'driver');
      element.style.display = 'flex';
      element.style.alignItems = 'center';
      element.style.justifyContent = 'center';

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '16');
      svg.setAttribute('height', '16');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', MOBILITY_MAP_VISUALS.markerBorder.color);
      svg.setAttribute('stroke-width', '2');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');

      for (const [cx, cy, r] of [[5.5, 17.5, 3.5], [18.5, 17.5, 3.5], [15, 5, 1]]) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', String(cx));
        circle.setAttribute('cy', String(cy));
        circle.setAttribute('r', String(r));
        svg.appendChild(circle);
      }

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M12 17.5V14l-3-3 4-3 2 3h2');

      svg.appendChild(path);
      element.appendChild(svg);
      driverMarkerRef.current = new maplibregl.Marker({ element }).setLngLat(lngLat).addTo(map);
    }

    const driverPathSource = map.getSource('driver-path');
    if (driverPathSource) {
      const coordinates = [
        originLat != null && originLon != null ? [originLon, originLat] : null,
        [displayLocation.longitude, displayLocation.latitude],
        destinationLat != null && destinationLon != null ? [destinationLon, destinationLat] : null,
      ].filter((coordinate): coordinate is [number, number] => coordinate !== null);

      if (coordinates.length >= 2) {
        (driverPathSource as GeoJSONSource).setData({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates },
          properties: {},
        });
      }
    }

    map.easeTo({ center: lngLat, duration: 500 });

    if (destinationLat != null && destinationLon != null) {
      calculateETA(destinationLat, destinationLon);
    }
  }, [calculateETA, destinationLat, destinationLon, displayLocation, mapReady, originLat, originLon]);

  if (loading && !displayLocation) {
    return (
      <Card className={cn('border', className)}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
            <p className="text-sm text-gray-400">Carregando localização...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('border border-red-500/30', className)}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <MapPin className="h-8 w-8 text-red-400" />
            <p className="text-sm text-red-400">Erro ao carregar localização</p>
            <Button size="sm" variant="outline" onClick={refetch}>
              <RefreshCw className="h-4 w-4 mr-2" />Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!displayLocation) {
    return (
      <Card className={cn('border', className)}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <MapPin className="h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-400">Localização não disponível</p>
            <p className="text-xs text-gray-500">O motorista ainda não compartilhou sua localização</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const etaObj: EtaSummary | null = typeof eta === 'object' && eta !== null ? (eta as EtaSummary) : null;

  return (
    <Card className={cn('border border-teal-500/30', compact && 'relative overflow-hidden', compactFill && 'flex min-h-0 flex-1 flex-col', className)}>
      <CardContent className={cn('p-0', compact && 'relative', compactFill && 'flex min-h-0 flex-1 flex-col')}>
        {!compact ? <div className="p-4 border-b border-white/10 bg-gradient-to-r from-teal-500/10 to-cyan-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Navigation className="h-5 w-5 text-teal-400" />
                {isConnected && mode === 'live' && <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {mode === 'snapshot' ? 'Última posição identificada' : 'Rastreamento em Tempo Real'}
                </h3>
                <p className="text-xs text-gray-400">
                  {mode === 'snapshot' ? 'Atualização pausada' : isConnected ? 'Conectado' : 'Atualizando...'}
                </p>
              </div>
            </div>
            {showETA && etaObj && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-teal-400" />
                <div className="text-right">
                  <p className="text-sm font-bold text-teal-400">{etaObj.eta_minutes ?? 0} min</p>
                  <p className="text-xs text-gray-400">{((etaObj.distance_km ?? 0) as number).toFixed(1)} km</p>
                </div>
              </div>
            )}
          </div>
        </div> : null}

        {compact ? (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-3">
            <Badge className="border-0 bg-white/95 text-territory-ink shadow-sm">
              {compactStatusLabel ?? (mode === 'snapshot' ? 'Última posição' : displayIsConnected ? 'Atualizado agora' : 'Aguardando atualização')}
            </Badge>
            {showETA && etaObj ? (
              <Badge className="border-0 bg-white/95 text-territory-ink shadow-sm">
                <Clock className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                {etaObj.eta_minutes ?? 0} min
              </Badge>
            ) : null}
          </div>
        ) : null}

        <div ref={containerRef} className={cn('w-full', compact ? (compactFill ? 'min-h-[18rem] flex-1' : 'h-56 sm:h-60') : 'h-64')} />

        {compact && mode === 'snapshot' && showSnapshotOverlay && displayLocation ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-territory-brand/60 bg-territory-info/5">
              <Badge className="border border-territory-brand/20 bg-white/95 text-[0.625rem] font-semibold text-territory-ink shadow-sm">
                Última posição
              </Badge>
            </div>
          </div>
        ) : null}

        {!compact ? <div className="absolute bottom-12 left-4 flex gap-2 pointer-events-none">
          {displayLocation.speed != null && displayLocation.speed > 0 && (
            <Badge variant="outline" className="bg-black/80 text-white border-white/20">
              <Navigation className="h-3 w-3 mr-1" />{Math.round(displayLocation.speed)} km/h
            </Badge>
          )}
          {displayLocation.accuracy != null && (
            <Badge variant="outline" className="bg-black/80 text-white border-white/20">
              ±{Math.round(displayLocation.accuracy)}m
            </Badge>
          )}
        </div> : null}

        {!compact ? <div className="p-3 bg-white/5 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-gray-400 font-mono">
            {mode === 'snapshot'
              ? 'Última posição identificada'
              : `${displayLocation.latitude.toFixed(6)}, ${displayLocation.longitude.toFixed(6)}`}
          </span>
          <span className="text-gray-500">{new Date(displayLocation.timestamp).toLocaleTimeString('pt-BR')}</span>
        </div> : null}
      </CardContent>
    </Card>
  );
});