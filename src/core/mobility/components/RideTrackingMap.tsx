/**
 * RideTrackingMap — Mapa de rastreamento de corrida com localização em tempo real.
 * Engine: MapLibre GL JS (via SSOT de mapa).
 */
import { logger } from '@/shared/utils/logger';
import { memo, useEffect, useRef, useState } from 'react';
import * as maplibregl from "maplibre-gl";
import 'maplibre-gl/dist/maplibre-gl.css';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { MapPin, Navigation, Clock, Loader2, RefreshCw } from 'lucide-react';
import { useDriverLocation } from '@/core/mobility/hooks/useDriverLocation';
import { routingService } from '@/core/routing';
import { cn } from '@/shared/utils/cn';
import { DEFAULT_TILE_STYLE } from '@/core/maps/providers/MapProvider';
interface RideTrackingMapProps {
  driverProfileId: string;
  rideId?: string;
  destinationLat?: number;
  destinationLon?: number;
  originLat?: number;
  originLon?: number;
  className?: string;
  showETA?: boolean;
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
}: RideTrackingMapProps) {
  const containerRef    = useRef<HTMLDivElement>(null);
  const mapRef          = useRef<maplibregl.Map | null>(null);
  const driverMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const { location, eta, loading, error, isConnected, calculateETA, refetch } = useDriverLocation({
    driverProfileId,
    rideId,
    enabled: true,
  });

  // ── Carregar/atualizar rota real somente depois do MapLibre estar pronto ──
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
          (liveMap.getSource('route-real') as maplibregl.GeoJSONSource).setData({
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
              'line-color': '#6366f1',
              'line-width': 4,
              'line-opacity': 0.7,
            },
          }, 'driver-path-line');
        }
      } catch (error) {
        logger.error('[RideTrackingMap] Erro ao carregar rota real:', error);
        // O tracking do motorista continua funcional mesmo se o roteamento falhar.
      }
    };

    void loadRoute();

    return () => {
      cancelled = true;
    };
  }, [mapReady, originLat, originLon, destinationLat, destinationLon]);

  // ── Inicialização ──────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const centerLng = originLon ?? destinationLon ?? -38.476;
    const centerLat = originLat ?? destinationLat ?? -12.975;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DEFAULT_TILE_STYLE.styleUrl,
      center: [centerLng, centerLat],
      zoom: 14,
      attributionControl: false,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

    map.on('load', () => {
      map.addSource('driver-path', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} } });
      map.addLayer({ id: 'driver-path-line', type: 'line', source: 'driver-path', paint: { 'line-color': '#14b8a6', 'line-width': 4, 'line-opacity': 0.8 } });

      if (originLat != null && originLon != null) {
        const el = document.createElement('div');
        el.style.cssText = 'width:24px;height:24px;background:#34d399;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);';
        new maplibregl.Marker({ element: el }).setLngLat([originLon, originLat]).addTo(map);
      }
      if (destinationLat != null && destinationLon != null) {
        const el = document.createElement('div');
        el.style.cssText = 'width:24px;height:24px;background:#ef4444;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);';
        new maplibregl.Marker({ element: el }).setLngLat([destinationLon, destinationLat]).addTo(map);
      }

      if (
        originLat != null &&
        originLon != null &&
        destinationLat != null &&
        destinationLon != null
      ) {
        map.fitBounds(
          [[Math.min(originLon, destinationLon), Math.min(originLat, destinationLat)],
           [Math.max(originLon, destinationLon), Math.max(originLat, destinationLat)]],
          { padding: 60 }
        );
      }

      setMapReady(true);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Atualizar posição do motorista ─────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !location) return;

    const lngLat: [number, number] = [location.longitude, location.latitude];

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLngLat(lngLat);
    } else {
      const el = document.createElement('div');
      el.style.cssText = 'width:32px;height:32px;background:#14b8a6;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;';
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '16');
      svg.setAttribute('height', '16');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'white');

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M5 17H3v-5l2-5h14l2 5v5h-2m0 0a2 2 0 0 1-4 0m4 0H7m0 0a2 2 0 0 1-4 0');

      svg.appendChild(path);
      el.appendChild(svg);
      driverMarkerRef.current = new maplibregl.Marker({ element: el }).setLngLat(lngLat).addTo(map);
    }

    map.easeTo({ center: lngLat, duration: 500 });

    if (destinationLat != null && destinationLon != null) {
      calculateETA(destinationLat, destinationLon);
    }
  }, [location, destinationLat, destinationLon, calculateETA, mapReady]);

  if (loading && !location) {
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

  if (!location) {
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
    <Card className={cn('border border-teal-500/30', className)}>
      <CardContent className="p-0">
        <div className="p-4 border-b border-white/10 bg-gradient-to-r from-teal-500/10 to-cyan-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Navigation className="h-5 w-5 text-teal-400" />
                {isConnected && <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Rastreamento em Tempo Real</h3>
                <p className="text-xs text-gray-400">{isConnected ? 'Conectado' : 'Atualizando...'}</p>
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
        </div>

        <div ref={containerRef} className="w-full h-64" />

        <div className="absolute bottom-12 left-4 flex gap-2 pointer-events-none">
          {location.speed != null && location.speed > 0 && (
            <Badge variant="outline" className="bg-black/80 text-white border-white/20">
              <Navigation className="h-3 w-3 mr-1" />{Math.round(location.speed)} km/h
            </Badge>
          )}
          {location.accuracy != null && (
            <Badge variant="outline" className="bg-black/80 text-white border-white/20">
              ±{Math.round(location.accuracy)}m
            </Badge>
          )}
        </div>

        <div className="p-3 bg-white/5 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-gray-400">Posição atualizada</span>
          <span className="text-gray-500">{new Date(location.timestamp).toLocaleTimeString('pt-BR')}</span>
        </div>
      </CardContent>
    </Card>
  );
});