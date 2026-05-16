/**
 * EVENTS MAP
 * 
 * Mapa interativo mostrando todos os eventos
 * Filtro por distância e clusters de eventos próximos
 * 
 * @version 1.0.0
 */

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Navigation, 
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/utils/cn';
import type { Event } from '../types';

interface EventsMapProps {
  events: Event[];
  onEventClick?: (eventId: string) => void;
  maxDistance?: number; // km
  userLocation?: { lat: number; lng: number };
}

interface EventMarker {
  event: Event;
  lat: number;
  lng: number;
  distance?: number;
}

export function EventsMap({ 
  events, 
  onEventClick,
  maxDistance = 50,
  userLocation 
}: EventsMapProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [mapCenter, setMapCenter] = useState(userLocation || { lat: -12.9714, lng: -38.5014 }); // Salvador default
  const [zoom, setZoom] = useState(12);
  const [showClusters, setShowClusters] = useState(true);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Filter and prepare event markers
  const eventMarkers = useMemo(() => {
    const markers: EventMarker[] = [];

    events.forEach(event => {
      if (event.location.latitude && event.location.longitude) {
        const distance = userLocation 
          ? calculateDistance(
              userLocation.lat, 
              userLocation.lng, 
              event.location.latitude, 
              event.location.longitude
            )
          : undefined;

        // Filter by distance if user location is available
        if (!userLocation || !distance || distance <= maxDistance) {
          markers.push({
            event,
            lat: event.location.latitude,
            lng: event.location.longitude,
            distance
          });
        }
      }
    });

    // Sort by distance if available
    if (userLocation) {
      markers.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    return markers;
  }, [events, userLocation, maxDistance]);

  // Cluster nearby events
  const clusters = useMemo(() => {
    if (!showClusters) return eventMarkers.map(m => ({ markers: [m], center: { lat: m.lat, lng: m.lng } }));

    const CLUSTER_RADIUS = 0.01; // ~1km
    const clustered: { markers: EventMarker[]; center: { lat: number; lng: number } }[] = [];
    const used = new Set<number>();

    eventMarkers.forEach((marker, index) => {
      if (used.has(index)) return;

      const cluster = [marker];
      used.add(index);

      eventMarkers.forEach((other, otherIndex) => {
        if (used.has(otherIndex)) return;
        
        const distance = calculateDistance(marker.lat, marker.lng, other.lat, other.lng);
        if (distance <= CLUSTER_RADIUS) {
          cluster.push(other);
          used.add(otherIndex);
        }
      });

      const centerLat = cluster.reduce((sum, m) => sum + m.lat, 0) / cluster.length;
      const centerLng = cluster.reduce((sum, m) => sum + m.lng, 0) / cluster.length;

      clustered.push({
        markers: cluster,
        center: { lat: centerLat, lng: centerLng }
      });
    });

    return clustered;
  }, [eventMarkers, showClusters]);

  const handleMarkerClick = (event: Event) => {
    setSelectedEvent(event);
    if (event.location.latitude && event.location.longitude) {
      setMapCenter({ lat: event.location.latitude, lng: event.location.longitude });
    }
  };

  const handleEventCardClick = (eventId: string) => {
    onEventClick?.(eventId);
  };

  const centerOnUser = () => {
    if (userLocation) {
      setMapCenter(userLocation);
      setZoom(14);
    }
  };

  return (
    <div className="relative h-[600px] overflow-hidden rounded-2xl border border-border bg-card">
      {/* Map placeholder (in production, use Google Maps or Mapbox) */}
      <div className="relative h-full w-full bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950">
        {/* Grid overlay for visual effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:50px_50px]" />

        {/* Event markers */}
        <div className="absolute inset-0">
          {clusters.map((cluster, index) => {
            const isMultiple = cluster.markers.length > 1;
            const firstEvent = cluster.markers[0].event;

            // Simple positioning (in production, use proper map projection)
            const x = ((cluster.center.lng + 180) / 360) * 100;
            const y = ((90 - cluster.center.lat) / 180) * 100;

            return (
              <motion.button
                key={index}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleMarkerClick(firstEvent)}
                className={cn(
                  "absolute flex items-center justify-center rounded-full border-2 border-white shadow-lg transition-all",
                  isMultiple 
                    ? "h-12 w-12 bg-primary text-primary-foreground" 
                    : "h-10 w-10 bg-card text-primary",
                  selectedEvent?.id === firstEvent.id && "ring-4 ring-primary/50"
                )}
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {isMultiple ? (
                  <span className="text-sm font-bold">{cluster.markers.length}</span>
                ) : (
                  <MapPin className="h-5 w-5 fill-current" />
                )}
              </motion.button>
            );
          })}

          {/* User location marker */}
          {userLocation && (
            <div
              className="absolute flex h-4 w-4 items-center justify-center"
              style={{
                left: `${((userLocation.lng + 180) / 360) * 100}%`,
                top: `${((90 - userLocation.lat) / 180) * 100}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="h-4 w-4 animate-ping rounded-full bg-blue-500 opacity-75" />
              <div className="absolute h-3 w-3 rounded-full bg-blue-500 ring-2 ring-white" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="absolute left-4 top-4 flex flex-col gap-2">
          {userLocation && (
            <Button
              size="sm"
              variant="secondary"
              onClick={centerOnUser}
              className="gap-2 shadow-lg"
            >
              <Navigation className="h-4 w-4" />
              Minha localização
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowClusters(!showClusters)}
            className="gap-2 shadow-lg"
          >
            <Layers className="h-4 w-4" />
            {showClusters ? 'Desagrupar' : 'Agrupar'}
          </Button>
        </div>

        {/* Zoom controls */}
        <div className="absolute right-4 top-4 flex flex-col gap-2">
          <Button
            size="icon"
            variant="secondary"
            onClick={() => setZoom(Math.min(zoom + 1, 18))}
            className="h-10 w-10 shadow-lg"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            onClick={() => setZoom(Math.max(zoom - 1, 8))}
            className="h-10 w-10 shadow-lg"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Stats */}
        <div className="absolute bottom-4 left-4 rounded-lg border border-border bg-card/95 p-3 shadow-lg backdrop-blur-sm">
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

        {/* Selected event card */}
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 right-4 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
          >
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
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
                {selectedEvent.location.latitude && userLocation && (
                  <span className="ml-auto font-semibold text-primary">
                    {calculateDistance(
                      userLocation.lat,
                      userLocation.lng,
                      selectedEvent.location.latitude,
                      selectedEvent.location.longitude
                    ).toFixed(1)}km
                  </span>
                )}
              </div>
              <Button
                onClick={() => handleEventCardClick(selectedEvent.id)}
                className="mt-3 w-full"
                size="sm"
              >
                Ver detalhes
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Note */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white backdrop-blur-sm">
        Mapa ilustrativo - Em produção, usar Google Maps ou Mapbox
      </div>
    </div>
  );
}
