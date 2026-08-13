import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Loader2,
  MapPin,
  Navigation,
  X,
} from "lucide-react";

import { TERRITORY_CONFIG } from "@/config/territory";
import { boundaryService } from "@/core/geospatial";
import { createLocationRepository } from "@/core/location/repositories/createLocationRepository";
import {
  LocationStatus,
  LocationType,
  type Location,
} from "@/core/location/types";
import type { TerritoryPolygon } from "@/core/maps/hooks/useTerritoryPolygon";
import { DEFAULT_TILE_STYLE } from "@/core/maps/providers/MapProvider";
import { geoPathToPublicUrl } from "@/core/routing/utils/territoryUrls";
import { isTerritoryPubliclyNavigable } from "@/core/routing/utils/territoryVisibility";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useGeolocation } from "@/shared/hooks/useGeolocation";
import { cn } from "@/shared/utils/cn";
import { normalizeTerritoryText } from "@/shared/utils/slugify";

const OFFICIAL_LOGO_SRC = "/images/logo-icon.png";
const LS_KEY = "achegue-se:last-city";

const LazyMapLibreAdapter = lazy(() =>
  import("@/core/maps/components/v3/MapLibreAdapter").then((module) => ({
    default: module.MapLibreAdapter,
  })),
);

interface ReverseGeocodeAddress {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  suburb?: string;
  state?: string;
  state_code?: string;
  country_code?: string;
  "ISO3166-2-lvl4"?: string;
}

interface ResolvedLocation {
  label: string;
  lat: number;
  lng: number;
}

interface CitySuggestion {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

const BR_STATE_TO_UF: Record<string, string> = {
  acre: "AC",
  alagoas: "AL",
  amapa: "AP",
  amazonas: "AM",
  bahia: "BA",
  ceara: "CE",
  "distrito federal": "DF",
  "espirito santo": "ES",
  goias: "GO",
  maranhao: "MA",
  "mato grosso": "MT",
  "mato grosso do sul": "MS",
  "minas gerais": "MG",
  para: "PA",
  paraiba: "PB",
  parana: "PR",
  pernambuco: "PE",
  piaui: "PI",
  "rio de janeiro": "RJ",
  "rio grande do norte": "RN",
  "rio grande do sul": "RS",
  rondonia: "RO",
  roraima: "RR",
  "santa catarina": "SC",
  "sao paulo": "SP",
  sergipe: "SE",
  tocantins: "TO",
};

const homeStatusCardStyle = {
  minWidth: "6.25rem",
  background: "rgba(255, 255, 255, 0.9)",
  boxShadow: "0 6px 14px rgba(15, 23, 42, 0.08)",
};

const recentSuggestions = ["Pituba", "Barra", "Rio Vermelho"];
const PUBLIC_SALVADOR_PATH = "/ba/salvador";
const PUBLIC_SALVADOR_DISTRICT_PATHS: Record<string, string> = {
  pituba: "/ba/salvador/pituba",
  barra: "/ba/salvador/barra",
  "rio vermelho": "/ba/salvador/rio-vermelho",
};

const PREVIEW_MAP_CENTER = { latitude: -12.95, longitude: -38.55 };

// Source: IBGE Malhas Municipais, municipio 2927408 (Salvador), GeoJSON qualidade intermediaria.
// Used only while the SSOT does not expose a stored municipal boundary for Salvador.
const SALVADOR_CITY_BOUNDARY_RING: [number, number][] = [
  [-13.0127, -38.5856],
  [-13.0099, -38.5278],
  [-13.0123, -38.5078],
  [-13.0117, -38.4927],
  [-13.0173, -38.487],
  [-13.0148, -38.4819],
  [-13.0149, -38.4687],
  [-13.0069, -38.4583],
  [-12.9962, -38.4404],
  [-12.9864, -38.4322],
  [-12.9633, -38.3982],
  [-12.956, -38.385],
  [-12.9507, -38.3644],
  [-12.9571, -38.3535],
  [-12.9449, -38.3348],
  [-12.9284, -38.3175],
  [-12.9109, -38.3043],
  [-12.9038, -38.3062],
  [-12.9053, -38.3162],
  [-12.8981, -38.3267],
  [-12.9034, -38.3321],
  [-12.9034, -38.3388],
  [-12.8947, -38.3549],
  [-12.8612, -38.3544],
  [-12.8529, -38.3522],
  [-12.8391, -38.3534],
  [-12.8315, -38.3588],
  [-12.8243, -38.374],
  [-12.8345, -38.3879],
  [-12.844, -38.3928],
  [-12.8536, -38.3899],
  [-12.862, -38.4007],
  [-12.8726, -38.4025],
  [-12.8735, -38.4066],
  [-12.867, -38.416],
  [-12.8494, -38.4281],
  [-12.8396, -38.4411],
  [-12.8458, -38.4504],
  [-12.8294, -38.464],
  [-12.8147, -38.4662],
  [-12.7977, -38.4605],
  [-12.7915, -38.4623],
  [-12.7845, -38.4742],
  [-12.7848, -38.4802],
  [-12.7908, -38.4913],
  [-12.7793, -38.5038],
  [-12.767, -38.508],
  [-12.7483, -38.5085],
  [-12.7436, -38.5157],
  [-12.7437, -38.5254],
  [-12.7387, -38.535],
  [-12.7362, -38.5467],
  [-12.7365, -38.5664],
  [-12.7339, -38.5879],
  [-12.754, -38.5879],
  [-12.7541, -38.6952],
  [-12.7866, -38.6993],
  [-12.8006, -38.6986],
  [-12.8164, -38.6956],
  [-12.8305, -38.688],
  [-12.8454, -38.6749],
  [-12.855, -38.6615],
  [-12.865, -38.6433],
  [-12.8824, -38.6058],
  [-12.8926, -38.5888],
  [-12.8993, -38.5812],
  [-12.9152, -38.5678],
  [-12.9327, -38.5611],
  [-12.9521, -38.5605],
  [-12.9661, -38.5652],
  [-12.9891, -38.5805],
  [-12.9987, -38.5846],
  [-13.0127, -38.5856],
];

const SALVADOR_BOUNDARY_SVG_POINTS = (() => {
  const latitudes = SALVADOR_CITY_BOUNDARY_RING.map(([latitude]) => latitude);
  const longitudes = SALVADOR_CITY_BOUNDARY_RING.map(
    ([, longitude]) => longitude,
  );
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);

  return SALVADOR_CITY_BOUNDARY_RING.map(([latitude, longitude]) => {
    const x =
      ((longitude - minLongitude) / (maxLongitude - minLongitude)) * 84 + 8;
    const y = ((maxLatitude - latitude) / (maxLatitude - minLatitude)) * 84 + 8;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
})();

function HomeBoundaryFallback() {
  return (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.9),transparent_30%),linear-gradient(145deg,#dcece6,#edf4f1_55%,#dce8e4)]">
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
      >
        <polygon
          points={SALVADOR_BOUNDARY_SVG_POINTS}
          fill="rgba(24,179,126,0.10)"
          stroke="#18B37E"
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

function getLaunchCityPaths(): string[] {
  const country = TERRITORY_CONFIG.launch.country || "br";
  const state = TERRITORY_CONFIG.launch.state || "ba";
  const city = TERRITORY_CONFIG.launch.city || "salvador";
  return Array.from(
    new Set([`/${country}/${state}/${city}`, `/${state}/${city}`]),
  );
}

async function findLaunchCityLocation(): Promise<Location | null> {
  const repo = createLocationRepository();

  for (const path of getLaunchCityPaths()) {
    const location = await repo.findByPath(path);
    if (location) return location;
  }

  const state = TERRITORY_CONFIG.launch.state || "ba";
  const city = TERRITORY_CONFIG.launch.city || "salvador";
  const normalizedCity = normalizeTerritoryText(city);
  const normalizedState = normalizeTerritoryText(state);
  const locations = await repo.findAll();

  return (
    locations.find((location) => {
      if (
        location.type !== LocationType.CITY ||
        location.status !== LocationStatus.ACTIVE
      ) {
        return false;
      }

      const pathParts = location.geographic_path.split("/").filter(Boolean);
      const cityMatches =
        normalizeTerritoryText(location.slug) === normalizedCity ||
        normalizeTerritoryText(location.name) === normalizedCity;
      const stateMatches =
        !normalizedState ||
        pathParts.includes(normalizedState) ||
        normalizeTerritoryText(String(location.metadata?.state_code ?? "")) ===
          normalizedState;

      return cityMatches && stateMatches;
    }) ?? null
  );
}

function buildOfficialSalvadorCityPolygon(
  cityName: string,
): TerritoryPolygon | null {
  if (normalizeTerritoryText(cityName) !== "salvador") return null;

  const latitudes = SALVADOR_CITY_BOUNDARY_RING.map(([latitude]) => latitude);
  const longitudes = SALVADOR_CITY_BOUNDARY_RING.map(
    ([, longitude]) => longitude,
  );

  return {
    name: cityName,
    coordinates: SALVADOR_CITY_BOUNDARY_RING,
    center: [
      (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
      (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
    ],
    color: "#18B37E",
    fillOpacity: 0.1,
    lineWidth: 3,
    lineOpacity: 0.95,
  };
}

function HomeBoundaryPreview() {
  const [homeCity, setHomeCity] = useState<Location | null>(null);
  const [cityPolygons, setCityPolygons] = useState<TerritoryPolygon[]>(() => {
    const fallback = buildOfficialSalvadorCityPolygon("Salvador");
    return fallback ? [fallback] : [];
  });

  useEffect(() => {
    let cancelled = false;

    findLaunchCityLocation()
      .then((city) => {
        if (cancelled) return;
        setHomeCity(city);
      })
      .catch(() => {
        if (!cancelled) setHomeCity(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!homeCity) {
        const fallback = buildOfficialSalvadorCityPolygon("Salvador");
        setCityPolygons(fallback ? [fallback] : []);
        return;
      }

      const bounds = await boundaryService.getLocationBounds(homeCity);
      if (cancelled) return;

      const storedPolygons = bounds.rings.map((ring, index) => ({
        name: homeCity.name,
        coordinates: ring,
        center: bounds.center,
        color: index === 0 ? "#18B37E" : "#7dd3fc",
        fillOpacity: index === 0 ? 0.1 : 0.06,
        lineWidth: index === 0 ? 3 : 2,
        lineOpacity: index === 0 ? 0.95 : 0.55,
      }));
      const fallback =
        storedPolygons.length === 0
          ? buildOfficialSalvadorCityPolygon(homeCity.name)
          : null;

      setCityPolygons(
        storedPolygons.length > 0 ? storedPolygons : fallback ? [fallback] : [],
      );
    };

    run().catch(() => {
      if (!cancelled) {
        const fallback = buildOfficialSalvadorCityPolygon(
          homeCity?.name ?? "Salvador",
        );
        setCityPolygons(fallback ? [fallback] : []);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [homeCity]);

  const territoryPolygons = useMemo(() => cityPolygons, [cityPolygons]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#eef4f0]">
      <Suspense fallback={<HomeBoundaryFallback />}>
        <LazyMapLibreAdapter
          styleUrl={DEFAULT_TILE_STYLE.styleUrl}
          initialViewport={{ center: PREVIEW_MAP_CENTER, zoom: 9.15 }}
          territoryPolygons={territoryPolygons}
          markers={[]}
          fitTerritoryBounds={territoryPolygons.length > 0}
          territoryFitPadding={28}
          territoryFitMaxZoom={9.4}
          userLocationMarker={{ enabled: false, autoAdd: false }}
          enableClustering={false}
          attribution={false}
          interactive={false}
          hideNavigationControl
          className="pointer-events-none h-full w-full"
        />
      </Suspense>
      <div
        aria-hidden
        className="absolute right-3 top-[3.75rem] z-20 flex max-w-[8.4rem] flex-col items-end gap-1 text-right lg:right-6 lg:top-20 lg:max-w-[9rem]"
      >
        <span className="rounded-full bg-white/90 px-2.5 py-1 text-[9.5px] font-semibold text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.10)] backdrop-blur-sm lg:text-[10px]">
          contorno da cidade
        </span>
        <span className="rounded-full bg-[#18B37E]/90 px-2.5 py-1 text-[9.5px] font-semibold text-white shadow-[0_8px_20px_rgba(24,179,126,0.18)] backdrop-blur-sm lg:text-[10px]">
          Salvador em destaque
        </span>
      </div>
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-white/80 via-white/35 to-white/0"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-white via-white/42 to-white/0 lg:h-32"
      />
    </div>
  );
}

function extractUf(addr: ReverseGeocodeAddress): string | null {
  const iso = addr["ISO3166-2-lvl4"];
  if (iso && iso.startsWith("BR-")) return iso.slice(3).toUpperCase();
  if (addr.state_code) return addr.state_code.toUpperCase();
  if (addr.state) {
    const key = addr.state.toLowerCase();
    if (BR_STATE_TO_UF[key]) return BR_STATE_TO_UF[key];
  }
  return null;
}

function buildLabel(addr: ReverseGeocodeAddress): string | null {
  const city =
    addr.city || addr.town || addr.village || addr.municipality || addr.suburb;
  const uf = extractUf(addr);
  if (city && uf) return `${city}, ${uf}`;
  if (city) return city;
  return null;
}

async function reverseGeocode(
  lat: number,
  lng: number,
  signal: AbortSignal,
): Promise<string | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1&accept-language=pt-BR`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { address?: ReverseGeocodeAddress };
  return buildLabel(data.address ?? {});
}

interface NominatimSearchItem {
  place_id: number;
  lat: string;
  lon: string;
  address?: ReverseGeocodeAddress;
  display_name?: string;
}

async function searchCities(
  query: string,
  signal: AbortSignal,
): Promise<CitySuggestion[]> {
  const url =
    `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1` +
    `&countrycodes=br&featuretype=city&limit=6&accept-language=pt-BR` +
    `&city=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!res.ok) return [];
  const data = (await res.json()) as NominatimSearchItem[];
  const seen = new Set<string>();
  const out: CitySuggestion[] = [];

  for (const item of data) {
    const label = buildLabel(item.address ?? {}) ?? item.display_name ?? null;
    if (!label || seen.has(label)) continue;
    seen.add(label);
    out.push({
      id: String(item.place_id),
      label,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    });
  }

  return out;
}

function readStoredCity(): ResolvedLocation | string | null {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ResolvedLocation>;
    if (parsed && typeof parsed.label === "string") {
      if (typeof parsed.lat === "number" && typeof parsed.lng === "number") {
        return { label: parsed.label, lat: parsed.lat, lng: parsed.lng };
      }
      return parsed.label;
    }
  } catch {
    // Ignore invalid local storage payloads.
  }
  return null;
}

function formatGeolocationError(err: string | null): string | null {
  if (!err) return null;
  const lower = err.toLowerCase();
  if (lower.includes("denied") || lower.includes("permÛ­¸¶‰žËkºwµçeÑåEÕ•Éä¡±…‰•°¤ì(€€€½¹ÍÐÁ…Ñ €ôAU	1%}M1Y=I}%MQI%Q}AQ!Mm¹½Éµ…±¥é•Q•ÉÉ¥Ñ½ÉåQ•áÐ¡±…‰•°¥tì(€€€¥˜€¡Á…Ñ ¤½Á•¹AÕ‰±¥Q•ÉÉ¥Ñ½Éä¡Á…Ñ °±…‰•°¤ì(€ôì((€É•ÑÕÉ¸€ (€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µ¥¸µ µlÄÀÁ‘Ù¡tÜµ™Õ±°½Ù•É™±½Üµ¡¥‘‘•¸‰œµl˜á™…™tÑ•áÐµÍ±…Ñ”´äÔÀˆø(€€€€€€ñµ…¥¸(€€€€€€€¥ô‰µ…¥¸µ½¹Ñ•¹Ðˆ(€€€€€€€±…ÍÍ9…µ”õí¸ (€€€€€€€€€€‰µàµ…ÕÑ¼™±•àµ¥¸µ µlÄÀÁ‘Ù¡tÜµ™Õ±°™±•àµ½°ˆ°(€€€€€€€€€€‰±œéÉ¥±œéµ…àµÜ´Ùá°±œéÉ¥µ½±Ìµmµ¥¹µ…à À°Ä¸Àá™È¥}µ¥¹µ…à ÌØÁÁà°À¸ÜÉ™È¥t±œé¥Ñ•µÌµ•¹Ñ•È±œé…À´ÄÀ±œéÁà´à±œéÁä´àˆ°(€€€€€€€€¥ô(€€€€€€ø(€€€€€€€€ñÍ•Ñ¥½¸(€€€€€€€€€…É¥„µ±…‰•°ô‰MÑ…ÑÕÌ…¼Ù¥Ù¼‘¼¡•Õ”µÍ”ˆ(€€€€€€€€€±…ÍÍ9…µ”ô‰Ñ µ±¥Ù”µÍ•Ñ¥½¸ˆ(€€€€€€€€ø(€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Ñ µ±¥Ù”µ…ÉÉ•±…Ñ¥Ù”‰±½¬ µlÈÌáÁátµ¥¸µ µlÈÌáÁátÍ•±•Ðµ¹½¹”½Ù•É™±½Üµ¡¥‘‘•¸É½Õ¹‘•µˆµlÈÙÁát‰½É‘•È´À‰œµl”á˜Å••tÍ¡…‘½ÜµlÁ|ÄáÁá|ÐáÁá}É‰„ ÄÔ°ÈÌ°ÐÈ°À¸ÄÌ¥tÍ´é µlÈÜÙÁát±œé µmµ¥¸ ÔÀÁÁà±…±Œ ÄÀÁ‘Ù ´ÙÉ•´¤¥t±œéµ¥¸µ µlÐÐÁÁát±œéÉ½Õ¹‘•µlÌÁÁátˆø(€€€€€€€€€€€€ñ!½µ•	½Õ¹‘…ÉåAÉ•Ù¥•Ü€¼ø(€€€€€€€€€€€€ñ‘¥Ø(€€€€€€€€€€€€€…É¥„µ¡¥‘‘•¸(€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰…‰Í½±ÕÑ”¥¹Í•Ðµà´ÀÑ½À´Àè´ÄÀ ´ÈÐ‰œµÉ…‘¥•¹ÐµÑ¼µˆ™É½´µÝ¡¥Ñ”¼ÜàÙ¥„µÝ¡¥Ñ”¼ÌàÑ¼µÝ¡¥Ñ”¼Àˆ(€€€€€€€€€€€€¼ø(€€€€€€€€€€€€ñ‘¥Ø(€€€€€€€€€€€€€…É¥„µ¡¥‘‘•¸(€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰…‰Í½±ÕÑ”¥¹Í•Ðµà´À‰½ÑÑ½´´Àè´ÄÀ ´ÈÀ‰œµÉ…‘¥•¹ÐµÑ¼µÐ™É½´µÝ¡¥Ñ”Ù¥„µÝ¡¥Ñ”¼ÐÈÑ¼µÝ¡¥Ñ”¼À±œé ´ÌÈˆ(€€€€€€€€€€€€¼ø((€€€€€€€€€€€€ñ¡•…‘•È(€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰…‰Í½±ÕÑ”±•™Ð´ÐÑ½Àµmµ…à À¸ÜÕÉ•´±•¹Ø¡Í…™”µ…É•„µ¥¹Í•ÐµÑ½À¤¥tè´ÌÀ™±•àÜµ™¥Ðµ…àµÜµm…±Œ ÄÀÀ”´ÉÉ•´¥t¥Ñ•µÌµ•¹Ñ•È…À´ÈÉ½Õ¹‘•µ™Õ±°‰œµÝ¡¥Ñ”Áä´Ä¸ÔÁ°´Ä¸ÔÁÈ´ÐÍ¡…‘½ÜµlÁ|ÄÑÁá|ÌÑÁá}É‰„ ÄÔ°ÈÌ°ÐÈ°À¸ÈÀ¥tÉ¥¹œ´ÄÉ¥¹œµÍ±…Ñ”´äÔÀ¼ÄÀ‰…­‘É½Àµ‰±ÕÈµµ±œé±•™Ð´Ø±œéÑ½À´Ø±œé…À´È¸Ô±œéÁÈ´Ôˆ(€€€€€€€€€€€€€…É¥„µ±…‰•°ô‰¡•Õ”µÍ”ˆ(€€€€€€€€€€€€ø(€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰™±•à ´äÜ´ä¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ•¹Ñ•ÈÉ½Õ¹‘•µ™Õ±°‰œµl˜Ñ™‰˜átÍ¡…‘½Üµm¥¹Í•Ñ|Á|Á|Á|ÅÁá}É‰„ ÈÐ°ÄÜä°ÄÈØ°À¸Äà¥t±œé ´ÄÀ±œéÜ´ÄÀˆø(€€€€€€€€€€€€€€€€ñ¥µœ(€€€€€€€€€€€€€€€€€ÍÉŒõí=%%1}1==}MIô(€€€€€€€€€€€€€€€€€…±Ðôˆˆ(€€€€€€€€€€€€€€€€€…É¥„µ¡¥‘‘•¸(€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰ ´ØÜ´Ø½‰©•Ðµ½¹Ñ…¥¸±œé ´Ü±œéÜ´Üˆ(€€€€€€€€€€€€€€€€¼ø(€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰™½¹Ðµ¡•…‘¥¹œÑ•áÐµlÈÁÁát™½¹Ðµ‰½±±•…‘¥¹œµ¹½¹”ÑÉ…­¥¹œµ¹½Éµ…°Ñ•áÐµÍ±…Ñ”´äÔÀ±œéÑ•áÐµlÈÍÁátˆø(€€€€€€€€€€€€€€€¡•Õ”´ñÍÁ…¸±…ÍÍ9…µ”ô‰Ñ•áÐµlŒÄáÌÝtˆùÍ”ð½ÍÁ…¸ø(€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€ð½¡•…‘•Èø(€€€€€€€€€€€€ñ1¥¹¬(€€€€€€€€€€€€€Ñ¼ôˆ½±½¥¸ˆ(€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰…‰Í½±ÕÑ”É¥¡Ð´ÐÑ½Àµmµ…à À¸åÉ•´±•¹Ø¡Í…™”µ…É•„µ¥¹Í•ÐµÑ½À¤¥tè´ÌÀ¥¹±¥¹”µ™±•à ´ä¥Ñ•µÌµ•¹Ñ•ÈÉ½Õ¹‘•µ™Õ±°‰œµÍ±…Ñ”´äÔÀ¼àÔÁà´Ì¸ÔÑ•áÐµáÌ™½¹ÐµÍ•µ¥‰½±Ñ•áÐµÝ¡¥Ñ”Í¡…‘½Üµ±œ‰…­‘É½Àµ‰±ÕÈµµÑÉ…¹Í¥Ñ¥½¸¡½Ù•Èé‰œµÍ±…Ñ”´äÔÀ™½ÕÌµÙ¥Í¥‰±”é½ÕÑ±¥¹”µ¹½¹”™½ÕÌµÙ¥Í¥‰±”éÉ¥¹œ´È™½ÕÌµÙ¥Í¥‰±”éÉ¥¹œµlŒÄáÌÝt±œéÉ¥¡Ð´Ø±œéÑ½À´Üˆ(€€€€€€€€€€€€ø(€€€€€€€€€€€€€¹ÑÉ…È(€€€€€€€€€€€€ð½1¥¹¬ø((€€€€€€€€€€€€ñ‘¥Ø(€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰Ñ µ±¥Ù”µ½Áä…‰Í½±ÕÑ”è´ÈÀÀ´Àˆ(€€€€€€€€€€€€€ÍÑå±”õíì(€€€€€€€€€€€€€€€±•™Ðè€ˆÅÉ•´ˆ°(€€€€€€€€€€€€€€€Ñ½Àè€ˆÐ¸äÕÉ•´ˆ°(€€€€€€€€€€€€€€€Ý¥‘Ñ è€‰µ¥¸ åÉ•´°…±Œ ÄÀÀ”€´€ÉÉ•´¤¤ˆ°(€€€€€€€€€€€€€õô(€€€€€€€€€€€€ø(€€€€€€€€€€€€€€ñÕ°(€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰Ñ µ±¥Ù”µÍÑ…ÑÕÌµ±¥ÍÐÉ¥©ÕÍÑ¥™äµ¥Ñ•µÌµÍÑ…ÉÐ…ÀµlÀ¸ÄÉÉ•µtˆ(€€€€€€€€€€€€€€€…É¥„µ±…‰•°ô‰Q•ÉÉ¥ÓÍÉ¥¼‘¥ÍÁ½»µÙ•°¹¼¡•Õ”µÍ”ˆ(€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€ñ±¤(€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰Ñ µ±¥Ù”µÍÑ…ÑÕÌ™±•àÜµ™¥Ðµ…àµÜµ™Õ±°¥Ñ•µÌµ•¹Ñ•È…ÀµlÀ¸ÈÑÉ•µtÉ½Õ¹‘•µlÀ¸ÔÑÉ•µt‰½É‘•È‰½É‘•ÈµÝ¡¥Ñ”¼äÀ‰œµÝ¡¥Ñ”¼äÔÁàµlÀ¸ÈÑÉ•µtÁäµlÀ¸ÄÙÉ•µtÍ¡…‘½ÜµlÁ|ÙÁá|ÄÑÁá}É‰„ ÄÔ°ÈÌ°ÐÈ°À¸ÀÜ¥t‰…­‘É½Àµ‰±ÕÈµÍ´ˆ(€€€€€€€€€€€€€€€€€ÍÑå±”õí¡½µ•MÑ…ÑÕÍ…É‘MÑå±•ô(€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰Ñ µ±¥Ù”µÍÑ…ÑÕÌµ¥½¸¥¹±¥¹”µ™±•à µlÄ¸ÀÙÉ•µtÜµlÄ¸ÀÙÉ•µtÍ¡É¥¹¬´À¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ•¹Ñ•ÈÉ½Õ¹‘•µlÀ¸ÌáÉ•µt‰œµÁÉ¥µ…Éä¼ÄÀÑ•áÐµÁÉ¥µ…Éäˆø(€€€€€€€€€€€€€€€€€€€€ñ5…ÁA¥¸(€€€€€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰ µlÀ¸ØÑÉ•µtÜµlÀ¸ØÑÉ•µtˆ(€€€€€€€€€€€€€€€€€€€€€…É¥„µ¡¥‘‘•¸(€€€€€€€€€€€€€€€€€€€€€ÍÑÉ½­•]¥‘Ñ õìÈ¸ÈÕô(€€€€€€€€€€€€€€€€€€€€¼ø(€€€€€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰µ¥¸µÜ´Àˆø(€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰‰±½¬ÑÉÕ¹…Ñ”Ñ•áÐµlä¸ÑÁát™½¹Ðµ‰½±±•…‘¥¹œµÑ¥¡ÐÑ•áÐµÍ±…Ñ”´äÔÀˆø(€€€€€€€€€€€€€€€€€€€€€M…±Ù…‘½È(€€€€€€€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰‰±½¬ÑÉÕ¹…Ñ”Ñ•áÐµlà¸ÑÁát±•…‘¥¹œµÑ¥¡ÐÑ•áÐµÍ±…Ñ”´ØÀÀˆø(€€€€€€€€€€€€€€€€€€€€€Ñ•ÉÉ¥ÓÍÉ¥¼‘¥ÍÁ½»µÙ•°(€€€€€€€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€ð½±¤ø(€€€€€€€€€€€€€€ð½Õ°ø(€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€ð½‘¥Øø(€€€€€€€€ð½Í•Ñ¥½¸ø((€€€€€€€€ñÍ•Ñ¥½¸±…ÍÍ9…µ”ô‰™±•à™±•à´Ä™±•àµ½°¥Ñ•µÌµ•¹Ñ•ÈÁà´ÔÁä´ÌÑ•áÐµ•¹Ñ•È±œé¥Ñ•µÌµÍÑ…ÉÐ±œé©ÕÍÑ¥™äµ•¹Ñ•È±œéÁà´À±œéÁä´À±œéÑ•áÐµ±•™Ðˆø(€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰ÍÁ…”µä´Ä¸Ôˆø(€€€€€€€€€€€€ñ Ä±…ÍÍ9…µ”ô‰µàµ…ÕÑ¼µ…àµÜµlÄÙÉ•µtÑ•áÐµlÈáÁát™½¹ÐµÍ•µ¥‰½±±•…‘¥¹œµlÀ¸äátÑÉ…­¥¹œµ¹½Éµ…°Ñ•áÐµÍ±…Ñ”´äÔÀµ¥¸µlÌàÁÁátéµ…àµÜµlÄÝÉ•µtµ¥¸µlÌàÁÁátéÑ•áÐµlÌÅÁát±œéµà´À±œéµ…àµÜµlÈÅÉ•µt±œéÑ•áÐµlÐÑÁátˆø(€€€€€€€€€€€€€QÕ‘¼½µ—„Á•±¼Í•Ô‰…¥ÉÉ¼(€€€€€€€€€€€€ð½ Äø(€€€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰µàµ…ÕÑ¼µ…àµÜµlÈÁÉ•µtÑ•áÐµlÄÑÁát±•…‘¥¹œ´ÔÑ•áÐµÍ±…Ñ”´ØÀÀ±œéµà´À±œéµ…àµÜµlÈÑÉ•µt±œéÑ•áÐµ‰…Í”±œé±•…‘¥¹œ´Üˆø(€€€€€€€€€€€€€Í½±¡„Õ´‰…¥ÉÉ¼½Ô•¹ÑÉ”Á½ÈM…±Ù…‘½È¥¹Ñ•¥É„¸(€€€€€€€€€€€€ð½Àø(€€€€€€€€€€ð½‘¥Øø((€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µÐ´ÐÜµ™Õ±°ÍÁ…”µä´È¸Ô±œéµÐ´Ü±œéµ…àµÜµlÐÄÁÁát±œéÍÁ…”µä´Ìˆø(€€€€€€€€€€€€ñ	ÕÑÑ½¸(€€€€€€€€€€€€€ÑåÁ”ô‰‰ÕÑÑ½¸ˆ(€€€€€€€€€€€€€Í¥é”ô‰±œˆ(€€€€€€€€€€€€€½¹±¥¬õí¡…¹‘±•UÍ•1½…Ñ¥½¹ô(€€€€€€€€€€€€€‘¥Í…‰±•õí•¼¹±½…‘¥¹œñðÉ•Í½±Ù¥¹¥Ñåô(€€€€€€€€€€€€€±…ÍÍ9…µ”õí¸ (€€€€€€€€€€€€€€€€‰ ´ÄÈÜµ™Õ±°…À´ÈÉ½Õ¹‘•µlÅÉ•µt‰œµlŒÄáÌÝtÑ•áÐµlÄÑÁát™½¹ÐµÍ•µ¥‰½±Ñ•áÐµÝ¡¥Ñ”ˆ°(€€€€€€€€€€€€€€€€‰Í¡…‘½ÜµlÁ|ÄÉÁá|ÈáÁá}É‰„ ÈÐ°ÄÜä°ÄÈØ°À¸ÈØ¥tÑÉ…¹Í¥Ñ¥½¸µ…±°‘ÕÉ…Ñ¥½¸´ÄÔÀˆ°(€€€€€€€€€€€€€€€€‰¡½Ù•Èé‰œµlŒÄÐå˜ÜÁt…Ñ¥Ù”éÍ…±”µlÀ¸äát‘¥Í…‰±•é½Á…¥Ñä´ÜÀ‘¥Í…‰±•éÍ¡…‘½Üµ¹½¹”ˆ°(€€€€€€€€€€€€€€¥ô(€€€€€€€€€€€€ø(€€€€€€€€€€€€€í•¼¹±½…‘¥¹œñðÉ•Í½±Ù¥¹¥Ñä€ü€ (€€€€€€€€€€€€€€€€ñ1½…‘•ÈÈ±…ÍÍ9…µ”ô‰ ´ÔÜ´Ô…¹¥µ…Ñ”µÍÁ¥¸ˆ€¼ø(€€€€€€€€€€€€€€¤€è€ (€€€€€€€€€€€€€€€€ñ9…Ù¥…Ñ¥½¸±…ÍÍ9…µ”ô‰ ´ÔÜ´Ôˆ€¼ø(€€€€€€€€€€€€€€¥ô(€€€€€€€€€€€€€íÉ•Í½±Ù¥¹¥Ñä(€€€€€€€€€€€€€€€€ü€‰%‘•¹Ñ¥™¥…¹‘¼±½…°¸¸¸ˆ(€€€€€€€€€€€€€€€€è€‰UÍ…Èµ¥¹¡„±½…±¥é‡Ÿ¼‰ô(€€€€€€€€€€€€ð½	ÕÑÑ½¸ø((€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰É•±…Ñ¥Ù”ˆø(€€€€€€€€€€€€€€ñ5…ÁA¥¸(€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰Á½¥¹Ñ•Èµ•Ù•¹ÑÌµ¹½¹”…‰Í½±ÕÑ”±•™Ð´ÐÑ½À´Ä¼Èè´ÄÀ ´ÔÜ´Ô€µÑÉ…¹Í±…Ñ”µä´Ä¼ÈÑ•áÐµlŒÄáÌÝtˆ(€€€€€€€€€€€€€€€…É¥„µ¡¥‘‘•¸(€€€€€€€€€€€€€€¼ø(€€€€€€€€€€€€€€ñ%¹ÁÕÐ(€€€€€€€€€€€€€€€¥ô‰¡½µ”µ¥Ñäˆ(€€€€€€€€€€€€€€€Ù…±Õ”õí¥ÑåEÕ•Éåô(€€€€€€€€€€€€€€€½¹¡…¹”õì¡•Ù•¹Ð¤€ôø¡…¹‘±•5…¹Õ…±¡…¹”¡•Ù•¹Ð¹Ñ…É•Ð¹Ù…±Õ”¥ô(€€€€€€€€€€€€€€€½¹½ÕÌõì ¤€ôøì(€€€€€€€€€€€€€€€€€¥˜€¡ÍÕ•ÍÑ¥½¹Ì¹±•¹Ñ €ø€À¤Í•ÑM¡½ÝMÕ•ÍÑ¥½¹Ì¡ÑÉÕ”¤ì(€€€€€€€€€€€€€€€õô(€€€€€€€€€€€€€€€½¹	±ÕÈõì ¤€ôøì(€€€€€€€€€€€€€€€€€Ý¥¹‘½Ü¹Í•ÑQ¥µ•½ÕÐ  ¤€ôøÍ•ÑM¡½ÝMÕ•ÍÑ¥½¹Ì¡™…±Í”¤°€ÄÔÀ¤ì(€€€€€€€€€€€€€€€õô(€€€€€€€€€€€€€€€½¹-•å½Ý¸õì¡•Ù•¹Ð¤€ôøì(€€€€€€€€€€€€€€€€€¥˜€¡•Ù•¹Ð¹­•ä€ôôô€‰¹Ñ•Èˆ€˜˜…¹MÕ‰µ¥Ñ¥Ñä¤ì(€€€€€€€€€€€€€€€€€€€Í•ÑM¡½ÝMÕ•ÍÑ¥½¹Ì¡™…±Í”¤ì(€€€€€€€€€€€€€€€€€€€Ù½¥½Á•¹I•Í½±Ù•‘Q•ÉÉ¥Ñ½Éä ¤ì(€€€€€€€€€€€€€€€€€ô(€€€€€€€€€€€€€€€€€¥˜€¡•Ù•¹Ð¹­•ä€ôôô€‰Í…Á”ˆ¤Í•ÑM¡½ÝMÕ•ÍÑ¥½¹Ì¡™…±Í”¤ì(€€€€€€€€€€€€€€€õô(€€€€€€€€€€€€€€€Á±…•¡½±‘•Èô‰	ÕÍ…È‰…¥ÉÉ¼½Ô¥‘…‘”ˆ(€€€€€€€€€€€€€€€±…ÍÍ9…µ”õí¸ (€€€€€€€€€€€€€€€€€€‰ ´ÄÈÉ½Õ¹‘•µlÅÉ•µt‰½É‘•ÈµÍ±…Ñ”´ÈÀÀ‰œµÝ¡¥Ñ”Á°´ÄÈÁÈ´ÄÐÑ•áÐµlÄÑÁátÑ•áÐµÍ±…Ñ”´äÔÀˆ°(€€€€€€€€€€€€€€€€€€‰Í¡…‘½ÜµlÁ|ÄÁÁá|ÈÑÁá}É‰„ ÄÔ°ÈÌ°ÐÈ°À¸Àà¥tÁ±…•¡½±‘•ÈéÑ•áÐµÍ±…Ñ”´ÐÀÀˆ°(€€€€€€€€€€€€€€€€€€‰™½ÕÌµÙ¥Í¥‰±”é‰½É‘•ÈµlŒÄáÌÝt™½ÕÌµÙ¥Í¥‰±”éÉ¥¹œ´È™½ÕÌµÙ¥Í¥‰±”éÉ¥¹œµlŒÄáÌÝt¼ÈÔ™½ÕÌµÙ¥Í¥‰±”éÉ¥¹œµ½™™Í•Ð´Àˆ°(€€€€€€€€€€€€€€€€¥ô(€€€€€€€€€€€€€€€…ÕÑ½½µÁ±•Ñ”ô‰½™˜ˆ(€€€€€€€€€€€€€€€¥¹ÁÕÑ5½‘”ô‰Ñ•áÐˆ(€€€€€€€€€€€€€€€É½±”ô‰½µ‰½‰½àˆ(€€€€€€€€€€€€€€€…É¥„µ•áÁ…¹‘•õíÍ¡½ÝMÕ•ÍÑ¥½¹Ì€˜˜ÍÕ•ÍÑ¥½¹Ì¹±•¹Ñ €ø€Áô(€€€€€€€€€€€€€€€…É¥„µ½¹ÑÉ½±Ìô‰¡½µ”µ¥ÑäµÍÕ•ÍÑ¥½¹Ìˆ(€€€€€€€€€€€€€€¼ø(€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸(€€€€€€€€€€€€€€€ÑåÁ”ô‰‰ÕÑÑ½¸ˆ(€€€€€€€€€€€€€€€…É¥„µ±…‰•°ô‰½¹™¥Éµ…È±½…°ˆ(€€€€€€€€€€€€€€€½¹±¥¬õì ¤€ôøÙ½¥½Á•¹I•Í½±Ù•‘Q•ÉÉ¥Ñ½Éä ¥ô(€€€€€€€€€€€€€€€‘¥Í…‰±•õì……¹MÕ‰µ¥Ñ¥Ñäñð½Á•¹¥¹Q•ÉÉ¥Ñ½Éåô(€€€€€€€€€€€€€€€±…ÍÍ9…µ”õí¸ (€€€€€€€€€€€€€€€€€€‰…‰Í½±ÕÑ”É¥¡Ð´ÈÑ½À´Ä¼Èè´ÄÀ™±•à ´ÄÀÜ´ÄÀ€µÑÉ…¹Í±…Ñ”µä´Ä¼È¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ•¹Ñ•ÈÉ½Õ¹‘•µ™Õ±°ˆ°(€€€€€€€€€€€€€€€€€€‰ÑÉ…¹Í¥Ñ¥½¸µ…±°‘ÕÉ…Ñ¥½¸´ÄÔÀ™½ÕÌµÙ¥Í¥‰±”é½ÕÑ±¥¹”µ¹½¹”™½ÕÌµÙ¥Í¥‰±”éÉ¥¹œ´È™½ÕÌµÙ¥Í¥‰±”éÉ¥¹œµlŒÄáÌÝt¼ØÀ™½ÕÌµÙ¥Í¥‰±”éÉ¥¹œµ½™™Í•Ð´Èˆ°(€€€€€€€€€€€€€€€€€…¹MÕ‰µ¥Ñ¥Ñä(€€€€€€€€€€€€€€€€€€€€ü€‰‰œµlŒÄáÌÝt¼ÄÀÑ•áÐµlŒÄÌàÐÕ™t¡½Ù•Èé‰œµlŒÄáÌÝt¼ÄÔ…Ñ¥Ù”éÍ…±”´äÀˆ(€€€€€€€€€€€€€€€€€€€€è€‰Ñ•áÐµÍ±…Ñ”´ÌÀÀˆ°(€€€€€€€€€€€€€€€€¥ô(€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€í½Á•¹¥¹Q•ÉÉ¥Ñ½Éä€ü€ (€€€€€€€€€€€€€€€€€€ñ1½…‘•ÈÈ±…ÍÍ9…µ”ô‰ ´ÔÜ´Ô…¹¥µ…Ñ”µÍÁ¥¸ˆ€¼ø(€€€€€€€€€€€€€€€€¤€è€ (€€€€€€€€€€€€€€€€€€ñÉÉ½ÝI¥¡Ð±…ÍÍ9…µ”ô‰ ´ÔÜ´Ôˆ€¼ø(€€€€€€€€€€€€€€€€¥ô(€€€€€€€€€€€€€€ð½‰ÕÑÑ½¸ø((€€€€€€€€€€€€€íÍ¡½ÝMÕ•ÍÑ¥½¹Ì€˜˜ÍÕ•ÍÑ¥½¹Ì¹±•¹Ñ €ø€À€ü€ (€€€€€€€€€€€€€€€€ñÕ°(€€€€€€€€€€€€€€€€€¥ô‰¡½µ”µ¥ÑäµÍÕ•ÍÑ¥½¹Ìˆ(€€€€€€€€€€€€€€€€€É½±”ô‰±¥ÍÑ‰½àˆ(€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰…‰Í½±ÕÑ”±•™Ð´ÀÉ¥¡Ð´ÀÑ½Àµ™Õ±°è´ÈÀµÐ´Èµ…àµ ´ØÐ½Ù•É™±½Üµ…ÕÑ¼É½Õ¹‘•´Éá°‰½É‘•È‰½É‘•ÈµÍ±…Ñ”´ÈÀÀ‰œµÝ¡¥Ñ”À´ÄÍ¡…‘½Üµá°ˆ(€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€íÍÕ•ÍÑ¥½¹Ì¹µ…À ¡Ì¤€ôø€ (€€€€€€€€€€€€€€€€€€€€ñ±¤­•äõíÌ¹¥‘ôø(€€€€€€€€€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸(€€€€€€€€€€€€€€€€€€€€€€€ÑåÁ”ô‰‰ÕÑÑ½¸ˆ(€€€€€€€€€€€€€€€€€€€€€€€É½±”ô‰½ÁÑ¥½¸ˆ(€€€€€€€€€€€€€€€€€€€€€€€…É¥„µÍ•±•Ñ•õí¥ÑåEÕ•Éä€ôôôÌ¹±…‰•±ô(€€€€€€€€€€€€€€€€€€€€€€€½¹5½ÕÍ•½Ý¸õì¡•Ù•¹Ð¤€ôø•Ù•¹Ð¹ÁÉ•Ù•¹Ñ•™…Õ±Ð ¥ô(€€€€€€€€€€€€€€€€€€€€€€€½¹±¥¬õì ¤€ôø¡…¹‘±•A¥­MÕ•ÍÑ¥½¸¡Ì¥ô(€€€€€€€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰™±•àµ¥¸µ ´ÄÄÜµ™Õ±°¥Ñ•µÌµ•¹Ñ•È…À´ÈÉ½Õ¹‘•µá°Áà´ÌÁä´È¸ÔÑ•áÐµ±•™ÐÑ•áÐµÍ´Ñ•áÐµÍ±…Ñ”´àÀÀÑÉ…¹Í¥Ñ¥½¸µ½±½ÉÌ¡½Ù•Èé‰œµÍ±…Ñ”´ÄÀÀ™½ÕÌµÙ¥Í¥‰±”é½ÕÑ±¥¹”µ¹½¹”™½ÕÌµÙ¥Í¥‰±”éÉ¥¹œ´È™½ÕÌµÙ¥Í¥‰±”éÉ¥¹œµlŒÄáÌÝt¼ÐÀˆ(€€€€€€€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€€€€€€€€ñ5…ÁA¥¸±…ÍÍ9…µ”ô‰ ´ÐÜ´ÐÍ¡É¥¹¬´ÀÑ•áÐµlŒÄáÌÝtˆ€¼ø(€€€€€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰ÑÉÕ¹…Ñ”ˆùíÌ¹±…‰•±ôð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€€€€€€€ð½±¤ø(€€€€€€€€€€€€€€€€€€¤¥ô(€€€€€€€€€€€€€€€€ð½Õ°ø(€€€€€€€€€€€€€€¤€è¹Õ±±ô(€€€€€€€€€€€€ð½‘¥Øø((€€€€€€€€€€€€ñ	ÕÑÑ½¸(€€€€€€€€€€€€€ÑåÁ”ô‰‰ÕÑÑ½¸ˆ(€€€€€€€€€€€€€Ù…É¥…¹Ðô‰½ÕÑ±¥¹”ˆ(€€€€€€€€€€€€€½¹±¥¬õì ¤€ôø(€€€€€€€€€€€€€€€½Á•¹AÕ‰±¥Q•ÉÉ¥Ñ½Éä¡AU	1%}M1Y=I}AQ °€‰M…±Ù…‘½Èˆ¤(€€€€€€€€€€€€€ô(€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰ ´ÄÄÜµ™Õ±°É½Õ¹‘•µlÅÉ•µt‰½É‘•ÈµlŒÄáÌÝt¼ÈÔ‰œµÝ¡¥Ñ”¼àÀÑ•áÐµlÄÌ¸ÕÁát™½¹ÐµÍ•µ¥‰½±Ñ•áÐµlŒÄÌàÐÕ™tÍ¡…‘½ÜµlÁ|áÁá|ÄáÁá}É‰„ ÄÔ°ÈÌ°ÐÈ°À¸ÀØ¥tÑÉ…¹Í¥Ñ¥½¸µ…±°¡½Ù•Èé‰½É‘•ÈµlŒÄáÌÝt¼ÐÔ¡½Ù•Èé‰œµlŒÄáÌÝt½lÀ¸ÀÙt…Ñ¥Ù”éÍ…±”µlÀ¸äátˆ(€€€€€€€€€€€€ø(€€€€€€€€€€€€€Y•ÈM…±Ù…‘½È¥¹Ñ•¥É„(€€€€€€€€€€€€ð½	ÕÑÑ½¸ø((€€€€€€€€€€€íÉ•Í½±Ù•€ü€ (€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰É½Õ¹‘•´Éá°‰½É‘•È‰½É‘•ÈµlŒÄáÌÝt¼ÈÀ‰œµlŒÄáÌÝt½lÀ¸ÀÝtÀ´Ì¸Ôˆø(€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à¥Ñ•µÌµÍÑ…ÉÐ…À´Ìˆø(€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à ´äÜ´äÍ¡É¥¹¬´À¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ•¹Ñ•ÈÉ½Õ¹‘•µ™Õ±°‰œµlŒÄáÌÝt¼ÄÔÑ•áÐµlŒÄÌàÐÕ™tˆø(€€€€€€€€€€€€€€€€€€€€ñ5…ÁA¥¸±…ÍÍ9…µ”ô‰ ´ÐÜ´Ðˆ€¼ø(€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µ¥¸µÜ´À™±•à´ÄÑ•áÐµ±•™Ðˆø(€€€€€€€€€€€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰Ñ•áÐµlÄÁÁát™½¹ÐµÍ•µ¥‰½±ÕÁÁ•É…Í”ÑÉ…­¥¹œµlÀ¸Àá•µtÑ•áÐµlŒÄÌàÐÕ™tˆø(€€€€€€€€€€€€€€€€€€€€€1½…°•¹½¹ÑÉ…‘¼(€€€€€€€€€€€€€€€€€€€€ð½Àø(€€€€€€€€€€€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰µÐ´À¸ÔÑÉÕ¹…Ñ”Ñ•áÐµÍ´™½¹ÐµÍ•µ¥‰½±Ñ•áÐµÍ±…Ñ”´äÔÀˆø(€€€€€€€€€€€€€€€€€€€€€íÉ•Í½±Ù•¹±…‰•±ô(€€€€€€€€€€€€€€€€€€€€ð½Àø(€€€€€€€€€€€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰µÐ´À¸ÔÑ•áÐµlÄÅÁátÑ•áÐµÍ±…Ñ”´ÔÀÀˆø(€€€€€€€€€€€€€€€€€€€€€AÉ½¹Ñ¼Á…É„…‰É¥È¼½¹Ñ•áÑ¼Ã
é‰±¥¼‘¥ÍÁ½»
µÙ•°¸(€€€€€€€€€€€€€€€€€€€€ð½Àø(€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸(€€€€€€€€€€€€€€€€€€€ÑåÁ”ô‰‰ÕÑÑ½¸ˆ(€€€€€€€€€€€€€€€€€€€…É¥„µ±…‰•°ô‰•Í…ÉÑ…È±½…°•¹½¹ÑÉ…‘¼ˆ(€€€€€€€€€€€€€€€€€€€½¹±¥¬õì ¤€ôøÍ•ÑI•Í½±Ù•¡¹Õ±°¥ô(€€€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ôˆµµÈ´Ä€µµÐ´Ä™±•à ´äÜ´äÍ¡É¥¹¬´À¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ•¹Ñ•ÈÉ½Õ¹‘•µ™Õ±°Ñ•áÐµÍ±…Ñ”´ÔÀÀÑÉ…¹Í¥Ñ¥½¸µ½±½ÉÌ¡½Ù•Èé‰œµÝ¡¥Ñ”¼ÜÀ¡½Ù•ÈéÑ•áÐµÍ±…Ñ”´äÀÀ…Ñ¥Ù”éÍ…±”´äÀ™½ÕÌµÙ¥Í¥‰±”é½ÕÑ±¥¹”µ¹½¹”™½ÕÌµÙ¥Í¥‰±”éÉ¥¹œ´È™½ÕÌµÙ¥Í¥‰±”éÉ¥¹œµlŒÄáÌÝt¼ÔÀˆ(€€€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€€€€ñ`±…ÍÍ9…µ”ô‰ ´ÐÜ´Ðˆ€¼ø(€€€€€€€€€€€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€ñ	ÕÑÑ½¸(€€€€€€€€€€€€€€€€€ÑåÁ”ô‰‰ÕÑÑ½¸ˆ(€€€€€€€€€€€€€€€€€Í¥é”ô‰Í´ˆ(€€€€€€€€€€€€€€€€€½¹±¥¬õì ¤€ôø(€€€€€€€€€€€€€€€€€€€Ù½¥½Á•¹I•Í½±Ù•‘Q•ÉÉ¥Ñ½Éä¡É•Í½±Ù•¹±…‰•°°É•Í½±Ù•¤(€€€€€€€€€€€€€€€€€ô(€€€€€€€€€€€€€€€€€‘¥Í…‰±•õí½Á•¹¥¹Q•ÉÉ¥Ñ½Éåô(€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰µÐ´Ì ´ÄÄÜµ™Õ±°…À´ÈÉ½Õ¹‘•µá°‰œµlŒÄáÌÝtÑ•áÐµÝ¡¥Ñ”ÑÉ…¹Í¥Ñ¥½¸µÑÉ…¹Í™½É´¡½Ù•Èé‰œµlŒÄÐå˜ÜÁt…Ñ¥Ù”éÍ…±”µlÀ¸äátˆ(€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€€ñ¡•¬±…ÍÍ9…µ”ô‰ ´ÐÜ´Ðˆ€¼ø(€€€€€€€€€€€€€€€€€½¹™¥Éµ…È(€€€€€€€€€€€€€€€€ð½	ÕÑÑ½¸ø(€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€¤€è¹Õ±±ô((€€€€€€€€€€€í•½ÉÉ½É1…‰•°ñðÉ•Ù•ÉÍ•ÉÉ½È€ü€ (€€€€€€€€€€€€€€ñ‘¥Ø(€€€€€€€€€€€€€€€É½±”ô‰…±•ÉÐˆ(€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰É½Õ¹‘•µá°‰½É‘•È‰½É‘•ÈµÉ•´ÈÀÀ‰œµÉ•´ÔÀÁà´ÌÁä´È¸ÔÑ•áÐµlÄÍÁát±•…‘¥¹œµÉ•±…á•Ñ•áÐµÉ•´ÜÀÀˆ(€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€í•½ÉÉ½É1…‰•°ñðÉ•Ù•ÉÍ•ÉÉ½Éô(€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€¤€è¹Õ±±ô((€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰ÍÁ…”µä´Ä¸ÔÁÐ´À¸Ôˆø(€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ‰•ÑÝ••¸…À´Ìˆø(€€€€€€€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰Ñ•áÐµlÄÉÁát™½¹Ðµµ•‘¥Õ´Ñ•áÐµÍ±…Ñ”´ÔÀÀˆø(€€€€€€€€€€€€€€€€€Q•ÉÉ¥ÓÍÉ¥½ÌÍÕ•É¥‘½Ì(€€€€€€€€€€€€€€€€ð½Àø(€€€€€€€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰Ñ•áÐµlÄÅÁát™½¹Ðµµ•‘¥Õ´Ñ•áÐµÍ±…Ñ”´ÐÀÀˆø(€€€€€€€€€€€€€€€€€•ÍÍ¼Ãé‰±¥¼(€€€€€€€€€€€€€€€€ð½Àø(€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€ñ‘¥Ø(€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰™±•à™±•àµÝÉ…À…À´Ä¸Ôˆ(€€€€€€€€€€€€€€€…É¥„µ±…‰•°ô‰MÕ•ÍÑ½•Ì‘”±½…°ˆ(€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€íÉ••¹ÑMÕ•ÍÑ¥½¹Ì¹µ…À ¡±…‰•°¤€ôø€ (€€€€€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸(€€€€€€€€€€€€€€€€€€€­•äõí±…‰•±ô(€€€€€€€€€€€€€€€€€€€ÑåÁ”ô‰‰ÕÑÑ½¸ˆ(€€€€€€€€€€€€€€€€€€€½¹±¥¬õì ¤€ôø¡…¹‘±•M••‘MÕ•ÍÑ¥½¸¡±…‰•°¥ô(€€€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰É½Õ¹‘•µ™Õ±°‰½É‘•È‰½É‘•ÈµÍ±…Ñ”´ÈÀÀ‰œµÝ¡¥Ñ”Áà´È¸ÔÁä´Ä¸ÔÑ•áÐµlÄÄ¸ÕÁát™½¹Ðµµ•‘¥Õ´Ñ•áÐµÍ±…Ñ”´ÜÀÀÍ¡…‘½ÜµÍ´ÑÉ…¹Í¥Ñ¥½¸µ½±½ÉÌ¡½Ù•Èé‰½É‘•ÈµlŒÄáÌÝt¼ÐÀ¡½Ù•ÈéÑ•áÐµÍ±…Ñ”´äÔÀ™½ÕÌµÙ¥Í¥‰±”é½ÕÑ±¥¹”µ¹½¹”™½ÕÌµÙ¥Í¥‰±”éÉ¥¹œ´È™½ÕÌµÙ¥Í¥‰±”éÉ¥¹œµlŒÄáÌÝt¼ÌÀˆ(€€€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸(€€€€€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰µÈ´Ä¥¹±¥¹”µ‰±½¬Ñ•áÐµlŒÄáÌÝtˆ(€€€€€€€€€€€€€€€€€€€€€…É¥„µ¡¥‘‘•¸(€€€€€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€€€€€ƒÂ~N4(€€€€€€€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€€í±…‰•±ô(€€€€€€€€€€€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€€€¤¥ô(€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€ð½‘¥Øø(€€€€€€€€ð½Í•Ñ¥½¸ø((€€€€€€€€ñ™½½Ñ•È±…ÍÍ9…µ”ô‰Áà´ÔÁˆ´ÌÑ•áÐµ•¹Ñ•ÈÑ•áÐµlÄÄ¸ÕÁát±•…‘¥¹œµÍ¹ÕœÑ•áÐµÍ±…Ñ”´ÔÀÀ±œé½°µÍÑ…ÉÐ´È±œéÁà´À±œéÁˆ´À±œéÑ•áÐµ±•™Ð±œéÑ•áÐµlÄÉÁát±œé±•…‘¥¹œµÉ•±…á•ˆø(€€€€€€€€€€ñÀùY½¨Ù•Ë„ÁÉ¥µ•¥É¼¼ÅÕ”É•…±µ•¹Ñ”…½¹Ñ•”Á•ÉÑ¼‘”Ù½¨¸ð½Àø(€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µÐ´Ä¸Ô™±•à™±•àµÝÉ…À¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ•¹Ñ•È…À´Ä¸Ô±œéµÐ´È±œé…À´È±œé©ÕÍÑ¥™äµÍÑ…ÉÐˆø(€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰É½Õ¹‘•µ™Õ±°‰œµlŒÄáÌÝt¼ÄÀÁà´È¸ÔÁä´ÄÑ•áÐµlÄÅÁát™½¹Ðµµ•‘¥Õ´Ñ•áÐµlŒÄÌàÐÕ™tˆø(€€€€€€€€€€€€€M…±Ù…‘½È(€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰É½Õ¹‘•µ™Õ±°‰œµÍ±…Ñ”´ÄÀÀÁà´È¸ÔÁä´ÄÑ•áÐµlÄÅÁát™½¹Ðµµ•‘¥Õ´Ñ•áÐµÍ±…Ñ”´ØÀÀˆø(€€€€€€€€€€€€€•áÁ±½É”Í•´…‘…ÍÑÉ¼(€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€ð½‘¥Øø(€€€€€€€€ð½™½½Ñ•Èø(€€€€€€ð½µ…¥¸ø(€€€€ð½‘¥Øø(€€¤ì)ô