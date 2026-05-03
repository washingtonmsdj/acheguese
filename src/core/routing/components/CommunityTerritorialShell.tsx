import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftRight,
  Briefcase,
  Building2,
  Car,
  ChevronRight,
  Home,
  LayoutList,
  Map,
  MapPin,
  MessageSquare,
  Tag,
  UtensilsCrossed,
  Users,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import { prefetchRouteByHref } from "@/app/routes/prefetch";
import { TerritorialLayout } from "./TerritorialLayout";

type CommunityNavItem = {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: typeof LayoutList;
  group: "community" | "local" | "opportunities" | "tools";
};

const TRANSITION_MS = 720;
const COMPLEXO_SLUG = "complexo-do-nordeste-de-amaralina";

const COMPLEXO_BAIRROS = [
  { label: "Todos", slug: null },
  { label: "Nordeste", slug: "nordeste-de-amaralina" },
  { label: "Santa Cruz", slug: "santa-cruz" },
  { label: "Vale das Pedrinhas", slug: "vale-das-pedrinhas" },
  { label: "Chapada", slug: "chapada-do-rio-vermelho" },
] as const;

function titleFromSlug(value?: string): string {
  if (!value) return "Comunidade local";
  if (value === COMPLEXO_SLUG) return "Complexo do Nordeste de Amaralina";
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

const NAV_GROUP_LABELS: Record<CommunityNavItem["group"], string> = {
  community: "Comunidade",
  local: "Comercio local",
  opportunities: "Oportunidades",
  tools: "Ferramentas",
};

export function CommunityTerritorialShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{
    state?: string;
    city?: string;
    groupSlugOrDistrict?: string;
  }>();
  const [transitionMessage, setTransitionMessage] = useState<string | null>(null);

  const state = params.state ?? "ba";
  const city = params.city ?? "salvador";
  const territorySlug = params.groupSlugOrDistrict ?? COMPLEXO_SLUG;
  const communityBase = `/comunidade/${state}/${city}/${territorySlug}`;
  const cityHref = `/${state}/${city}`;
  const territoryName = titleFromSlug(territorySlug);
  const cityName = cityLabelFromSlug(city);
  const isComplexo = territorySlug === COMPLEXO_SLUG;

  const navItems = useMemo<CommunityNavItem[]>(
    () => [
      {
        id: "home",
        label: "Inicio",
        description: "Panorama da comunidade",
        href: communityBase,
        icon: Home,
        group: "community",
      },
      {
        id: "feed",
        label: "Feed",
        description: "Conversas do Complexo",
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
        id: "empresas",
        label: "Empresas",
        description: "Negocios locais",
        href: `${communityBase}/empresas`,
        icon: Building2,
        group: "local",
      },
      {
        id: "gastronomia",
        label: "Gastronomia",
        description: "Restaurantes e cardapios locais",
        href: `${communityBase}/gastronomia`,
        icon: UtensilsCrossed,
        group: "local",
      },
      {
        id: "servicos",
        label: "Servicos",
        description: "Prestadores locais",
        href: `${communityBase}/servicos`,
        icon: Briefcase,
        group: "local",
      },
      {
        id: "classificados",
        label: "Classificados",
        description: "Anuncios da comunidade",
        href: `${communityBase}/classificados`,
        icon: Tag,
        group: "opportunities",
      },
      {
        id: "vagas",
        label: "Vagas",
        description: "Oportunidades locais",
        href: `${communityBase}/vagas`,
        icon: Briefcase,
        group: "opportunities",
      },
      {
        id: "eventos",
        label: "Eventos",
        description: "Agenda do territorio",
        href: `${communityBase}/eventos`,
        icon: MapPin,
        group: "opportunities",
      },
      {
        id: "mapa",
        label: "Mapa",
        description: "Camadas do Complexo",
        href: `${communityBase}/mapa`,
        icon: Map,
        group: "tools",
      },
      {
        id: "mobilidade",
        label: "Mobilidade",
        description: "Caronas e entregas locais",
        href: `${communityBase}/mobilidade`,
        icon: Car,
        group: "tools",
      },
    ],
    [communityBase],
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

  useEffect(() => {
    setTransitionMessage(`Bem-vindo ao ${territoryName}`);
    const timer = window.setTimeout(() => setTransitionMessage(null), TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [territoryName]);

  const activeKey = normalizeModulePath(location.pathname);

  const handleExitToCity = () => {
    setTransitionMessage(`Saindo do ${territoryName}`);
    window.setTimeout(() => navigate(cityHref), TRANSITION_MS - 120);
  };

  return (
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
              <p className="mt-0.5 text-xs text-white/55">Território fundador</p>
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
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onMouseEnter={() => prefetchRouteByHref(item.href)}
                      onFocus={() => prefetchRouteByHref(item.href)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
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

          {isComplexo ? (
            <div className="mt-5 border-t border-white/10 pt-4">
              <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-white/45">
                Bairros internos
              </p>
              <div className="grid grid-cols-1 gap-1">
                {COMPLEXO_BAIRROS.map((bairro) => {
                  const href = bairro.slug
                    ? `${communityBase}?bairro=${bairro.slug}`
                    : communityBase;
                  return (
                    <Link
                      key={bairro.label}
                      to={href}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/65 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <MapPin className="h-3.5 w-3.5 text-primary/80" />
                      <span>{bairro.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}
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
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Meu Bairro</p>
            <p className="truncate text-sm font-bold text-white">{territoryName}</p>
          </div>
          <Button size="sm" variant="outline" className="shrink-0 px-3" onClick={handleExitToCity}>
            {cityName}
          </Button>
        </header>

        <div className="grid w-full min-w-0 grid-cols-3 gap-2 border-b border-white/10 bg-[#071316]/90 px-3 py-2 min-[380px]:grid-cols-4 lg:hidden">
          {navItems.map((item) => {
            const isActive = activeKey === item.id || (item.id === "home" && location.pathname === communityBase);

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex min-h-10 min-w-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border px-1.5 py-2 text-[10px] font-semibold leading-none min-[360px]:text-[11px]",
                  isActive
                    ? "border-primary/40 bg-primary/15 text-white"
                    : "border-white/10 bg-white/5 text-white/75"
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                <span className="block w-full truncate text-center">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {isComplexo ? (
          <div className="flex w-full min-w-0 max-w-full flex-wrap gap-2 overflow-hidden border-b border-white/10 bg-[#081114] px-3 py-2 lg:hidden">
            {COMPLEXO_BAIRROS.map((bairro) => {
              const href = bairro.slug ? `${communityBase}?bairro=${bairro.slug}` : communityBase;
              return (
                <Link
                  key={bairro.label}
                  to={href}
                  className="flex min-w-0 max-w-full items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-white/65 ring-1 ring-white/10"
                >
                  {bairro.slug ? <MapPin className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                  <span className="truncate">{bairro.label}</span>
                </Link>
              );
            })}
          </div>
        ) : null}

        <main id="main-content" className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto" tabIndex={-1}>
          <TerritorialLayout />
        </main>
      </div>
    </div>
  );
}
