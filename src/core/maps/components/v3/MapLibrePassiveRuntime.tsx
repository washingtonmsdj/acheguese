import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { Map as MapLibreMap } from "maplibre-gl";

import { loadMapLibreRuntime } from "@/core/maps/runtime/loadMapLibreRuntime";
import { readMapState, writeMapState } from "@/core/maps/runtime/mapRuntimeState";
import type {
  MapLibreAdapterHandle,
  MapLibreAdapterProps,
} from "./MapLibreAdapterRuntime";

const DEFAULT_CENTER: [number, number] = [-51.9253, -14.235];
const DEFAULT_ZOOM = 13;

function isFiniteCoordinate(latitude: unknown, longitude: unknown): boolean {
  return (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function reportPassiveMapIssue(
  level: "debug" | "warn",
  message: string,
  context?: unknown,
): void {
  void import("@/shared/utils/logger")
    .then(({ logger }) => {
      logger[level](message, context);
    })
    .catch(() => undefined);
}

/**
 * Runtime interno para mapas somente de leitura.
 *
 * Mantém a mesma API pública do MapLibreAdapter, porém exclui do chunk de
 * entrada controles, geolocalização, clustering, busca e markers interativos.
 */
export const MapLibrePassiveRuntime = forwardRef<
  MapLibreAdapterHandle,
  MapLibreAdapterProps
>(function MapLibrePassiveRuntime(
  {
    styleUrl,
    initialViewport,
    territoryPolygons = [],
    resolved,
    fitTerritoryBounds = false,
    territoryFitPadding,
    territoryFitMaxZoom,
    attribution = true,
    hideNavigationControl = false,
    navigationControlPosition = "bottom-right",
    onLoad,
    className,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const styleUrlRef = useRef(styleUrl);
  const fittedTerritoryKeyRef = useRef<string | null>(null);
  const [mapCreated, setMapCreated] = useState(false);

  useImperativeHandle(ref, () => ({
    getMap: () => mapRef.current,
    flyTo: (viewport) => {
      const map = mapRef.current;
      if (!map) return;
      const center = viewport.center;
      if (center && !isFiniteCoordinate(center.latitude, center.longitude)) return;
      map.flyTo({
        center: center ? [center.longitude, center.latitude] : undefined,
        zoom: Number.isFinite(viewport.zoom) ? viewport.zoom : undefined,
        duration: 800,
      });
    },
    getMapId: () => "passive-map",
  }));

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let disposed = false;

    void (async () => {
      const maplibregl = await loadMapLibreRuntime();
      if (disposed || !containerRef.current || mapRef.current) return;

      const requestedCenter = initialViewport?.center;
      const center: [number, number] =
        requestedCenter &&
        isFiniteCoordinate(requestedCenter.latitude, requestedCenter.longitude)
          ? [requestedCenter.longitude, requestedCenter.latitude]
          : DEFAULT_CENTER;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: styleUrl,
        center,
        zoom: initialViewport?.zoom ?? DEFAULT_ZOOM,
        bearing: initialViewport?.bearing ?? 0,
        pitch: initialViewport?.pitch ?? 0,
        attributionControl: false,
        interactive: false,
      });

      if (attribution) {
        map.addControl(
          new maplibregl.AttributionControl({
            compact: true,
            customAttribution:
              '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
          }),
          "bottom-left",
        );
      }

      if (!hideNavigationControl) {
        map.addControl(
          new maplibregl.NavigationControl({ showCompass: false }),
          navigationControlPosition,
        );
      }

      map.setMissingStyleImageResolver((id: string) => {
        if (!map.hasImage(id)) {
          map.addImage(id, {
            width: 1,
            height: 1,
            data: new Uint8Array(4),
          });
        }
      });

      map.on("load", () => {
        if (disposed) return;
        onLoad?.();
      });

      map.on("idle", () => {
        if (disposed || typeof window === "undefined") return;
        const state = readMapState();
        state.loaded = map.loaded();
        state.tilesLoaded = map.areTilesLoaded();
        state.idle = true;
        state.zoom = map.getZoom();
        const centerPoint = map.getCenter();
        state.lastCenter = { lat: centerPoint.lat, lng: centerPoint.lng };
        writeMapState(state);
      });

      map.on("error", (event: { error?: { message?: string }; preventDefault?: () => void }) => {
        const message = event.error?.message || "";
        if (message.includes("Expected value to be of type number, but found null")) {
          event.preventDefault?.();
          return;
        }
        reportPassiveMapIssue("warn", "[MapLibrePassiveRuntime] Map error:", message);
        if (typeof window !== "undefined") {
          const state = readMapState();
          (state.errors = state.errors || []).push(message || "unknown");
          writeMapState(state);
        }
      });

      map.on("webglcontextlost", () => {
        if (typeof window === "undefined") return;
        const state = readMapState();
        state.webglContextLost = true;
        writeMapState(state);
      });

      mapRef.current = map;
      setMapCreated(true);
    })();

    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // Initialization is intentionally single-shot. Updates are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapCreated || !map || styleUrlRef.current === styleUrl) return;
    styleUrlRef.current = styleUrl;
    fittedTerritoryKeyRef.current = null;
    map.setStyle(styleUrl);
  }, [mapCreated, styleUrl]);

  useEffect(() => {
    fittedTerritoryKeyRef.current = null;
  }, [resolved]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapCreated || !map) return;

    const SOURCE_PREFIX = "territory-source-";
    const FILL_PREFIX = "territory-fill-";
    const LINE_PREFIX = "territory-line-";
    let disposed = false;

    const apply = () => {
      if (disposed || !map.isStyleLoaded()) return false;

      const style = map.getStyle();
      if (style?.sources) {
        Object.keys(style.sources)
          .filter((id) => id.startsWith(SOURCE_PREFIX))
          .forEach((sourceId) => {
            const index = sourceId.replace(SOURCE_PREFIX, "");
            const fillId = `${FILL_PREFIX}${index}`;
            const lineId = `${LINE_PREFIX}${index}`;
            if (map.getLayer(fillId)) map.removeLayer(fillId);
            if (map.getLayer(lineId)) map.removeLayer(lineId);
            if (map.getSource(sourceId)) map.removeSource(sourceId);
          });
      }

      let polygonCount = 0;
      let coordinateCount = 0;
      let west = Infinity;
      let south = Infinity;
      let east = -Infinity;
      let north = -Infinity;

      territoryPolygons.forEach((polygon, index) => {
        const ring = polygon.coordinates
          .filter(([lat, lng]) => isFiniteCoordinate(lat, lng))
          .map(([lat, lng]) => [lng, lat] as [number, number]);

        if (ring.length < 3) return;
        if (
          ring[0][0] !== ring[ring.length - 1][0] ||
          ring[0][1] !== ring[ring.length - 1][1]
        ) {
          ring.push(ring[0]);
        }

        const sourceId = `${SOURCE_PREFIX}${index}`;
        const fillId = `${FILL_PREFIX}${index}`;
        const lineId = `${LINE_PREFIX}${index}`;

        map.addSource(sourceId, {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: { type: "Polygon", coordinates: [ring] },
            properties: { name: polygon.name },
          },
        });
        map.addLayer({
          id: fillId,
          type: "fill",
          source: sourceId,
          paint: {
            "fill-color": polygon.color,
            "fill-opacity": polygon.fillOpacity ?? 0.18,
          },
        });
        map.addLayer({
          id: lineId,
          type: "line",
          source: sourceId,
          paint: {
            "line-color": polygon.color,
            "line-width": polygon.lineWidth ?? 3,
            "line-opacity": polygon.lineOpacity ?? 1,
          },
        });

        polygonCount += 1;
        coordinateCount += ring.length;
        ring.forEach(([lng, lat]) => {
          west = Math.min(west, lng);
          south = Math.min(south, lat);
          east = Math.max(east, lng);
          north = Math.max(north, lat);
        });
      });

      if (typeof window !== "undefined") {
        const state = readMapState();
        state.territoryPolygonCount = polygonCount;
        state.territoryCoordinateCount = coordinateCount;
        state.territoryBounds =
          coordinateCount > 0 && [west, south, east, north].every(Number.isFinite)
            ? { west, south, east, north }
            : undefined;
        writeMapState(state);
      }

      const hasValidBounds =
        coordinateCount >= 3 &&
        [west, south, east, north].every(Number.isFinite) &&
        Math.abs(east - west) > 0.000001 &&
        Math.abs(north - south) > 0.000001;

      if (fitTerritoryBounds && hasValidBounds) {
        const territoryKey = `${polygonCount}:${west}:${south}:${east}:${north}`;
        if (fittedTerritoryKeyRef.current !== territoryKey) {
          fittedTerritoryKeyRef.current = territoryKey;
          try {
            map.fitBounds(
              [
                [west, south],
                [east, north],
              ],
              {
                padding: territoryFitPadding ?? 32,
                maxZoom: territoryFitMaxZoom,
                duration: 800,
              },
            );
          } catch (error) {
            reportPassiveMapIssue(
              "debug",
              "[MapLibrePassiveRuntime] Ignoring invalid territory bounds:",
              error,
            );
          }
        }
      }

      return true;
    };

    const applyWhenReady = () => {
      if (!apply()) return;
      map.off("load", applyWhenReady);
      map.off("idle", applyWhenReady);
    };

    if (!apply()) {
      map.on("load", applyWhenReady);
      map.on("idle", applyWhenReady);
    }
    const retryId = window.setTimeout(applyWhenReady, 250);

    return () => {
      disposed = true;
      window.clearTimeout(retryId);
      map.off("load", applyWhenReady);
      map.off("idle", applyWhenReady);
    };
  }, [
    fitTerritoryBounds,
    mapCreated,
    territoryFitMaxZoom,
    territoryFitPadding,
    territoryPolygons,
  ]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        ref={containerRef}
        className={className}
        data-maplibre-adapter
        data-maplibre-runtime="passive"
        style={{ width: "100%", height: "100%" }}
        aria-label="Mapa territorial"
        role="img"
      />
    </div>
  );
});
