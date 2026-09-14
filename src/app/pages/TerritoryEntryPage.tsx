import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Loader2, LocateFixed, MapPin, Menu, Search, Users, X } from "lucide-react";

import TerritoryEntryMap from "@/app/components/territory-vivo/TerritoryEntryMap";
import communityThumbnail from "@/assets/hero-complexo-nordeste.jpg";
import { LAUNCH_URLS, TERRITORY_CONFIG } from "@/core/routing/config/territory";
import { createLocationRepository } from "@/core/location/repositories/createLocationRepository";
import { LocationStatus, LocationType, type Location } from "@/core/location/types";
import { lastTerritoryStore } from "@/core/routing/stores/LastTerritoryStore";
import { resolvePublicTerritoryFallback } from "@/core/routing/utils/publicTerritoryFallbacks";
import { geoPathToPublicUrl } from "@/core/routing/utils/territoryUrls";
import { isTerritoryPubliclyNavigable } from "@/core/routing/utils/territoryVisibility";
import { normalizeTerritoryText } from "@/shared/utils/slugify";

const COMPLEX_TERRITORY_NAME = "Complexo do Nordeste de Amaralina";
const PUBLIC_SALVADOR_PATH = "/ba/salvador";

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

const BR_STATE_TO_UF: Record<string, string> = {
  acre: "AC", alagoas: "AL", amapa: "AP", amazonas: "AM", bahia: "BA", ceara: "CE",
  "distrito federal": "DF", "espirito santo": "ES", goias: "GO", maranhao: "MA",
  "mato grosso": "MT", "mato grosso do sul": "MS", "minas gerais": "MG", para: "PA",
  paraiba: "PB", parana: "PR", pernambuco: "PE", piaui: "PI", "rio de janeiro": "RJ",
  "rio grande do norte": "RN", "rio grande do sul": "RS", rondonia: "RO", roraima: "RR",
  "santa catarina": "SC", "sao paulo": "SP", sergipe: "SE", tocantins: "TO",
};

let launchCityPromise: Promise<Location | null> | null = null;
let launchTerritoriesPromise: Promise<Location[]> | null = null;

function getLaunchCityPaths(): string[] {
  const country = TERRITORY_CONFIG.launch.country || "br";
  const state = TERRITORY_CONFIG.launch.state || "ba";
  const city = TERRITORY_CONFIG.launch.city || "salvador";
  return Array.from(new Set([`/${country}/${state}/${city}`, `/${state}/${city}`]));
}

async function resolveLaunchCity(): Promise<Location | null> {
  const repository = createLocationRepository();
  for (const path of getLaunchCityPaths()) {
    const location = await repository.findByPath(path);
    if (location) return location;
  }
  const normalizedCity = normalizeTerritoryText(TERRITORY_CONFIG.launch.city || "salvador");
  const normalizedState = normalizeTerritoryText(TERRITORY_CONFIG.launch.state || "ba");
  const locations = await repository.findAll();
  return locations.find((location) => {
    const pathParts = location.geographic_path.split("/").filter(Boolean);
    return location.type === LocationType.CITY && location.status === LocationStatus.ACTIVE &&
      (normalizeTerritoryText(location.slug) === normalizedCity || normalizeTerritoryText(location.name) === normalizedCity) &&
      (pathParts.includes(normalizedState) || normalizeTerritoryText(String(location.metadata.state_code ?? "")) === normalizedState);
  }) ?? null;
}

function getLaunchCity(): Promise<Location | null> {
  if (!launchCityPromise) launchCityPromise = resolveLaunchCity().catch(() => null);
  return launchCityPromise;
}

async function getLaunchTerritories(): Promise<Location[]> {
  if (!launchTerritoriesPromise) {
    launchTerritoriesPromise = (async () => {
      const city = await getLaunchCity();
      if (!city) return [];
      const result = await createLocationRepository().findDescendants(city.id, {
        include_self: false, max_depth: 2, page: 1, page_size: 200,
      });
      return result.locations.filter((location) => location.status === LocationStatus.ACTIVE && isTerritoryPubliclyNavigable(location.metadata));
    })().catch(() => []);
  }
  return launchTerritoriesPromise;
}

function extractUf(address: ReverseGeocodeAddress): string | null {
  const iso = address["ISO3166-2-lvl4"];
  if (iso?.startsWith("BR-")) return iso.slice(3).toUpperCase();
  if (address.state_code) return address.state_code.toUpperCase();
  return address.state ? BR_STATE_TO_UF[normalizeTerritoryText(address.state)] ?? null : null;
}

function buildLocationLabel(address: ReverseGeocodeAddress): string | null {
  const city = address.city || address.town || address.village || address.municipality || null;
  const neighborhood = address.neighbourhood || address.quarter || address.suburb || null;
  if (neighborhood && city && normalizeTerritoryText(city) === "salvador" && normalizeTerritoryText(neighborhood) !== "salvador") return `${neighborhood}, Salvador`;
  const uf = extractUf(address);
  if (city && uf) return `${city}, ${uf}`;
  return city ?? neighborhood;
}

async function reverseGeocode(latitude: number, longitude: number, signal: AbortSignal): Promise<string | null> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1&accept-language=pt-BR`,
    { headers: { Accept: "application/json" }, signal },
  );
  if (!response.ok) return null;
  const data = (await response.json()) as { address?: ReverseGeocodeAddress };
  return buildLocationLabel(data.address ?? {});
}

async function searchBrazilianCities(query: string, signal: AbortSignal): Promise<TerritorySuggestion[]> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=br&featuretype=city&limit=5&accept-language=pt-BR&city=${encodeURIComponent(query)}`,
    { headers: { Accept: "application/json" }, signal },
  );
  if (!response.ok) return [];
  const data = (await response.json()) as NominatimSearchItem[];
  const seen = new Set<string>();
  return data.flatMap((item) => {
    const label = buildLocationLabel(item.address ?? {}) ?? item.display_name;
    if (!label) return [];
    const key = normalizeTerritoryText(label);
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ id: `city-${item.place_id}`, label, latitude: Number(item.lat), longitude: Number(item.lon), kind: "city" as const }];
  });
}

async function searchLocalTerritories(query: string): Promise<TerritorySuggestion[]> {
  const normalizedQuery = normalizeTerritoryText(query);
  const [city, locations] = await Promise.all([getLaunchCity(), getLaunchTerritories()]);
  const matches = locations.filter((location) =>
    normalizeTerritoryText(location.name).includes(normalizedQuery) || normalizeTerritoryText(location.slug).includes(normalizedQuery),
  ).slice(0, 6).map((location) => ({
    id: `territory-${location.id}`, label: `${location.name}, Salvador`, path: geoPathToPublicUrl(location.geographic_path), location, kind: "territory" as const,
  }));
  return "salvador".includes(normalizedQuery)
    ? [{ id: "territory-salvador", label: "Salvador inteira", path: PUBLIC_SALVADOR_PATH, ...(city ? { location: city } : {}), kind: "territory" as const }, ...matches].slice(0, 6)
    : matches;
}

function mergeSuggestions(local: TerritorySuggestion[], remote: TerritorySuggestion[]): TerritorySuggestion[] {
  const seen = new Set<string>();
  return [...local, ...remote].filter((suggestion) => {
    const key = normalizeTerritoryText(suggestion.label);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 7);
}

async function resolvePublicTerritoryPath(label: string): Promise<string | null> {
  const normalized = normalizeTerritoryText(label.split(",")[0] ?? label);
  if (!normalized) return null;
  if (normalized === "salvador" || normalized === "salvador inteira") return PUBLIC_SALVADOR_PATH;
  const locations = await getLaunchTerritories();
  const location = locations.find((item) => normalizeTerritoryText(item.slug) === normalized || normalizeTerritoryText(item.name) === normalized);
  return location ? geoPathToPublicUrl(location.geographic_path) : null;
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }));
}

function geolocationErrorMessage(error: unknown): string {
  const code = error && typeof error === "object" && "code" in error && typeof error.code === "number" ? error.code : null;
  if (code === 1) return "A localização foi bloqueada. Você ainda pode buscar uma cidade ou bairro.";
  if (code === 2) return "Não foi possível determinar sua posição. Verifique o GPS ou a conexão e tente novamente.";
  if (code === 3) return "A localização demorou para responder. Tente novamente ou faça a busca manual.";
  return "Não foi possível usar sua localização agora. Busque uma cidade ou bairro para continuar.";
}

export default function TerritoryEntryPage() {
  const navigate = useNavigate();
  const [launchCity, setLaunchCity] = useState<Location | null>(null);
  const [previewTerritory, setPreviewTerritory] = useState<Location | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<TerritorySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [resolvedLocation, setResolvedLocation] = useState<ResolvedLocation | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const reverseAbortRef = useRef<AbortController | null>(null);
  const manualQueryRef = useRef(false);
  const canSubmit = useMemo(() => query.trim().length > 1, [query]);

  useEffect(() => {
    let cancelled = false;
    const timeout = window.setTimeout(() => { if (!cancelled) setIsMapLoading(false); }, 8000);
    getLaunchCity().then((city) => { if (!cancelled) { window.clearTimeout(timeout); setLaunchCity(city); setIsMapLoading(false); } });
    return () => { cancelled = true; window.clearTimeout(timeout); };
  }, []);

  const cancelPendingRequests = useCallback(() => { searchAbortRef.current?.abort(); reverseAbortRef.current?.abort(); }, []);
  useEffect(() => () => cancelPendingRequests(), [cancelPendingRequests]);

  useEffect(() => {
    if (!manualQueryRef.current) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) { setSuggestions([]); setShowSuggestions(false); setIsSearching(false); return; }
    const controller = new AbortController();
    searchAbortRef.current?.abort(); searchAbortRef.current = controller;
    const timeout = window.setTimeout(async () => {
      setIsSearching(true);
      const [localResult, remoteResult] = await Promise.allSettled([searchLocalTerritories(trimmed), searchBrazilianCities(trimmed, controller.signal)]);
      if (controller.signal.aborted) return;
      setSuggestions(mergeSuggestions(localResult.status === "fulfilled" ? localResult.value : [], remoteResult.status === "fulfilled" ? remoteResult.value : []));
      setShowSuggestions(true); setIsSearching(false);
    }, 280);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [query]);

  const openTerritory = useCallback((path: string, label: string) => { lastTerritoryStore.set({ name: label, baseUrl: path }); navigate(path); }, [navigate]);

  const resolveAndOpen = async (label = query) => {
    const finalLabel = label.trim(); if (!finalLabel) return;
    setIsOpening(true); setMessage(null);
    try {
      const path = await resolvePublicTerritoryPath(finalLabel);
      if (!path) { setMessage("Esse território ainda não está disponível para exploração pública. O lançamento começa pelo Complexo do Nordeste de Amaralina."); return; }
      openTerritory(path, finalLabel.replace(", Salvador", ""));
    } catch { setMessage("Não foi possível confirmar esse território agora. Tente novamente ou explore o lançamento."); }
    finally { setIsOpening(false); }
  };

  const handleQueryChange = (value: string) => { manualQueryRef.current = true; reverseAbortRef.current?.abort(); setResolvedLocation(null); setPreviewTerritory(null); setMessage(null); setQuery(value); };
  const handleSuggestion = (suggestion: TerritorySuggestion) => {
    manualQueryRef.current = false; setSuggestions([]); setShowSuggestions(false); setMessage(null); setQuery(suggestion.label);
    if (suggestion.path) { setPreviewTerritory(suggestion.location ?? null); return; }
    if (suggestion.latitude !== undefined && suggestion.longitude !== undefined) setResolvedLocation({ label: suggestion.label, latitude: suggestion.latitude, longitude: suggestion.longitude });
  };
  const handleUseLocation = async () => {
    setMessage(null); setResolvedLocation(null); setPreviewTerritory(null); setShowSuggestions(false); manualQueryRef.current = false;
    if (!("geolocation" in navigator)) { setMessage("Este navegador não oferece localização. Busque uma cidade ou bairro para continuar."); return; }
    setIsLocating(true); const controller = new AbortController(); reverseAbortRef.current?.abort(); reverseAbortRef.current = controller;
    try {
      const position = await getCurrentPosition();
      const label = await reverseGeocode(position.coords.latitude, position.coords.longitude, controller.signal);
      if (controller.signal.aborted) return;
      if (!label) { setMessage("Localizamos seu dispositivo, mas não identificamos o território. Faça a busca manual para continuar."); return; }
      setQuery(label); setResolvedLocation({ label, latitude: position.coords.latitude, longitude: position.coords.longitude });
      const normalizedLabel = normalizeTerritoryText(label.split(",")[0] ?? label);
      const localTerritories = await getLaunchTerritories();
      setPreviewTerritory(localTerritories.find((location) => normalizeTerritoryText(location.name) === normalizedLabel || normalizeTerritoryText(location.slug) === normalizedLabel) ?? null);
    } catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) setMessage(geolocationErrorMessage(error)); }
    finally { if (!controller.signal.aborted) setIsLocating(false); }
  };

  const rememberComplex = () => lastTerritoryStore.set({ name: COMPLEX_TERRITORY_NAME, baseUrl: TERRITORY_CONFIG.launch.community.path });

  return (
    <div className="territory-vivo territory-entry-page">
      <header className="territory-entry-header">
        <div className="territory-entry-header-inner">
          <Link to="/?trocar=territorio" className="entry-wordmark" aria-label="Achegue-se">achegue-se<span aria-hidden="true">.</span></Link>
          <nav className="entry-desktop-nav" aria-label="Navegação pública"><Link to="/sobre">Como funciona</Link><span className="entry-nav-divider" aria-hidden="true" /><Link to="/login">Entrar</Link></nav>
          <button type="button" className="entry-mobile-menu" aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={isMobileMenuOpen} onClick={() => setIsMobileMenuOpen((open) => !open)}><Menu className="h-6 w-6" aria-hidden="true" /></button>
          {isMobileMenuOpen ? <div className="entry-mobile-menu-popover"><Link to="/sobre" onClick={() => setIsMobileMenuOpen(false)}>Como funciona</Link><Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>Entrar</Link></div> : null}
        </div>
      </header>

      <main className="territory-entry-main">
        <section className="entry-left" aria-labelledby="territory-entry-title">
          <div className="entry-hero">
            <p className="entry-eyebrow">Nossa primeira comunidade</p>
            <h1 id="territory-entry-title">Seu lugar, mais perto.</h1>
            <p className="entry-hero-subtitle">Negócios, serviços e histórias do Complexo do Nordeste de Amaralina, em Salvador.</p>
          </div>

          <div className="entry-search-wrap">
            <form className="entry-search-form" role="search" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setShowSuggestions(false); void resolveAndOpen(); }}>
              <label htmlFor="territory-entry-search" className="sr-only">Buscar cidade ou bairro</label>
              <Search className="entry-search-icon" aria-hidden="true" />
              <input id="territory-entry-search" value={query} onChange={(event) => handleQueryChange(event.target.value)} onFocus={() => suggestions.length > 0 && setShowSuggestions(true)} onBlur={() => window.setTimeout(() => setShowSuggestions(false), 150)} onKeyDown={(event) => event.key === "Escape" && setShowSuggestions(false)} placeholder="Busque cidade ou bairro" autoComplete="off" role="combobox" aria-expanded={showSuggestions} aria-controls="territory-entry-suggestions" />
              <button type="submit" className="entry-search-submit" disabled={!canSubmit || isOpening} aria-label="Confirmar território">{isOpening ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}</button>
              {showSuggestions ? <ul id="territory-entry-suggestions" className="entry-suggestions" role="listbox">{isSearching ? <li className="entry-suggestion-loading"><Loader2 className="h-4 w-4 animate-spin" />Buscando territórios…</li> : suggestions.length ? suggestions.map((suggestion) => <li key={suggestion.id}><button type="button" role="option" aria-selected={query === suggestion.label} onMouseDown={(event) => event.preventDefault()} onClick={() => handleSuggestion(suggestion)}><MapPin className="h-4 w-4 shrink-0 text-territory-brand" aria-hidden="true" /><span>{suggestion.label}</span><small>{suggestion.kind === "territory" ? "bairro" : "cidade"}</small></button></li>) : <li className="entry-suggestion-empty">Nenhum território encontrado com esse nome.</li>}</ul> : null}
            </form>
            <button type="button" className="entry-location-action" onClick={() => void handleUseLocation()} disabled={isLocating}><span><span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-territory-brand">{isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}</span>{isLocating ? "Identificando seu território…" : "Usar minha localização"}</span><ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
          </div>

          <section className="entry-selection" aria-labelledby="entry-community-title">
            <Link to={LAUNCH_URLS.community} className="entry-community-preview" onClick={rememberComplex}><img src={communityThumbnail} alt="" /><span><strong id="entry-community-title">{COMPLEX_TERRITORY_NAME}</strong><em>Salvador · Bahia</em></span></Link>
            <div className="entry-neighborhoods" aria-label="Bairros do Complexo"><span>Nordeste de Amaralina</span><span>Santa Cruz</span><span>Vale das Pedrinhas</span><span>Chapada</span></div>
            <Link to={LAUNCH_URLS.community} className="entry-explore-link" onClick={rememberComplex}>Explorar o Complexo <ArrowRight aria-hidden="true" /></Link>
            <p className="entry-no-account">Sem cadastro para explorar.</p>
            <Link className="entry-account-link" to="/cadastro">Criar minha conta</Link>
            <p className="entry-residence-note">Você pode conhecer a comunidade mesmo morando em outro lugar.</p>
          </section>

          {resolvedLocation ? <div className="entry-resolved-location" role="status"><div><MapPin className="h-5 w-5" aria-hidden="true" /><div><p>Local encontrado</p><strong>{resolvedLocation.label}</strong><span>Confirme para abrir o contexto público disponível.</span></div></div><button type="button" onClick={() => setResolvedLocation(null)} aria-label="Descartar local encontrado"><X className="h-4 w-4" /></button><button type="button" onClick={() => void resolveAndOpen(resolvedLocation.label)} disabled={isOpening}><Check className="h-4 w-4" /> Confirmar território</button></div> : null}
          {message ? <div className="entry-message" role="alert">{message}<button type="button" onClick={() => openTerritory(PUBLIC_SALVADOR_PATH, "Salvador")}>Explorar Salvador</button></div> : null}
        </section>

        <TerritoryEntryMap city={launchCity} territory={previewTerritory} label={COMPLEX_TERRITORY_NAME} isLoading={isMapLoading} className="entry-map" />

        <section className="entry-indication" aria-labelledby="entry-indication-title"><div className="entry-indication-copy"><Users className="entry-indication-icon" aria-hidden="true" /><div><h2 id="entry-indication-title">Quer o Achegue-se na sua comunidade?</h2><p>Conte de onde você é e ajude a indicar os próximos lugares.</p></div></div><Link className="entry-indication-button" to="/indicar-comunidade">Indicar minha comunidade</Link></section>
      </main>

      <footer className="entry-footer"><span>Estamos começando pelo Complexo. A expansão será por etapas.</span><nav aria-label="Links institucionais"><Link to="/privacidade">Privacidade</Link><i aria-hidden="true" /><Link to="/sobre">Como funciona</Link></nav></footer>
    </div>
  );
}
