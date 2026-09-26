import { useEffect, useState } from "react";
import TerritoryEntryMap from "@/app/components/territory-vivo/TerritoryEntryMap";
import { AUTH_PATHS, buildLoginPath } from "@/core/auth/constants/authFlow";
import { LAUNCH_URLS, TERRITORY_CONFIG } from "@/core/routing/config/territory";
import {
  getPublicTerritoryGroupPresentation,
  getPublicTerritoryLocationLabel,
  resolvePublicTerritoryFallback,
} from "@/core/routing/utils/publicTerritoryFallbacks";
import { PRIVACY_POLICY_PATH } from "@/shared/constants/legal";

const LAUNCH_STATE = TERRITORY_CONFIG.launch.state;
const LAUNCH_CITY = TERRITORY_CONFIG.launch.city;
const LAUNCH_COMMUNITY_SLUG = TERRITORY_CONFIG.launch.community.slug;
const LAUNCH_COMMUNITY_NAME = TERRITORY_CONFIG.launch.community.name;
const LAUNCH_STATE_LABEL = LAUNCH_STATE === "ba" ? "Bahia" : LAUNCH_STATE.toUpperCase();
const LAUNCH_PLACE_LABEL = [
  TERRITORY_CONFIG.launch.name,
  LAUNCH_STATE_LABEL,
]
  .filter(Boolean)
  .join(" · ");
const ACCOUNT_PATH = "/conta";

/**
 * A entrada pública não depende do banco para descobrir o território inicial.
 * O fallback versionado é o contrato oficial de lançamento e já contém os
 * quatro membros do Complexo com metadados da fonte municipal GeoSalvador.
 * O contexto de launch, porém, pertence exclusivamente a TERRITORY_CONFIG.
 */
const launchCityResolved = resolvePublicTerritoryFallback({
  state: LAUNCH_STATE,
  city: LAUNCH_CITY,
});
const launchTerritory = resolvePublicTerritoryFallback({
  state: LAUNCH_STATE,
  city: LAUNCH_CITY,
  territorySlug: LAUNCH_COMMUNITY_SLUG,
});
const launchCity =
  launchCityResolved?.kind === "location" ? launchCityResolved.location : null;
const launchCommunityMembers =
  launchTerritory?.kind === "group" ? launchTerritory.group.members : [];
const launchCommunityPresentation =
  launchTerritory?.kind === "group"
    ? getPublicTerritoryGroupPresentation(launchTerritory.group)
    : { label: LAUNCH_COMMUNITY_NAME, article: null };
const launchCommunityGenitiveLabel =
  launchCommunityPresentation.article === "o"
    ? `do ${LAUNCH_COMMUNITY_NAME}`
    : launchCommunityPresentation.article === "a"
      ? `da ${LAUNCH_COMMUNITY_NAME}`
      : `de ${LAUNCH_COMMUNITY_NAME}`;

export default function TerritoryEntryPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let disposed = false;
    let authRevision = 0;
    let unsubscribe = () => undefined;

    // A home usa um runtime público leve e não monta SessionProvider. Carregamos
    // o SSOT de sessão sob demanda para refletir login sem duplicar autoridade.
    void import("@/core/session/services/SessionService").then(
      ({ SessionService }) => {
        if (disposed) return;

        unsubscribe = SessionService.onAuthStateChange((_event, session) => {
          authRevision += 1;
          if (!disposed) {
            setIsAuthenticated(Boolean(session?.user));
          }
        });

        const readRevision = authRevision;
        void SessionService.getCurrentUser().then((user) => {
          if (!disposed && authRevision === readRevision) {
            setIsAuthenticated(Boolean(user));
          }
        });
      },
      () => {
        // A home continua pública mesmo se a leitura local da sessão falhar.
      },
    );

    return () => {
      disposed = true;
      unsubscribe();
    };
  }, []);

  const accountHref = isAuthenticated
    ? buildLoginPath(ACCOUNT_PATH)
    : AUTH_PATHS.login;
  const accountLabel = isAuthenticated ? "Minha conta" : "Entrar";

  return (
    <div className="territory-vivo territory-entry-page">
      <a href="#main-content" className="skip-link">
        Pular para o conteúdo principal
      </a>

      <header className="territory-entry-header max-md:min-h-[calc(3.5rem+env(safe-area-inset-top))]">
        <div className="territory-entry-header-inner">
          <a href="/" className="entry-wordmark" aria-label="Achegue-se — início">
            achegue-se<span aria-hidden="true">.</span>
          </a>
          <p className="mvp-entry-tagline">
            <span aria-hidden="true">/</span> Encontre o que está perto
          </p>
          <nav className="entry-desktop-nav" aria-label="Navegação pública">
            <a className="hover:bg-territory-raised" href="/como-funciona">
              Como funciona
            </a>
            <a className="hover:bg-territory-raised" href={accountHref}>
              {accountLabel}
            </a>
          </nav>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="territory-entry-main">
        <div
          className="mvp-entry-content max-md:overflow-y-visible"
          data-entry-mobile-scroll-owner
        >
          <section className="mvp-entry-panel" aria-labelledby="territory-entry-title">
            <div className="mvp-entry-hero">
              <p className="mvp-entry-eyebrow">COMEÇAMOS PELO COMPLEXO</p>
              <h1 id="territory-entry-title">Tudo perto de você.</h1>
              <p className="mvp-entry-hero-subtitle">
                Encontre empresas e estabelecimentos {launchCommunityGenitiveLabel}.
              </p>
              <p className="mvp-entry-location">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 10.2c0 5.3-8 11.3-8 11.3S4 15.5 4 10.2a8 8 0 1 1 16 0Z" />
                  <circle cx="12" cy="10" r="2.4" />
                </svg>
                {LAUNCH_PLACE_LABEL}
              </p>
            </div>

            <form className="mvp-business-search" action={LAUNCH_URLS.search} method="get">
              <label htmlFor="entry-business-query">Buscar empresas</label>
              <div className="mvp-business-search-row">
                <span className="mvp-business-search-field">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="11" cy="11" r="6.5" />
                    <path d="m16 16 4.5 4.5" />
                  </svg>
                  <input
                    id="entry-business-query"
                    name="q"
                    type="search"
                    placeholder="Qual empresa você procura?"
                    aria-label="Qual empresa você procura?"
                  />
                </span>
                <button type="submit" aria-label="Buscar">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12h13" />
                    <path d="m13 6 6 6-6 6" />
                  </svg>
                </button>
              </div>
            </form>

            <a href={LAUNCH_URLS.business} className="entry-explore-link">
              Explorar empresas
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12h13" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </a>

            <div className="mvp-entry-actions">
              <a href={LAUNCH_URLS.map}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
                  <path d="M9 3v15M15 6v15" />
                </svg>
                Ver no mapa
              </a>
              <a href="/perto-de-mim">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 10.2c0 5.3-8 11.3-8 11.3S4 15.5 4 10.2a8 8 0 1 1 16 0Z" />
                  <circle cx="12" cy="10" r="2.4" />
                </svg>
                Perto de mim
              </a>
            </div>

            <p className="mvp-entry-no-account">Sem cadastro para explorar.</p>

            <section className="mvp-neighborhood-card" aria-labelledby="entry-neighborhoods-title">
              <h2 id="entry-neighborhoods-title">Quatro bairros, um lugar para descobrir</h2>
              <div className="entry-neighborhoods" aria-label={`Bairros de ${LAUNCH_COMMUNITY_NAME}`}>
                {launchCommunityMembers.map((member) => (
                  <span key={member.id}>{getPublicTerritoryLocationLabel(member)}</span>
                ))}
              </div>
              <p>Você pode explorar mesmo morando em outro lugar.</p>
              <p className="mvp-entry-mobile-location">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 10.2c0 5.3-8 11.3-8 11.3S4 15.5 4 10.2a8 8 0 1 1 16 0Z" />
                  <circle cx="12" cy="10" r="2.4" />
                </svg>
                {LAUNCH_PLACE_LABEL}
              </p>
            </section>
          </section>

          <section className="mvp-entry-map-shell" aria-labelledby="entry-map-heading">
            <div className="mvp-entry-map-heading" id="entry-map-heading">
              <span className="mvp-map-title-desktop">Empresas no território</span>
              <span className="mvp-map-title-mobile">{LAUNCH_COMMUNITY_NAME}</span>
            </div>
            <TerritoryEntryMap
              city={launchCity}
              resolvedTerritory={launchTerritory}
              label={LAUNCH_COMMUNITY_NAME}
              className="entry-map"
            />
            <span className="mvp-map-note mvp-map-note-left">Mapa demonstrativo</span>
            <span className="mvp-map-note mvp-map-note-right">Dados territoriais oficiais</span>
          </section>
        </div>
      </main>

      <footer className="entry-footer">
        <span>Disponível inicialmente no {LAUNCH_COMMUNITY_NAME}.</span>
        <nav aria-label="Links institucionais">
          <a href={PRIVACY_POLICY_PATH}>Privacidade</a>
          <i aria-hidden="true" />
          <a href="/conta/preferencias#acessibilidade">Acessibilidade</a>
        </nav>
      </footer>
    </div>
  );
}
