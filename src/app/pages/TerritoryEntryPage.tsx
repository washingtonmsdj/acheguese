import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Check,
  Info,
  Loader2,
  LocateFixed,
  MapPin,
  Search,
  Store,
  Users,
  Wrench,
  X,
} from "lucide-react";

import TerritoryEntryMap from "@/app/components/territory-vivo/TerritoryEntryMap";
import {
  TerritorySectionHeading,
  TerritorySurface,
} from "@/app/components/territory-vivo";
import { SALVADOR_COMMUNITY_LAUNCH_CLUSTER } from "@/core/community/config/communityLaunch";
import { LAUNCH_URLS, TERRITORY_CONFIG } from "@/config/territory";
import { createLocationRepository } from "@/core/location/repositories/createLocationRepository";
import {
  LocationStatus,
  LocationType,
  type Location,
} from "@/core/location/types";
import {
  lastTerritoryStore,
  type LastTerritory,
} from "@/core/routing/stores/LastTerritoryStore";
import { geoPathToPublicUrl } from "@/core/routing/utils/territoryUrls";
import { isTerritoryPubliclyNavigable } from "@/core/routing/utils/territoryVisibility";
import { normalizeTerritoryText } from "@/shared/utils/slugify";

const OFFICIAL_LOGO_SRC = "/images/logo-icon.png";
const PUBLIC_SALVADOR_PATH = "/ba/salvador";

const FEATURED_TERRITORIES = [
  { label: "Pituba", path: "/ba/salvador/pituba" },
  { label: "Barra", path: "/ba/salvador/barra" },
  { label: "Rio Vermelho", path: "/ba/salvador/rio-vermelho" },
] as const;

const PRODUCT_VALUE = [
  { label: "Serviços", icon: Wrench },
  { label: "Comércio", icon: Store },
  { label: "Oportunidades", icon: BriefcaseBusiness },
  { label: "Informação local", icon: Info },
] as const;

interface ReverseGeocodeAddress {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  neighbourhood?: string;
  quarter?: string;
  suburb?: string;
  state?: string;
  state_code?: string;
  country_code?: string;
  "ISO3166-2-lvl4"?: string;
}

interface ResolvedLocation {
  label: string;
  latitude: number;
  longitude: number;
}

interface TerritorySuggestion {
  id: string;
  label: string;
  path?: string;
  location?: Location;
  latitude?: number;
  longitude?: number;
  kind: "territory" | "city";
}

interface NominatimSearchItem {
  place_id: number;
  lat: string;
  lon: string;
  address?: ReverseGeocodeAddress;
  display_name?: string;
}

interface TerritoryEntryPageProps {
  recentTerritory?: LastTerritory | null;
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

let launchCityPromise: Promise<Location | null> | null = null;
let launchTerritoriesPromise: Promise<Location[]> | null = null;

function getLaunchCityPaths(): string[] {
  const country = TERRITORY_CONFIG.launch.country || "br";
  const state = TERRITORY_CONFIG.launch.state || "ba";
  const city = TERRITORY_CONFIG.launch.city || "salvador";
  return Array.from(
    new Set([`/${country}/${state}/${city}`, `/${state}/${city}`]),
  );
}

async function resolveLaunchCity(): Promise<Location | null> {
  const repository = createLocationRepository();

  for (const path of getLaunchCityPaths()) {
    const location = await repository.findByPath(path);
    if (location) return location;
  }

  const normalizedCity = normalizeTerritoryText(
    TERRITORY_CONFIG.launch.city || "salvador",
  );
  const normalizedState = normalizeTerritoryText(
    TERRITORY_CONFIG.launch.state || "ba",
  );
  const locations = await repository.findAll();

  return (
    locations.find((location) => {
      const pathParts = location.geographic_path.split("/").filter(Boolean);
      return (
        location.type === LocationType.CITY &&
        location.status === LocationStatus.ACTIVE &&
        (normalizeTerritoryText(location.slug) === normalizedCity ||
          normalizeTerritoryText(location.name) === normalizedCity) &&
        (pathParts.includes(normalizedState) ||
          normalizeTerritoryText(String(location.metadata.state_code ?? "")) ===
            normalizedState)
      );
    }) ?? null
  );
}

function getLaunchCity(): Promise<Location | null> {
  if (!launchCityPromise) {
    launchCityPromise = resolveLaunchCity().catch(() => null);
  }
  return launchCityPromise;
}

async function getLaunchTerritories(): Promise<Location[]> {
  if (!launchTerritoriesPromise) {
    launchTerritoriesPromise = (async () => {
      const city = await getLaunchCity();
      if (!city) return [];
      const result = await createLocationRepository().findDescendants(city.id, {
        include_self: false,
        max_depth: 2,
        page: 1,
        page_size: 200,
      });
      return result.locations.filter(
        (location) =>
          location.status === LocationStatus.ACTIVE &&
          isTerritoryPubliclyNavigable(location.metadata),
      );
    })().catch(() => []);
  }
  return launchTerritoriesPromise;
}

function extractUf(address: ReverseGeocodeAddress): string | null {
  const iso = address["ISO3166-2-lvl4"];
  if (iso?.startsWith("BR-")) return iso.slice(3).toUpperCase();
  if (address.state_code) return address.state_code.toUpperCase();
  if (!address.state) return null;
  return BR_STATE_TO_UF[normalizeTerritoryText(address.state)] ?? null;
}

function buildLocationLabel(address: ReverseGeocodeAddress): string | null {
  const city =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    null;
  const neighborhood =
    address.neighbourhood || address.quarter || address.suburb || null;

  if (
    neighborhood &&
    city &&
    normalizeTerritoryText(city) === "salvador" &&
    normalizeTerritoryText(neighborhood) !== "salvador"
  ) {
    return `${neighborhood}, Salvador`;
  }

  const uf = extractUf(address);
  if (city && uf) return `${city}, ${uf}`;
  return city ?? neighborhood;
}

async function reverseGeocode(
  latitude: number,
  longitude: number,
  signal: AbortSignal,
): Promise<string | null> {
  const url =
    "https://nominatim.openstreetmap.org/reverse?format=jsonv2" +
    `&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1&accept-language=pt-BR`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { address?: ReverseGeocodeAddress };
  return buildLocationLabel(data.address ?? {});
}

async function searchBrazilianCities(
  query: string,
  signal: AbortSignal,
): Promise<TerritorySuggestion[]> {
  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1" +
    "&countrycodes=br&featuretype=city&limit=5&accept-language=pt-BR" +
    `&city=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) return [];
  const data = (await response.json()) as NominatimSearchItem[];
  const seen = new Set<string>();

  return data.flatMap((item) => {
    const label = buildLocationLabel(item.address ?? {}) ?? item.display_name;
    if (!label) return [];
    const key = normalizeTerritoryText(label);
    if (seen.has(key)) return [];
    seen.add(key);
    return [
      {
        id: `city-${item.place_id}`,
        label,
        latitude: Number(item.lat),
        longitude: Number(item.lon),
        kind: "city" as const,
      },
    ];
  });
}

async function searchLocalTerritories(
  query: string,
): Promise<TerritorySuggestion[]> {
  const normalizedQuery = normalizeTerritoryText(query);
  const cityMatches = "salvador".includes(normalizedQuery);
  const [city, locations] = await Promise.all([
    getLaunchCity(),
    getLaunchTerritories(),
  ]);
  const matches = locations
    .filter(
      (location) =>
        normalizeTerritoryText(location.name).includes(normalizedQuery) ||
        normalizeTerritoryText(location.slug).includes(normalizedQuery),
    )
    .slice(0, 6)
    .map((location) => ({
      id: `territory-${location.id}`,
      label: `${location.name}, Salvador`,
      path: geoPathToPublicUrl(location.geographic_path),
      location,
      kind: "territory" as const,
    }));

  return cityMatches
    ? [
        {
          id: "territory-salvador",
          label: "Salvador inteira",
          path: PUBLIC_SALVADOR_PATH,
          ...(city ? { location: city } : {}),
          kind: "territory" as const,
        },
        ...matches,
      ].slice(0, 6)
    : matches;
}

function mergeSuggestions(
  local: TerritorySuggestion[],
  remote: TerritorySuggestion[],
): TerritorySuggestion[] {
  const seen = new Set<string>();
  const merged: TerritorySuggestion[] = [];

  for (const suggestion of [...local, ...remote]) {
    const key = normalizeTerritoryText(suggestion.label);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(suggestion);
    if (merged.length === 7) break;
  }
  return merged;
}

async function resolvePublicTerritoryPath(
  label: string,
): Promise<string | null> {
  const normalized = normalizeTerritoryText(label.split(",")[0] ?? label);
  if (!normalized) return null;
  if (normalized === "salvador" || normalized === "salvador inteira") {
    return PUBLIC_SALVADOR_PATH;
  }

  const locations = await getLaunchTerritories();
  const location = locations.find(
    (item) =>
      normalizeTerritoryText(item.slug) === normalized ||
      normalizeTerritoryText(item.name) === normalized,
  );
  return location ? geoPathToPublicUrl(location.geographic_path) : null;
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000,
    });
  });
}

function geolocationErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "number"
  ) {
    if (error.code === 1) {
      return "A localização foi bloqueada. Você ainda pode buscar uma cidade ou bairro abaixo.";
    }
    if (error.code === 2) {
      return "Não foi possível determinar sua posição. Verifique o GPS ou a conexão e tente novamente.";
    }
    if (error.code === 3) {
      return "A localização demorou para responder. Tente novamente ou faça a busca manual.";
    }
  }
  return "Não foi possível usar sua localização agora. Busque uma cidade ou bairro para continuar.";
}

export default function TerritoryEntryPage({
  recentTerritory = null,
}: TerritoryEntryPageProps) {
  const navigate = useNavigate();
  const [launchCity, setLaunchCity] = useState<Location | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<TerritorySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [resolvedLocation, setResolvedLocation] =
    useState<ResolvedLocation | null>(null);
  const [previewTerritory, setPreviewTerritory] = useState<Location | null>(
    null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const reverseAbortRef = useRef<AbortController | null>(null);
  const manualQueryRef = useRef(false);

  const canSubmit = useMemo(() => query.trim().length > 1, [query]);

  useEffect(() => {
    let cancelled = false;
    const loadingTimeout = window.setTimeout(() => {
      if (!cancelled) setIsMapLoading(false);
    }, 8000);
    getLaunchCity().then((city) => {
      if (cancelled) return;
      window.clearTimeout(loadingTimeout);
      setLaunchCity(city);
      setIsMapLoading(false);
    });
    return () => {
      cancelled = true;
      window.clearTimeout(loadingTimeout);
    };
  }, []);

  const cancelPendingRequests = useCallback(() => {
    searchAbortRef.current?.abort();
    reverseAbortRef.current?.abort();
    searchAbortRef.current = null;
    reverseAbortRef.current = null;
  }, []);

  useEffect(() => () => cancelPendingRequests(), [cancelPendingRequests]);

  useEffect(() => {
    if (!manualQueryRef.current) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    searchAbortRef.current?.abort();
    searchAbortRef.current = controller;
    const timeout = window.setTimeout(async () => {
      setIsSearching(true);
      const [localResult, remoteResult] = await Promise.allSettled([
        searchLocalTerritories(trimmed),
        searchBrazilianCities(trimmed, controller.signal),
      ]);
      if (controller.signal.aborted) return;
      const local = localResult.status === "fulfilled" ? localResult.value : [];
      const remote =
        remoteResult.status === "fulfilled" ? remoteResult.value : [];
      setSuggestions(mergeSuggestions(local, remote));
      setShowSuggestions(true);
      setIsSearching(false);
    }, 280);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const openTerritory = useCallback(
    (path: string, label: string) => {
      lastTerritoryStore.set({ name: label, baseUrl: path });
      navigate(path);
    },
    [navigate],
  );

  const resolveAndOpen = async (label = query) => {
    const finalLabel = label.trim();
    if (!finalLabel) return;
    setIsOpening(true);
    setMessage(null);
    try {
      const path = await resolvePublicTerritoryPath(finalLabel);
      if (!path) {
        setMessage(
          "Esse território ainda não está disponível para exploração pública. Salvador continua aberta por inteiro.",
        );
        return;
      }
      openTerritory(path, finalLabel.replace(", Salvador", ""));
    } catch {
      setMessage(
        "Não foi possível confirmar esse território agora. Tente novamente ou explore Salvador.",
      );
    } finally {
      setIsOpening(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowSuggestions(false);
    void resolveAndOpen();
  };

  const handleQueryChange = (value: string) => {
    manualQueryRef.current = true;
    reverseAbortRef.current?.abort();
    setResolvedLocation(null);
    setPreviewTerritory(null);
    setIsLocating(false);
    setMessage(null);
    setQuery(value);
  };

  const handleSuggestion = (suggestion: TerritorySuggestion) => {
    manualQueryRef.current = false;
    setSuggestions([]);
    setShowSuggestions(false);
    setMessage(null);
    setQuery(suggestion.label);
    if (suggestion.path) {
      setPreviewTerritory(suggestion.location ?? null);
      return;
    }
    if (
      suggestion.latitude !== undefined &&
      suggestion.longitude !== undefined
    ) {
      setResolvedLocation({
        label: suggestion.label,
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
      });
      setPreviewTerritory(null);
    }
  };

  const handleUseLocation = async () => {
    setMessage(null);
    setResolvedLocation(null);
    setPreviewTerritory(null);
    setShowSuggestions(false);
    manualQueryRef.current = false;
    if (!("geolocation" in navigator)) {
      setMessage(
        "Este navegador não oferece localização. Busque uma cidade ou bairro para continuar.",
      );
      return;
    }

    setIsLocating(true);
    const controller = new AbortController();
    reverseAbortRef.current?.abort();
    reverseAbortRef.current = controller;
    try {
      const position = await getCurrentPosition();
      const label = await reverseGeocode(
        position.coords.latitude,
        position.coords.longitude,
        controller.signal,
      );
      if (controller.signal.aborted) return;
      if (!label) {
        setMessage(
          "Localizamos seu dispositivo, mas não identificamos o território. Faça a busca manual para continuar.",
        );
        return;
      }
      setQuery(label);
      setResolvedLocation({
        label,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      const normalizedLabel = normalizeTerritoryText(
        label.split(",")[0] ?? label,
      );
      const localTerritories = await getLaunchTerritories();
      setPreviewTerritory(
        localTerritories.find(
          (location) =>
            normalizeTerritoryText(location.name) === normalizedLabel ||
            normalizeTerritoryText(location.slug) === normalizedLabel,
        ) ?? null,
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessage(geolocationErrorMessage(error));
    } finally {
      if (!controller.signal.aborted) setIsLocating(false);
    }
  };

  return (
    <div className="territory-vivo min-h-[100dvh] overflow-x-hidden">
      <header className="mx-auto flex h-16 w-full max-w-[90rem] items-center justify-between px-4 sm:h-[4.5rem] sm:px-6 lg:px-10">
        <Link
          to="/?trocar=territorio"
          className="flex items-center gap-2.5"
          aria-label="Achegue-se"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-territory-border bg-territory-surface shadow-territory-highlight">
            <img
              src={OFFICIAL_LOGO_SRC}
              alt=""
              className="h-6 w-6 object-contain"
            />
          </span>
          <span className="font-heading text-xl font-bold tracking-[-0.03em] text-territory-ink">
            Achegue-<span className="text-territory-brand">se</span>
          </span>
        </Link>
        <Link
          to="/login"
          className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-territory-ink transition-colors hover:bg-territory-surface"
        >
          Entrar
        </Link>
      </header>

      <main
        data-testid="territory-entry-layout"
        className="mx-auto grid w-full max-w-[90rem] gap-5 px-4 pb-8 sm:px-6 sm:pb-10 md:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)] md:items-stretch md:gap-6 lg:px-10 xl:grid-cols-[minmax(0,1.22fr)_minmax(26rem,0.78fr)] xl:gap-8"
      >
        <TerritoryEntryMap
          city={launchCity}
          territory={previewTerritory}
          isLoading={isMapLoading}
        />

        <section
          className="flex min-w-0 flex-col justify-center md:py-2"
          aria-labelledby="territory-entry-title"
        >
          <div className="mb-4 md:mb-5">
            <p className="mb-2 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-territory-brand">
              Seu território, sua rotina
            </p>
            <h1
              id="territory-entry-title"
              className="max-w-xl font-heading text-[2rem] font-semibold leading-[1.02] tracking-[-0.045em] text-territory-ink min-[380px]:text-[2.25rem] md:text-[2.5rem] xl:text-[3rem]"
            >
              Encontre o que importa perto de você.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-territory-muted sm:text-base sm:leading-7">
              Serviços, comércio, oportunidades e informação local em Salvador —
              na cidade inteira ou no seu bairro.
            </p>
          </div>

          <TerritorySurface
            tone="raised"
            className="relative z-20 p-3.5 sm:p-4"
          >
            <button
              type="button"
              onClick={() => void handleUseLocation()}
              disabled={isLocating}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-territory bg-territory-brand px-4 text-sm font-semibold text-[hsl(var(--territory-canvas))] shadow-territory-highlight transition-colors hover:bg-territory-brand-strong disabled:cursor-wait disabled:opacity-70"
            >
              {isLocating ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <LocateFixed className="h-5 w-5" aria-hidden="true" />
              )}
              {isLocating
                ? "Identificando seu território…"
                : "Usar minha localização"}
            </button>

            <div className="my-3 flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-territory-border" />
              <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-territory-muted">
                ou busque
              </span>
              <span className="h-px flex-1 bg-territory-border" />
            </div>

            <form onSubmit={handleSubmit} role="search" className="relative">
              <label htmlFor="territory-entry-search" className="sr-only">
                Buscar cidade ou bairro
              </label>
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-territory-muted"
                aria-hidden="true"
              />
              <input
                id="territory-entry-search"
                value={query}
                onChange={(event) => handleQueryChange(event.target.value)}
                onFocus={() =>
                  suggestions.length > 0 && setShowSuggestions(true)
                }
                onBlur={() =>
                  window.setTimeout(() => setShowSuggestions(false), 150)
                }
                onKeyDown={(event) =>
                  event.key === "Escape" && setShowSuggestions(false)
                }
                placeholder="Cidade ou bairro"
                autoComplete="off"
                role="combobox"
                aria-expanded={showSuggestions}
                aria-controls="territory-entry-suggestions"
                className="h-14 w-full rounded-territory border border-territory-border bg-territory-raised pl-12 pr-14 text-base text-territory-ink outline-none transition placeholder:text-territory-muted/75 hover:border-territory-brand/30 focus:border-territory-brand/60"
              />
              <button
                type="submit"
                disabled={!canSubmit || isOpening}
                className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl bg-territory-brand text-[hsl(var(--territory-canvas))] transition-colors hover:bg-territory-brand-strong disabled:bg-territory-border disabled:text-territory-muted"
                aria-label="Confirmar território"
              >
                {isOpening ? (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                )}
              </button>

              {showSuggestions ? (
                <ul
                  id="territory-entry-suggestions"
                  role="listbox"
                  className="absolute inset-x-0 top-full z-30 mt-2 max-h-64 overflow-auto rounded-territory border border-territory-border bg-territory-surface p-1.5 shadow-territory-highlight"
                >
                  {isSearching ? (
                    <li className="flex min-h-11 items-center gap-2 px-3 text-sm text-territory-muted">
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />{" "}
                      Buscando territórios…
                    </li>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((suggestion) => (
                      <li key={suggestion.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={query === suggestion.label}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleSuggestion(suggestion)}
                          className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-territory-ink transition-colors hover:bg-territory-raised"
                        >
                          <MapPin
                            className="h-4 w-4 shrink-0 text-territory-brand"
                            aria-hidden="true"
                          />
                          <span className="min-w-0 flex-1 truncate">
                            {suggestion.label}
                          </span>
                          <span className="text-[0.6875rem] text-territory-muted">
                            {suggestion.kind === "territory"
                              ? "bairro"
                              : "cidade"}
                          </span>
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="px-3 py-3 text-sm leading-5 text-territory-muted">
                      Nenhum território encontrado com esse nome.
                    </li>
                  )}
                </ul>
              ) : null}
            </form>

            <button
              type="button"
              onClick={() => openTerritory(PUBLIC_SALVADOR_PATH, "Salvador")}
              className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-territory border border-territory-brand/30 bg-territory-brand/8 px-4 text-sm font-semibold text-territory-brand transition-colors hover:bg-territory-brand/14"
            >
              <Building2 className="h-4 w-4" aria-hidden="true" />
              Explorar Salvador inteira
            </button>
          </TerritorySurface>

          {resolvedLocation ? (
            <TerritorySurface
              tone="highlight"
              className="mt-3 p-4"
              role="status"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-territory-brand/12 text-territory-brand">
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-territory-brand">
                    Local encontrado
                  </p>
                  <p className="mt-1 truncate font-heading text-base font-semibold text-territory-ink">
                    {resolvedLocation.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-territory-muted">
                    Confirme para abrir o contexto público disponível.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setResolvedLocation(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-territory-muted hover:bg-territory-surface"
                  aria-label="Descartar local encontrado"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => void resolveAndOpen(resolvedLocation.label)}
                disabled={isOpening}
                className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-territory-brand px-4 text-sm font-semibold text-[hsl(var(--territory-canvas))] hover:bg-territory-brand-strong disabled:opacity-70"
              >
                <Check className="h-4 w-4" aria-hidden="true" /> Confirmar
                território
              </button>
            </TerritorySurface>
          ) : null}

          {message ? (
            <div
              role="alert"
              className="mt-3 rounded-territory border border-territory-warm/30 bg-territory-warm/10 px-4 py-3 text-sm leading-6 text-territory-ink"
            >
              {message}
              <button
                type="button"
                onClick={() => openTerritory(PUBLIC_SALVADOR_PATH, "Salvador")}
                className="ml-1 font-semibold text-territory-brand underline decoration-territory-brand/40 underline-offset-4"
              >
                Explorar Salvador
              </button>
            </div>
          ) : null}

          {recentTerritory ? (
            <button
              type="button"
              onClick={() =>
                openTerritory(recentTerritory.baseUrl, recentTerritory.name)
              }
              className="mt-3 flex min-h-12 w-full items-center justify-between rounded-territory border border-territory-border bg-territory-surface px-4 text-left shadow-territory-highlight"
            >
              <span>
                <span className="block text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-territory-muted">
                  Seu último território
                </span>
                <span className="mt-0.5 block text-sm font-semibold text-territory-ink">
                  {recentTerritory.name}
                </span>
              </span>
              <ArrowRight
                className="h-4 w-4 text-territory-brand"
                aria-hidden="true"
              />
            </button>
          ) : null}

          <div className="mt-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-territory-muted">
                Bairros para explorar
              </p>
              <span className="text-[0.6875rem] text-territory-muted">
                sem cadastro
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {FEATURED_TERRITORIES.map((territory) => (
                <button
                  key={territory.path}
                  type="button"
                  onClick={() => openTerritory(territory.path, territory.label)}
                  className="min-h-10 rounded-xl border border-territory-border bg-territory-surface px-3 text-xs font-semibold text-territory-ink transition-colors hover:border-territory-brand/40 hover:text-territory-brand"
                >
                  {territory.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section
          className="grid gap-4 md:col-span-2 md:grid-cols-[minmax(0,1fr)_minmax(20rem,0.72fr)] md:gap-6"
          aria-label="O que encontrar no Achegue-se"
        >
          <TerritorySurface tone="inset" className="p-5 sm:p-6">
            <TerritorySectionHeading
              eyebrow="Depois da escolha"
              title="Um ponto de partida para a vida local"
              description="A seleção abre conteúdo público do território. Conta só é necessária quando você quiser participar."
            />
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PRODUCT_VALUE.map(({ label, icon: Icon }) => (
                <li
                  key={label}
                  className="flex min-h-[4.75rem] flex-col justify-between rounded-territory border border-territory-border bg-territory-surface p-3"
                >
                  <Icon
                    className="h-5 w-5 text-territory-brand"
                    aria-hidden="true"
                  />
                  <span className="mt-3 text-xs font-semibold text-territory-ink">
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </TerritorySurface>

          <TerritorySurface tone="highlight" className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-territory bg-territory-brand/12 text-territory-brand">
                <Users className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-territory-brand">
                  Community em expansão
                </p>
                <h2 className="mt-1 font-heading text-lg font-semibold text-territory-ink">
                  Complexo do Nordeste de Amaralina
                </h2>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-territory-muted">
              Salvador inteira já pode ser explorada. A camada de participação
              comunitária tem rollout próprio e começa por estes territórios:
            </p>
            <p className="mt-3 text-xs font-semibold leading-5 text-territory-ink">
              {SALVADOR_COMMUNITY_LAUNCH_CLUSTER.map(
                (territory) => territory.name,
              ).join(" · ")}
            </p>
            <Link
              to={LAUNCH_URLS.community}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-territory-brand/30 px-4 text-sm font-semibold text-territory-brand hover:bg-territory-brand/10"
            >
              Conhecer a Community{" "}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </TerritorySurface>
        </section>
      </main>
    </div>
  );
}
