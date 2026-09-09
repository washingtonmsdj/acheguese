/**
 * LiveTrackingMap — Mapa de rastreamento em tempo real.
 * Engine: MapLibre GL JS (via SSOT de mapa).
 */
import { logger } from '@/shared/utils/logger';
import { useEffect, useRef, useState } from 'react';
import * as maplibregl from "maplibre-gl";
import 'maplibre-gl/dist/maplibre-gl.css';
import { useDriverLocation } from '@/modules/mobility/hooks/useDriverLocation';
import { routingService } from '@/core/routing';
import { Car, MapPin, Navigation } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { RIDE_STATUS } from '@/shared/types/constants';
import { DEFAULT_TILE_STYLE } from '@/core/maps/providers/MapProvider';
import { createMapPopupContent } from '@/shared/components/maps/mapPopupContent';
interface LiveTrackingMapProps {
  driverProfileId: string;
  origin: { lat: number; lng: number; address: string };
  destination: { lat: number; lng: number; address: string };
  rideStatus:
    | 'pending'
    | 'driver_assigned'
    | 'driver_on_the_way'
    | 'driver_arrived'
    | 'in_progress'
    | 'completed';
  className?: string;
}

const ON_THE_WAY_STATUSES = new Set<string>([
  RIDE_STATUS.DRIVER_ASSIGNED,
  RIDE_STATUS.DRIVER_ON_THE_WAY,
  RIDE_STATUS.DRIVER_ARRIVED,
]);

function makeSvgMarker(color: string, shape: 'circle' | 'car'): HTMLElement {
  const el = document.createElement('div');
  el.style.cssText = `width:32px;height:32px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;`;
  if (shape === 'car') {
    // ✅ SEGURO - Usa DOM API ao invés de innerHTML
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '18');
    svg.setAttribute('height', '18');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'white');
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M5 17H3v-5l2-5h14l2 5v5h-2m0 0a2 2 0 0 1-4 0m4 0H7m0 0a2 2 0 0 1-4 0');
    
    svg.appendChild(path);
    el.appendChild(svg);
  } else {
    const inner = document.createElement('div');
    inner.style.cssText = 'width:8px;height:8px;background:white;border-radius:50%;';
    el.appendChild(inner);
  }
  return el;
}

export function LiveTrackingMap({
  driverProfileId,
  origin,
  destination,
  rideStatus,
  className,
}: LiveTrackingMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<maplibregl.Map | null>(null);
  const driverMarkerRef = useRef<maplibregl.Marker | null>(null);
  const trajectoryRef   = useRef<[number, number][]>([]);
  const [routeLoaded, setRouteLoaded] = useState(false);

  const { location, loading } = useDriverLocation({ driverProfileId, enabled: true });
  const [statusText, setStatusText] = useState('Aguardando motorista');
  const [speed, setSpeed] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  // ── Carregar rota real ─────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || routeLoaded) return;

    const loadRoute = async () => {
      try {
        const routeResponse = await routingService.calculateRoute({
          origin: { latitude: origin.lat, longitude: origin.lng },
          destination: { latitude: destination.lat, longitude: destination.lng },
          options: {
            profile: 'car',
            alternatives: false,
          },
        });

        const route = routeResponse.primaryRoute;
        const coordinates = route.geometry.map(coord => [coord.longitude, coord.latitude]);

        // Atualizar source de rota planejada com rota real
        const source = map.getSource('planned-route') as maplibregl.GeoJSONSource;
        if (source) {
          source.setData({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates,
            },
            properties: {},
          });
        }

        setRouteLoaded(true);
      } catch (error) {
        logger.error('[LiveTrackingMap] Erro ao carregar rota real:', error);
        // Mantém linha reta como fallback visual
      }
    };

    loadRoute();
  }, [origin.lat, origin.lng, destination.lat, destination.lng, routeLoaded]);

  // ── Inicialização ──────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DEFAULT_TILE_STYLE.styleUrl,
      center: [origin.lng, origin.lat],
      zoom: 14,
      attributionControl: false,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

    map.on('load', () => {
      // Source de trajeto
      map.addSource('trajectory', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} } });
      map.addLayer({ id: 'trajectory-line', type: 'line', source: 'trajectory', paint: { 'line-color': '#14b8a6', 'line-width': 4, 'line-opacity': 0.8 } });

      // Source de rota planejada
      map.addSource('planned-route', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [[origin.lng, origin.lat], [destination.lng, destination.lat]] }, properties: {} },
      });
      map.addLayer({ id: 'planned-route-line', type: 'line', source: 'planned-route', paint: { 'line-color': '#6b7280', 'line-width': 2, 'line-opacity': 0.5, 'line-dasharray': [5, 10] } });

      // Marcadores fixos
      new maplibregl.Marker({ element: makeSvgMarker('#34d399', 'circle') })
        .setLngLat([origin.lng, origin.lat])
        .setPopup(
          new maplibregl.Popup({ closeButton: false }).setDOMContent(
            createMapPopupContent({
              title: 'Origem',
              description: origin.address,
              titleTone: 'success',
              align: 'left',
            }),
          ),
        )
        .addTo(map);

      new maplibregl.Marker({ element: makeSvgMarker('#ef4444', 'circle') })
        .setLngLat([destination.lng, destination.lat])
        .setPopup(
          new maplibregl.Popup({ closeButton: false }).setDOMContent(
            createMapPopupContent({
              title: 'Destino',
              description: destination.address,
              titleTone: 'danger',
              align: 'left',
            }),
          ),
        )
        .addTo(map);

      // Ajustar câmera para cobrir origem e destino
      map.fitBounds(
        [[Math.min(origin.lng, destination.lng), Math.min(origin.lat, destination.lat)],
         [Math.max(origin.lng, destination.lng), Math.max(origin.lat, destination.lat)]],
        { padding: 60 }
      );
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Atualizar posição do motorista ─────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !location) return;

    const lngLat: [number, number] = [location.longitude, location.latitude];
    setSpeed(location.speed ?? null);
    setAccuracy(location.accuracy ?? null);

    // Atualizar ou criar marcador do motorista
    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLngLat(lngLat);
    } else {
      driverMarkerRef.current = new maplibregl.Marker({ element: makeSvgMarker('#14b8a6', 'car') })
        .setLngLat(lngLat)
        .addTo(map);
    }

    // Atualizar trajeto percorrido
    if (rideStatus === RIDE_STATUS.IN_PROGRESS) {
      trajectoryRef.current = [...trajectoryRef.current, lngLat];
      const source = map.getSource('trajectory') as maplibregl.GeoJSONSource | undefined;
      source?.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: trajectoryRef.current }, properties: {} });
    }

    // Centralizar no motorista
    map.easeTo({ center: lngLat, duration: 500 });
  }, [location, rideStatus]);

  // ── Status text ────────────────────────────────────────────────
  useEffect(() => {
    if (rideStatus === RIDE_STATUS.IN_PROGRESS) setStatusText('Viagem em andamento');
    else if (ON_THE_WAY_STATUSES.has(rideStatus)) setStatusText('Motorista a caminho');
    else setStatusText('Aguardando motorista');
  }, [rideStatus]);

  const isActive = rideStatus === RIDE_STATUS.IN_PROGRESS;
  const isOnWay  = ON_THE_WAY_STATUSES.has(rideStatus);

  return (
    <div className={cn('relative rounded-2xl overflow-hidden border border-white/10', className)}>
      <div ref={containerRef} className="w-full h-full" style={{ minHeight: 300 }} />

      {/* Status overlay */}
      <div className="absolute top-4 left-4 right-4 z-10 pointer-events-none">
        <div className="bg-[#1E2529]/95 backdrop-blur-lg border border-white/10 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <div className={cn('w-2 h-2 rounded-full', isActive ? 'bg-emerald-400 animate-pulse' : isOnWay ? 'bg-cyan-400 animate-pulse' : 'bg-gray-400')} />
            <span className="text-xs font-semibold text-white">{statusText}</span>
          </div>
          {location && (
            <div className="mt-2 flex items-center gap-3 text-[10px] text-gray-400">
              {speed !== null && <span className="flex items-center gap-1"><Navigation className="h-3 w-3" />{Math.round(speed)} km/h</span>}
              {accuracy !== null && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />Precisão: {Math.round(accuracy)}m</span>}
            </div>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-[#12181B]/50 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="bg-[#1E2529] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-white">Carregando mapa...</span>
          </div>
        </div>
      )}
    </div>
  );
}
