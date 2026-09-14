import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Menu, Users } from "lucide-react";
import TerritoryEntryMap from "@/app/components/territory-vivo/TerritoryEntryMap";
import communityThumbnail from "@/assets/hero-complexo-nordeste.jpg";
import { LAUNCH_URLS, TERRITORY_CONFIG } from "@/core/routing/config/territory";
import { createLocationRepository } from "@/core/location/repositories/createLocationRepository";
import { LocationStatus, LocationType, type Location } from "@/core/location/types";
import { lastTerritoryStore } from "@/core/routing/stores/LastTerritoryStore";
import { resolvePublicTerritoryFallback } from "@/core/routing/utils/publicTerritoryFallbacks";
import { isTerritoryPubliclyNavigable } from "@/core/routing/utils/territoryVisibility";
import { normalizeTerritoryText } from "@/shared/utils/slugify";

const COMPLEX_TERRITORY_NAME = "Complexo do Nordeste de Amaralina";
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
      const result = await createLocationRepository().findDescendants(city.id, { include_self: false, max_depth: 2, page: 1, page_size: 200 });
      return result.locations.filter((location) => location.status === LocationStatus.ACTIVE && isTerritoryPubliclyNavigable(location.metadata));
    })().catch(() => []);
  }
  return launchTerritoriesPromise;
}

function findComplexTerritory(locations: Location[]): Location | null {
  const normalizedName = normalizeTerritoryText(COMPLEX_TERRITORY_NAME);
  return locations.find((location) => normalizeTerritoryText(location.name).includes(normalizedName)) ??
    locations.find((location) => normalizeTerritoryText(location.name).includes("nordeste de amaralina")) ??
    (() => {
      const fallback = resolvePublicTerritoryFallback({ state: TERRITORY_CONFIG.launch.state || "ba", city: TERRITORY_CONFIG.launch.city || "salvador", territorySlug: "nordeste-de-amaralina" });
      return fallback?.kind === "location" ? fallback.location : null;
    })();
}

export default function TerritoryEntryPage() {
  const [launchCity, setLaunchCity] = useState<Location | null>(null);
  const [previewTerritory, setPreviewTerritory] = useState<Location | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadingTimeout = window.setTimeout(() => { if (!cancelled) setIsMapLoading(false); }, 8000);
    getLaunchCity().then((city) => {
      if (cancelled) return;
      window.clearTimeout(loadingTimeout);
      setLaunchCity(city);
      setIsMapLoading(false);
    });
    return () => { cancelled = true; window.clearTimeout(loadingTimeout); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getLaunchTerritories().then((locations) => { if (!cancelled) setPreviewTerritory(findComplexTerritory(locations)); });
    return () => { cancelled = true; };
  }, []);

  const rememberComplex = () => {
    lastTerritoryStore.set({ name: COMPLEX_TERRITORY_NAME, baseUrl: TERRITORY_CONFIG.launch.community.path });
  };

  return (
    <div className="territory-vivo territory-entry-page">
      <header className="territory-entry-header">
        <div className="territory-entry-header-inner">
          <Link to="/?trocar=territorio" className="entry-wordmark" aria-label="Achegue-se">
            achegue-se<span aria-hidden="true">.</span>
          </Link>
          <nav className="entry-desktop-nav" aria-label="Navegação pública">
            <Link to="/sobre">Como funciona</Link>
            <span className="entry-nav-divider" aria-hidden="true" />
            <Link to="/login">Entrar</Link>
          </nav>
          <button type="button" className="entry-mobile-menu" aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={isMobileMenuOpen} onClick={() => setIsMobileMenuOpen((open) => !open)}>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          {isMobileMenuOpen ? (
            <div className="entry-mobile-menu-popover">
              <Link to="/sobre" onClick={() => setIsMobileMenuOpen(false)}>Como funciona</Link>
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>Entrar</Link>
            </div>
          ) : null}
        </div>
      </header>

      <main className="territory-entry-main">
        <section className="entry-left" aria-labelledby="territory-entry-title">
          <div className="entry-hero">
            <p className="entry-eyebrow">Nossa primeira comunidade</p>
            <h1 id="territory-entry-title">Seu lugar, mais perto.</h1>
            <p className="entry-hero-subtitle">Negócios, serviços e histórias do Complexo do Nordeste de Amaralina, em Salvador.</p>
          </div>

          <section className="entry-selection" aria-labelledby="entry-community-title">
            <Link to={LAUNCH_URLS.community} className="entry-community-preview" onClick={rememberComplex}>
              <img src={communityThumbnail} alt="" />
              <span>
                <strong id="entry-community-title">{COMPLEX_TERRITORY_NAME}</strong>
                <em>Salvador · Bahia</em>
              </span>
            </Link>
            <div className="entry-neighborhoods" aria-label="Bairros do Complexo">
              <span>Nordeste de Amaralina</span><span>Santa Cruz</span><span>Vale das Pedrinhas</span><span>Chapada</span>
            </div>
            <Link to={LAUNCH_URLS.community} className="entry-explore-link" onClick={rememberComplex}>
              Explorar o Complexo <ArrowRight aria-hidden="true" />
            </Link>
            <p className="entry-no-account">Sem cadastro para explorar.</p>
            <Link className="entry-account-link" to="/cadastro">Criar minha conta</Link>
            <p className="entry-residence-note">Você pode conhecer a comunidade mesmo morando em outro lugar.</p>
          </section>
        </section>

        <TerritoryEntryMap city={launchCity} territory={previewTerritory} label={COMPLEX_TERRITORY_NAME} isLoading={isMapLoading} className="entry-map" />

        <section className="entry-indication" aria-labelledby="entry-indication-title">
          <div className="entry-indication-copy">
            <Users className="entry-indication-icon" aria-hidden="true" />
            <div>
              <h2 id="entry-indication-title">Quer o Achegue-se na sua comunidade?</h2>
              <p>Conte de onde você é e ajude a indicar os próximos lugares.</p>
            </div>
          </div>
          <Link className="entry-indication-button" to="/indicar-comunidade">Indicar minha comunidade</Link>
        </section>
      </main>

      <footer className="entry-footer">
        <span>Estamos começando pelo Complexo. A expansão será por etapas.</span>
        <nav aria-label="Links institucionais"><Link to="/privacidade">Privacidade</Link><i aria-hidden="true" /><Link to="/sobre">Como funciona</Link></nav>
      </footer>
    </div>
  );
}
