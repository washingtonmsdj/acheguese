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
}

function resolvePickerPosition(initialLat?: number, initialLng?: number): [number, number] {
  if (initialLat != null && initialLng != null) {
    return [initialLat, initialLng];
  }

  return [MAP_DEFAULT_CENTER_LNGLAT[1], MAP_DEFAULT_CENTER_LNGLAT[0]];
}

export function LocationPickerSheet({ open, onOpenChange, onConfirm, initialLat, initialLng }: LocationPickerSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<MapLibreMarker | null>(null);
  const [position, setPosition] = useState<[number, number]>(() => resolvePickerPosition(initialLat, initialLng));
  const [ready, setReady] = useState(false);

  const handleGeolocationSuccess = useCallback((coords: GeolocationCoords) => {
    const { latitude: lat, longitude: lng } = coords;
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 17, duration: 800 });
    markerRef.current?.setLngLat([lng, lat]);
    setPosition([lat, lng]);
  }, []);

  const { loading: locatingUser, requestLocation } = useRobustGeolocation({
    useCache: false,
    onSuccess: handleGeolocationSuccess,
  });

  useEffect(() => {
    if (!open) {
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
          zoom: 16,
          attributionControl: false,
        });

        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

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
            'cursor:grab',
          ].join(';');
          const marker = new maplibregl.Marker({ element: el, draggable: true, anchor: 'bottom' })
            .setLngLat([startLng, startLat])
            .addTo(map);

          marker.on('dragend', () => {
            const { lat, lng } = marker.getLngLat();
            setPosition([lat, lng]);
          });

          map.on('click', (event) => {
            marker.setLngLat(event.lngLat);
            setPosition([event.lngLat.lat, event.lngLat.lng]);
          });

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
  }, [open, initialLat, initialLng]);

  const centerOnUser = useCallback(() => {
    void requestLocation({ useCache: false });
  }, [requestLocation]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] p-0 rounded-t-2xl">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle className="font-display text-base">Marcar localização</SheetTitle>
          <SheetDescription className="text-xs">Arraste o pin ou toque no mapa para posicionar</SheetDescription>
        </SheetHeader>

        <div className="relative flex-1 h-[calc(85vh-140px)]">
          <div ref={containerRef} className="absolute inset-0" />

          <Button
            size="icon"
            variant="secondary"
            className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full shadow-lg"
            onClick={centerOnUser}
            disabled={locatingUser}
            aria-label="Usar minha localização atual"
          >
            {locatingUser ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Navigation className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>

          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center bg-secondary/50 z-20">
              <p className="text-sm text-muted-foreground animate-pulse">Carregando mapa...</p>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t bg-card flex items-center gap-3">
          <p className="flex-1 text-xs text-muted-foreground flex items-center gap-1 min-w-0 truncate">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            {position[0].toFixed(5)}, {position[1].toFixed(5)}
          </p>
          <Button onClick={() => { onConfirm(position[0], position[1]); onOpenChange(false); }} size="sm" className="rounded-full gap-1.5 px-5">
            <Check className="h-4 w-4" />Confirmar local
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
