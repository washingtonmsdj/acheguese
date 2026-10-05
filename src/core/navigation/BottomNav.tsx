/**
 * BottomNav
 *
 * Navegação primária mobile do MVP.
 * Exibe somente os modos autorizados pela camada de composição. O core não
 * conhece lifecycle de produto; ele apenas renderiza o conjunto recebido.
 */

import { useMemo, useSyncExternalStore } from "react";
import { Link, useLocation as useRouterLocation } from "react-router-dom";
import { usePublicBrowsingCity } from "@/core/location/hooks/usePublicBrowsingCity";
import {
  buildTerritoryNavigationModes,
  isTerritoryNavigationModeActive,
  type TerritoryNavigationModeId,
} from "@/core/navigation/territoryNavigationModes";
import { TERRITORY_CONFIG } from "@/core/routing/config/territory";
import {
  lastTerritoryStore,
  type LastTerritory,
} from "@/core/routing/stores/LastTerritoryStore";
import { useSessionContext } from "@/core/session";
import { cn } from "@/shared/utils/cn";

interface BottomNavProps {
  prefetchRoute?: (href: string) => void;
  visibleModeIds?: readonly TerritoryNavigationModeId[];
}

const noopPrefetch = () => undefined;

export function BottomNav({
  prefetchRoute = noopPrefetch,
  visibleModeIds,
}: BottomNavProps) {
  const { pathname } = useRouterLocation();
  const { active } = usePublicBrowsingCity();
  const { user } = useSessionContext();
  const lastTerritory = useSyncExternalStore<LastTerritory | null>(
    (listener) => lastTerritoryStore.subscribe(listener),
    () => lastTerritoryStore.get(),
    () => null,
  );
  const visibleModeIdSet = useMemo(
    () => (visibleModeIds ? new Set(visibleModeIds) : null),
    [visibleModeIds],
  );

  if (pathname === "/") return null;

  const mainTabs = buildTerritoryNavigationModes({
    pathname,
    fallback: active,
    fallbackBaseUrl:
      lastTerritory?.baseUrl ?? TERRITORY_CONFIG.launch.community.path,
    authenticated: Boolean(user),
  }).filter((tab) => !visibleModeIdSet || visibleModeIdSet.has(tab.id));

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-territory-border/80 bg-territory-surface/95 font-sans shadow-lg backdrop-blur-xl safe-area-bottom md:hidden"
      aria-label="Navegação principal mobile"
    >
      <div className="mx-auto flex h-16 max-w-lg items-stretch px-1">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const activeTab = isTerritoryNavigationModeActive(pathname, tab);
          return (
            <Link
              key={`${tab.label}:${tab.href}`}
              to={tab.href}
              onClick={() => prefetchRoute(tab.href)}
              onMouseEnter={() => prefetchRoute(tab.href)}
              onFocus={() => prefetchRoute(tab.href)}
              onTouchStart={() => prefetchRoute(tab.href)}
              className={cn(
                "relative mx-0.5 flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 transition-colors",
                activeTab
                  ? "text-territory-brand"
                  : "text-territory-muted active:bg-territory-raised active:text-territory-ink",
              )}
              aria-label={tab.label}
              aria-current={activeTab ? "page" : undefined}
              data-bottom-nav-item={tab.label.toLocaleLowerCase("pt-BR")}
            >
              <span
                className={cn(
                  "flex h-7 w-9 items-center justify-center rounded-full transition-colors",
                  activeTab && "bg-territory-brand/12",
                )}
              >
                <Icon
                  className={cn("h-5 w-5", activeTab && "stroke-[2.5]")}
                />
              </span>
              <span
                className={cn(
                  "max-w-full whitespace-nowrap text-[9px] font-medium leading-none min-[360px]:text-[10px]",
                  activeTab && "font-semibold",
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
