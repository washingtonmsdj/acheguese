import {
  ArrowLeftRight,
  BookOpen,
  Building2,
  BusFront,
  Compass,
  Home,
  MapPin,
  MessageCircle,
  Plus,
  Tag,
  UserRound,
  Users,
  Wrench,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { usePublicBrowsingCity } from "@/core/location/hooks/usePublicBrowsingCity";
import { useSessionContext } from "@/core/session";
import { resolveTerritoryNavigationBase } from "@/core/navigation/territoryNavigationModes";
import { cn } from "@/shared/utils/cn";
import {
  buildModuleTerritoryUrl,
  buildCommunityTerritoryUrl,
  MODULE_SLUGS,
} from "@/core/routing/utils/territoryUrls";

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
  const territoryBase = resolveTerritoryNavigationBase(
    pathname,
    active,
  );
  const desktopItems = [
    { label: "Início", href: territoryBase, icon: Home },
    {
      label: "Comunidade",
      href: buildCommunityTerritoryUrl(territoryBase),
      icon: Users,
    },
    {
      label: "Explorar",
      href: buildModuleTerritoryUrl(MODULE_SLUGS.search, territoryBase),
      icon: Compass,
    },
    {
      label: "Negócios",
      href: buildModuleTerritoryUrl(MODULE_SLUGS.business, territoryBase),
      icon: Building2,
    },
    {
      label: "Serviços",
      href: buildModuleTerritoryUrl(MODULE_SLUGS.services, territoryBase),
      icon: Wrench,
    },
    {
      label: "Mobilidade",
      href: buildModuleTerritoryUrl(MODULE_SLUGS.mobility, territoryBase),
      icon: BusFront,
    },
    {
      label: "Classificados",
      href: buildModuleTerritoryUrl(MODULE_SLUGS.classifieds, territoryBase),
      icon: Tag,
    },
    {
      label: "Educação",
      href: buildModuleTerritoryUrl(MODULE_SLUGS.education, territoryBase),
      icon: BookOpen,
    },
  ];
  const mobileItems = [
    { label: "Início", href: territoryBase, icon: Home, id: "home" },
    {
      label: "Comunidade",
      href: buildCommunityTerritoryUrl(territoryBase),
      icon: Users,
      id: "community",
    },
    {
      label: "Publicar",
      href: user ? "/novo-post" : "/login",
      icon: Plus,
      id: "publish",
      emphasized: true,
    },
    {
      label: "Conversas",
      href: user ? "/mensagens" : "/login",
      icon: MessageCircle,
      id: "messages",
    },
    {
      label: "Conta",
      href: user ? "/conta" : "/login",
      icon: UserRound,
      id: "account",
    },
  ];

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
          {mobileItems.map((item) => {
            const Icon = item.icon;
            const activeMode =
              item.id === "home"
                ? pathname === item.href
                : item.id === "community"
                  ? pathname === item.href || pathname.startsWith(`${item.href}/`)
                  : item.id === "publish"
                    ? pathname === "/novo-post"
                    : item.id === "messages"
                      ? pathname.startsWith("/mensagens") || pathname.startsWith("/chat/")
                      : pathname.startsWith("/conta");
            return (
              <Link
                key={`${item.label}:${item.href}`}
                to={item.href}
                className={cn(
                  "relative mx-0 flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-0 py-1.5 text-territory-muted transition-colors min-[360px]:mx-0.5 min-[360px]:px-1",
                  activeMode && "text-territory-brand",
                )}
                aria-current={activeMode ? "page" : undefined}
                data-bottom-nav-item={item.label.toLocaleLowerCase("pt-BR")}
              >
                <span
                  className={cn(
                    "flex h-8 w-10 items-center justify-center rounded-full",
                    item.emphasized
                      ? "-mt-4 h-12 w-12 bg-territory-sun text-territory-ink shadow-territory-highlight"
                      : activeMode && "bg-[hsl(var(--territory-brand)/0.12)]",
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="max-w-full whitespace-nowrap text-[0.5625rem] font-semibold leading-none min-[360px]:text-[0.625rem]">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <nav
        className={cn("fixed inset-y-0 left-0 z-[90] hidden w-[4.5rem] flex-col border-r border-territory-border bg-territory-surface px-2 py-3 md:flex xl:hidden", hideDesktop && "md:hidden")}
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
          {desktopItems.map((item) => {
            const Icon = item.icon;
            const activeMode =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={`tablet:${item.label}:${item.href}`}
                to={item.href}
                className={cn(
                  "flex min-h-[3.25rem] flex-col items-center justify-center gap-1 rounded-territory text-territory-muted transition-colors hover:bg-territory-raised hover:text-territory-ink",
                  activeMode && "bg-[hsl(var(--territory-brand)/0.12)] text-territory-brand",
                )}
                aria-label={item.label}
                aria-current={activeMode ? "page" : undefined}
                title={item.label}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <nav
        className={cn("fixed inset-y-0 left-0 z-[90] hidden w-44 flex-col border-r border-territory-border bg-territory-surface px-3 py-5 xl:bottom-0 xl:top-16 xl:flex", hideDesktop && "xl:hidden")}
        aria-label="Navegação principal desktop"
        data-territory-navigation="desktop"
      >
        <div className="mt-2 flex flex-1 flex-col gap-1">
          {desktopItems.map((item) => {
            const Icon = item.icon;
            const activeMode =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={`${item.label}:${item.href}`}
                to={item.href}
                className={cn(
                  "group flex min-h-12 items-center gap-3 rounded-xl px-3 text-territory-muted transition-colors hover:bg-territory-raised hover:text-territory-ink",
                  activeMode && "bg-[hsl(var(--territory-brand)/0.12)] text-territory-brand",
                )}
                aria-current={activeMode ? "page" : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-tight">
                    {item.label}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>

        <Link
          to="/?trocar=territorio"
          className="flex min-h-11 items-center gap-3 border-t border-territory-border px-3 pt-4 text-sm font-semibold text-territory-muted hover:text-territory-brand"
        >
          <ArrowLeftRight className="h-5 w-5" aria-hidden="true" />
          Trocar território
        </Link>
      </nav>
    </>
  );
}
