import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeftRight,
  Briefcase,
  Building2,
  Car,
  ChevronRight,
  Home,
  LayoutList,
  LocateFixed,
  Map,
  MapPin,
  MessageSquare,
  Search,
  Tag,
  UtensilsCrossed,
  Users,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import { prefetchRouteByHref } from "@/app/routes/prefetch";
import { useCommunityScopeResolver } from "@/core/community/hooks/useCommunityScopeResolver";
import { TerritorialLayout } from "./TerritorialLayout";
import { buildCommunityTerritoryUrl, buildModuleTerritoryUrl, MODULE_SLUGS } from "@/core/routing/utils/territoryUrls";
import { resolveSeoPolicy } from "@/core/routing/seo/territorialSeoPolicy";

type CommunityNavItem = {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: typeof LayoutList;
  group: "community" | "local" | "opportunities" | "tools";
};

const TRANSITION_MS = 720;
function titleFromSlug(value?: string): string {
  if (!value) return "Comunidade local";
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function cityLabelFromSlug(value?: string): string {
  if (!value) return "Cidade";
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeModulePath(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  const module = parts[0] ?? "";

  if (module === "comunidade") {
    if (parts[4]) return parts[4];
    return "home";
  }

  return module;
}

function useCommunitySeoHead(canonicalHref: string, robots: string) {
  useLayoutEffect(() => {
    const canonical =
      document.querySelector<HTMLLinkElement>("link[rel='canonical']") ??
      document.head.appendChild(document.createElement("link"));

    canonical.setAttribute("rel", "canonical");
    canonical.setAttribute("href", canonicalHref);

    const robotsMeta =
      document.querySelector<HTMLMetaElement>("meta[name='robots']") ??
      document.head.appendChild(document.createElement("meta"));

    robotsMeta.setAttribute("name", "robots");
    robotsMeta.setAttribute("content", robots);
  }, [canonicalHref, robots]);
}

const NAV_GROUP_LABELS: Record<CommunityNavItem["group"], string> = {
  community: "Comunidade",
  local: "Comercio local",
  opportunities: "Oportunidades",
  tools: "Ferramentas",
};

export function CommunityTerritorialShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { resolved, resolvedScope } = useCommunityScopeResolver();
  const params = useParams<{
    state?: string;
    city?: string;
    territorySlug?: string;
  }>();
  const [transitionMessage, setTransitionMessage] = useState<string | null>(null);

  const state = params.state ?? "ba";
  const city = params.city ?? "salvador";
  const territorySlug = params.territorySlug ?? city;
  const territoryBase = `/${state}/${city}/${territorySlug}`;
  const communityBase = buildCommunityTerritoryUrl(territoryBase);
  const cityHref = `/${state}/${city}`;
  const territoryName = resolved
    ? resolved.kind === "group"
      ? resolved.group.name
      : resolved.location.name
    : titleFromSlug(territorySlug);
  const cityName = cityLabelFromSlug(city);
  const scopeLabel = "Meu Bairro";
  const territorySubtitle = "Comunidade local";
  const localContentDescription = "Panorama da comunidade local";

  const navItems = useMemo<CommunityNavItem[]>(
    () => [
      {
        id: "home",
        label: "Meu Bairro",
        description: localContentDescription,
        href: communityBase,
        icon: Home,
        group: "community",
      },
      {
        id: "feed",
        label: "Feed",
        description: "Conversas locais",
        href: `${communityBase}/feed`,
        icon: LayoutList,
        group: "community",
      },
      {
        id: "grupos",
        label: "Grupos",
        description: "Nucleos e interesses locais",
        href: `${communityBase}/grupos`,
        icon: Users,
        group: "community",
      },
      {
        id: "alertas",
        label: "Alertas",
        description: "Alertas do territorio",
        href: `${communityBase}/alertas`,
        icon: MapPin,
        group: "community",
      },
      {
        id: "problemas",
        label: "Problemas",
        description: "Problemas da regiao",
        href: `${communityBase}/problemas`,
        icon: MessageSquare,
        group: "community",
      },
      {
        id: "achados-e-perdidos",
        label: "Achados e Perdidos",
        description: "Itens perdidos e encontrados",
        href: `${communityBase}/achados-e-perdidos`,
        icon: Search,
        group: "community",
      },
      {
        id: "empresas",
        label: "Empresas",
        description: "Negocios locais",
        href: buildModuleTerritoryUrl(MODULE_SLUGS.business, territoryBase),
        icon: Building2,
        group: "local",
      },
      {
        id: "gastronomia",
        label: "Gastronomia",
        description: "Restaurantes e cardapios locais",
        href: buildModuleTerritoryUrl(MODULE_SLUGS.gastronomy, territoryBase),
        icon: UtensilsCrossed,
        group: "local",
      },
      {
        id: "servicos",
        label: "Servicos",
        description: "Prestadores locais",
        href: buildModuleTerritoryUrl(MODULE_SLUGS.services, territoryBase),
        icon: Briefcase,
        group: "local",
      },
      {
        id: "classificados",
        label: "Classificados",
        description: "Anuncios da comunidade",
        href: buildModuleTerritoryUrl(MODULE_SLUGS.classifieds, territoryBase),
        icon: Tag,
        group: "opportunities",
      },
      {
        id: "vagas",
        label: "Vagas",
        description: "Oportunidades locais",
        href: buildModuleTerritoryUrl(MODULE_SLUGS.jobs, territoryBase),
        icon: Briefcase,
        group: "opportunities",
      },
      {
        id: "eventos",
        label: "Eventos",
        description: "Agenda do territorio",
        href: buildModuleTerritoryUrl(MODULE_SLUGS.events, territoryBase),
        icon: MapPin,
        group: "opportunities",
      },
      {
        id: "mapa",
        label: "Mapa",
        description: "Camadas territoriais",
        href: buildModuleTerritoryUrl(MODULE_SLUGS.map, territoryBase),
        icon: Map,
        group: "tools",
      },
      {
        id: "buscar",
        label: "Busca",
        description: "Busca no contexto local",
        href: `/buscar/${state}/${city}`,
        icon: Search,
        group: "tools",
      },
      {
        id: "perto-de-mim",
        label: "Perto de Mim",
        description: "Explorar o que esta por perto",
        href: "/perto-de-mim",
        icon: LocateFixed,
        group: "tools",
      },
      {
        id: "mobilidade",
        label: "Mobilidade",
        description: "Caronas e entregas locais",
        href: buildModuleTerritoryUrl(MODULE_SLUGS.mobility, territoryBase),
        icon: Car,
        group: "tools",
      },
    ],
    [city, communityBase, localContentDescription, state, territoryBase],
  );

  const navGroups = useMemo(
    () =>
      (["community", "local", "opportunities", "tools"] as const)
        .map((group) => ({
          group,
          items: navItems.filter((item) => item.group === group),
        }))
        .filter((section) => section.items.length > 0),
    [navItems],
  );
  const mobilePrimaryItems = useMemo(
    () => navItems.filter((item) => item.group === "community"),
    [navItems],
  );
  const mobileSecondaryGroups = useMemo(
    () =>
      navGroups.filter(
        (section) => section.group === "local" || section.group === "opportunities" || section.group === "tools",
      ),
    [navGroups],
  );

  useEffect(() => {
    setTransitionMessage(`Bem-vindo ao ${territoryName}`);
    const timer = window.setTimeout(() => setTransitionMessage(null), TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [territoryName]);

  const activeKey = normalizeModulePath(location.pathname);
  const seoPolicy = resolveSeoPolicy(location.pathname);
  const canonicalHref = typeof window !== "undefined"
    ? `${window.location.origin}${seoPolicy.canonicalPath}`
    : seoPolicy.canonicalPath;
  useCommunitySeoHead(canonicalHref, seoPolicy.robots);

  const handleExitToCity = () => {
    setTransitionMessage(`Saindo do ${territoryName}`);
    window.setTimeout(() => navigate(cityHref), TRANSITION_MS - 120);
  };

  return (
    <>
      <Helmet>
        <link rel="canonical" href={canonicalHref} />
        <meta name="robots" content={seoPolicy.robots} />
      </Helmet>
      <div className="relative flex h-screen w-full overflow-hidden bg-[#081114] text-foreground">
      {transitionMessage ? (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-md">
          <div className="w-[min(90vw,420px)] rounded-2xl border border-primary/25 bg-card/95 p-6 text-center shadow-2xl shadow-primary/10">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MapPin className="h-6 w-6" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Comunidade
            </p>
            <h2 className="mt-2 text-xl font-bold text-foreground">{transitionMessage}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Carregando a experiência local do território.
            </p>
            <div className="mt-5 h-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-primary" />
            </div>
          </div>
        </div>
      ) : null}

      <aside className="hidden w-80 shrink-0 border-r border-white/10 bg-[#071316] lg:flex lg:flex-col">
        <div className="border-b border-white/10 p-5">
          <Link
            to={communityBase}
            className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/10 p-3"
            onMouseEnter={() => prefetchRouteByHref(communityBase)}
            onFocus={() => prefetchRouteByHref(communityBase)}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Home className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Comunidade</p>
              <p className="truncate text-sm font-bold text-white">{territoryName}</p>
              <p className="mt-0.5 text-xs text-white/55">{territorySubtitle}</p>
            </div>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {navGroups.map(({ group, items }) => (
            <div key={group} className="mb-4 last:mb-0">
              <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-white/45">
                {NAV_GROUP_LABELS[group]}
              </p>
              <nav className="space-y-1">
                {items.map((item) => {
                  const isActive = activeKey === item.id || (item.id === "home" && location.pathname === communityBase);
                  const isHomeItem = item.id === "home";
                  return (
                    <Link
                      key={item.id}
                      to={item.href}
                      onMouseEnter={() => prefetchRouteByHref(item.href)}
                      onFocus={() => prefetchRouteByHref(item.href)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                        isHomeItem && "border border-primary/30 bg-primary/12",
                        isActive
                          ? "bg-primary/15 text-white ring-1 ring-primary/25"
                          : "text-white/70 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">{item.label}</span>
                        <span className="block truncate text-xs text-white/45">{item.description}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 text-white/35" />
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}

        </div>

        <div className="border-t border-white/10 p-3">
          <Button
            variant="outline"
            className="w-full justify-start border-white/15 bg-white/5 text-white hover:bg-white/10"
            onClick={handleExitToCity}
          >
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            Ver {cityName} inteiro
          </Button>
          <Link
            to={cityHref}
            className="mt-2 block rounded-lg px-3 py-2 text-center text-xs text-white/45 hover:text-white"
          >
            Ir para a página da cidade
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        <header className="flex w-full min-w-0 items-center gap-3 border-b border-white/10 bg-[#071316]/95 px-3 py-3 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{scopeLabel}</p>
            <p className="truncate text-sm font-bold text-white">{territoryName}</p>
          </div>
          <Button size="sm" variant="outline" className="shrink-0 px-3" onClick={handleExitToCity}>
            {cityName}
          </Button>
        </header>

        <div className="border-b border-white/10 bg-[#071316]/90 px-3 py-3 lg:hidden">
          <div className="mb-3">
            <nav className="grid grid-cols-3 gap-2">
              {mobilePrimaryItems.map((item) => {
                const isActive = activeKey === item.id || (item.id === "home" && location.pathname === communityBase);
                const isHomeItem = item.id === "home";

                return (
                  <Link
                    key={item.id}
                    to={item.href}
                    className={cn(
                      "flex min-h-11 min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2 text-[11px] font-semibold",
                      isHomeItem && "border-primary/35 bg-primary/12",
                      isActive
                        ? "border-primary/45 bg-primary/20 text-white"
                        : "border-white/10 bg-white/5 text-white/80"
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="space-y-2">
            {mobileSecondaryGroups.map(({ group, items }) => (
              <div key={group}>
                <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-white/45">
                  {NAV_GROUP_LABELS[group]}
                </p>
                <div className="overflow-x-auto pb-1">
                  <nav className="flex min-w-max gap-2">
                    {items.map((item) => {
                      const isActive = activeKey === item.id;
                      return (
                        <Link
                          key={item.id}
                          to={item.href}
                          className={cn(
                            "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap",
                            isActive
                              ? "border-primary/40 bg-primary/15 text-white"
                              : "border-white/10 bg-white/5 text-white/70"
                          )}
                        >
                          <item.icon className="h-3 w-3 shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              </div>
            ))}
          </div>
        </div>

        <main id="main-content" className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto" tabIndex={-1}>
          <TerritorialLayout />
        </main>
      </div>
      </div>
    </>
  );
}
