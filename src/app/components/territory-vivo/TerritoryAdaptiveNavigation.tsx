import { useSyncExternalStore } from "react";
import {
  ArrowLeftRight,
  Home,
  MapPin,
  MessageCircle,
  Plus,
  UserRound,
  Users,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { usePublicBrowsingCity } from "@/core/location/hooks/usePublicBrowsingCity";
import {
  buildTerritoryNavigationModes,
  isTerritoryNavigationModeActive,
  resolveTerritoryNavigationBase,
} from "@/core/navigation/territoryNavigationModes";
import { TERRITORY_CONFIG } from "@/core/routing/config/territory";
import {
  lastTerritoryStore,
  type LastTerritory,
} from "@/core/routing/stores/LastTerritoryStore";
import { buildCommunityTerritoryUrl } from "@/core/routing/utils/territoryUrls";
import { useSessionContext } from "@/core/session";
import { cn } from "@/shared/utils/cn";

export function TerritoryAdaptiveNavigation({
  hideMobile = false,
  hideDesktop = false,
}: {
  hideMobile?: boolean;
  hideDesktop?: boolean;
}) {
  const { pathname } = useLocation();
  const { active } = usePublicBrowsingCity();
  const { user } = useSessionContext();
  const lastTerritory = useSyncExternalStore<LastTerritory | null>(
    (listener) => lastTerritoryStore.subscribe(listener),
    () => lastTerritoryStore.get(),
    () => null,
  );
  const fallbackBaseUrl =
    lastTerritory?.baseUrl ?? TERRITORY_CONFIG.launch.community.path;
  const territoryBase = resolveTerritoryNavigationBase(
    pathname,
    active,
    fallbackBaseUrl,
  );
  const navigationModes = buildTerritoryNavigationModes({
    pathname,
    fallback: active,
    fallbackBaseUrl,
    authenticated: Boolean(user),
  });
  const communityConceptPreview =
    import.meta.env.DEV &&
    pathname.startsWith("/comunidade/") &&
    new URLSearchParams(location.search).get("visualMock") ===
      "community-concept";
  const conceptMobileModes = [
    { id: "home", label: "Início", href: territoryBase, icon: Home },
    {
      id: "community",
      label: "Comunidade",
      href: buildCommunityTerritoryUrl(territoryBase),
      icon: Users,
    },
    {
      id: "publish",
      label: "Publicar",
      href: "#feed",
      icon: Plus,
    },
    {
      id: "conversations",
      label: "Conversas",
      href: "/mensagens",
      icon: MessageCircle,
    },
    {
      id: "account",
      label: "Conta",
      href: "/conta",
      icon: UserRound,
    },
  ] as const;

  return (
    <>
      <nav
        className={cn(
          "fixed inset-x-0 bottom-0 z-[100] border-t border-territory-border bg-territory-surface/96 backdrop-blur-xl safe-area-bottom md:hidden",
          hideMobile && "hidden",
        )}
        aria-label="Navegação principal mobile"
        data-territory-navigation="mobile"
      >
        <div className="mx-auto flex h-16 max-w-lg items-stretch px-1">
          {(communityConceptPreview ? conceptMobileModes : navigationModes).map(
            (mode) => {
            const Icon = mode.icon;
            const publishMode = mode.id === "publish";
            const activeMode =
              mode.id === "community"
                ? pathname === mode.href
                : mode.id === "publish"
                  ? false
                  : isTerritoryNavigationModeActive(pathname, mode);

            return (
              <Link
                key={`mobile:${mode.id}:${mode.href}`}
                to={mode.href}
                className={cn(
                  "relative mx-0 flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-0 py-1.5 text-territory-muted transition-colors min-[360px]:mx-0.5 min-[360px]:px-1",
                  activeMode && "text-territory-brand",
                  publishMode && "text-territory-ink",
                )}
                aria-label={mode.label}
                aria-current={activeMode ? "page" : undefined}
                data-bottom-nav-item={mode.label.toLocaleLowerCase("pt-BR")}
              >
                <span
                  className={cn(
                    "flex h-8 w-10 items-center justify-center rounded-full",
                    activeMode && "bg-[hsl(var(--territory-brand)/0.12)]",
                    publishMode &&
                      "relative -top-3 h-12 w-12 bg-territory-sun text-territory-ink shadow-lg ring-4 ring-territory-surface",
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span
                  className={cn(
                    "max-w-full whitespace-nowrap text-[0.5625rem] font-semibold leading-none min-[360px]:text-[0.625rem]",
                    publishMode && "text-territory-ink",
                  )}
                >
                  {mode.label}
                </span>
              </Link>
            );
          },
          )}
        </div>
      </nav>

      <nav
        className={cn(
          "fixed inset-y-0 left-0 z-[90] hidden w-[4.5rem] flex-col border-r border-territory-border bg-territory-surface px-2 py-3 md:flex xl:hidden",
          hideDesktop && "md:hidden",
        )}
        aria-label="Navegação principal tablet"
        data-territory-navigation="tablet"
      >
        <Link
          to={territoryBase}
          className="mx-auto flex h-11 w-11 items-center justify-center rounded-territory bg-territory-brand text-[hsl(var(--territory-canvas))]"
          aria-label="Achegue-se — Hoje"
        >
          <MapPin className="h-5 w-5" aria-hidden="true" />
        </Link>
        <div className="mt-6 flex flex-1 flex-col gap-1">
          {navigationModes.map((mode) => {
            const Icon = mode.icon;
            const activeMode = isTerritoryNavigationModeActive(pathname, mode);

            return (
              <Link
                key={`tablet:${mode.id}:${mode.href}`}
                to={mode.href}
                className={cn(
                  "flex min-h-[3.25rem] flex-col items-center justify-center gap-1 rounded-territory text-territory-muted transition-colors hover:bg-territory-raised hover:text-territory-ink",
                  activeMode &&
                    "bg-[hsl(var(--territory-brand)/0.12)] text-territory-brand",
                )}
                aria-label={mode.label}
                aria-current={activeMode ? "page" : undefined}
                title={mode.description}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">{mode.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <nav
        className={cn(
          "fixed inset-y-0 left-0 z-[90] hidden w-44 flex-col border-r border-territory-border bg-territory-surface px-3 py-5 xl:bottom-0 xl:top-16 xl:flex",
          hideDesktop && "xl:hidden",
        )}
        aria-label="Navegação principal desktop"
        data-territory-navigation="desktop"
      >
        <div className="mt-2 flex flex-1 flex-col gap-1">
          {navigationModes.map((mode) => {
            const Icon = mode.icon;
            const activeMode = isTerritoryNavigationModeActive(pathname, mode);

            return (
              <Link
                key={`desktop:${mode.id}:${mode.href}`}
                to={mode.href}
                className={cn(
                  "group flex min-h-12 items-center gap-3 rounded-xl px-3 text-territory-muted transition-colors hover:bg-territory-raised hover:text-territory-ink",
                  activeMode &&
                    "bg-[hsl(var(--territory-brand)/0.12)] text-territory-brand",
                )}
                aria-current={activeMode ? "page" : undefined}
                title={mode.description}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-tight">
                    {mode.label}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
        <Link
          to="/"
          className="flex min-h-11 items-center gap-3 border-t border-territory-border px-3 pt-4 text-sm font-semibold text-territory-muted hover:text-territory-brand"
        >
          <ArrowLeftRight className="h-5 w-5" aria-hidden="true" />
          Voltar à entrada
        </Link>
      </nav>
    </>
  );
}
