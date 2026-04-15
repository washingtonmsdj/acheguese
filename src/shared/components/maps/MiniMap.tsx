/**
 * MiniMap — Componente de mapa pequeno reutilizável
 *
 * Usa MapLibre GL JS com DEFAULT_TILE_STYLE (SSOT do MapProvider).
 */

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { DEFAULT_TILE_STYLE } from '@/core/maps/providers/MapProvider';

export interface MiniMapProps {
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  zoom?: number;
  height?: string;
  markerColor?: string;
  markerIcon?: string;
  className?: string;
  showControls?: boolean;
  interactive?: boolean;
}

export function MiniMap({
  latitude,
  longitude,
  title,
  description,
  zoom = 15,
  height = '280px',
  markerColor = '#10b981',
  markerIcon = '📍',
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

    // Evita flood de warnings de sprite/icones faltando no estilo vetorial.
    map.on('styleimagemissing', (event: { id: string }) => {
      if (!map.hasImage(event.id)) {
        map.addImage(event.id, {
          width: 1,
          height: 1,
          data: new Uint8Array(4),
        });
      }
    });

    // Ignora warning conhecido de tile/style que nao afeta render do MiniMap.
    map.on('error', (event: any) => {
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

    el.innerHTML = `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="${markerColor}" opacity="0.2"/>
        <circle cx="20" cy="20" r="12" fill="${markerColor}" stroke="white" stroke-width="3"/>
        <text x="20" y="24" text-anchor="middle" font-size="16" fill="white">${markerIcon}</text>
      </svg>
    `;

    // Criar popup se houver título ou descrição
    let popup: maplibregl.Popup | undefined;
    if (title || description) {
      popup = new maplibregl.Popup({ 
        offset: 25, 
        closeButton: false,
        closeOnClick: false,
      }).setHTML(`
        <div style="padding: 8px 12px; text-align: center; max-width: 200px;">
          ${title ? `<p style="font-weight: 600; margin: 0 0 4px 0; font-size: 13px;">${title}</p>` : ''}
          ${description ? `<p style="font-size: 11px; color: #666; margin: 0;">${description}</p>` : ''}
        </div>
      `);
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

    // Cleanup
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
      }
      if (mapRef.current) {
        mapRef.current.remove();
      }
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [latitude, longitude, title, description, zoom, markerColor, markerIcon, showControls, interactive]);

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full bg-muted ${className}`}
      style={{ height }}
      aria-label={title ? `Mapa mostrando localização de ${title}` : 'Mapa de localização'}
    />
  );
}
