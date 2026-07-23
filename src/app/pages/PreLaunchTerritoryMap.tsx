import { useEffect, useMemo, useState } from "react";

import { TERRITORY_CONFIG } from "@/config/territory";
import { boundaryService } from "@/core/geospatial";
import { createLocationRepository } from "@/core/location/repositories/createLocationRepository";
import { LocationStatus, LocationType, type Location } from "@/core/location/types";
import { DEFAULT_TILE_STYLE, MapLibreAdapter, type MapMarker } from "@/core/maps";
import type { TerritoryPolygon } from "@/core/maps/hooks/useTerritoryPolygon";
import { normalizeTerritoryText, slugifyTerritory } from "@/shared/utils/slugify";

const COMPLEX_NEIGHBORHOODS = [
  "Nordeste de Amaralina",
  "Santa Cruz",
  "Chapada do Rio Vermelho",
  "Vale das Pedrinhas",
] as const;

const COMPLEX_POLYGON_COLORS = ["#18B37E", "#f97316", "#0ea5e9", "#84cc16"] as const;
const SALVADOR_CENTER = { latitude: -12.9777, longitude: -38.5016 };
const COMPLEX_FALLBACK_CENTERS: Record<
  (typeof COMPLEX_NEIGHBORHOODS)[number],
  [number, number]
> = {
  "Nordeste de Amaralina": [-13.00850207522845, -38.473872259293444],
  "Santa Cruz": [-13.00219789478145, -38.47471040182655],
  "Chapada do Rio Vermelho": [-13.004056002367001, -38.4818418340164],
  "Vale das Pedrinhas": [-13.00843350490315, -38.48009510441305],
};

type TerritoryFitPadding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

function getTerritoryFitPadding(): TerritoryFitPadding {
  if (typeof window === "undefined") {
    return { top: 96, right: 32, bottom: 110, left: 32 };
  }

  if (window.innerWidth < 640) {
    return { top: 92, right: 18, bottom: 280, left: 126 };
  }

  if (window.innerWidth < 1024) {
    return { top: 96, right: 28, bottom: 240, left: 28 };
  }

  return { top: 96, right: 32, bottom: 110, left: 32 };
}

function getLaunchCityPaths(): string[] {
  const country = TERRITORY_CONFIG.launch.country || "br";
  const state = TERRITORY_CONFIG.launch.state || "ba";
  const city = TERRITORY_CONFIG.launch.city || "salvador";
  return Array.from(new Set([`/${country}/${state}/${city}`, `/${state}/${city}`]));
}

function isComplexNeighborhood(name: string): boolean {
  const normalized = normalizeTerritoryText(name);
  return COMPLEX_NEIGHBORHOODS.some(
    (neighborhood) => normalizeTerritoryText(neighborhood) === normalized,
  );
}

function getLocationCenter(location: Location): [number, number] | null {
  const latitude = Number(location.metadata.center_latitude);
  const longitude = Number(location.metadata.center_longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude === 0 && longitude === 0) return null;
  return [latitude, longitude];
}

export function PreLaunchTerritoryMap() {
  const [cityLocation, setCityLocation] = useState<Location | null>(null);
  const [cityPolygons, setCityPolygons] = useState<TerritoryPolygon[]>([]);
  const [complexLocations, setComplexLocations] = useState<Location[]>([]);
  const [complexPolygons, setComplexPolygons] = useState<TerritoryPolygon[]>([]);
  const [territoryFitPadding, setTerritoryFitPadding] =
    useState<TerritoryFitPadding>(() => getTerritoryFitPadding());

  useEffect(() => {
    const handleResize = () => setTerritoryFitPadding(getTerritoryFitPadding());
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadCityLocation = async () => {
      const repo = createLocationRepository();
      for (const path of getLaunchCityPaths()) {
        const location = await repo.findByPath(path);
        if (location) return location;
      }
      return null;
    };

    loadCityLocation()
      .then((location) => {
        if (!cancelled) setCityLocation(location);
      })
      .catch(() => {
        if (!cancelled) setCityLocation(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadCityBoundary = async () => {
      if (!cityLocation) {
        setCityPolygons([]);
        return;
      }

      const bounds = await boundaryService.getLocationBounds(cityLocation);
      if (cancelled) return;

      setCityPolygons(
        bounds.rings.map((ring, index) => ({
          name: cityLocation.name,
          coordinates: ring,
          center: bounds.center,
          color: index === 0 ? "#64748b" : "#94a3b8",
        })),
      );
    };

    loadCityBoundary().catch(() => {
      if (!cancelled) setCityPolygons([]);
    });

    return () => {
      cancelled = true;
    };
  }, [cityLocation]);

  useEffect(() => {
    let cancelled = false;

    const loadComplexBoundaries = async () => {
      if (!cityLocation) {
        setComplexLocations([]);
        const fallbackResults = await Promise.allSettled(
          COMPLEX_NEIGHBORHOODS.map(async (neighborhood) => {
            const bounds = await boundaryService.getNeighborhoodBounds({
              neighborhood,
              city: TERRITORY_CONFIG.launch.name || "Salvador",
              state: TERRITORY_CONFIG.launch.state || "ba",
            });

            return bounds.rings.map((ring) => ({
              name: neighborhood,
              coordinates: ring,
              center: bounds.center,
              color:
                COMPLEX_POLYGON_COLORS[
                  COMPLEX_NEIGHBORHOODS.indexOf(neighborhood)
                ],
            }));
          }),
        );

        if (!cancelled) {
          setComplexPolygons(
            fallbackResults.flatMap((result) =>
              result.status === "fulfilled" ? result.value : [],
            ),
          );
        }
        return;
      }

      const repo = createLocationRepository();
      const { locations: neighborhoods } = await repo.findChildren(cityLocation.id, {
        type: LocationType.NEIGHBORHOOD,
        status: LocationStatus.ACTIVE,
        page_size: 200,
      });
      const { locations: districts } = await repo.findChildren(cityLocation.id, {
        type: LocationType.DISTRICT,
        status: LocationStatus.ACTIVE,
        page_size: 200,
      });

      const selected = new Map<string, Location>();
      [...neighborhoods, ...districts].forEach((location) => {
        if (!isComplexNeighborhood(location.name)) return;
        const key = normalizeTerritoryText(location.name);
        if (!selected.has(key)) selected.set(key, location);
      });

      const selectedLocations = Array.from(selected.values());
      if (!cancelled) setComplexLocations(selectedLocations);

      const results = await Promise.allSettled(
        selectedLocations.map(async (location) => {
          const colorIndex = COMPLEX_NEIGHBORHOODS.findIndex(
            (neighborhood) =>
              normalizeTerritoryText(neighborhood) === normalizeTerritoryText(location.name),
          );
          const bounds = await boundaryService.getNeighborhoodBounds({
            neighborhood: location.name,
            city: cityLocation.name,
            state: "",
            locationId: location.id,
          });

          return bounds.rings.map((ring) => ({
            name: location.name,
            coordinates: ring,
            center: bounds.center,
            color: COMPLEX_POLYGON_COLORS[colorIndex >= 0 ? colorIndex : 0],
          }));
        }),
      );

      if (cancelled) return;

      setComplexPolygons(
        results.flatMap((result) => (result.status === "fulfilled" ? result.value : [])),
      );
    };

    loadComplexBoundaries().catch(() => {
      if (!cancelled) setComplexPolygons([]);
    });

    return () => {
      cancelled = true;
    };
  }, [cityLocation]);

  const territoryPolygons = useMemo(
    () => [...cityPolygons, ...complexPolygons],
    [cityPolygons, complexPolygons],
  );

  const markers = useMemo<MapMarker[]>(() => {
    const salvadorCenter = cityPolygons[0]?.center;
    const output: MapMarker[] = [
      {
        id: "prelaunch-salvador",
        type: "service",
        coordinates: {
          latitude: salvadorCenter?.[0] ?? SALVADOR_CENTER.latitude,
          longitude: salvadorCenter?.[1] ?? SALVADOR_CENTER.longitude,
        },
        title: "Salvador",
        subtitle: "cidade piloto",
        status: "active",
        score: 100,
        isPremium: true,
      },
    ];
    const complexMarkerSourcesByName = new Map<
      string,
      { center: [number, number]; name: string }
    >();

    complexPolygons.forEach((polygon) => {
      const key = normalizeTerritoryText(polygon.name);
      if (!key || complexMarkerSourcesByName.has(key)) return;
      complexMarkerSourcesByName.set(key, {
        center: polygon.center,
        name: polygon.name,
      });
    });

    complexLocations.forEach((location) => {
      const key = normalizeTerritoryText(location.name);
      if (!key || complexMarkerSourcesByName.has(key)) return;
      const center = getLocationCenter(location);
      if (center) {
        complexMarkerSourcesByName.set(key, {
          center,
          name: location.name,
        });
      }
    });

    COMPLEX_NEIGHBORHOODS.forEach((name) => {
      const key = normalizeTerritoryText(name);
      if (!key || complexMarkerSourcesByName.has(key)) return;
      complexMarkerSourcesByName.set(key, {
        center: COMPLEX_FALLBACK_CENTERS[name],
        name,
      });
    });

    Array.from(complexMarkerSourcesByName.values())
      .slice(0, 4)
      .forEach((source, index) => {
        output.push({
          id: `prelaunch-complex-${slugifyTerritory(source.name)}-${index}`,
          type: index === 0 ? "business" : "service",
          coordinates: {
            latitude: source.center[0],
            longitude: source.center[1],
          },
          title: source.name,
          subtitle: "Complexo do Nordeste",
          status: "active",
          score: 96 - index,
        });
      });

    return output;
  }, [cityPolygons, complexLocations, complexPolygons]);

  const complexCount = new Set(
    (complexPolygons.length > 0 ? complexPolygons : complexLocations).map((item) =>
      normalizeTerritoryText(item.name),
    ),
  ).size;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 h-[100svh] min-h-[760px] overflow-hidden lg:inset-0 lg:h-auto"
      aria-hidden="true"
    >
      <div className="absolute inset-0 opacity-[0.62] sm:opacity-[0.78] lg:opacity-100 [&_.maplibregl-marker]:drop-shadow-[0_10px_18px_rgba(15,23,42,0.24)]">
        <MapLibreAdapter
          styleUrl={DEFAULT_TILE_STYLE.styleUrl}
          initialViewport={{ center: SALVADOR_CENTER, zoom: 10.2 }}
          territoryPolygons={territoryPolygons}
          markers={markers}
          fitTerritoryBounds={territoryPolygons.length > 0}
          territoryFitPadding={territoryFitPadding}
          territoryFitMaxZoom={10.7}
          userLocationMarker={{ enabled: false, autoAdd: false }}
          enableClustering={false}
          markerPresentation="compact"
          attribution={false}
          hideNavigationControl
          className="h-full w-full"
        />
      </div>
      <div className="absolute right-4 top-20 z-10 hidden max-w-[250px] rounded-2xl border border-white/80 bg-white/88 px-4 py-3 text-left shadow-[0_16px_42px_rgba(15,23,42,0.14)] backdrop-blur-md sm:block lg:right-[8%] lg:top-[22%]">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#0f8c61]">
          Salvador
        </p>
        <p className="mt-1 text-sm font-semibold leading-tight text-slate-950">
          Complexo do Nordeste em destaque
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-600">
          {complexCount || 4} bairros mapeados no primeiro lançamento.
        </p>
      </div>
      <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-white via-white/95 to-white/54 sm:w-[84vw] sm:via-white/88 sm:to-white/8 lg:w-[58vw] lg:from-white/98 lg:via-white/88 lg:to-white/0" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white via-white/90 to-white/0 sm:h-36 sm:from-white/98" />
      <div className="absolute inset-x-0 bottom-0 h-[62vh] bg-gradient-to-t from-white via-white/88 to-white/0 sm:h-80 sm:via-white/76 lg:h-72 lg:via-white/86" />
    </div>
  );
}
