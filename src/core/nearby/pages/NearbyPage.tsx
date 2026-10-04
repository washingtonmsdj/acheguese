import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, Bookmark, ChevronDown, Compass, GraduationCap, HeartPulse, LocateFixed, Map, MapPin, MoreHorizontal, Navigation, Search, ShoppingCart, SlidersHorizontal, Star, Store, UtensilsCrossed, Wrench, X, type LucideIcon } from "lucide-react";
import { useTerritorialContextOptional } from "@/core/routing/components/TerritorialLayout";
import { useLocationContext } from "@/core/location/hooks/useLocationContext";
import { useResolvedUserLocation } from "@/core/location/hooks/useResolvedUserLocation";
import { useTerritoryLabels } from "@/core/location/hooks/useTerritoryLabels";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { MODULE_SLUGS, buildLocationModuleUrl, buildModuleTerritoryUrl } from "@/core/routing/utils/territoryUrls";
import { APP_MODULE_SLUGS, buildAppModulePath } from "@/shared/config/moduleSlugs";
import { useGeocoding } from "@/core/geospatial/hooks/useGeocoding";
import {
  BUSINESS_CATEGORY_OPTIONS,
  getBusinessCategoryLabel,
  type BusinessCategory,
} from "@/shared/taxonomy/businessCategories";
import { NearbyMiniMap } from "../components";
import { NearbyBusinessCta } from "../components/NearbyBusinessCta";
import { NearbyQuickRoutes } from "../components/NearbyQuickRoutes";
import {
  formatNearbyDistance,
  formatNearbyTerritoryDistance,
} from "../utils/nearbyDistance";
import { useNearbyBusinesses } from "../hooks/useNearbyBusinesses";
import type { NearbyBusiness } from "../domain/types";
import type { NearbyProviderId } from "../providers/registry";
import {
  NEARBY_DEFAULT_RADIUS_KM,
  NEARBY_MIN_ADDRESS_QUERY_LENGTH,
  NEARBY_QUERY_LIMIT,
  NEARBY_QUICK_RADIUS_OPTION_COUNT,
  NEARBY_RADIUS_OPTIONS_KM,
  NEARBY_REFERENCE_STORAGE_KEY,
  NEARBY_VISIBLE_RESULTS_LIMIT,
} from "../config/nearbyConfig";
import "./NearbyPage.css";

interface NearbyPageProps { providerIds: readonly NearbyProviderId[]; }
interface NearbyReference { type: "address" | "gps"; label: string; latitude: number; longitude: number; }

function readNearbyReference(): NearbyReference | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.sessionStorage.getItem(NEARBY_REFERENCE_STORAGE_KEY);
    if (!stored) return null;
    const reference = JSON.parse(stored) as NearbyReference;
    return Number.isFinite(reference.latitude) && Number.isFinite(reference.longitude) ? reference : null;
  } catch { return null; }
}

function persistNearbyReference(reference: NearbyReference): void {
  if (typeof window === "undefined") return;
  try { window.sessionStorage.setItem(NEARBY_REFERENCE_STORAGE_KEY, JSON.stringify(reference)); } catch { /* armazenamento pode estar bloqueado */ }
}
type SortMode = "distance" | "name" | "rating";
type NearbyCategoryFilter = "all" | BusinessCategory;

const CATEGORY_ICONS: Record<BusinessCategory, LucideIcon> = {
  restaurante: UtensilsCrossed,
  mercado: ShoppingCart,
  farmacia: HeartPulse,
  saude: HeartPulse,
  educacao: GraduationCap,
  servicos: Wrench,
  lazer: Compass,
  outros: MoreHorizontal,
};

const CATEGORY_OPTIONS = [
  { value: "all" as const, label: "Todos", icon: Compass },
  ...BUSINESS_CATEGORY_OPTIONS.map((option) => ({
    ...option,
    icon: CATEGORY_ICONS[option.value],
  })),
];

function formatCategory(value: string): string {
  return getBusinessCategoryLabel(value);
}

function NearbyBusinessCard({ business, precise }: { business: NearbyBusiness; precise: boolean }) {
  const navigate = useNavigate();
  return (
    <button className="nb-business-card" type="button" onClick={() => navigate(business.canonicalUrl)}>
      <span className="nb-business-media">
        {business.logo ? <img src={business.logo} alt="" loading="lazy" /> : <Store />}
        {business.verified ? <b>Verificada</b> : null}
      </span>
      <span className="nb-business-copy">
        <small>{business.category ? formatCategory(business.category) : "Empresa local"}</small>
        <strong>{business.name}</strong>
        <span className="nb-business-distance"><MapPin /> {precise ? formatNearbyDistance(business.distanceMeters) : formatNearbyTerritoryDistance(business.distanceMeters)}</span>
        <span className="nb-business-status">Horário não informado</span>
        <span className="nb-business-footer">{business.rating > 0 ? <em><Star /> {business.rating.toFixed(1)}</em> : <em className="nb-rating-empty">Sem avaliações</em>}<span className="nb-save-button" aria-label={`Salvar ${business.name}`} title="Salvar"><Bookmark /></span></span>
      </span>
    </button>
  );
}

export default function NearbyPage({ providerIds }: NearbyPageProps) {
  const navigate = useNavigate();
  const territorialContext = useTerritorialContextOptional();
  const { activeLocation, activeTerritory } = useLocationContext();
  const [radiusKm, setRadiusKm] = useState(NEARBY_DEFAULT_RADIUS_KM);
  const [query, setQuery] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const hasValidAddressInput = addressInput.trim().length >= NEARBY_MIN_ADDRESS_QUERY_LENGTH;
  const [addressRequest, setAddressRequest] = useState("");
  const [savedReference, setSavedReference] = useState<NearbyReference | null>(readNearbyReference);
  const [locationEditorOpen, setLocationEditorOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<NearbyCategoryFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("distance");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const resolved = useMemo<ResolvedTerritory | null>(
    () =>
      territorialContext?.resolved ??
      (activeTerritory?.location
        ? { kind: "location", location: activeTerritory.location }
        : null),
    [activeTerritory?.location, territorialContext?.resolved],
  );
  const routeFallbackLocation = territorialContext ? resolved?.kind === "location" ? resolved.location : null : undefined;
  const businessUrl = territorialContext ? buildModuleTerritoryUrl(MODULE_SLUGS.business, territorialContext.baseUrl) : activeLocation ? buildLocationModuleUrl(activeLocation, MODULE_SLUGS.business) : buildAppModulePath(APP_MODULE_SLUGS.business);
  const mapUrl = territorialContext ? buildModuleTerritoryUrl(MODULE_SLUGS.map, territorialContext.baseUrl) : activeLocation ? buildLocationModuleUrl(activeLocation, MODULE_SLUGS.map) : buildAppModulePath(APP_MODULE_SLUGS.map);
  const territoryLabels = useTerritoryLabels(resolved);
  const { location: resolvedUserLocation, coords: userLocation, status: locationStatus, isGoodForProximity: hasGpsLocation, resolve: resolveLocation, isLoading: gpsLoading } = useResolvedUserLocation({ autoResolve: false, tryGps: true, territoryLocation: routeFallbackLocation });
  const { data: geocodedAddress, isFetching: addressLoading, isError: addressError } = useGeocoding({ address: addressRequest, enabled: Boolean(addressRequest) });
  const userLatitude = userLocation?.latitude;
  const userLongitude = userLocation?.longitude;
  useEffect(() => {
    if (!geocodedAddress) return;
    const reference: NearbyReference = { type: "address", label: geocodedAddress.address.formatted || addressInput, latitude: geocodedAddress.coordinates.latitude, longitude: geocodedAddress.coordinates.longitude };
    setSavedReference(reference);
    persistNearbyReference(reference);
    setLocationEditorOpen(false);
  }, [addressInput, geocodedAddress]);
  useEffect(() => {
    if (!hasGpsLocation || userLatitude == null || userLongitude == null) return;
    const reference: NearbyReference = { type: "gps", label: resolvedUserLocation?.locationName || "Sua localização atual", latitude: userLatitude, longitude: userLongitude };
    setSavedReference(reference);
    persistNearbyReference(reference);
    setLocationEditorOpen(false);
  }, [hasGpsLocation, resolvedUserLocation?.locationName, userLatitude, userLongitude]);
  const territoryCenter = useMemo(() => {
    const locations = resolved?.kind === "group" ? resolved.group.members : resolved?.kind === "location" ? [resolved.location] : [];
    const centers = locations.flatMap((location) => {
      const latitude = Number(location.metadata?.center_latitude);
      const longitude = Number(location.metadata?.center_longitude);
      return Number.isFinite(latitude) && Number.isFinite(longitude) ? [{ latitude, longitude }] : [];
    });
    if (!centers.length) return null;
    return {
      latitude: centers.reduce((sum, center) => sum + center.latitude, 0) / centers.length,
      longitude: centers.reduce((sum, center) => sum + center.longitude, 0) / centers.length,
    };
  }, [resolved]);
  const addressLocation = savedReference ? { latitude: savedReference.latitude, longitude: savedReference.longitude } : null;
  const isGoodForProximity = Boolean(savedReference);
  const gpsUnavailable = !hasGpsLocation && (locationStatus === "territory" || locationStatus === "fallback" || locationStatus === "error");
  const spatialCenter = addressLocation ?? territoryCenter ?? userLocation;
  const spatialLocationId = territorialContext ? resolved?.kind === "location" ? routeFallbackLocation?.id : undefined : activeLocation?.id;
  const spatialLocationIds = territorialContext && resolved?.kind === "group" ? territorialContext.activeMemberIds : undefined;
  const { businesses, isLoading: businessesLoading, isError } = useNearbyBusinesses({ enabled: providerIds.includes("business") && isGoodForProximity, radiusKm, center: spatialCenter, locationId: spatialLocationId, locationIds: spatialLocationIds, limit: NEARBY_QUERY_LIMIT });
  const filteredBusinesses = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    const matches = businesses.filter((business) => (activeCategory === "all" || business.category === activeCategory) && (!normalizedQuery || `${business.name} ${business.category} ${business.neighborhood || ""}`.toLocaleLowerCase("pt-BR").includes(normalizedQuery)));
    return [...matches].sort((left, right) => {
      if (sortMode === "name") return left.name.localeCompare(right.name, "pt-BR");
      if (sortMode === "rating") return right.rating - left.rating;
      return left.distanceMeters - right.distanceMeters;
    });
  }, [activeCategory, businesses, query, sortMode]);
  const visibleBusinesses = filteredBusinesses.slice(0, NEARBY_VISIBLE_RESULTS_LIMIT);
  const locationName = territoryLabels.name || resolvedUserLocation?.locationName || "território selecionado";
  const proximityLocationName = savedReference?.label || "";
  const isLoading = gpsLoading || addressLoading || businessesLoading;
  const handleRadiusChange = useCallback((value: number) => setRadiusKm(value), []);

  if (providerIds.length === 0) return <div className="nb-page"><section className="nb-empty-state"><Compass /><h2>Perto de mim indisponível agora</h2><p>Continue explorando as empresas deste território.</p><button type="button" onClick={() => navigate(businessUrl)}>Ver empresas <ArrowRight /></button></section></div>;

  return (
    <div className={`nb-page${isGoodForProximity ? "" : " nb-page--awaiting-location"}`}>
      <Helmet><title>Perto de mim — {locationName}</title><meta name="description" content={`Encontre empresas e serviços perto de você em ${locationName}.`} /></Helmet>
      <div className="nb-container">
        <section className={`nb-location-strip${isGoodForProximity ? " nb-location-strip--resolved" : ""}`}>
          {!isGoodForProximity ? <><div className="nb-location-prompt"><strong>Onde você quer buscar?</strong><small>Informe um endereço ou use sua localização atual.</small></div><form className="nb-address-picker" onSubmit={(event) => { event.preventDefault(); const nextAddress = addressInput.trim(); if (hasValidAddressInput) setAddressRequest(`${nextAddress}, ${locationName}`); }}><label htmlFor="nb-address"><MapPin /><input id="nb-address" value={addressInput} onChange={(event) => setAddressInput(event.target.value)} placeholder="Digite seu endereço ou CEP" /></label><button type="submit" disabled={!hasValidAddressInput || addressLoading}>{addressLoading ? "Buscando…" : "Usar endereço"}</button></form></> : <div className="nb-location-summary"><span><MapPin /></span><div><small>Buscando perto de:</small><strong>{proximityLocationName}</strong><p>{savedReference?.type === "gps" ? "GPS ativado" : "Endereço definido"}</p></div><button className="nb-edit-location" type="button" onClick={() => { setAddressInput(""); setAddressRequest(""); setLocationEditorOpen(true); }}>Editar</button></div>}
          {!isGoodForProximity && (addressError || gpsUnavailable) ? <p className="nb-location-error">{addressError ? "Endereço não encontrado. Revise e tente novamente." : "GPS indisponível. Digite um endereço para continuar."}</p> : null}
          {isGoodForProximity ? <div className="nb-radius-control"><LocateFixed /><label htmlFor="nb-radius">Raio de busca<small>Mostrando resultados em até {radiusKm} km.</small></label><div><select id="nb-radius" value={radiusKm} onChange={(event) => handleRadiusChange(Number(event.target.value))}>{NEARBY_RADIUS_OPTIONS_KM.map((radius) => <option key={radius} value={radius}>{radius} km</option>)}</select><ChevronDown /></div></div> : null}
          {isGoodForProximity ? <div className="nb-radius-quick">{NEARBY_RADIUS_OPTIONS_KM.slice(0, NEARBY_QUICK_RADIUS_OPTION_COUNT).map((radius) => <button className={radiusKm === radius ? "is-active" : ""} type="button" key={radius} onClick={() => setRadiusKm(radius)}>{formatNearbyDistance(radius * 1000)}</button>)}</div> : null}
          {!isGoodForProximity && locationStatus !== "resolving" ? <button className="nb-gps-button" type="button" onClick={() => { setAddressInput(""); setAddressRequest(""); void resolveLocation(); }}><Navigation /> Usar GPS</button> : null}
        </section>

        {locationEditorOpen ? <div className="nb-location-overlay" role="presentation" onClick={() => setLocationEditorOpen(false)}><section className="nb-location-sheet" role="dialog" aria-modal="true" aria-labelledby="nb-location-editor-title" onClick={(event) => event.stopPropagation()}><span className="nb-sheet-handle" /><header><div><h2 id="nb-location-editor-title">Alterar localização</h2><p>Digite um novo endereço ou use o GPS.</p></div><button type="button" aria-label="Fechar" onClick={() => setLocationEditorOpen(false)}><X /></button></header><form className="nb-address-picker" onSubmit={(event) => { event.preventDefault(); const nextAddress = addressInput.trim(); if (hasValidAddressInput) setAddressRequest(`${nextAddress}, ${locationName}`); }}><label htmlFor="nb-new-address"><MapPin /><input id="nb-new-address" value={addressInput} onChange={(event) => setAddressInput(event.target.value)} placeholder="Digite um novo endereço ou CEP" /></label><button type="submit" disabled={!hasValidAddressInput || addressLoading}>{addressLoading ? "Buscando…" : "Usar endereço"}</button></form>{addressError ? <p className="nb-location-error">Endereço não encontrado. Revise e tente novamente.</p> : null}<button className="nb-sheet-gps" type="button" disabled={gpsLoading} onClick={() => { setAddressInput(""); setAddressRequest(""); void resolveLocation(); }}><Navigation />{gpsLoading ? "Obtendo localização…" : "Usar GPS"}</button></section></div> : null}

        {isGoodForProximity ? <section className="nb-filter-panel" aria-label="Filtros de proximidade">
          <div className="nb-search-row"><label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por perto..." /></label><div className="nb-sort-control"><SlidersHorizontal /><select aria-label="Ordenar resultados" value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}><option value="distance">Mais próximos</option><option value="rating">Melhor avaliados</option><option value="name">Ordem alfabética</option></select><ChevronDown /></div><button className="nb-filter-trigger" type="button" aria-label="Abrir filtros" onClick={() => setFiltersOpen(true)}><SlidersHorizontal /></button></div>
          <div className="nb-filter-chips">{CATEGORY_OPTIONS.map(({ value, label, icon: Icon }) => <button className={activeCategory === value ? "is-active" : ""} type="button" key={value} onClick={() => setActiveCategory(value)}><Icon />{label}</button>)}<button type="button" onClick={() => setFiltersOpen(true)}><MoreHorizontal />Mais</button></div>
        </section> : null}

        {filtersOpen ? <div className="nb-filter-overlay" role="presentation" onClick={() => setFiltersOpen(false)}><section className="nb-filter-sheet" role="dialog" aria-modal="true" aria-labelledby="nb-filter-title" onClick={(event) => event.stopPropagation()}><span className="nb-sheet-handle" /><header><h2 id="nb-filter-title">Filtros</h2><button type="button" aria-label="Fechar filtros" onClick={() => setFiltersOpen(false)}><X /></button></header><div className="nb-sheet-group"><h3>Categorias</h3><div>{CATEGORY_OPTIONS.map(({ value, label }) => <button className={activeCategory === value ? "is-active" : ""} type="button" key={value} onClick={() => setActiveCategory(value)}>{label}</button>)}</div></div><div className="nb-sheet-group"><h3>Ordenar por</h3><div>{([['distance','Mais próximos'],['rating','Melhor avaliação'],['name','Nome (A → Z)']] as const).map(([value,label]) => <button className={sortMode === value ? "is-active" : ""} type="button" key={value} onClick={() => setSortMode(value)}>{label}</button>)}</div></div><button className="nb-apply-filters" type="button" onClick={() => setFiltersOpen(false)}>Aplicar filtros</button><button className="nb-clear-filters" type="button" onClick={() => { setActiveCategory("all"); setSortMode("distance"); }}>Limpar filtros</button></section></div> : null}

        {isError ? <section className="nb-error"><AlertTriangle /><div><strong>Não foi possível carregar os resultados.</strong><p>Você ainda pode explorar a lista completa de empresas.</p></div><button type="button" onClick={() => navigate(businessUrl)}>Ver empresas</button></section> : null}
        <div className="nb-layout">
          <main className="nb-results">
            <header className="nb-section-heading"><div><Navigation /><span><h2>{isGoodForProximity ? "Mais próximos de você" : "Defina sua localização"}</h2><p>{!isGoodForProximity ? "Digite um endereço ou use o GPS para começar." : isLoading ? "Buscando estabelecimentos..." : `${filteredBusinesses.length} resultado${filteredBusinesses.length === 1 ? "" : "s"} em até ${formatNearbyDistance(radiusKm * 1000)}`}</p></span></div>{isGoodForProximity ? <><button type="button" onClick={() => navigate(businessUrl)}>Ver todos <ArrowRight /></button><div className="nb-mobile-sort"><span className="nb-sort-label">Ordenar por</span><select aria-label="Ordenar por" value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}><option value="distance">Mais próximos</option><option value="rating">Melhor avaliação</option><option value="name">Nome (A → Z)</option></select><ChevronDown /></div></> : null}</header>
            {!isGoodForProximity ? <div className="nb-no-results"><MapPin /><strong>Onde você quer buscar?</strong><p>Informe um endereço ou ative o GPS para calcular distâncias reais.</p></div> : isLoading ? <div className="nb-loading"><LocateFixed /><span>Localizando o que está perto de você…</span></div> : visibleBusinesses.length ? <div className="nb-business-grid">{visibleBusinesses.map((business) => <NearbyBusinessCard key={business.id} business={business} precise />)}</div> : <div className="nb-no-results"><Search /><strong>Nenhum resultado neste recorte</strong><p>Amplie o raio ou remova os filtros para ver mais opções.</p></div>}
          </main>
          <aside className="nb-sidebar">
            {isGoodForProximity ? <section className="nb-map-card"><header className="nb-section-heading"><div><Map /><span><h2>Mapa da região</h2><p>{`Raio de ${radiusKm} km`}</p></span></div><button type="button" aria-label="Abrir mapa completo" title="Abrir mapa completo" onClick={() => navigate(mapUrl)}><span className="nb-map-cta-desktop">Mapa completo</span><span className="nb-map-cta-mobile">Expandir mapa</span><ArrowRight aria-hidden="true" /></button></header><NearbyMiniMap userLocation={spatialCenter} businesses={visibleBusinesses} radiusKm={radiusKm} showProximity /></section> : null}
            {isGoodForProximity ? <section className="nb-mobile-radius" aria-label="Raio de busca"><strong>Raio de busca</strong><div>{NEARBY_RADIUS_OPTIONS_KM.slice(0, NEARBY_QUICK_RADIUS_OPTION_COUNT).map((radius) => <button className={radiusKm === radius ? "is-active" : ""} type="button" key={radius} onClick={() => setRadiusKm(radius)}>{formatNearbyDistance(radius * 1000)}</button>)}</div></section> : null}
            {visibleBusinesses.length ? (
              <NearbyQuickRoutes
                businesses={visibleBusinesses}
                precise={isGoodForProximity}
              />
            ) : null}
            {isGoodForProximity ? (
              <NearbyBusinessCta businessUrl={businessUrl} />
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
