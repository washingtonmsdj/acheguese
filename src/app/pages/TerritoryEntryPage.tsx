import { useEffect, useRef, useState } from "react";
import TerritoryEntryMap from "@/app/components/territory-vivo/TerritoryEntryMap";
import { AUTH_PATHS } from "@/core/auth/constants/authFlow";
import { LAUNCH_URLS, TERRITORY_CONFIG } from "@/core/routing/config/territory";
import {
  getPublicTerritoryGroupPresentation,
  getPublicTerritoryLocationLabel,
  resolvePublicTerritoryFallback,
} from "@/core/routing/utils/publicTerritoryFallbacks";
import { lastTerritoryStore } from "@/core/routing/stores/LastTerritoryStore";
import { PRIVACY_POLICY_PATH } from "@/shared/constants/legal";
import {
  PUBLIC_ROOT_MAP_TERMINAL_TIMEOUT_MS,
  scheduleAfterPublicRootMap,
} from "@/shared/utils/publicRootReadiness";

const LAUNCH_STATE = TERRITORY_CONFIG.launch.state;
const LAUNCH_CITY = TERRITORY_CONFIG.launch.city;
const LAUNCH_COMMUNITY_SLUG = TERRITORY_CONFIG.launch.community.slug;
const LAUNCH_COMMUNITY_NAME = TERRITORY_CONFIG.launch.community.name;
const LAUNCH_PLACE_LABEL = [
  TERRITORY_CONFIG.launch.name,
  TERRITORY_CONFIG.launch.state.toUpperCase(),
]
  .filter(Boolean)
  .join(" · ");
const COMMUNITY_IMAGE_MAP_SETTLE_GRACE_MS = 500;

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
const launchCommunityDefiniteLabel = [
  launchCommunityPresentation.article,
  launchCommunityPresentation.label,
]
  .filter(Boolean)
  .join(" ");
const launchCommunitySentenceLabel = launchCommunityDefiniteLabel.replace(
  /^./,
  (character) => character.toUpperCase(),
);
const launchCommunityOriginLabel =
  launchCommunityPresentation.article === "o"
    ? `pelo ${launchCommunityPresentation.label}`
    : launchCommunityPresentation.article === "a"
      ? `pela ${launchCommunityPresentation.label}`
      : `por ${launchCommunityPresentation.label}`;

export default function TerritoryEntryPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [communityImageSrc, setCommunityImageSrc] = useState<string | null>(null);
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

  useEffect(() => {
    const desktopMedia = window.matchMedia("(min-width: 768px)");
    let cancelScheduledImage: (() => void) | null = null;
    let disposed = false;
    let imageModulePromise: Promise<string | null> | null = null;

    const loadCommunityImage = () => {
      imageModulePromise ??= import("@/assets/complexo-cultura.jpg")
        .then((module) => module.default)
        .catch(() => null);
      return imageModulePromise;
    };

    const scheduleImage = () => {
      if (!desktopMedia.matches || communityImageSrc || cancelScheduledImage) {
        return;
      }

      cancelScheduledImage = scheduleAfterPublicRootMap(
        async () => {
          cancelScheduledImage = null;
          if (!desktopMedia.matches || disposed) return;

          const imageSrc = await loadCommunityImage();
          if (!disposed && desktopMedia.matches && imageSrc) {
            setCommunityImageSrc(imageSrc);
          }
        },
        {
          maxWaitMs:
            PUBLIC_ROOT_MAP_TERMINAL_TIMEOUT_MS +
            COMMUNITY_IMAGE_MAP_SETTLE_GRACE_MS,
          idleTimeoutMs: 1800,
          idleFallbackDelayMs: 600,
        },
      );
    };

    const handleMediaChange = () => {
      if (desktopMedia.matches) {
        setIsMobileMenuOpen(false);
        scheduleImage();
        return;
      }

      cancelScheduledImage?.();
      cancelScheduledImage = null;
    };

    scheduleImage();
    desktopMedia.addEventListener("change", handleMediaChange);

    return () => {
      disposed = true;
      desktopMedia.removeEventListener("change", handleMediaChange);
      cancelScheduledImage?.();
    };
  }, [communityImageSrc]);

  const rememberLaunchCommunity = () => {
    lastTerritoryStore.set({
      name: LAUNCH_COMMUNITY_NAME,
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
            <a className="hover:bg-territory-raised" href="/como-funciona">
              Como funciona
            </a>
            <span className="entry-nav-divider" aria-hidden="true" />
            <a className="hover:bg-territory-raised" href={AUTH_PATHS.login}>
              Entrar
            </a>
          </nav>
          <button
            ref={mobileMenuButtonRef}
            type="button"
            className="entry-mobile-menu hover:bg-territory-raised"
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
              <a
                className="hover:bg-territory-raised"
                href="/como-funciona"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Como funciona
              </a>
              <a
                className="hover:bg-territory-raised"
                href={PRIVACY_POLICY_PATH}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Privacidade
              </a>
              <a
                className="hover:bg-territory-raised"
                href={AUTH_PATHS.login}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Entrar
              </a>
            </nav>
          ) : null}
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="territory-entry-main">
        <div
          className="contents max-md:flex max-md:min-h-0 max-md:flex-1 max-md:flex-col max-md:gap-[0.45rem] max-md:overflow-y-auto max-md:overscroll-contain max-md:pb-[calc(0.35rem+env(safe-area-inset-bottom))] max-md:pt-[env(safe-area-inset-top)]"
          data-entry-mobile-scroll-owner
        >
          <section className="entry-left" aria-labelledby="territory-entry-title">
            <div className="entry-hero">
              <p className="entry-eyebrow">Nossa primeira comunidade</p>
              <h1 id="territory-entry-title">Seu lugar, mais perto.</h1>
              <p className="entry-hero-subtitle">
                Descubra o que está perto: negócios, serviços e histórias de {LAUNCH_COMMUNITY_NAME}.
              </p>
            </div>

            <section className="entry-selection" aria-labelledby="entry-community-title">
              <div className="entry-community-preview">
                <img
                  src={communityImageSrc ?? undefined}
                  alt=""
                  width={1024}
                  height={768}
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                  className="bg-territory-raised"
                />
                <span>
                  <strong id="entry-community-title">{LAUNCH_COMMUNITY_NAME}</strong>
                  <em>{LAUNCH_PLACE_LABEL}</em>
                </span>
              </div>
              <div className="entry-neighborhoods" aria-label={`Bairros de ${LAUNCH_COMMUNITY_NAME}`}>
                {launchCommunityMembers.map((member) => (
                  <span key={member.id}>{getPublicTerritoryLocationLabel(member)}</span>
                ))}
              </div>
              <a
                href={LAUNCH_URLS.community}
                className="entry-explore-link"
                onClick={rememberLaunchCommunity}
              >
                Explorar {launchCommunityDefiniteLabel}
                <span aria-hidden="true" className="text-lg leading-none">→</span>
              </a>
              <p className="entry-no-account">Sem cadastro para explorar.</p>
              <a className="entry-account-link" href={AUTH_PATHS.signup}>
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
            label={LAUNCH_COMMUNITY_NAME}
            isLoading={false}
            className="entry-map"
          />

          <section
            className="entry-indication [content-visibility:auto] [contain-intrinsic-size:auto_9rem]"
            aria-labelledby="entry-indication-title"
            data-entry-deferred-paint
          >
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
                  {launchCommunitySentenceLabel} é só o começo. Conte de onde você é e ajude a orientar os próximos lugares.
                </p>
              </div>
            </div>
            <a className="entry-indication-button" href="/indicar-comunidade">
              Indicar minha comunidade
            </a>
          </section>
        </div>
      </main>

      <footer
        className="entry-footer [content-visibility:auto] [contain-intrinsic-size:auto_4rem]"
        data-entry-deferred-paint
      >
        <span>
          Começamos {launchCommunityOriginLabel}. Aos poucos, o Achegue-se chega a novos lugares.
        </span>
        <nav aria-label="Links institucionais">
          <a href={PRIVACY_POLICY_PATH}>Privacidade</a>
          <i aria-hidden="true" />
          <a href="/como-funciona">Como funciona</a>
        </nav>
      </footer>
    </div>
  );
}
