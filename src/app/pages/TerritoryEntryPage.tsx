import { useEffect, useRef, useState } from "react";
import TerritoryEntryMap from "@/app/components/territory-vivo/TerritoryEntryMap";
import communityThumbnail from "@/assets/complexo-cultura.jpg";
import { LAUNCH_URLS, TERRITORY_CONFIG } from "@/core/routing/config/territory";
import { resolvePublicTerritoryFallback } from "@/core/routing/utils/publicTerritoryFallbacks";
import { lastTerritoryStore } from "@/core/routing/stores/LastTerritoryStore";

const COMPLEX_TERRITORY_NAME = "Complexo do Nordeste de Amaralina";
const COMPLEX_FALLBACK_SLUG = "complexo-do-nordeste-de-amaralina";
const LAUNCH_STATE = TERRITORY_CONFIG.launch.state || "ba";
const LAUNCH_CITY = TERRITORY_CONFIG.launch.city || "salvador";
const LAUNCH_COMMUNITY_SLUG =
  TERRITORY_CONFIG.launch.community.slug ?? COMPLEX_FALLBACK_SLUG;

/**
 * A entrada pública não depende do banco para descobrir o território inicial.
 * O fallback versionado é o contrato oficial de lançamento e já contém os
 * quatro membros do Complexo com metadados da fonte municipal GeoSalvador.
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

export default function TerritoryEntryPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuPopoverRef = useRef<HTMLElement | null>(null);

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
    lastTerritoryStore.set({
      name: COMPLEX_TERRITORY_NAME,
      baseUrl: TERRITORY_CONFIG.launch.community.path,
    });
  };

  return (
    <div className="territory-vivo territory-entry-page">
      <a href="#main-content" className="skip-link">
        Pular para o conteúdo principal
      </a>

      <header className="territory-entry-header">
        <div className="territory-entry-header-inner">
          <a href="/" className="entry-wordmark" aria-label="Achegue-se — início">
            achegue-se<span aria-hidden="true">.</span>
          </a>
          <nav className="entry-desktop-nav" aria-label="Navegação pública">
            <a href="/como-funciona">Como funciona</a>
            <span className="entry-nav-divider" aria-hidden="true" />
            <a href="/login">Entrar</a>
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
            <span aria-hidden="true" className="relative block h-5 w-5">
              <span
                className={`absolute left-0 top-[0.38rem] h-0.5 w-5 rounded-full bg-current transition-transform duration-150 motion-reduce:transition-none ${
                  isMobileMenuOpen ? "translate-y-[0.24rem] rotate-45" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-[0.86rem] h-0.5 w-5 rounded-full bg-current transition-transform duration-150 motion-reduce:transition-none ${
                  isMobileMenuOpen ? "-translate-y-[0.24rem] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
          {isMobileMenuOpen ? (
            <nav
              ref={mobileMenuPopoverRef}
              id="entry-mobile-menu-popover"
              className="entry-mobile-menu-popover"
              aria-label="Navegação pública móvel"
            >
              <a href="/como-funciona" onClick={() => setIsMobileMenuOpen(false)}>
                Como funciona
              </a>
              <a href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                Entrar
              </a>
            </nav>
          ) : null}
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="territory-entry-main">
        <section className="entry-left" aria-labelledby="territory-entry-title">
          <div className="entry-hero">
            <p className="entry-eyebrow">Nossa primeira comunidade</p>
            <h1 id="territory-entry-title">Seu lugar, mais perto.</h1>
            <p className="entry-hero-subtitle">
              Descubra o que está perto: negócios, serviços e histórias do Complexo do Nordeste de Amaralina.
            </p>
          </div>

          <section className="entry-selection" aria-labelledby="entry-community-title">
            <div className="entry-community-preview">
              <img
                src={communityThumbnail}
                alt=""
                width={1024}
                height={768}
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
              <span>Nordeste de Amaralina</span>
              <span>Santa Cruz</span>
              <span>Vale das Pedrinhas</span>
              <span>Chapada</span>
            </div>
            <a
              href={LAUNCH_URLS.community}
              className="entry-explore-link"
              onClick={rememberComplex}
            >
              Explorar o Complexo
              <span aria-hidden="true" className="text-lg leading-none">→</span>
            </a>
            <p className="entry-no-account">Sem cadastro para explorar.</p>
            <a className="entry-account-link" href="/cadastro">
              Criar minha conta
            </a>
            <p className="entry-residence-note">
              Você pode conhecer a comunidade mesmo morando em outro lugar.
            </p>
          </section>
        </section>

        <TerritoryEntryMap
          city={launchCity}
          resolvedTerritory={launchTerritory}
          label={COMPLEX_TERRITORY_NAME}
          isLoading={false}
          className="entry-map"
        />

        <section className="entry-indication" aria-labelledby="entry-indication-title">
          <div className="entry-indication-copy">
            <span className="entry-indication-icon relative block h-8 w-8 shrink-0" aria-hidden="true">
              <span className="absolute left-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-current" />
              <span className="absolute right-1 top-1.5 h-2 w-2 rounded-full border-2 border-current opacity-70" />
              <span className="absolute bottom-1 left-0.5 h-3 w-5 rounded-t-full border-2 border-b-0 border-current" />
              <span className="absolute bottom-1 right-0.5 h-2.5 w-4 rounded-t-full border-2 border-b-0 border-current opacity-70" />
            </span>
            <div>
              <h2 id="entry-indication-title">Quer o Achegue-se na sua comunidade?</h2>
              <p>
                O Complexo é só o começo. Conte de onde você é e ajude a orientar os próximos lugares.
              </p>
            </div>
          </div>
          <a className="entry-indication-button" href="/indicar-comunidade">
            Indicar minha comunidade
          </a>
        </section>
      </main>

      <footer className="entry-footer">
        <span>Começamos pelo Complexo. Aos poucos, o Achegue-se chega a novos lugares.</span>
        <nav aria-label="Links institucionais">
          <a href="/privacidade">Privacidade</a>
          <i aria-hidden="true" />
          <a href="/como-funciona">Como funciona</a>
        </nav>
      </footer>
    </div>
  );
}
