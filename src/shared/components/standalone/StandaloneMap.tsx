/**
 * StandaloneMap — Mapa de localização de empresa com rota do usuário.
 * 
 * ✅ SSOT COMPLETO:
 * - DEFAULT_TILE_STYLE: Estilo de mapa centralizado (MapProvider)
 * - useRobustGeolocation: Geolocalização centralizada
 * - MapLibre GL JS: Engine padrão
 * 
 * Nota: Não usa useMapInitialization pois precisa de configurações customizadas
 * (centro dinâmico, interações específicas). O SSOT está no MapProvider.
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, Navigation, Loader2, Map as MapIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { useRobustGeolocation } from '@/shared/hooks';
import { getCoordinates } from '@/core/business/services/business.helpers';
import { DEFAULT_TILE_STYLE } from '@/core/maps/providers/MapProvider';

interface Business {
  name: string;
  metadata?: Record<string, unknown> | null;
  location?: {
    name?: string | null;
    canonical_lat?: number | null;
    canonical_lng?: number | null;
  } | null;
  address?: {
    latitude?: number | null;
    longitude?: number | null;
    street?: string | null;
    number?: string | null;
    complement?: string | null;
    postal_code?: string | null;
  } | null;
}

interface StandaloneMapProps {
  business: Business;
}

function haversineDistance(a: [number, number], b: [number, number]): string {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const d = R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`;
}

/** Extrai coordenadas do Business canônico */
function getBusinessCoords(business: Business): [number, number] | null {
  const coords = getCoordinates(business);
  if (coords) return [coords.latitude, coords.longitude];
  return null;
}

/** Extrai endereço legível */
function getAddressText(business: Business): string | null {
  const addr = business.address;
  if (!addr) return null;
  const parts = [addr.street, addr.number, addr.complement].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

export default function StandaloneMap({ business }: StandaloneMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const businessMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [distance, setDistance] = useState<string | null>(null);

  const businessPos = getBusinessCoords(business);
  const addressText = getAddressText(business);
  const locationName = business.location?.name ?? null;
  const postalCode = business.address?.postal_code ?? null;

  // URL do mapa completo com foco explícito no estabelecimento.
  const internalMapUrl = useMemo(() => {
    if (!businessPos) return null;
    const params = new URLSearchParams({
      lat: String(businessPos[0]),
      lng: String(businessPos[1]),
      z: '16',
      name: business.name,
    });
    return `/mapa?${params.toString()}`;
  }, [businessPos, business.name]);

  // ── Geolocalização robusta (SSOT) ──────────────────────────────
  const {
    coords: userCoords,
    loading: loadingLoc,
    requestLocation,
  } = useRobustGeolocation({
    onSuccess: (coords) => {
      if (businessPos) {
        setDistance(haversineDistance([coords.latitude, coords.longitude], businessPos));
      }
    },
  });

  const userPos = useMemo<[number, number] | null>(
    () =>
      userCoords
        ? [userCoords.latitude, userCoords.longitude]
        : null,
    [userCoords],
  );

  // ── Inicialização do mapa (SSOT: DEFAULT_TILE_STYLE) ──────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current || !businessPos) return;

    // ✅ SSOT: Usa DEFAULT_TILE_STYLE do MapProvider
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DEFAULT_TILE_STYLE.styleUrl,
      center: [businessPos[1], businessPos[0]], // [lng, lat]
      zoom: 15,
      attributionControl: false,
      scrollZoom: true,
      dragPan: true,
      touchZoomRotate: true,
    });

    // Adicionar controles padrão
    map.addControl(
      new maplibregl.AttributionControl({ 
        compact: true, 
        customAttribution: DEFAULT_TILE_STYLE.attribution,
      }), 
      'bottom-left'
    );
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }), 
      'top-right'
    );

    mapRef.current = map;

    // Configurar mapa quando carregar
    map.on('load', () => {
      // Criar marcador do negócio
      const el = document.createElement('div');
      el.style.cssText = 'width:32px;height:32px;background:#ef4444;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;';
      // ✅ SEGURO - Usa DOM API ao invés de innerHTML
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '16');
      svg.setAttribute('height', '16');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'white');
      
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z');
      
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '12');
      circle.setAttribute('cy', '10');
      circle.setAttribute('r', '3');
      
      svg.appendChild(path);
      svg.appendChild(circle);
      el.appendChild(svg);

      businessMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([businessPos[1], businessPos[0]])
        .setPopup(
          new maplibregl.Popup({ closeButton: false }).setHTML(
            `<p style="font-size:13px;font-weight:600">${business.name}</p>${addressText ? `<p style="font-size:11px;color:#6b7280">${addressText}</p>` : ''}`
          )
        )
        .addTo(map);

      // Adicionar source e layer para rota
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: [] },
          properties: {},
        },
      });

      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        paint: {
          'line-color': '#3b82f6',
          'line-width': 3,
          'line-opacity': 0.7,
          'line-dasharray': [10, 10],
        },
      });
    });

    // Cleanup
    return () => {
      if (businessMarkerRef.current) {
        businessMarkerRef.current.remove();
        businessMarkerRef.current = null;
      }
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [businessPos, business.name, addressText]);

  // ── Atualizar rota quando usuário localizado ───────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userPos || !businessPos) return;

    const userLngLat: [number, number] = [userPos[1], userPos[0]];
    const bizLngLat:  [number, number] = [businessPos[1], businessPos[0]];

    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat(userLngLat);
    } else {
      const el = document.createElement('div');
      el.style.cssText = 'width:24px;height:24px;background:#3b82f6;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;';
      const inner = document.createElement('div');
      inner.style.cssText = 'width:8px;height:8px;background:white;border-radius:50%;';
      el.appendChild(inner);
      userMarkerRef.current = new maplibregl.Marker({ element: el }).setLngLat(userLngLat).addTo(map);
    }

    const source = map.getSource('route') as maplibregl.GeoJSONSource | undefined;
    source?.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [userLngLat, bizLngLat] }, properties: {} });

    map.fitBounds(
      [[Math.min(userLngLat[0], bizLngLat[0]), Math.min(userLngLat[1], bizLngLat[1])],
       [Math.max(userLngLat[0], bizLngLat[0]), Math.max(userLngLat[1], bizLngLat[1])]],
      { padding: 60, maxZoom: 15 }
    );
  }, [userPos, businessPos]);

  const openExternalRoute = useCallback(() => {
    if (!businessPos) return;
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const url = isIos
      ? `maps://maps.apple.com/?daddr=${businessPos[0]},${businessPos[1]}&q=${encodeURIComponent(business.name)}`
      : `https://www.google.com/maps/dir/?api=1&destination=${businessPos[0]},${businessPos[1]}`;
    window.open(url, '_blank');
  }, [businessPos, business.name]);

  if (!businessPos) {
    return (
      <section id="location" className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" />Endereço</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {addressText && <p className="font-medium">{addressText}</p>}
              {locationName && <p className="text-muted-foreground">{locationName}</p>}
              <p className="text-muted-foreground">Bahia - BA</p>
              {postalCode && <p className="text-muted-foreground">CEP: {postalCode}</p>}
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section id="location" className="py-16">
      <div className="container mx-auto px-4 max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Localização</h2>
          <p className="text-muted-foreground">Venha nos visitar</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" />Endereço</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                {addressText && <p className="font-medium">{addressText}</p>}
                {locationName && <p className="text-muted-foreground">{locationName}</p>}
                <p className="text-muted-foreground">Bahia - BA</p>
                {postalCode && <p className="text-muted-foreground">CEP: {postalCode}</p>}
              </div>
              {distance && (
                <div className="p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm font-medium text-primary">Distância: {distance}</p>
                </div>
              )}
              <div className="space-y-2">
                <Button onClick={requestLocation} variant="outline" className="w-full gap-2" disabled={loadingLoc}>
                  {loadingLoc ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                  {userPos ? 'Atualizar Minha Localização' : 'Mostrar Rota'}
                </Button>
                {internalMapUrl && (
                  <Button asChild variant="default" className="w-full gap-2">
                    <a href={internalMapUrl}>
                      <MapIcon className="h-4 w-4" />Ver no Mapa Completo
                    </a>
                  </Button>
                )}
                <Button onClick={openExternalRoute} variant="outline" className="w-full gap-2">
                  <Navigation className="h-4 w-4" />Abrir no Google Maps
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <div ref={containerRef} className="h-[400px] w-full rounded-lg" />
          </Card>
        </div>
      </div>
    </section>
  );
}
