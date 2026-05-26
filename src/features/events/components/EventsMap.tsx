import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, MapPin, Navigation, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { MAP_DEFAULT_COORDINATES, MAP_DEFAULT_ZOOM } from '@/shared/config/mapDefaults';
import {
  DEFAULT_TILE_STYLE,
  MapLibreAdapter,
  type MapLibreAdapterHandle,
  type MapMarker,
} from '@/core/maps';
import type { Event } from '../types';

interface EventsMapProps {
  events: Event[];
  onEventClick?: (eventId: string) => void;
  maxDistance?: number;
  userLocation?: { lat: number; lng: number };
}

interface EventMarker {
  event: Event;
  lat: number;
  lng: number;
  distance?: number;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export function EventsMap({
  events,
  onEventClick,
  maxDistance = 50,
  userLocation,
}: EventsMapProps) {
  const adapterRef = useRef<MapLibreAdapterHandle>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showClusters, setShowClusters] = useState(true);

  const eventMarkers = useMemo(() => {
    const markers: EventMarker[] = [];

    events.forEach((event) => {
      const latitude = event.location.latitude;
      const longitude = event.location.longitude;
      if (typeof latitude !== 'number' || typeof longitude !== 'number') return;

      const distance = userLocation
        ? calculateDistance(userLocation.lat, userLocation.lng, latitude, longitude)
        : undefined;

      if (distance === undefined || distance <= maxDistance) {
        markers.push({
          event,
          lat: latitude,
          lng: longitude,
          distance,
        });
      }
    });

    if (userLocation) {
      markers.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    }

    return markers;
  }, [events, maxDistance, userLocation]);

  const mapMarkers = useMemo<MapMarker[]>(
    () =>
      eventMarkers.map((marker) => ({
        id: marker.event.id,
        type: 'event',
        coordinates: {
          latitude: marker.lat,
          longitude: marker.lng,
        },
        title: marker.event.title,
        subtitle: marker.event.location.neighborhood || marker.event.location.city,
        status:
          marker.event.status === 'cancelado' || marker.event.status === 'finalizado'
            ? 'inactive'
            : 'active',
        isPremium: marker.event.ticket_type === 'pago',
        metadata: {
          distance: marker.distance,
          category: marker.event.category,
        },
      })),
    [eventMarkers],
  );

  const initialViewport = useMemo(() => {
    const firstMarker = eventMarkers[0];
    const center = userLocation
      ? { latitude: userLocation.lat, longitude: userLocation.lng }
      : firstMarker
        ? { latitude: firstMarker.lat, longitude: firstMarker.lng }
        : MAP_DEFAULT_COORDINATES;

    return {
      center,
      zoom: firstMarker || userLocation ? Math.max(MAP_DEFAULT_ZOOM, 12) : MAP_DEFAULT_ZOOM,
    };
  }, [eventMarkers, userLocation]);

  const handleMarkerClick = (eventId: string) => {
    const marker = eventMarkers.find((item) => item.event.id === eventId);
    if (!marker) return;

    setSelectedEvent(marker.event);
    adapterRef.current?.flyTo({
      center: { latitude: marker.lat, longitude: marker.lng },
      zoom: 15,
    });
  };

  const centerOnUser = () => {
    if (!userLocation) return;

    adapterRef.current?.flyTo({
      center: { latitude: userLocation.lat, longitude: userLocation.lng },
      zoom: 14,
    });
  };

  const selectedMarker = selectedEvent
    ? eventMarkers.find((marker) => marker.event.id === selectedEvent.id)
    : null;

  return (
    <div className="relative h-[600px] overflow-hidden rounded-2xl border border-border bg-card">
      <MapLibreAdapter
        ref={adapterRef}
        styleUrl={DEFAULT_TILE_STYLE.styleUrl}
        initialViewport={initialViewport}
        markers={mapMarkers}
        onMarkerClick={handleMarkerClick}
        enableClustering={showClusters}
        className="h-full w-full"
      />

      <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
        {userLocation && (
          <Button size="sm" variant="secondary" onClick={centerOnUser} className="gap-2 shadow-lg">
            <Navigation className="h-4 w-4" />
            Minha localizacao
          </Button>
        )}
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setShowClusters((current) => !current)}
          className="gap-2 shadow-lg"
        >
          <Layers className="h-4 w-4" />
          {showClusters ? 'Desagrupar' : 'Agrupar'}
        </Button>
      </div>

      <div className="absolute bottom-4 left-4 z-10 rounded-lg border border-border bg-card/95 p-3 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Eventos</p>
            <p className="text-lg font-bold text-foreground">{eventMarkers.length}</p>
          </div>
          {userLocation && (
            <div>
              <p className="text-xs text-muted-foreground">Raio</p>
              <p className="text-lg font-bold text-foreground">{maxDistance}km</p>
            </div>
          )}
        </div>
      </div>

      {selectedEvent && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-4 right-4 z-10 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        >
          <button
            type="button"
            onClick={() => setSelectedEvent(null)}
            className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
            aria-label="Fechar evento selecionado"
          >
            <X className="h-4 w-4" />
          </button>
          <img
            src={selectedEvent.cover_image_url}
            alt={selectedEvent.title}
            className="h-32 w-full object-cover"
          />
          <div className="p-4">
            <Badge className="mb-2">{selectedEvent.category}</Badge>
            <h4 className="mb-2 font-bold text-foreground">{selectedEvent.title}</h4>
            <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
              {selectedEvent.short_description}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{selectedEvent.location.neighborhood || selectedEvent.location.city}</span>
              {selectedMarker?.distance !== undefined && (
                <span className="ml-auto font-semibold text-primary">
                  {selectedMarker.distance.toFixed(1)}km
                </span>
              )}
            </div>
            <Button onClick={() => onEventClick?.(selectedEvent.id)} className="mt-3 w-full" size="sm">
              Ver detalhes
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
