/**
 * MiniMap — Componente de mapa pequeno reutilizável
 *
 * Usa MapLibre GL JS com DEFAULT_TILE_STYLE (SSOT do MapProvider).
 */

import { useEffect, useRef } from 'react';
import * as maplibregl from "maplibre-gl";
import 'maplibre-gl/dist/maplibre-gl.css';
import { DEFAULT_TILE_STYLE } from '@/shared/config/mapDefaults';
import { createMapPopupContent } from './mapPopupContent';

export interface MiniMapProps {
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  zoom?: number;
  height?: string;
  markerColor?: string;
  markerIcon?: string;
  routeCoordinates?: Array<[number, number]>;
  routeColor?: string;
  routeStartColor?: string;
  routeEndColor?: string;
  className?: string;
  showControls?: boolean;
  interactive?: boolean;
}

type MiniMapErrorEvent = {
  error?: {
    message?: string | null;
  } | null;
  preventDefault?: () => void;
};

export function MiniMap({
  latitude,
  longitude,
  title,
  description,
  zoom = 15,
  height = '280px',
  markerColor = '#10b981',
  markerIcon = '',
  routeCoordinates,
  routeColor = '#0f766e',
  routeStartColor = '#fbbf24',
  routeEndColor = '#064e3b',
  className = '',
  showControls = true,
  interactive = true,
}: MiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Inicializar mapa
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DEFAULT_TILE_STYLE.styleUrl,
      center: [longitude, latitude],
      zoom: zoom,
      attributionControl: false,
      interactive: interactive,
    });

    mapRef.current = map;

    // MapLibre v6 exige resolver dedicado para imagens ausentes. O evento
    // styleimagemissing agora e apenas observacional e nao pode mais resolver
    // a requisicao atual via addImage().
    map.setMissingStyleImageResolver((id: string) => {
      if (!map.hasImage(id)) {
        map.addImage(id, {
          width: 1,
          height: 1,
          data: new Uint8Array(4),
        });
      }
    });

    // Ignora warning conhecido de tile/style que nao afeta render do MiniMap.
    map.on('error', (event: MiniMapErrorEvent) => {
      const message = String(event?.error?.message || '');
      if (message.includes('Expected value to be of type number, but found null instead.')) {
        event?.preventDefault?.();
      }
    });

    // Adicionar controles de navegacao (se habilitado)
    if (showControls && interactive) {
      map.addControl(new maplibregl.NavigationControl(), 'top-right');
    }

    // Criar marcador customizado
    const el = document.createElement('div');
    el.style.cssText = [
      'width: 40px',
      'height: 40px',
      'display: flex',
      'align-items: center',
      'justify-content: center',
      'cursor: pointer',
    ].join(';');

    // ✅ SEGURO - Usa DOM API ao invés de innerHTML
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '40');
    svg.setAttribute('height', '40');
    svg.setAttribute('viewBox', '0 0 40 40');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    
    const outerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    outerCircle.setAttribute('cx', '20');
    outerCircle.setAttribute('cy', '20');
    outerCircle.setAttribute('r', '18');
    outerCircle.setAttribute('fill', markerColor);
    outerCircle.setAttribute('opacity', '0.2');
    
    const innerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    innerCircle.setAttribute('cx', '20');
    innerCircle.setAttribute('cy', '20');
    innerCircle.setAttribute('r', '12');
    innerCircle.setAttribute('fill', markerColor);
    innerCircle.setAttribute('stroke', 'white');
    innerCircle.setAttribute('stroke-width', '3');
    
    svg.appendChild(outerCircle);
    svg.appendChild(innerCircle);
    if (markerIcon) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', '20');
      text.setAttribute('y', '24');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '16');
      text.setAttribute('fill', 'white');
      text.textContent = markerIcon;
      svg.appendChild(text);
    }
    el.appendChild(svg);

    // Criar popup se houver título ou descrição
    let popup: maplibregl.Popup | undefined;
    if (title || description) {
      popup = new maplibregl.Popup({ 
        offset: 25, 
        closeButton: false,
        closeOnClick: false,
      }).setDOMContent(createMapPopupContent({ title, description }));
    }

    // Adicionar marcador ao mapa
    const marker = new maplibregl.Marker({ 
      element: el, 
      anchor: 'center' 
    })
      .setLngLat([longitude, latitude]);

    if (popup) {
      marker.setPopup(popup);
    }

    marker.addTo(map);
    markerRef.current = marker;

    const routeMarkers: maplibregl.Marker[] = [];
    const addRouteMarkers = () => {
      if (!routeCoordinates || routeCoordinates.length < 2) return;

      const routeData: GeoJSON.Feature<GeoJSON.LineString> = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: routeCoordinates,
        },
      };

      map.addSource('mini-map-route', { type: 'geojson', data: routeData });
      map.addLayer({
        id: 'mini-map-route-casing',
        type: 'line',
        source: 'mini-map-route',
        paint: { 'line-color': '#ffffff', 'line-width': 7, 'line-opacity': 0.9 },
      });
      map.addLayer({
        id: 'mini-map-route-line',
        type: 'line',
        source: 'mini-map-route',
        paint: { 'line-color': routeColor, 'line-width': 4, 'line-opacity': 0.95 },
      });

      const createEndpoint = (color: string) => {
        const endpoint = document.createElement('div');
        endpoint.style.cssText = [
          'width: 24px',
          'height: 24px',
          `background: ${color}`,
          'border: 3px solid white',
          'border-radius: 999px',
          'box-shadow: 0 2px 8px rgba(15, 23, 42, 0.25)',
        ].join(';');
        return endpoint;
      };

      const start = new maplibregl.Marker({ element: createEndpoint(routeStartColor) })
        .setLngLat(routeCoordinates[0])
        .addTo(map);
      const end = new maplibregl.Marker({ element: createEndpoint(routeEndColor) })
        .setLngLat(routeCoordinates[routeCoordinates.length - 1])
        .addTo(map);
      routeMarkers.push(start, end);

      const bounds = new maplibregl.LngLatBounds(routeCoordinates[0], routeCoordinates[0]);
      routeCoordinates.slice(1).forEach((coordinate) => bounds.extend(coordinate));
      map.fitBounds(bounds, { padding: 32, maxZoom: 15 });
    };

    map.once('load', addRouteMarkers);

    // Cleanup
    return () => {
      routeMarkers.forEach((routeMarker) => routeMarker.remove());
      if (markerRef.current) {
        markerRef.current.remove();
      }
      if (mapRef.current) {
        mapRef.current.remove();
      }
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [latitude, longitude, title, description, zoom, markerColor, markerIcon, routeCoordinates, routeColor, routeStartColor, routeEndColor, showControls, interactive]);

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full bg-muted ${className}`}
      style={{ height }}
      aria-label={title ? `Mapa mostrando localização de ${title}` : 'Mapa de localização'}
    />
  );
}
