import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Menu, Users, X } from "lucide-react";
import TerritoryEntryMap from "@/app/components/territory-vivo/TerritoryEntryMap";
import communityThumbnail from "@/assets/hero-complexo-nordeste.jpg";
import { LAUNCH_URLS, TERRITORY_CONFIG } from "@/core/routing/config/territory";
import { LocationStatus, LocationType, type Location } from "@/core/location/types";
import { lastTerritoryStore } from "@/core/routing/stores/LastTerritoryStore";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { scheduleBrowserIdleWork } from "@/shared/utils/browserIdle";
import { normalizeTerritoryText } from "@/shared/utils/slugify";

const COMPLEX_TERRITORY_NAME = "Complexo do Nordeste de Amaralina";
const COMPLEX_FALLBACK_SLUG = "complexo-do-nordeste-de-amaralina";
let launchCityPromise: Promise<Location | null> | null = null;
let launchTerritoriesPromise: Promise<Location[]> | null = null;
let launchResolvedTerritoryPromise: Promise<ResolvedTerritory | null> | null = null;

function getLaunchCityPaths(): string[] {
  const country = TERRITORY_CONFIG.launch.country || "br";
  const state = TERRITORY_CONFIG.launch.state || "ba";
  const city = TERRITORY_CONFIG.launch.city || "salvador";
  return Array.from(new Set([`/${country}/${state}/${city}`, `/${state}/${city}`]));
}

async function resolveLaunchCity(): Promise<Location | null> {
  const { createLocationRepository } = await import(
    "@/core/location/repositories/createLocationRepository"
  );
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
      const [{ createLocationRepository }, { isTerritoryPubliclyNavigable }] =
        await Promise.all([
          import("@/core/location/repositories/createLocationRepository"),
          import("@/core/routing/utils/territoryVisibility"),
        ]);
      const result = await createLocationRepository().findDescendants(city.id, { include_self: false, max_depth: 2, page: 1, page_size: 200 });
      return result.locations.filter((location) => location.status === LocationStatus.ACTIVE && isTerritoryPubliclyNavigable(location.metadata));
    })().catch(() => []);
  }
  return launchTerritoriesPromise;
}

function getLaunchCommunitySlug(): string {
  return TERRITORY_CONFIG.launch.community.slug ?? COMPLEX_FALLBACK_SLUG;
}

async function resolveLaunchTerritory(): Promise<ResolvedTerritory | null> {
  const city = await getLaunchCity();
  const launchSlug = getLaunchCommunitySlug();

  if (city) {
    const { territorialGroupService } = await import("@/core/territorial");
    const group = await territorialGroupService
      .getGroupBySlugAndCity(launchSlug, city.id)
      .catch(() => null);

    if (group) {
      const fullGroup = await territorialGroupService
        .getGroupWithMembers(group.id)
        .catch(() => null);

      if (fullGroup?.members.length) {
        return { kind: "group", group: fullGroup };
      }
    }
  }

  const { resolvePublicTerritoryFallback } = await import(
    "@/core/routing/utils/publicTerritoryFallbacks"
  );
  const fallback = resolvePublicTerritoryFallback({
    state: TERRITORY_CONFIG.launch.state || "ba",
    city: TERRITORY_CONFIG.launch.city || "salvador",
    territorySlug: launchSlug,
  });
  if (fallback) return fallback;

  const normalizedName = normalizeTerritoryText(COMPLEX_TERRITORY_NAME);
  const locations = await getLaunchTerritories();
  const fallbackLocation =
    locations.find((location) => normalizeTerritoryText(location.name).includes(normalizedName)) ??
    locations.find((location) => normalizeTerritoryText(location.name).includes("nordeste de amaralina")) ??
    null;

  return fallbackLocation
    ? { kind: "location", location: fallbackLocation }
    : null;
}

function getLaunchResolvedTerritory(): Promise<ResolvedTerritory | null> {
  if (!launchResolvedTerritoryPromise) {
    launchResolvedTerritoryPromise = resolveLaunchTerritory().catch(() => null);
  }
  return launchResolvedTerritoryPromise;
}

export default function TerritoryEntryPage() {
  const [launchCity, setLaunchCity] = useState<Location | null>(null);
  const [previewTerritory, setPreviewTerritory] = useState<ResolvedTerritory | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuPopoverRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadingTimeout = window.setTimeout(() => {
      if (!cancelled) setIsMapLoading(false);
    }, 8000);

    const cancelIdleResolution = scheduleBrowserIdleWork(
      () => {
        Promise.all([getLaunchCity(), getLaunchResolvedTerritory()]).then(([city, territory]) => {
          if (cancelled) return;
          window.clearTimeout(loadingTimeout);
          setLaunchCity(city);
          setPreviewTerritory(territory);
          setIsMapLoading(false);
        });
      },
      { timeoutMs: 700, fallbackDelayMs: 120 },
    );

    return () => {
      cancelled = true;
      cancelIdleResolution();
      window.clearTimeout(loadingTimeout);
    };
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const firstLink = mobileMenuPopoverRef.current?.querySelector<HTMLElement>("a");
    firstLink?.focus();

    const closeAndRestoreFocus = () => {
      setIsMobileMenuOpen(false);
      window.requestAnimationFrame(() => mobileMenuButtonRef.current?.focus());
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAndRestoreFocus();
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        mobileMenuPopoverRef.current?.contains(target) ||
        mobileMenuButtonRef.current?.contains(target)
      ) {
        return;
      }
      setIsMobileMenuOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isMobileMenuOpen]);

  const rememberComplex = () => {
    lastTerritoryStore.set({ name: COMPLEX_TERRITORY_NAME, baseUrl: TERRITORY_CONFIG.launch.community.path });
  };

  return (
    <div className="territory-vivo territory-entry-page">
      <a href="#main-content" className="skip-link">
        Pular para o conteúdo principal
      </a>

      <header className="territory-entry-header">
        <div className="territory-entry-header-inner">
          <Link to="/" className="entry-wordmark" aria-label="Achegue-se — início">
            achegue-se<span aria-hidden="true">.</span>
          </Link>
          <nav className="entry-desktop-nav" aria-label="Navegação pública">
            <Link to="/sobre">Como funciona</Link>
            <span className="entry-nav-divider" aria-hidden="true" />
            <Link to="/login">Entrar</Link>
          </nav>
          <button
            ref={mobileMenuButtonRef}
            type="button"
            className="entry-mobile-menu"
            aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="entry-mobile-menu-popover"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
          {isMobileMenuOpen ? (
            <nav
              ref={mobileMenuPopoverRef}
              id="entry-mobile-menu-popover"
              className="entry-mobile-menu-popover"
              aria-label="Navegação pública móvel"
            >
              <Link to="/sobre" onClick={() => setIsMobileMenuOpen(false)}>Como funciona</Link>
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>Entrar</Link>
            </nav>
          ) : null}
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="territory-entry-main">
        <section className="entry-left" aria-labelledby="territory-entry-title">
          <div className="entry-hero">
            <p className="entry-eyebrow">Nossa primeira comunidade</p>
            <h1 id="territory-entry-title">Seu lugar, mais perto.</h1>
            <p className="entry-hero-subtitle">Descubra o que está perto: negócios, serviços e histórias do Complexo do Nordeste de Amaralina.</p>
          </div>

          <section className="entry-selection" aria-labelledby="entry-community-title">
            <div className="entry-community-preview">
              <img
                src={communityThumbnail}
                alt=""
                width={1920}
                height={1080}
                loading="lazy"
                decoding="async"
                fetchPriority="low"
              />
              <span>
                <strong id="entry-community-title">{COMPLEX_TERRITORY_NAME}</strong>
                <em>Salvador · Bahia</em>
              </span>
            </div>
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

        <TerritoryEntryMap
          city={launchCity}
          resolvedTerritory={previewTerritory}
          label={COMPLEX_TERRITORY_NAME}
          isLoading={isMapLoading}
          className="entry-map"
        />

        <section className="entry-indication" aria-labelledby="entry-indication-title">
          <div className="entry-indication-copy">
            <Users className="entry-indication-icon" aria-hidden="true" />
            <div>
              <h2 id="entry-indication-title">Quer o Achegue-se na sua comunidade?</h2>
              <p>O Complexo é só o começo. Conte de onde você é e ajude a orientar os próximos lugares.</p>
            </div>
          </div>
          <Link className="entry-indication-button" to="/indicar-comunidade">Indicar minha comunidade</Link>
        </section>
      </main>

      <footer className="entry-footer">
        <span>Começamos pelo Complexo. Aos poucos, o Achegue-se chega a novos lugares.</span>
        <nav aria-label="Links institucionais"><Link to="/privacidade">Privacidade</Link><i aria-hidden="true" /><Link to="/sobre">Como funciona</Link></nav>
      </footer>
    </div>
  );
}
