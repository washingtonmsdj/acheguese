import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  Check,
  Loader2,
  MapPin,
  Navigation,
  Store,
  X,
} from "lucide-react";

import { TERRITORY_CONFIG } from "@/config/territory";
import { boundaryService } from "@/core/geospatial";
import { createLocationRepository } from "@/core/location/repositories/createLocationRepository";
import { LocationStatus, LocationType, type Location } from "@/core/location/types";
import { DEFAULT_TILE_STYLE, MapLibreAdapter, type MapMarker } from "@/core/maps";
import type { TerritoryPolygon } from "@/core/maps/hooks/useTerritoryPolygon";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useGeolocation } from "@/shared/hooks/useGeolocation";
import { cn } from "@/shared/utils/cn";
import { normalizeTerritoryText } from "@/shared/utils/slugify";

const OFFICIAL_LOGO_SRC = "/images/logo-icon.png";
const LS_KEY = "achegue-se:last-city";

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
  "sergipe": "SE",
  tocantins: "TO",
};

const statusChips = [
  { value: "170", label: "bairros", icon: MapPin, tone: "green" },
  { value: "12", label: "lugares abertos", icon: Store, tone: "green" },
  { value: "2", label: "avisos hoje", icon: Bell, tone: "orange" },
] as const;

const recentSuggestions = ["Pituba", "Barra", "Rio Vermelho"];

const PREVIEW_MAP_CENTER = { latitude: -12.95, longitude: -38.55 };
const PREVIEW_CITY_MARKERS: MapMarker[] = [
  {
    id: "salvador",
    type: "service",
    coordinates: { latitude: -12.9777, longitude: -38.5016 },
    title: "Salvador",
    subtitle: "destaque territorial",
    status: "active",
    score: 100,
    isPremium: true,
  },
  {
    id: "lauro-de-freitas",
    type: "service",
    coordinates: { latitude: -12.8944, longitude: -38.3277 },
    title: "Lauro de Freitas",
    subtitle: "região metropolitana",
    status: "active",
  },
  {
    id: "camacari",
    type: "service",
    coordinates: { latitude: -12.6975, longitude: -38.3254 },
    title: "Camaçari",
    subtitle: "região metropolitana",
    status: "active",
  },
  {
    id: "simoes-filho",
    type: "service",
    coordinates: { latitude: -12.7846, longitude: -38.4028 },
    title: "Simões Filho",
    subtitle: "região metropolitana",
    status: "active",
  },
  {
    id: "feira-de-santana",
    type: "service",
    coordinates: { latitude: -12.2664, longitude: -38.9663 },
    title: "Feira de Santana",
    subtitle: "interior da Bahia",
    status: "active",
  },
];

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

function getLaunchCityPaths(): string[] {
  const country = TERRITORY_CONFIG.launch.country || "br";
  const state = TERRITORY_CONFIG.launch.state || "ba";
  const city = TERRITORY_CONFIG.launch.city || "salvador";
  return Array.from(new Set([`/${country}/${state}/${city}`, `/${state}/${city}`]));
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
      if (location.type !== LocationType.CITY || location.status !== LocationStatus.ACTIVE) {
        return false;
      }

      const pathParts = location.geographic_path.split("/").filter(Boolean);
      const cityMatches =
        normalizeTerritoryText(location.slug) === normalizedCity ||
        normalizeTerritoryText(location.name) === normalizedCity;
      const stateMatches =
        !normalizedState ||
        pathParts.includes(normalizedState) ||
        normalizeTerritoryText(String(location.metadata?.state_code ?? "")) === normalizedState;

      return cityMatches && stateMatches;
    }) ?? null
  );
}

function buildOfficialSalvadorCityPolygon(cityName: string): TerritoryPolygon | null {
  if (normalizeTerritoryText(cityName) !== "salvador") return null;

  const latitudes = SALVADOR_CITY_BOUNDARY_RING.map(([latitude]) => latitude);
  const longitudes = SALVADOR_CITY_BOUNDARY_RING.map(([, longitude]) => longitude);

  return {
    name: cityName,
    coordinates: SALVADOR_CITY_BOUNDARY_RING,
    center: [
      (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
      (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
    ],
    color: "#18B37E",
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
      }));
      const fallback = storedPolygons.length === 0
        ? buildOfficialSalvadorCityPolygon(homeCity.name)
        : null;

      setCityPolygons(storedPolygons.length > 0 ? storedPolygons : fallback ? [fallback] : []);
    };

    run().catch(() => {
      if (!cancelled) {
        const fallback = buildOfficialSalvadorCityPolygon(homeCity?.name ?? "Salvador");
        setCityPolygons(fallback ? [fallback] : []);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [homeCity]);

  const cityLabel = homeCity?.name ?? "Salvador";
  const cityMetaLabel = "170 bairros";

  const territoryPolygons = useMemo(
    () => cityPolygons,
    [cityPolygons],
  );

  const mapMarkers = useMemo<MapMarker[]>(
    () => PREVIEW_CITY_MARKERS,
    [],
  );

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#eef4f0]">
      <MapLibreAdapter
        styleUrl={DEFAULT_TILE_STYLE.styleUrl}
        initialViewport={{ center: PREVIEW_MAP_CENTER, zoom: 9.15 }}
        territoryPolygons={territoryPolygons}
        markers={mapMarkers}
        fitTerritoryBounds={territoryPolygons.length > 0}
        territoryFitPadding={28}
        territoryFitMaxZoom={9.4}
        userLocationMarker={{ enabled: false, autoAdd: false }}
        enableClustering={false}
        attribution={false}
        hideNavigationControl
        className="h-full w-full"
      />
      <div
        aria-hidden
        className="absolute left-4 top-16 z-20 rounded-full bg-white/88 px-3 py-1.5 text-[11px] font-medium text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.10)] backdrop-blur-sm"
      >
        {cityLabel} · {cityMetaLabel}
      </div>
      <div aria-hidden className="absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-white/80 via-white/35 to-white/0" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-white via-white/42 to-white/0 lg:h-32" />
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
  const city = addr.city || addr.town || addr.village || addr.municipality || addr.suburb;
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
  const res = await fetch(url, { headers: { Accept: "application/json" }, signal });
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
  const res = await fetch(url, { headers: { Accept: "application/json" }, signal });
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
  if (lower.includes("denied") || lower.includes("permission")) {
    return "Permissao de localizacao negada. Ative-a nas configuracoes do navegador e tente novamente.";
  }
  if (lower.includes("unavailable")) {
    return "Nao foi possivel determinar sua posicao. Verifique se o GPS/Wi-Fi esta ativo e tente novamente.";
  }
  if (lower.includes("timeout")) {
    return "A localizacao demorou demais para responder. Tente novamente em uma area com melhor sinal.";
  }
  if (lower.includes("suportada")) {
    return "Seu dispositivo ou navegador nao oferece suporte a geolocalizacao. Digite sua cidade manualmente abaixo.";
  }
  return err;
}

export default function AchegueSeHomePage() {
  const navigate = useNavigate();
  const geo = useGeolocation();

  const initial = useMemo(() => {
    const stored = readStoredCity();
    if (stored && typeof stored === "object") {
      return { query: stored.label, resolved: stored as ResolvedLocation };
    }
    if (typeof stored === "string" && stored.trim()) {
      return { query: stored, resolved: null };
    }
    return { query: "", resolved: null };
  }, []);

  const [cityQuery, setCityQuery] = useState<string>(initial.query);
  const [resolved, setResolved] = useState<ResolvedLocation | null>(initial.resolved);
  const [resolvingCity, setResolvingCity] = useState(false);
  const [reverseError, setReverseError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const reverseAbortRef = useRef<AbortController | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const manualEditRef = useRef(false);

  const canSubmitCity = useMemo(() => cityQuery.trim().length > 1, [cityQuery]);
  const cityScaleLabel = "170 bairros";
  const geoErrorLabel = formatGeolocationError(geo.error);

  const persistCity = useCallback((label: string, coords?: ResolvedLocation | null) => {
    try {
      const payload = coords ? coords : { label };
      window.localStorage.setItem(LS_KEY, JSON.stringify(payload));
    } catch {
      // Local storage is optional for this entry flow.
    }
  }, []);

  const cancelPendingRequests = useCallback(() => {
    reverseAbortRef.current?.abort();
    reverseAbortRef.current = null;
    searchAbortRef.current?.abort();
    searchAbortRef.current = null;
  }, []);

  useEffect(() => () => cancelPendingRequests(), [cancelPendingRequests]);

  useEffect(() => {
    if (!manualEditRef.current) return;
    const q = cityQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    searchAbortRef.current?.abort();
    searchAbortRef.current = controller;
    const timeout = window.setTimeout(async () => {
      try {
        const results = await searchCities(q, controller.signal);
        if (!controller.signal.aborted) {
          setSuggestions(results);
          setShowSuggestions(true);
        }
      } catch {
        // Aborted requests and transient network failures do not block manual entry.
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [cityQuery]);

  const goToOnboarding = (label?: string, coords?: ResolvedLocation | null) => {
    const finalLabel = (label ?? cityQuery).trim();
    if (!finalLabel) return;
    persistCity(finalLabel, coords ?? resolved);
    navigate("/onboarding");
  };

  const handleUseLocation = async () => {
    setReverseError(null);
    setResolved(null);
    if (!("geolocation" in navigator)) {
      setReverseError(
        "Seu dispositivo ou navegador nao oferece suporte a geolocalizacao. Digite sua cidade manualmente abaixo.",
      );
      return;
    }

    const ok = await geo.requestPermission();
    if (!ok) return;

    setResolvingCity(true);
    manualEditRef.current = false;
    setShowSuggestions(false);

    const controller = new AbortController();
    reverseAbortRef.current?.abort();
    reverseAbortRef.current = controller;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const label = await reverseGeocode(
            pos.coords.latitude,
            pos.coords.longitude,
            controller.signal,
          );
          if (controller.signal.aborted) return;
          if (label) {
            setCityQuery(label);
            setResolved({
              label,
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            });
          } else {
            setReverseError("Nao foi possivel identificar sua cidade automaticamente.");
          }
        } catch (err) {
          if ((err as Error).name !== "AbortError") {
            setReverseError("Falha ao consultar o servico de localizacao. Tente novamente.");
          }
        } finally {
          if (!controller.signal.aborted) setResolvingCity(false);
        }
      },
      (err) => {
        const codeMap: Record<number, string> = {
          1: "Permissao de localizacao negada. Ative-a nas configuracoes do navegador e tente novamente.",
          2: "Nao foi possivel determinar sua posicao. Verifique se o GPS/Wi-Fi esta ativo e tente novamente.",
          3: "A localizacao demorou demais para responder. Tente novamente em uma area com melhor sinal.",
        };
        setReverseError(codeMap[err.code] ?? err.message);
        setResolvingCity(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  };

  const handleManualChange = (value: string) => {
    manualEditRef.current = true;
    cancelPendingRequests();
    setResolved(null);
    setResolvingCity(false);
    setReverseError(null);
    setCityQuery(value);
  };

  const handlePickSuggestion = (s: CitySuggestion) => {
    manualEditRef.current = false;
    setSuggestions([]);
    setShowSuggestions(false);
    setCityQuery(s.label);
    setResolved({ label: s.label, lat: s.lat, lng: s.lng });
  };

  const handleSeedSuggestion = (label: string) => {
    manualEditRef.current = false;
    cancelPendingRequests();
    setSuggestions([]);
    setShowSuggestions(false);
    setReverseError(null);
    setResolved(null);
    setCityQuery(label);
  };

  return (
    <div className="min-h-[100dvh] w-full overflow-hidden bg-[#f8fafc] text-slate-950">
      <main
        id="main-content"
        className={cn(
          "mx-auto flex min-h-[100dvh] w-full flex-col",
          "lg:grid lg:max-w-6xl lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.72fr)] lg:items-center lg:gap-10 lg:px-8 lg:py-8",
        )}
      >
        <section
          aria-label="Status ao vivo do Achegue-se"
          className="th-live-section"
        >
          <div className="th-live-card h-[392px] rounded-b-[28px] border-0 bg-[#e8f1ee] shadow-[0_22px_60px_rgba(15,23,42,0.14)] lg:h-[calc(100dvh-4rem)] lg:min-h-[640px] lg:rounded-[32px]">
            <HomeBoundaryPreview />
            <div aria-hidden className="absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-white/78 via-white/38 to-white/0" />
            <div aria-hidden className="absolute inset-x-0 bottom-0 z-10 h-28 bg-gradient-to-t from-white via-white/42 to-white/0 lg:h-40" />

            <header
              className="absolute left-5 right-5 top-[max(1rem,env(safe-area-inset-top))] z-30 flex items-center gap-2.5 lg:left-7 lg:right-7 lg:top-7"
              aria-label="Achegue-se"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-[0_10px_24px_rgba(15,23,42,0.10)] ring-1 ring-white/80 backdrop-blur">
                <img src={OFFICIAL_LOGO_SRC} alt="" aria-hidden className="h-7 w-7 object-contain" />
              </span>
              <span className="font-heading text-[22px] font-semibold leading-none tracking-tight text-slate-950 drop-shadow-[0_1px_0_rgba(255,255,255,0.65)] lg:text-[24px]">
                Achegue-<span className="text-[#18B37E]">se</span>
              </span>
            </header>

            <div className="th-live-copy !left-5 !top-[5.75rem] !w-[min(14rem,calc(100%-2.5rem))] lg:!left-7 lg:!top-[6.75rem] lg:!w-[min(14rem,38%)]">
              <ul className="th-live-status-list" aria-label="Status ao vivo do Achegue-se">
                <li className="th-live-status">
                  <span className="th-live-status-icon bg-primary/10 text-primary">
                    <MapPin className="h-3 w-3" aria-hidden strokeWidth={2.25} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[10.5px] font-bold leading-tight text-foreground">
                      Descubra seu bairro
                    </span>
                    <span className="block truncate text-[9.5px] leading-tight text-muted-foreground">
                      perto de você
                    </span>
                  </span>
                </li>
                {statusChips.map((chip) => {
                  const Icon = chip.icon;
                  const isOrange = chip.tone === "orange";
                  const isPlaces = chip.label.includes("lugares");
                  const primaryLabel = isOrange
                    ? `${chip.value} avisos`
                    : isPlaces
                      ? `${chip.value} lugares`
                      : `${chip.value} ${chip.label}`;
                  const detailLabel = isOrange
                    ? "hoje"
                    : isPlaces
                      ? "abertos agora"
                      : "em Salvador";
                  return (
                    <li
                      key={`${chip.value ?? "near"}-${chip.label}`}
                      className="th-live-status"
                    >
                      <span
                        className={cn(
                          "th-live-status-icon",
                          isOrange ? "bg-orange-50 text-[#f97316]" : "bg-primary/10 text-primary",
                        )}
                      >
                        <Icon className="h-3 w-3" aria-hidden strokeWidth={2.25} />
                      </span>
                      <span className="min-w-0 leading-none">
                        <span className="block truncate text-[10.5px] font-bold leading-tight text-foreground">
                          {primaryLabel}
                        </span>
                        <span className="block truncate text-[9.5px] leading-tight text-muted-foreground">
                          {detailLabel}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>

        <section className="flex flex-1 flex-col items-center px-5 py-7 text-center lg:items-start lg:justify-center lg:px-0 lg:py-0 lg:text-left">
          <div className="space-y-2">
            <h1 className="mx-auto max-w-[17rem] text-[32px] font-semibold leading-[0.98] tracking-normal text-slate-950 lg:mx-0 lg:max-w-[21rem] lg:text-[48px]">
              Tudo começa pelo seu bairro
            </h1>
            <p className="mx-auto max-w-[20rem] text-[15px] leading-6 text-slate-600 lg:mx-0 lg:max-w-[24rem] lg:text-base lg:leading-7">
              Escolha seu bairro para ver pessoas, empresas e alertas perto de você.
            </p>
          </div>

          <div className="mt-6 w-full space-y-3 lg:mt-8 lg:max-w-[410px]">
            <Button
              type="button"
              size="lg"
              onClick={handleUseLocation}
              disabled={geo.loading || resolvingCity}
              className={cn(
                "h-14 w-full gap-2 rounded-2xl bg-[#18B37E] text-[15px] font-semibold text-white",
                "shadow-[0_16px_35px_rgba(24,179,126,0.28)] transition-all duration-150",
                "hover:bg-[#149f70] active:scale-[0.98] disabled:opacity-70 disabled:shadow-none",
              )}
            >
              {geo.loading || resolvingCity ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Navigation className="h-5 w-5" />
              )}
              {resolvingCity ? "Identificando local..." : "Usar minha localização"}
            </Button>

            <div className="relative">
              <MapPin
                className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-[#18B37E]"
                aria-hidden
              />
              <Input
                id="home-city"
                value={cityQuery}
                onChange={(event) => handleManualChange(event.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onBlur={() => {
                  window.setTimeout(() => setShowSuggestions(false), 150);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && canSubmitCity) {
                    setShowSuggestions(false);
                    goToOnboarding();
                  }
                  if (event.key === "Escape") setShowSuggestions(false);
                }}
                placeholder="Buscar bairro ou cidade"
                className={cn(
                  "h-14 rounded-2xl border-slate-200 bg-white pl-12 pr-14 text-[15px] text-slate-950",
                  "shadow-[0_12px_28px_rgba(15,23,42,0.08)] placeholder:text-slate-400",
                  "focus-visible:border-[#18B37E] focus-visible:ring-2 focus-visible:ring-[#18B37E]/25 focus-visible:ring-offset-0",
                )}
                autoComplete="off"
                inputMode="text"
                role="combobox"
                aria-expanded={showSuggestions && suggestions.length > 0}
                aria-controls="home-city-suggestions"
              />
              <button
                type="button"
                aria-label="Confirmar local"
                onClick={() => goToOnboarding()}
                disabled={!canSubmitCity}
                className={cn(
                  "absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full",
                  "transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18B37E]/60 focus-visible:ring-offset-2",
                  canSubmitCity
                    ? "bg-[#18B37E]/10 text-[#13845f] hover:bg-[#18B37E]/15 active:scale-90"
                    : "text-slate-300",
                )}
              >
                <ArrowRight className="h-5 w-5" />
              </button>

              {showSuggestions && suggestions.length > 0 ? (
                <ul
                  id="home-city-suggestions"
                  role="listbox"
                  className="absolute left-0 right-0 top-full z-20 mt-2 max-h-64 overflow-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-xl"
                >
                  {suggestions.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={cityQuery === s.label}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handlePickSuggestion(s)}
                        className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-slate-800 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18B37E]/40"
                      >
                        <MapPin className="h-4 w-4 shrink-0 text-[#18B37E]" />
                        <span className="truncate">{s.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            {resolved ? (
              <div className="rounded-2xl border border-[#18B37E]/20 bg-[#18B37E]/[0.07] p-3.5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#18B37E]/15 text-[#13845f]">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#13845f]">
                      Local encontrado
                    </p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-slate-950">
                      {resolved.label}
                    </p>
                    <p className="mt-0.5 text-[11px] tabular-nums text-slate-500">
                      {resolved.lat.toFixed(5)} / {resolved.lng.toFixed(5)}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Descartar local encontrado"
                    onClick={() => setResolved(null)}
                    className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-white/70 hover:text-slate-900 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18B37E]/50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => goToOnboarding(resolved.label, resolved)}
                  className="mt-3 h-11 w-full gap-2 rounded-xl bg-[#18B37E] text-white transition-transform hover:bg-[#149f70] active:scale-[0.98]"
                >
                  <Check className="h-4 w-4" />
                  Confirmar
                </Button>
              </div>
            ) : null}

            {geoErrorLabel || reverseError ? (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] leading-relaxed text-red-700"
              >
                {geoErrorLabel || reverseError}
              </div>
            ) : null}

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[12px] font-medium text-slate-500">Mais acessados</p>
                <p className="text-[11px] font-medium text-slate-400">{cityScaleLabel}</p>
              </div>
              <div className="flex flex-wrap gap-2" aria-label="Sugestoes de local">
                {recentSuggestions.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleSeedSuggestion(label)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-700 shadow-sm transition-colors hover:border-[#18B37E]/40 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18B37E]/30"
                  >
                    <span className="mr-1 inline-block text-[#18B37E]" aria-hidden>
                      📍
                    </span>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <footer className="px-5 pb-4 text-center text-[12px] leading-relaxed text-slate-500 lg:col-start-2 lg:px-0 lg:pb-0 lg:text-left">
          <p>Você verá primeiro o que realmente acontece perto de você.</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
            <span className="rounded-full bg-[#18B37E]/10 px-2.5 py-1 text-[11px] font-medium text-[#13845f]">
              Salvador
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
              {cityScaleLabel}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
              comunidade oficial
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
