import { useCallback, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, ChevronDown, Compass, Cross, LocateFixed, Map, MapPin, Navigation, Search, SlidersHorizontal, Star, Store } from "lucide-react";
import { useTerritorialContextOptional } from "@/core/routing/components/TerritorialLayout";
import { useLocationContext } from "@/core/location/hooks/useLocationContext";
import { useResolvedUserLocation } from "@/core/location/hooks/useResolvedUserLocation";
import { useTerritoryLabels } from "@/core/location/hooks/useTerritoryLabels";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { MODULE_SLUGS, buildLocationModuleUrl, buildModuleTerritoryUrl } from "@/core/routing/utils/territoryUrls";
import { APP_MODULE_SLUGS, buildAppModulePath } from "@/shared/config/moduleSlugs";
import { NearbyMiniMap } from "../components";
import { useNearbyBusinesses } from "../hooks/useNearbyBusinesses";
import type { NearbyBusiness } from "../domain/types";
import type { NearbyProviderId } from "../providers/registry";
import "./NearbyPage.css";

interface NearbyPageProps { providerIds: readonly NearbyProviderId[]; }
const RADIUS_OPTIONS = [1, 2, 5, 10, 20] as const;

function formatDistance(meters: number): string {
  if (!meters) return "No território";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1).replace(".", ",")} km`;
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
        <small>{business.category || "Empresa local"}</small>
        <strong>{business.name}</strong>
        <span><MapPin /> {precise ? formatDistance(business.distanceMeters) : business.neighborhood || business.city || "No território"}</span>
        <em><Star /> {business.rating > 0 ? business.rating.toFixed(1) : "Novo"}</em>
      </span>
    </button>
  );
}

export default function NearbyPage({ providerIds }: NearbyPageProps) {
  const navigate = useNavigate();
  const territorialContext = useTerritorialContextOptional();
  const { activeLocation, activeTerritory } = useLocationContext();
  const [radiusKm, setRadiusKm] = useState(5);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const resolved: ResolvedTerritory | null = territorialContext?.resolved ?? (activeTerritory?.location ? { kind: "location", location: activeTerritory.location } : null);
  const routeFallbackLocation = territorialContext ? resolved?.kind === "location" ? resolved.location : null : undefined;
  const businessUrl = territorialContext ? buildModuleTerritoryUrl(MODULE_SLUGS.business, territorialContext.baseUrl) : activeLocation ? buildLocationModuleUrl(activeLocation, MODULE_SLUGS.business) : buildAppModulePath(APP_MODULE_SLUGS.business);
  const mapUrl = territorialContext ? buildModuleTerritoryUrl(MODULE_SLUGS.map, territorialContext.baseUrl) : activeLocation ? buildLocationModuleUrl(activeLocation, MODULE_SLUGS.map) : buildAppModulePath(APP_MODULE_SLUGS.map);
  const territoryLabels = useTerritoryLabels(resolved);
  const { location: resolvedUserLocation, coords: userLocation, status: locationStatus, isGoodForProximity, sourceMessage, resolve: resolveLocation, isLoading: locationLoading } = useResolvedUserLocation({ autoResolve: true, tryGps: true, territoryLocation: routeFallbackLocation });
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
  const spatialCenter = isGoodForProximity ? userLocation : territoryCenter ?? userLocation;
  const spatialLocationId = territorialContext ? resolved?.kind === "location" ? routeFallbackLocation?.id : undefined : activeLocation?.id;
  const spatialLocationIds = territorialContext && resolved?.kind === "group" ? territorialContext.activeMemberIds : undefined;
  const { businesses, isLoading: businessesLoading, isError } = useNearbyBusinesses({ enabled: providerIds.includes("business"), radiusKm, center: spatialCenter, locationId: spatialLocationId, locationIds: spatialLocationIds, limit: 100 });
  const categories = useMemo(() => ["Todos", ...[...new Set(businesses.map((item) => item.category).filter(Boolean))].slice(0, 5)], [businesses]);
  const filteredBusinesses = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    return businesses.filter((business) => (activeCategory === "Todos" || business.category === activeCategory) && (!normalizedQuery || `${business.name} ${business.category} ${business.neighborhood || ""}`.toLocaleLowerCase("pt-BR").includes(normalizedQuery)));
  }, [activeCategory, businesses, query]);
  const visibleBusinesses = filteredBusinesses.slice(0, 8);
  const locationName = territoryLabels.name || resolvedUserLocation?.locationName || "território selecionado";
  const isLoading = locationLoading || businessesLoading;
  const handleRadiusChange = useCallback((value: number) => setRadiusKm(value), []);

  if (providerIds.length === 0) return <div className="nb-page"><section className="nb-empty-state"><Compass /><h2>Perto de mim indisponível agora</h2><p>Continue explorando as empresas deste território.</p><button type="button" onClick={() => navigate(businessUrl)}>Ver empresas <ArrowRight /></button></section></div>;

  return (
    <div className="nb-page">
      <Helmet><title>Perto de mim — {locationName}</title><meta name="description" content={`Encontre empresas e serviços perto de você em ${locationName}.`} /></Helmet>
      <div className="nb-container">
        <section className="nb-location-strip">
          <div className="nb-location-summary"><span><MapPin /></span><div><strong>{isGoodForProximity ? "Sua localização atual" : "Referência do território"}</strong><p>{locationName}</p><small>{isGoodForProximity ? sourceMessage : `Mostrando resultados em ${locationName}`}</small></div></div>
          <div className="nb-radius-control"><LocateFixed /><label htmlFor="nb-radius">Raio de busca<small>Mostrando resultados em até {radiusKm} km.</small></label><div><select id="nb-radius" value={radiusKm} onChange={(event) => handleRadiusChange(Number(event.target.value))}>{RADIUS_OPTIONS.map((radius) => <option key={radius} value={radius}>{radius} km</option>)}</select><ChevronDown /></div></div>
          {!isGoodForProximity && locationStatus !== "resolving" ? <button className="nb-gps-button" type="button" onClick={() => resolveLocation()}><Navigation /> Usar GPS</button> : null}
        </section>

        <section className="nb-filter-panel" aria-label="Filtros de proximidade">
          <div className="nb-search-row"><label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por perto..." /></label><button type="button"><SlidersHorizontal /> Mais próximos <ChevronDown /></button></div>
          <div className="nb-filter-chips">{categories.map((category, index) => <button className={activeCategory === category ? "is-active" : ""} type="button" key={category} onClick={() => setActiveCategory(category)}>{index === 0 ? <Compass /> : index === 1 ? <Store /> : <Cross />}{category}</button>)}</div>
        </section>

        {isError ? <section className="nb-error"><AlertTriangle /><div><strong>Não foi possível carregar os resultados.</strong><p>Você ainda pode explorar a lista completa de empresas.</p></div><button type="button" onClick={() => navigate(businessUrl)}>Ver empresas</button></section> : null}
        <div className="nb-layout">
          <main className="nb-results">
            <header className="nb-section-heading"><div><Navigation /><span><h2>Mais próximos agora</h2><p>{isLoading ? "Buscando estabelecimentos..." : `${filteredBusinesses.length} resultado${filteredBusinesses.length === 1 ? "" : "s"} encontrado${filteredBusinesses.length === 1 ? "" : "s"}`}</p></span></div><button type="button" onClick={() => navigate(businessUrl)}>Ver todos <ArrowRight /></button></header>
            {isLoading ? <div className="nb-loading"><LocateFixed /><span>Localizando o que está perto de você…</span></div> : visibleBusinesses.length ? <div className="nb-business-grid">{visibleBusinesses.map((business) => <NearbyBusinessCard key={business.id} business={business} precise={isGoodForProximity} />)}</div> : <div className="nb-no-results"><Search /><strong>Nenhum resultado neste recorte</strong><p>Amplie o raio ou remova os filtros para ver mais opções.</p></div>}
          </main>
          <aside className="nb-sidebar">
            <section className="nb-map-card"><header className="nb-section-heading"><div><Map /><span><h2>Mapa da região</h2><p>{isGoodForProximity ? `Raio de ${radiusKm} km` : locationName}</p></span></div><button type="button" onClick={() => navigate(mapUrl)}>Mapa completo <ArrowRight /></button></header><NearbyMiniMap userLocation={spatialCenter} businesses={filteredBusinesses} radiusKm={radiusKm} showProximity={isGoodForProximity} /></section>
            {visibleBusinesses.length ? <section className="nb-routes"><header className="nb-section-heading"><div><Navigation /><span><h2>Rotas rápidas</h2><p>Atalhos para os primeiros resultados.</p></span></div></header><div>{visibleBusinesses.slice(0, 4).map((business) => <button type="button" key={business.id} onClick={() => navigate(business.canonicalUrl)}><span>{business.logo ? <img src={business.logo} alt="" /> : <Store />}</span><strong>{business.name}</strong><small>{formatDistance(business.distanceMeters)}</small></button>)}</div></section> : null}
            <section className="nb-business-cta"><Store /><div><strong>Seu negócio aparece aqui?</strong><p>Cadastre sua empresa e seja encontrado por quem está perto.</p></div><button type="button" onClick={() => navigate(businessUrl)}>Saiba mais <ArrowRight /></button></section>
          </aside>
        </div>
      </div>
    </div>
  );
}
