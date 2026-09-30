/**
 * LocationPickerSheet — Sheet para seleção de localização no mapa.
 * Engine: MapLibre GL JS via runtime canônico lazy.
 * Geolocalização: useRobustGeolocation (SSOT compartilhado).
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Map as MapLibreMap, Marker as MapLibreMarker } from "maplibre-gl";
import { loadMapLibreRuntime } from '@/core/maps/runtime/loadMapLibreRuntime';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/shared/components/ui/sheet';
import { Button } from '@/shared/components/ui/button';
import { Check, Loader2, MapPin, Navigation } from 'lucide-react';
import { DEFAULT_TILE_STYLE, MAP_DEFAULT_CENTER_LNGLAT } from '@/shared/config/mapDefaults';
import { useRobustGeolocation } from '@/shared/hooks';
import type { GeolocationCoords } from '@/shared/hooks/useRobustGeolocation';

interface LocationPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
  inline?: boolean;
  requireAdjustment?: boolean;
  readOnly?: boolean;
  compact?: boolean;
  initialZoom?: number;
}

function resolvePickerPosition(initialLat?: number, initialLng?: number): [number, number] {
  if (initialLat != null && initialLng != null) {
    return [initialLat, initialLng];
  }

  return [MAP_DEFAULT_CENTER_LNGLAT[1], MAP_DEFAULT_CENTER_LNGLAT[0]];
}

export function LocationPickerSheet({ open, onOpenChange, onConfirm, initialLat, initialLng, inline = false, requireAdjustment = false, readOnly = false, compact = false, initialZoom = 16 }: LocationPickerSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<MapLibreMarker | null>(null);
  const [position, setPosition] = useState<[number, number]>(() => resolvePickerPosition(initialLat, initialLng));
  const [ready, setReady] = useState(false);
  const [adjusted, setAdjusted] = useState(false);

  const handleGeolocationSuccess = useCallback((coords: GeolocationCoords) => {
    const { latitude: lat, longitude: lng } = coords;
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 17, duration: 800 });
    markerRef.current?.setLngLat([lng, lat]);
    setPosition([lat, lng]);
    setAdjusted(true);
  }, []);

  const { loading: locatingUser, requestLocation } = useRobustGeolocation({
    useCache: false,
    onSuccess: handleGeolocationSuccess,
  });

  useEffect(() => {
    if (!open && !inline) {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
      setReady(false);
      return;
    }

    let disposed = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        if (!containerRef.current || mapRef.current) return;
        const maplibregl = await loadMapLibreRuntime();
        if (disposed || !containerRef.current || mapRef.current) return;

        const [startLat, startLng] = resolvePickerPosition(initialLat, initialLng);

        const map = new maplibregl.Map({
          container: containerRef.current,
          style: DEFAULT_TILE_STYLE.styleUrl,
          center: [startLng, startLat],
          zoom: initialZoom,
          interactive: !readOnly,
          attributionControl: false,
        });

        if (!readOnly) map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
        map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

        map.on('load', () => {
          if (disposed) return;
          const el = document.createElement('div');
          el.style.cssText = [
            'width:28px',
            'height:28px',
            'border-radius:9999px',
            'background:#0f766e',
            'border:3px solid #ffffff',
            'box-shadow:0 10px 24px rgba(15,118,110,0.35)',
            `cursor:${readOnly ? 'default' : 'grab'}`,
          ].join(';');
          const marker = new maplibregl.Marker({ element: el, draggable: !readOnly, anchor: 'bottom' })
            .setLngLat([startLng, startLat])
            .addTo(map);

          if (!readOnly) {
            marker.on('dragend', () => {
              const { lat, lng } = marker.getLngLat();
              setPosition([lat, lng]);
              setAdjusted(true);
            });

            map.on('click', (event) => {
              marker.setLngLat(event.lngLat);
              setPosition([event.lngLat.lat, event.lngLat.lng]);
              setAdjusted(true);
            });
          }

          markerRef.current = marker;
          setPosition([startLat, startLng]);
          setReady(true);
        });

        mapRef.current = map;
      })();
    }, 300);

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      markerRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [open, inline, initialLat, initialLng, readOnly, initialZoom]);

  const centerOnUser = useCallback(() => {
    void requestLocation({ useCache: false });
  }, [requestLocation]);

  const mapSurface = (
    <>
      <div className={`relative w-full ${compact ? "h-[220px] min-h-[200px]" : "h-[220px] min-h-[210px] sm:h-[240px] lg:h-[260px]"}`}>
        <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
        {!readOnly && <Button size="icon" variant="secondary" className="absolute top-3 right-3 z-10 h-11 w-11 rounded-full shadow-lg" onClick={centerOnUser} disabled={locatingUser} aria-label="Usar minha localização atual">
          {locatingUser ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Navigation className="h-4 w-4" aria-hidden="true" />}
        </Button>}
        {!ready && <div className="absolute inset-0 flex items-center justify-center bg-secondary/50 z-20"><p className="text-sm text-muted-foreground animate-pulse">Carregando mapa...</p></div>}
      </div>
      {!readOnly && <div className="flex items-center gap-3 border-t bg-card px-4 py-3">
        <p className="flex-1 min-w-0 truncate text-xs text-muted-foreground"><MapPin className="mr-1 inline h-3 w-3" />{position[0].toFixed(5)}, {position[1].toFixed(5)}</p>
        <Button disabled={!ready || (requireAdjustment && !adjusted)} onClick={() => { onConfirm(position[0], position[1]); if (!inline) onOpenChange(false); }} size="sm" className="min-h-11 rounded-full px-5"><Check className="mr-1.5 h-4 w-4" />{inline ? "Confirmar ponto" : "Confirmar local"}</Button>
      </div>}
    </>
  );

  if (inline) return <section className="overflow-hidden rounded-xl border bg-card" aria-label={readOnly ? "Prévia da localização da empresa no mapa" : "Ajuste o ponto da empresa no mapa"}>{mapSurface}</section>;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] p-0 rounded-t-2xl">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle className="font-display text-base">Marcar localização</SheetTitle>
          <SheetDescription className="text-xs">Arraste o pin ou toque no mapa para posicionar</SheetDescription>
        </SheetHeader>

        {mapSurface}
      </SheetContent>
    </Sheet>
  );
}
