/**
 * TouristPointsMap — Mapa interativo de pontos turísticos.
 * Engine: MapLibre GL JS (via SSOT de mapa).
 */

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, Star } from 'lucide-react';
import type { TouristPoint } from '../types';
import { CATEGORY_LABELS, CATEGORY_MARKER_ABBR } from '../types';
import { DEFAULT_TILE_STYLE } from '@/core/maps/providers/MapProvider';

interface TouristPointsMapProps {
  points: TouristPoint[];
  selectedId?: string;
  onSelect?: (point: TouristPoint) => void;
  className?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function TouristPointsMap({ points, selectedId, onSelect, className = '' }: TouristPointsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<maplibregl.Map | null>(null);
  const markersRef   = useRef<Map<string, maplibregl.Marker>>(new Map());

  const withCoords = points.filter(p => p.latitude && p.longitude);

  useEffect(() => {
    if (!containerRef.current || mapRef.current || withCoords.length === 0) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DEFAULT_TILE_STYLE.styleUrl,
      center: [-38.5014, -12.9714],
      zoom: 13,
      attributionControl: false,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      withCoords.forEach(point => {
        const markerAbbr = CATEGORY_MARKER_ABBR[point.category] ?? '?';
        const bgColor = point.is_featured ? '#f59e0b' : 'hsl(var(--primary, 221 83% 53%))';
        const categoryLabel = CATEGORY_LABELS[point.category] ?? point.category;

        const el = document.createElement('div');
        el.style.cssText = `width:36px;height:36px;background:${bgColor};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;cursor:pointer;`;
        const inner = document.createElement('span');
        inner.style.cssText = 'transform:rotate(45deg);font-size:12px;line-height:1;font-weight:800;color:white;font-family:Arial,sans-serif;';
        inner.textContent = markerAbbr;
        el.appendChild(inner);

        el.addEventListener('click', () => onSelect?.(point));

        const popup = new maplibregl.Popup({ offset: 20, closeButton: false, maxWidth: '240px' }).setHTML(`
          <div style="padding:4px;min-width:180px">
            ${point.photo_url ? `<img src="${escapeHtml(point.photo_url)}" alt="${escapeHtml(point.name)}" style="width:100%;height:96px;object-fit:cover;border-radius:8px;margin-bottom:8px"/>` : ''}
            <div style="display:flex;align-items:flex-start;gap:8px">
              <span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:999px;background:${bgColor};color:white;font-size:11px;font-weight:800;flex-shrink:0">${markerAbbr}</span>
              <div>
                <p style="font-weight:700;font-size:13px;line-height:1.2">${escapeHtml(point.name)}</p>
                <p style="font-size:11px;color:#6b7280;margin-top:2px">${escapeHtml(categoryLabel)}</p>
                ${point.neighborhood ? `<p style="font-size:11px;color:#6b7280;margin-top:4px">Bairro: ${escapeHtml(point.neighborhood)}</p>` : ''}
                ${point.rating > 0 ? `<p style="font-size:11px;color:#d97706;margin-top:4px;font-weight:600">Nota: ${point.rating.toFixed(1)}</p>` : ''}
                ${point.visiting_hours ? `<p style="font-size:11px;color:#6b7280;margin-top:4px">Horario: ${escapeHtml(point.visiting_hours)}</p>` : ''}
              </div>
            </div>
          </div>
        `);

        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([point.longitude!, point.latitude!])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.set(point.id, marker);
      });

      // Ajustar câmera para cobrir todos os pontos
      if (withCoords.length === 1) {
        map.flyTo({ center: [withCoords[0].longitude!, withCoords[0].latitude!], zoom: 15 });
      } else {
        const lngs = withCoords.map(p => p.longitude!);
        const lats = withCoords.map(p => p.latitude!);
        map.fitBounds(
          [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
          { padding: 40 }
        );
      }
    });

    mapRef.current = map;
    const markers = markersRef.current;
    return () => {
      markers.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Abrir popup do ponto selecionado externamente
  useEffect(() => {
    if (!selectedId) return;
    markersRef.current.get(selectedId)?.togglePopup();
  }, [selectedId]);

  if (withCoords.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center bg-muted/30 border border-border rounded-2xl text-muted-foreground ${className}`}>
        <MapPin className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-sm">Nenhum ponto com coordenadas cadastradas</p>
      </div>
    );
  }

  return <div ref={containerRef} className={`rounded-2xl border border-border z-0 ${className}`} style={{ minHeight: '100%' }} />;
}


