/**
 * MapLibreAdapter - Ponte entre MapLibre GL JS e o sistema de hooks v3
 *
 * Responsabilidades:
 * - Inicializar instância MapLibre no container fornecido
 * - Ouvir eventos do mapa (moveend, zoomend, click) e traduzir para o domínio
 * - Conectar com useViewportBridge para sincronização bidirecional
 * - Disparar fetchByBounds no moveend
 * - Expor ref da instância para casos avançados
 *
 * NÃO conhece providers. NÃO contém lógica de negócio.
 * É a única camada que importa maplibre-gl diretamente.
 *
 * @module core/maps/components/v3
 */
import { logger } from '@/shared/utils/logger';
import React, { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useViewportBridge } from './MapViewportController';
import { getMarkerConfig } from '../../config/markerConfig';
import { useRobustGeolocation } from '@/shared/hooks';
import { useMapClustering } from '../../hooks/useMapClustering';
import { MapSearchControl } from './controls/MapSearchControl';
import { MapLocationControl } from './controls/MapLocationControl';
import { MapLayerControl } from './controls/MapLayerControl';
import { MapTerritoryControl } from './controls/MapTerritoryControl';
import { MapControlsLayout } from './controls/MapControlsLayout';
import { MapRadiusControl } from './controls/MapRadiusControl';
import { createUserLocationSvg } from '@/shared/utils/safeSvg';
import type { BoundingBox, MapViewport, MapMarker } from '../../types/core';
import type { TerritoryPolygon } from '../../hooks/useTerritoryPolygon';
import type { CircleArea } from '../../providers/types';
import type { MapControlsConfig, UserLocationMarkerConfig } from './controls/types';
import type { ResolvedTerritory } from '../../routing/hooks/useResolveTerritoryFromUrl';
export interface MapLibreAdapterHandle {
  /** Acesso direto à instância MapLibre (para casos avançados) */
  getMap: () => maplibregl.Map | null;
  /** Voar para coordenadas */
  flyTo: (viewport: Partial<MapViewport>) => void;
  /** ID único do mapa para componentes filhos */
  getMapId: () => string;
}

export interface MapLibreAdapterProps {
  /** URL do estilo de tiles */
  styleUrl: string;
  /** Viewport inicial */
  initialViewport?: Partial<MapViewport>;
  /** Polígonos de território a renderizar sobre o mapa */
  territoryPolygons?: TerritoryPolygon[];
  /**
   * Marcadores de ponto de interesse.
   * Usa o tipo canônico MapMarker de types/core.
   */
  markers?: MapMarker[];
  /** Callback quando marcador é clicado */
  onMarkerClick?: (id: string) => void;
  /** Área circular (ex: raio de CEP) */
  circle?: CircleArea;
  /** Callback quando viewport muda (moveend/zoomend) */
  onViewportChange?: (viewport: MapViewport, bounds: BoundingBox) => void;
  /** Callback quando usuário clica no mapa */
  onMapClick?: (coords: { latitude: number; longitude: number }) => void;
  /** Callback quando mapa termina de carregar */
  onLoad?: () => void;
  /** Configuração de controles do mapa (busca, localização, camadas, etc) */
  controls?: MapControlsConfig;
  /** Configuração do marcador de localização do usuário */
  userLocationMarker?: UserLocationMarkerConfig;
  /** Território resolvido (para controle territorial) */
  resolved?: ResolvedTerritory | null;
  /** Habilitar clustering de marcadores */
  enableClustering?: boolean;
  /** Configuração de raio de busca */
  radiusControl?: {
    enabled: boolean;
    initialRadius?: number;
    minRadius?: number;
    maxRadius?: number;
    onRadiusPreview?: (radiusKm: number) => void;
    onRadiusChange?: (radiusKm: number) => void;
    onDisable?: () => void;
    isActive?: boolean;
    counts?: {
      businesses?: number;
      events?: number;
      alerts?: number;
      touristPoints?: number;
    };
  };
  className?: string;
}

const DEFAULT_CENTER: [number, number] = [-38.5014, -12.9714]; // Salvador, BA [lng, lat]
const DEFAULT_ZOOM = 13;

interface ClusterRenderMarker {
  id: string;
  type: 'cluster';
  coordinates: { latitude: number; longitude: number };
  title: string;
  status: 'active';
  metadata: {
    isCluster: true;
    pointCount: number;
    clusterId: number;
  };
}

type RenderMarker = MapMarker | ClusterRenderMarker;

const MARKER_TYPE_TO_LAYER: Partial<Record<string, string>> = {
  business: 'businesses',
  service: 'services',
  classified: 'classifieds',
  event: 'events',
  alert: 'alerts',
  professional: 'professionals',
  tourist_point: 'tourist_points',
  driver: 'mobility',
  ride: 'mobility',
};

function createUserLocationMarker(
  coordinates: { latitude: number; longitude: number },
  label?: string,
): MapMarker {
  const marker = {
    id: 'user-location',
    type: 'user_location' as const,
    title: label ?? 'Voce esta aqui',
    status: 'active' as const,
    metadata: { isUserLocation: true },
  } as MapMarker;

  marker.coordinates = {
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
  };

  return marker;
}

function createClusterRenderMarker(
  clusterId: number,
  pointCount: number,
  coordinates: [number, number],
): ClusterRenderMarker {
  const [longitude, latitude] = coordinates;
  const marker = {
    id: `cluster-${clusterId}`,
    type: 'cluster' as const,
    title: `${pointCount} itens`,
    status: 'active' as const,
    metadata: {
      isCluster: true,
      pointCount,
      clusterId,
    },
  } as ClusterRenderMarker;

  marker.coordinates = { latitude, longitude };

  return marker;
}

/**
 * Adaptador MapLibre GL JS para o sistema de hooks v3.
 *
 * @example
 * ```tsx
 * const adapterRef = useRef<MapLibreAdapterHandle>(null);
 *
 * <MapLibreAdapter
 *   ref={adapterRef}
 *   styleUrl="https://tiles.openfreemap.org/styles/positron"
 *   onViewportChange={(viewport, bounds) => {
 *     fetchByBounds(bounds, viewport.zoom);
 *   }}
 * />
 * ```
 */
// ─── Refs de marcadores com mapa por ID para diffing ─────────────────────────
export const MapLibreAdapter = forwardRef<MapLibreAdapterHandle, MapLibreAdapterProps>(
  function MapLibreAdapter(
    { 
      styleUrl, 
      initialViewport, 
      territoryPolygons = [], 
      markers = [], 
      onMarkerClick, 
      circle, 
      onViewportChange, 
      onMapClick, 
      onLoad, 
      controls,
      userLocationMarker,
      resolved,
      enableClustering = false,
      radiusControl,
      className 
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    // Map<markerId, Marker> para diffing eficiente
    const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
    const { handleMapMove } = useViewportBridge();

    // Estado do viewport para clustering
    const [currentBounds, setCurrentBounds] = React.useState<BoundingBox | null>(null);
    const [currentZoom, setCurrentZoom] = React.useState<number>(DEFAULT_ZOOM);
    
    // ID único do mapa para componentes filhos
    const mapId = React.useMemo(() => `map-${Math.random().toString(36).substr(2, 9)}`, []);

    // Expor handle imperativo
    useImperativeHandle(ref, () => ({
      getMap: () => mapRef.current,
      flyTo: (viewport) => {
        const map = mapRef.current;
        if (!map) return;
        map.flyTo({
          center: viewport.center
            ? [viewport.center.longitude, viewport.center.latitude]
            : undefined,
          zoom: viewport.zoom,
          duration: 800,
        });
      },
      getMapId: () => mapId,
    }));

    // Extrair bounds do mapa como BoundingBox
    const extractBounds = useCallback((map: maplibregl.Map): BoundingBox => {
      const b = map.getBounds();
      return [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
    }, []);

    // Inicializar mapa
    useEffect(() => {
      if (!containerRef.current || mapRef.current) return;

      const center: [number, number] = initialViewport?.center
        ? [initialViewport.center.longitude, initialViewport.center.latitude]
        : DEFAULT_CENTER;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: styleUrl,
        center,
        zoom: initialViewport?.zoom ?? DEFAULT_ZOOM,
        bearing: initialViewport?.bearing ?? 0,
        pitch: initialViewport?.pitch ?? 0,
        attributionControl: false,
      });

      map.addControl(
        new maplibregl.AttributionControl({
          compact: true,
          customAttribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        }),
        'bottom-left'
      );

      map.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        'bottom-right'
      );

      // Evento: mapa carregado
      map.on('load', () => {
        onLoad?.();
      });

      // Suprimir avisos de sprite do estilo liberty (OSM tem ícones não bundlados).
      // Registrar uma imagem transparente 1x1 para qualquer ícone ausente evita
      // o flood de warnings no console sem trocar de estilo.
      map.on('styleimagemissing', (e: { id: string }) => {
        if (!map.hasImage(e.id)) {
          map.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) });
        }
      });

      // Evento: idle — mapa estabilizou, tiles carregados
      // Expor estado real via window.__mapState para testes E2E
      map.on('idle', () => {
        onLoad?.(); // compatibilidade
        if (typeof window !== 'undefined') {
          const s = (window as any).__mapState || {};
          s.loaded = map.loaded();
          s.tilesLoaded = map.areTilesLoaded();
          s.idle = true;
          s.zoom = map.getZoom();
          const c = map.getCenter();
          s.lastCenter = { lat: c.lat, lng: c.lng };
          (window as any).__mapState = s;
        }
      });

      // Evento: erro do mapa
      map.on('error', (e) => {
        // Suprimir avisos de dados de tiles com valores null (comum em tiles OSM)
        const errorMessage = e.error?.message || '';
        if (errorMessage.includes('Expected value to be of type number, but found null')) {
          // Aviso conhecido: tiles do OSM podem ter propriedades null
          // Não afeta renderização do mapa, apenas log silencioso
          return;
        }

        // Outros erros são registrados para debug
        logger.warn('[MapLibreAdapter] Map error:', errorMessage);

        if (typeof window !== 'undefined') {
          const s = (window as any).__mapState || {};
          (s.errors = s.errors || []).push(errorMessage || 'unknown');
          (window as any).__mapState = s;
        }
      });

      // Evento: perda de contexto WebGL — via map.on, não listener manual no canvas
      map.on('webglcontextlost', () => {
        if (typeof window !== 'undefined') {
          const s = (window as any).__mapState || {};
          s.webglContextLost = true;
          (window as any).__mapState = s;
        }
      });

      // Evento: fim de movimento (pan + zoom)
      map.on('moveend', () => {
        const center = map.getCenter();
        const zoom = map.getZoom();
        const bounds = extractBounds(map);

        const viewport: MapViewport = {
          center: { latitude: center.lat, longitude: center.lng },
          zoom,
          bearing: map.getBearing(),
          pitch: map.getPitch(),
          bounds,
        };

        // Atualizar estado para clustering
        setCurrentBounds(bounds);
        setCurrentZoom(zoom);

        // Sincronizar com useViewportBridge (atualiza estado interno)
        handleMapMove(viewport);

        // Notificar consumidor externo (para viewport fetch)
        onViewportChange?.(viewport, bounds);

        // Atualizar __mapState para testes de pan/zoom
        if (typeof window !== 'undefined') {
          const s = (window as any).__mapState || {};
          s.zoom = zoom;
          s.lastCenter = { lat: center.lat, lng: center.lng };
          (window as any).__mapState = s;
        }
      });

      // Evento: clique no mapa
      map.on('click', (e) => {
        onMapClick?.({
          latitude: e.lngLat.lat,
          longitude: e.lngLat.lng,
        });
      });

      mapRef.current = map;

      const markerRegistry = markersRef.current;

      return () => {
        map.remove();
        mapRef.current = null;
        markerRegistry.clear();
      };
    // Inicialização única — dependências intencionalmente omitidas
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sincronizar estilo quando mudar — usa ref para evitar setStyle desnecessário
    const currentStyleUrlRef = useRef(styleUrl);
    useEffect(() => {
      const map = mapRef.current;
      if (!map || currentStyleUrlRef.current === styleUrl) return;
      currentStyleUrlRef.current = styleUrl;
      map.setStyle(styleUrl);
    }, [styleUrl]);

    // ── Câmera dinâmica (para NeighborhoodMap que atualiza centro ao localizar) ──
    // Só aplica quando initialViewport muda após a montagem (não na inicialização).
    const isFirstRender = useRef(true);
    useEffect(() => {
      if (isFirstRender.current) { isFirstRender.current = false; return; }
      const map = mapRef.current;
      if (!map || !initialViewport?.center) return;
      map.flyTo({
        center: [initialViewport.center.longitude, initialViewport.center.latitude],
        zoom: initialViewport.zoom,
        duration: 1000,
        essential: true,
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialViewport?.center?.latitude, initialViewport?.center?.longitude, initialViewport?.zoom]);

    // ── Centralizar no território quando polígonos chegarem ───────────────────
    // Comportamento SSOT: qualquer consumidor do MapLibreAdapter (MapaPageV4,
    // EmpresasLandingPage, NeighborhoodMap) centraliza automaticamente no
    // território quando os polígonos do Nominatim chegam — sem precisar
    // implementar essa lógica em cada página.
    const centeredOnTerritory = useRef(false);
    useEffect(() => {
      // Resetar flag quando o território muda
      centeredOnTerritory.current = false;
    }, [resolved]);

    useEffect(() => {
      if (centeredOnTerritory.current || territoryPolygons.length === 0) return;
      const map = mapRef.current;
      if (!map) return;
      centeredOnTerritory.current = true;

      const fly = () => {
        if (territoryPolygons.length === 1) {
          const [lat, lng] = territoryPolygons[0].center;
          const isCity =
            resolved?.kind === 'location' &&
            resolved.location.geographic_path.split('/').filter(Boolean).length === 3;
          map.flyTo({ center: [lng, lat], zoom: isCity ? 12 : 14, duration: 800 });
        } else {
          const n = territoryPolygons.length;
          const lat = territoryPolygons.reduce((s, p) => s + p.center[0], 0) / n;
          const lng = territoryPolygons.reduce((s, p) => s + p.center[1], 0) / n;
          map.flyTo({ center: [lng, lat], zoom: 13, duration: 800 });
        }
      };

      if (map.isStyleLoaded()) fly();
      else map.once('load', fly);
    }, [territoryPolygons, resolved]);

    // ── Camada de território (polígonos de bairro/cidade) ──────────────────────
    // Renderiza os polígonos do território ativo sobre o mapa base.
    // IDs de source/layer prefixados para não colidir com layers do estilo.
    useEffect(() => {
      const map = mapRef.current;
      if (!map) return;

      const TERRITORY_SOURCE_PREFIX = 'territory-source-';
      const TERRITORY_FILL_PREFIX   = 'territory-fill-';
      const TERRITORY_LINE_PREFIX   = 'territory-line-';

      const apply = () => {
        // Remover layers/sources anteriores
        const style = map.getStyle();
        if (style?.sources) {
          Object.keys(style.sources)
            .filter((id) => id.startsWith(TERRITORY_SOURCE_PREFIX))
            .forEach((sourceId) => {
              const idx = sourceId.replace(TERRITORY_SOURCE_PREFIX, '');
              const fillId = `${TERRITORY_FILL_PREFIX}${idx}`;
              const lineId = `${TERRITORY_LINE_PREFIX}${idx}`;
              if (map.getLayer(fillId)) map.removeLayer(fillId);
              if (map.getLayer(lineId)) map.removeLayer(lineId);
              if (map.getSource(sourceId)) map.removeSource(sourceId);
            });
        }

        territoryPolygons.forEach((poly, i) => {
          const sourceId = `${TERRITORY_SOURCE_PREFIX}${i}`;
          const fillId   = `${TERRITORY_FILL_PREFIX}${i}`;
          const lineId   = `${TERRITORY_LINE_PREFIX}${i}`;

          // Projeto usa [lat, lng]; GeoJSON exige [lng, lat]
          // Validar coordenadas antes de converter
          const ring = poly.coordinates
            .filter(([lat, lng]) => 
              lat != null && lng != null && 
              !isNaN(lat) && !isNaN(lng) &&
              isFinite(lat) && isFinite(lng)
            )
            .map(([lat, lng]) => [lng, lat] as [number, number]);
          
          // Verificar se temos coordenadas válidas suficientes
          if (ring.length < 3) {
            logger.warn(`[MapLibreAdapter] Polígono ${poly.name} tem coordenadas insuficientes ou inválidas`);
            return;
          }
          
          // Fechar anel se necessário
          if (
            ring.length > 0 &&
            (ring[0][0] !== ring[ring.length - 1][0] ||
              ring[0][1] !== ring[ring.length - 1][1])
          ) {
            ring.push(ring[0]);
          }

          map.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: { type: 'Polygon', coordinates: [ring] },
              properties: { name: poly.name },
            },
          });

          map.addLayer({
            id: fillId,
            type: 'fill',
            source: sourceId,
            paint: { 'fill-color': poly.color, 'fill-opacity': 0.12 },
          });

          map.addLayer({
            id: lineId,
            type: 'line',
            source: sourceId,
            paint: { 'line-color': poly.color, 'line-width': 2, 'line-opacity': 0.8 },
          });
        });
      };

      if (map.isStyleLoaded()) {
        apply();
      } else {
        map.once('load', apply);
      }
    }, [territoryPolygons]);

    // ── Círculo (área de CEP) ──────────────────────────────────────────────────
    useEffect(() => {
      const map = mapRef.current;
      if (!map) return;

      const CIRCLE_SOURCE = 'adapter-circle-source';
      const CIRCLE_FILL   = 'adapter-circle-fill';
      const CIRCLE_LINE   = 'adapter-circle-line';

      const apply = () => {
        if (map.getLayer(CIRCLE_FILL)) map.removeLayer(CIRCLE_FILL);
        if (map.getLayer(CIRCLE_LINE)) map.removeLayer(CIRCLE_LINE);
        if (map.getSource(CIRCLE_SOURCE)) map.removeSource(CIRCLE_SOURCE);

        if (!circle) return;

        const [lat, lng] = circle.center;
        const r = circle.radiusMeters;
        const steps = 64;
        const coords: [number, number][] = Array.from({ length: steps }, (_, i) => {
          const angle = (i / steps) * 2 * Math.PI;
          const dLat = (r / 111320) * Math.cos(angle);
          const dLng = (r / (111320 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle);
          return [lng + dLng, lat + dLat];
        });
        coords.push(coords[0]);

        map.addSource(CIRCLE_SOURCE, {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] }, properties: {} },
        });
        map.addLayer({ id: CIRCLE_FILL, type: 'fill', source: CIRCLE_SOURCE, paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.1 } });
        map.addLayer({ id: CIRCLE_LINE, type: 'line', source: CIRCLE_SOURCE, paint: { 'line-color': '#3b82f6', 'line-width': 2 } });
        map.flyTo({ center: [lng, lat], zoom: 14 });
      };

      if (map.isStyleLoaded()) apply();
      else map.once('load', apply);
    }, [circle]);

    // ── Controles integrados ──────────────────────────────────────────────────
    // Geolocalização lazy — só inicia quando o usuário clica no botão de localização
    const {
      coords: userLocation,
      loading: loadingLocation,
      requestLocation: handleRequestLocation,
      isHighAccuracy,
    } = useRobustGeolocation({
      useCache: true, // usa cache se disponível, sem solicitar GPS automaticamente
      onSuccess: (coords) => {
        if (controls?.location?.autoFlyTo !== false) {
          const zoom = controls?.location?.flyToZoom ?? (coords.accuracy < 100 ? 16 : 14);
          mapRef.current?.flyTo({
            center: [coords.longitude, coords.latitude],
            zoom,
            duration: 800,
          });
        }
      },
    });

    // Solicitar localização automaticamente ao montar (para marcador aparecer)
    React.useEffect(() => {
      if (userLocationMarker?.enabled && userLocationMarker?.autoAdd) {
        logger.debug('[MapLibreAdapter] Solicitando localização para marcador automático...');
        handleRequestLocation();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Apenas uma vez ao montar

    const [searchQuery, setSearchQuery] = React.useState('');
    const locationAccuracy = userLocation?.accuracy;

    // ── Estado de camadas visíveis — suporta modo controlado e não-controlado ──
    const [internalVisibleLayers, setInternalVisibleLayers] = React.useState<Record<string, boolean>>(
      () => Object.fromEntries((controls?.layers?.layers ?? []).map((k) => [k, true])),
    );
    const controlledVisibleLayers = controls?.layers?.visibleLayers;
    const isLayerVisibilityControlled = controlledVisibleLayers !== undefined;
    const visibleLayers = isLayerVisibilityControlled
      ? controlledVisibleLayers
      : internalVisibleLayers;

    // Re-sincroniza estado interno quando a lista de camadas muda
    React.useEffect(() => {
      if (!controls?.layers?.layers) return;
      if (isLayerVisibilityControlled) return;
      setInternalVisibleLayers((prev) => {
        const next: Record<string, boolean> = {};
        controls.layers?.layers.forEach((key) => {
          next[key] = prev[key] ?? true;
        });
        return next;
      });
    }, [controls?.layers?.layers, isLayerVisibilityControlled]);

    const handleLayerToggle = React.useCallback((key: string, visible: boolean) => {
      if (!isLayerVisibilityControlled) {
        setInternalVisibleLayers((prev) => ({ ...prev, [key]: visible }));
      }
      controls?.layers?.onLayerToggle?.(key, visible);
    }, [controls?.layers, isLayerVisibilityControlled]);

    // Mapeamento tipo de marcador → chave de camada
    // Filtrar marcadores por busca
    const filteredMarkers = React.useMemo(() => {
      let result = markers;

      // Filtro de busca
      if (searchQuery.trim() && controls?.search) {
        const query = searchQuery.toLowerCase();
        result = result.filter((m) =>
          m.title?.toLowerCase().includes(query) ||
          (m.metadata?.category as string | undefined)?.toLowerCase().includes(query),
        );
      }

      // Filtro de camadas — só aplica se houver controle de camadas configurado
      if (controls?.layers?.enabled) {
        result = result.filter((m) => {
          const metadataLayerKey =
            typeof m.metadata?.map_layer_key === 'string' ? m.metadata.map_layer_key : undefined;
          const layerKey = metadataLayerKey ?? MARKER_TYPE_TO_LAYER[m.type];
          if (!layerKey) return true; // tipo sem camada → sempre visível
          return visibleLayers[layerKey] !== false;
        });
      }

      return result;
    }, [markers, searchQuery, controls?.search, controls?.layers?.enabled, visibleLayers]);

    // Adicionar marcador de localização do usuário se configurado
    const allMarkers = React.useMemo(() => {
      const result = [...filteredMarkers];
      if (userLocationMarker?.enabled && userLocationMarker?.autoAdd && userLocation) {
        result.push(
          createUserLocationMarker(
            {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            },
            userLocationMarker.label,
          ),
        );
      }
      return result;
    }, [filteredMarkers, userLocationMarker, userLocation]);

    // ── Clustering de marcadores ─────────────────────────────────────────────
    const { clusters, isReady: clusteringReady } = useMapClustering({
      markers: allMarkers,
      bounds: currentBounds,
      zoom: currentZoom,
      enabled: enableClustering,
      radius: 60,
      maxZoom: 16,
      minPoints: 2,
    });

    // Usar clusters se clustering estiver habilitado, senão usar marcadores diretos
    const markersToRender = React.useMemo<RenderMarker[]>(() => {
      if (!enableClustering || !clusteringReady) {
        return allMarkers;
      }

      // Converter clusters para marcadores
      return clusters.map((cluster) => {
        if (cluster.properties.cluster) {
          // É um cluster
          return createClusterRenderMarker(
            cluster.id,
            cluster.properties.point_count ?? 0,
            cluster.geometry.coordinates,
          );
        }

        return cluster.properties.marker;
      });
    }, [enableClustering, clusteringReady, clusters, allMarkers]);

    // ── Marcadores com diffing por ID ─────────────────────────────────────────
    // Só remove/adiciona marcadores que mudaram — evita recriar todos a cada pan/zoom.
    useEffect(() => {
      const map = mapRef.current;
      if (!map) return;

      const syncMarkers = () => {
        const current = markersRef.current;
        const nextIds = new Set(markersToRender.map((m) => m.id));

        // Remover marcadores que não existem mais
        current.forEach((marker, id) => {
          if (!nextIds.has(id)) {
            marker.remove();
            current.delete(id);
          }
        });

        // Adicionar marcadores novos
        markersToRender.forEach((marker) => {
          if (current.has(marker.id)) return; // já existe

          // ✅ SSOT: Validar coordenadas antes de desestruturar
          if (!marker.coordinates) return;
          
          const { latitude: lat, longitude: lng } = marker.coordinates;
          if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) return;

          const isUserLocation = marker.metadata?.isUserLocation === true;
          const isCluster = marker.metadata?.isCluster === true;
          const el = document.createElement('div');

          if (isUserLocation) {
            el.style.cssText = 'width:60px;height:60px;display:flex;align-items:center;justify-content:center;position:relative;pointer-events:auto;';
            // ✅ SEGURO - Usa DOM API ao invés de innerHTML
            const svg = createUserLocationSvg();
            el.appendChild(svg);
          } else if (isCluster) {
            // Renderizar cluster
            const pointCount = marker.metadata?.pointCount || 0;
            const size = pointCount < 10 ? 40 : pointCount < 50 ? 50 : 60;
            el.style.cssText = [
              `width:${size}px`, `height:${size}px`,
              'display:flex', 'align-items:center', 'justify-content:center',
              'border-radius:50%',
              'background:#3b82f6',
              'border:3px solid white',
              'box-shadow:0 2px 12px rgba(0,0,0,0.4)',
              'cursor:pointer',
              'font-weight:bold',
              'color:white',
              'font-size:14px',
            ].join(';');
            el.textContent = String(pointCount);

            // Ao clicar no cluster, dar zoom
            el.addEventListener('click', () => {
              map.flyTo({
                center: [lng, lat],
                zoom: map.getZoom() + 2,
                duration: 500,
              });
            });
          } else {
            // Usa SSOT: getMarkerConfig de markerConfig.ts
            const cfg = getMarkerConfig(marker.type);
            el.style.cssText = [
              'width:36px', 'height:36px',
              'display:flex', 'align-items:center', 'justify-content:center',
              'border-radius:50% 50% 50% 0', 'transform:rotate(-45deg)',
              `background:${cfg.color}`,
              'border:2px solid white',
              'box-shadow:0 2px 8px rgba(0,0,0,0.35)',
              'cursor:pointer',
            ].join(';');
            const inner = document.createElement('span');
            inner.style.cssText = 'transform:rotate(45deg);font-size:15px;line-height:1;';
            inner.textContent = cfg.emoji;
            el.appendChild(inner);
          }

          if (onMarkerClick && !isUserLocation && !isCluster) {
            el.addEventListener('click', () => onMarkerClick(marker.id));
          }

          const m = new maplibregl.Marker({
            element: el,
            anchor: isUserLocation ? 'center' : isCluster ? 'center' : 'bottom-left',
          }).setLngLat([lng, lat]).addTo(map);

          current.set(marker.id, m);
        });
      };

      if (map.isStyleLoaded()) syncMarkers();
      else map.once('load', syncMarkers);
    }, [markersToRender, onMarkerClick]);

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <div
          ref={containerRef}
          className={className}
          data-maplibre-adapter
          style={{ width: '100%', height: '100%' }}
          aria-label="Mapa interativo"
          role="application"
        />

        {controls?.search && (
          <MapControlsLayout position={controls.search.position ?? 'top-left'}>
            <MapSearchControl
              {...controls.search}
              entities={markers}
              onSearch={setSearchQuery}
              onResultSelect={(lat, lng) => {
                mapRef.current?.flyTo({ center: [lng, lat], zoom: 15, duration: 800 });
              }}
            />
          </MapControlsLayout>
        )}

        {/* Controles do canto superior direito - agrupados */}
        {(controls?.location?.enabled || controls?.territory?.enabled) && (
          <MapControlsLayout position="top-right">
            {controls?.location?.enabled && (
              <MapLocationControl
                {...controls.location}
                onRequestLocation={handleRequestLocation}
                isLoading={loadingLocation}
                accuracy={locationAccuracy}
                hasLocation={!!userLocation}
                isHighAccuracy={isHighAccuracy}
              />
            )}
            {controls?.territory?.enabled && (
              <MapTerritoryControl {...controls.territory} resolved={resolved} />
            )}
          </MapControlsLayout>
        )}

        {/* Controle de camadas */}
        {controls?.layers?.enabled && (
          <MapControlsLayout position={controls.layers.position ?? 'bottom-left'}>
            <MapLayerControl
              {...controls.layers}
              visibleLayers={visibleLayers}
              onLayerToggle={handleLayerToggle}
            />
          </MapControlsLayout>
        )}

        {/* Controle de raio */}
        {radiusControl?.enabled && (
          <MapControlsLayout position="bottom-right">
            <MapRadiusControl
              initialRadius={radiusControl.initialRadius}
              minRadius={radiusControl.minRadius}
              maxRadius={radiusControl.maxRadius}
              onRadiusPreview={radiusControl.onRadiusPreview}
              onRadiusChange={radiusControl.onRadiusChange}
              onDisable={radiusControl.onDisable}
              isActive={radiusControl.isActive}
              counts={radiusControl.counts}
              visible={true}
            />
          </MapControlsLayout>
        )}
      </div>
    );
  }
);

