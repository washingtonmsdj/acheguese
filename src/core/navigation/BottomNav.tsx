/**
 * BottomNav
 *
 * Navegacao primaria mobile territorial. Modulos especificos permanecem na
 * Home e em Explorar; a barra reserva espaco para orientacao, participacao,
 * atividade e identidade.
 */

import {
  Bell,
  Compass,
  Sun,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Link, useLocation as useRouterLocation } from "react-router-dom";
import { usePublicBrowsingCity } from "@/core/location/hooks/usePublicBrowsingCity";
import { useSessionContext } from "@/core/session";
import { parsePublicTerritoryPath } from "@/core/routing/utils/publicTerritoryPath";
import { buildCommunityTerritoryUrl } from "@/core/routing/utils/territoryUrls";
import { cn } from "@/shared/utils/cn";

interface BottomNavProps {
  prefetchRoute?: (href: string) => void;
}

interface PrimaryTab {
  path: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

const noopPrefetch = () => undefined;

function normalizedPath(value: string): string {
  return value.replace(/\/+$/, "") || "/";
}

export function BottomNav({ prefetchRoute = noopPrefetch }: BottomNavProps) {
  const { pathname } = useRouterLocation();
  const { active } = usePublicBrowsingCity();
  const { user } = useSessionContext();

  if (pathname === "/") return null;

  const cityBase = `/${active.state}/${active.city}`;
  const parsedTerritory = parsePublicTerritoryPath(pathname);
  const territoryBase =
    parsedTerritory.state && parsedTerritory.city
      ? `/${parsedTerritory.state}/${parsedTerritory.city}${parsedTerritory.territorySlug ? `/${parsedTerritory.territorySlug}` : ""}`
      : cityBase;
  const territoryModule = (module: string) => `/${module}${territoryBase}`;
  const communityHref = buildCommunityTerritoryUrl(territoryBase);

  const mainTabs: PrimaryTab[] = [
    { path: territoryBase, label: "Hoje", icon: Sun, exact: true },
    { path: territoryModule("busca"), label: "Explorar", icon: Compass },
    { path: communityHref, label: "Community", icon: Users },
    {
      path: user ? "/notificacoes" : "/login",
      label: "Atividade",
      icon: Bell,
    },
    {
      path: user ? "/conta" : "/login",
      label: user ? "Conta" : "Entrar",
      icon: UserRound,
    },
  ];

  const isActive = (tab: PrimaryTab): boolean => {
    const current = normalizedPath(pathname);
    const target = normalizedPath(tab.path);
    if (tab.exact) return current === target;
    if (tab.label === "Atividade") {
      return (
        current === "/notificacoes" || current.startsWith("/notificacoes/")
      );
    }
    if (tab.label === "Entrar") {
      return current === "/login" || current.startsWith("/login/");
    }
    return current === target || current.startsWith(`${target}/`);
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-border/80 bg-card/95 font-sans shadow-[0_-12px_32px_-24px_rgba(15,23,42,0.65)] backdrop-blur-xl safe-area-bottom md:hidden"
      aria-label="Navegacao principal mobile"
    >
      <div className="mx-auto flex h-16 max-w-lg items-stretch px-1">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const activeTab = isActive(tab);
          return (
            <Link
              key={`${tab.label}:${tab.path}`}
              to={tab.path}
              onClick={() => prefetchRoute(tab.path)}
              onMouseEnter={() => prefetchRoute(tab.path)}
              onFocus={() => prefetchRoute(tab.path)}
              onTouchStart={() => prefetchRoute(tab.path)}
              className={cn(
                "relative mx-0.5 flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 transition-colors",
                activeTab
                  ? "text-primary"
                  : "text-muted-foreground active:bg-muted active:text-foreground",
              )}
              aria-label={tab.label}
              aria-current={activeTab ? "page" : undefined}
              data-bottom-nav-item={tab.label.toLocaleLowerCase("pt-BR")}
            >
              <span
                className={cn(
                  "flex h-7 w-9 items-center justify-center rounded-full transition-colors",
                  activeTab && "bg-primary/12",
                )}
              >
                <Icon className={cn("h-5 w-5", activeTab && "stroke-[2.5]")} />
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
