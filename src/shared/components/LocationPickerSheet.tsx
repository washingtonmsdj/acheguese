/**
 * LocationPickerSheet — Sheet para seleção de localização no mapa.
 * Engine: MapLibre GL JS (via SSOT de mapa).
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/shared/components/ui/sheet';
import { Button } from '@/shared/components/ui/button';
import { MapPin, Navigation, Check } from 'lucide-react';
import { DEFAULT_TILE_STYLE, MAP_DEFAULT_CENTER_LNGLAT } from '@/shared/config/mapDefaults';

interface LocationPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

export function LocationPickerSheet({ open, onOpenChange, onConfirm, initialLat, initialLng }: LocationPickerSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<maplibregl.Map | null>(null);
  const markerRef    = useRef<maplibregl.Marker | null>(null);
  const [position, setPosition] = useState<[number, number]>(
    initialLat && initialLng
      ? [initialLat, initialLng]
      : [MAP_DEFAULT_CENTER_LNGLAT[1], MAP_DEFAULT_CENTER_LNGLAT[0]],
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!open) {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
      setReady(false);
      return;
    }

    const timer = setTimeout(() => {
      if (!containerRef.current || mapRef.current) return;

      const startLat = initialLat ?? MAP_DEFAULT_CENTER_LNGLAT[1];
      const startLng = initialLng ?? MAP_DEFAULT_CENTER_LNGLAT[0];

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: DEFAULT_TILE_STYLE.styleUrl,
        center: [startLng, startLat],
        zoom: 16,
        attributionControl: false,
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

      map.on('load', () => {
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

        // Clicar no mapa move o marcador
        map.on('click', (e) => {
          marker.setLngLat(e.lngLat);
          setPosition([e.lngLat.lat, e.lngLat.lng]);
        });

        markerRef.current = marker;
        setPosition([startLat, startLng]);
        setReady(true);
      });

      mapRef.current = map;
    }, 300);

    return () => clearTimeout(timer);
  }, [open, initialLat, initialLng]);

  const centerOnUser = useCallback(async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        });
      });
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      mapRef.current?.flyTo({ center: [lng, lat], zoom: 17, duration: 800 });
      markerRef.current?.setLngLat([lng, lat]);
      setPosition([lat, lng]);
    } catch {
      // permissão negada ou indisponível — silencioso
    }
  }, []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] p-0 rounded-t-2xl">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle className="font-display text-base">Marcar localização</SheetTitle>
          <SheetDescription className="text-xs">Arraste o pin ou toque no mapa para posicionar</SheetDescription>
        </SheetHeader>

        <div className="relative flex-1 h-[calc(85vh-140px)]">
          <div ref={containerRef} className="absolute inset-0" />

          <Button size="icon" variant="secondary" className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full shadow-lg" onClick={centerOnUser}>
            <Navigation className="h-4 w-4" />
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
