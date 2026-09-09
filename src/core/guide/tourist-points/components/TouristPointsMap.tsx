/**
 * TouristPointsMap — Mapa interativo de pontos turísticos.
 * Engine: MapLibre GL JS (via SSOT de mapa).
 */

import { useEffect, useRef } from 'react';
import * as maplibregl from "maplibre-gl";
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin } from 'lucide-react';
import type { TouristPoint } from '../types';
import { CATEGORY_LABELS, CATEGORY_MARKER_ABBR } from '../types';
import { DEFAULT_TILE_STYLE } from '@/core/maps/providers/MapProvider';
import { resolveSafeImageUrl } from '@/shared/utils/urlSafety';

interface TouristPointsMapProps {
  points: TouristPoint[];
  selectedId?: string;
  onSelect?: (point: TouristPoint) => void;
  className?: string;
}

function appendText(parent: HTMLElement, className: string, text: string): HTMLElement {
  const element = document.createElement('p');
  element.className = className;
  element.textContent = text;
  parent.appendChild(element);
  return element;
}

function getMarkerToneClass(isFeatured: boolean): string {
  return isFeatured ? 'bg-amber-500' : 'bg-primary';
}

function createMarkerElement(markerAbbr: string, isFeatured: boolean): HTMLDivElement {
  const marker = document.createElement('div');
  marker.className = [
    'flex h-9 w-9 rotate-[-45deg] cursor-pointer items-center justify-center',
    'rounded-[50%_50%_50%_0] border-2 border-background shadow-lg',
    getMarkerToneClass(isFeatured),
  ].join(' ');

  const label = document.createElement('span');
  label.className = 'rotate-45 text-xs font-extrabold leading-none text-primary-foreground';
  label.textContent = markerAbbr;
  marker.appendChild(label);

  return marker;
}

function createPopupContent(
  point: TouristPoint,
  markerAbbr: string,
  categoryLabel: string,
  neighborhoodName?: string | null,
): HTMLDivElement {
  const root = document.createElement('div');
  root.className = 'min-w-44 p-1';

  const safePhotoUrl = point.photo_url
    ? resolveSafeImageUrl(point.photo_url, { context: 'TouristPointsMap.popupPhoto' })
    : null;

  if (safePhotoUrl) {
    const image = document.createElement('img');
    image.src = safePhotoUrl;
    image.alt = point.name;
    image.loading = 'lazy';
    image.className = 'mb-2 h-24 w-full rounded-md object-cover';
    root.appendChild(image);
  }

  const content = document.createElement('div');
  content.className = 'flex items-start gap-2';
  root.appendChild(content);

  const badge = document.createElement('span');
  badge.className = [
    'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
    'text-[11px] font-extrabold text-primary-foreground',
    getMarkerToneClass(point.is_featured),
  ].join(' ');
  badge.textContent = markerAbbr;
  content.appendChild(badge);

  const details = document.createElement('div');
  content.appendChild(details);

  appendText(details, 'text-sm font-bold leading-tight text-foreground', point.name);
  appendText(details, 'mt-0.5 text-xs text-muted-foreground', categoryLabel);

  if (neighborhoodName) {
    appendText(details, 'mt-1 text-xs text-muted-foreground', `Bairro: ${neighborhoodName}`);
  }

  if (point.rating > 0) {
    appendText(details, 'mt-1 text-xs font-semibold text-amber-600', `Nota: ${point.rating.toFixed(1)}`);
  }

  if (point.visiting_hours) {
    appendText(details, 'mt-1 text-xs text-muted-foreground', `Horario: ${point.visiting_hours}`);
  }

  return root;
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
        const categoryLabel = CATEGORY_LABELS[point.category] ?? point.category;
        const neighborhoodName = point.location?.name ?? point.neighborhood;

        const el = createMarkerElement(markerAbbr, point.is_featured);

        el.addEventListener('click', () => onSelect?.(point));

        const popup = new maplibregl.Popup({ offset: 20, closeButton: false, maxWidth: '15rem' })
          .setDOMContent(createPopupContent(point, markerAbbr, categoryLabel, neighborhoodName));

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


